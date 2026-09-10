import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getConnection, triggerSync, toggleConnection, getConnectionSyncs, discoverSchema } from '../api/client';
import { useToast } from '../hooks/useToast';
import { usePolling } from '../hooks/usePolling';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { Play, ArrowLeft, RefreshCw } from 'lucide-react';

const ConnectionDetail = () => {
  const { id } = useParams();
  const [connection, setConnection] = useState(null);
  const [activeTab, setActiveTab] = useState('history');
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchConnection = async () => {
    try {
      const res = await getConnection(id);
      setConnection(res.data);
    } catch (err) {
      addToast('Failed to fetch connection details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnection();
  }, [id]);

  const { data: syncsData, loading: syncsLoading } = usePolling(() => getConnectionSyncs(id), 5000);

  const handleSync = async () => {
    try {
      addToast('Starting sync job...', 'info');
      await triggerSync(id);
      addToast('Sync job triggered successfully', 'success');
    } catch (err) {
      addToast('Failed to trigger sync', 'error');
    }
  };

  const handleToggle = async () => {
    try {
      await toggleConnection(id);
      fetchConnection();
    } catch (err) {
      addToast('Failed to toggle connection', 'error');
    }
  };

  const handleDiscover = async () => {
    try {
      addToast('Discovering schema...', 'info');
      await discoverSchema(id);
      addToast('Schema discovered successfully', 'success');
      fetchConnection();
    } catch (err) {
      addToast('Failed to discover schema', 'error');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading connection...</div>;
  if (!connection) return <div className="p-8 text-center text-red-500">Connection not found</div>;

  const syncColumns = [
    { key: 'id', label: 'ID' },
    { key: 'status', label: 'Status', render: row => <StatusBadge status={row.status} /> },
    { key: 'trigger_type', label: 'Trigger' },
    { key: 'rows_synced', label: 'Rows' },
    { key: 'started_at', label: 'Started', render: row => row.started_at ? new Date(row.started_at).toLocaleString() : (row.created_at ? new Date(row.created_at).toLocaleString() : '-') },
    { key: 'duration_seconds', label: 'Duration', render: row => (row.started_at && row.finished_at) ? `${Math.max(0, Math.round((new Date(row.finished_at) - new Date(row.started_at)) / 1000))}s` : '-' },
    { key: 'message', label: 'Message', render: row => <span className="text-slate-600 text-xs truncate max-w-[200px] block">{row.message || row.error_details || '-'}</span> },
  ];

  const schemaColumns = [
    { key: 'name', label: 'Column Name' },
    { key: 'type', label: 'Data Type' }
  ];

  let schemaData = [];
  if (connection.schema_json) {
    try {
      const parsed = typeof connection.schema_json === 'string' ? JSON.parse(connection.schema_json) : connection.schema_json;
      if (Array.isArray(parsed?.columns)) {
        schemaData = parsed.columns;
      } else if (Array.isArray(parsed)) {
        schemaData = parsed;
      } else if (parsed && typeof parsed === 'object') {
        schemaData = Object.entries(parsed).map(([name, type]) => ({ name, type: typeof type === 'object' ? JSON.stringify(type) : String(type) }));
      }
    } catch (e) {
      schemaData = [];
    }
  }

  const isActive = Boolean(connection.enabled ?? connection.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/connections" className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">{connection.name}</h1>
          <StatusBadge status={isActive ? 'active' : 'inactive'} />
        </div>
        <div className="flex gap-3">
          <button onClick={handleToggle} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">
            {isActive ? 'Disable' : 'Enable'}
          </button>
          <button onClick={handleSync} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
            <Play className="w-4 h-4" /> Sync Now
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-xs text-slate-500">Source</p>
          <p className="font-medium">ID: {connection.connector_id}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-xs text-slate-500">Destination</p>
          <p className="font-medium">ID: {connection.destination_id}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-xs text-slate-500">Table & Mode</p>
          <p className="font-medium">{connection.source_table} ({connection.sync_mode})</p>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-xs text-slate-500">Schedule</p>
          <p className="font-medium">Every {connection.schedule_interval_minutes} mins</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="flex border-b">
          <button onClick={() => setActiveTab('history')} className={`px-6 py-3 font-medium text-sm ${activeTab === 'history' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>Sync History</button>
          <button onClick={() => setActiveTab('schema')} className={`px-6 py-3 font-medium text-sm ${activeTab === 'schema' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>Schema</button>
          <button onClick={() => setActiveTab('config')} className={`px-6 py-3 font-medium text-sm ${activeTab === 'config' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>Configuration</button>
        </div>
        
        <div className="p-6">
          {activeTab === 'history' && (
            <DataTable columns={syncColumns} data={syncsData?.data || []} loading={syncsLoading} />
          )}
          
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={handleDiscover} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-sm font-medium">
                  <RefreshCw className="w-4 h-4" /> Discover Schema
                </button>
              </div>
              <DataTable columns={schemaColumns} data={schemaData} emptyMessage="No schema discovered yet. Click Discover Schema." />
            </div>
          )}

          {activeTab === 'config' && (
            <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(connection, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionDetail;
