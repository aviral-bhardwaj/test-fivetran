import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getConnection, triggerSync, toggleConnection, getConnectionSyncs, discoverSchema, updateConnection } from '../api/client';
import { useToast } from '../hooks/useToast';
import { usePolling } from '../hooks/usePolling';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import StreamConfigMatrix from '../components/StreamConfigMatrix';
import TerminalLogViewer from '../components/TerminalLogViewer';
import { Play, ArrowLeft, RefreshCw, Terminal, Layers, History, Settings2, Save } from 'lucide-react';

const ConnectionDetail = () => {
  const { id } = useParams();
  const [connection, setConnection] = useState(null);
  const [activeTab, setActiveTab] = useState('history');
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [streamCatalog, setStreamCatalog] = useState([]);
  const [discoveredStreams, setDiscoveredStreams] = useState([]);
  const [isSavingCatalog, setIsSavingCatalog] = useState(false);

  const { addToast } = useToast();

  const fetchConnection = async () => {
    try {
      const res = await getConnection(id);
      const conn = res.data;
      setConnection(conn);

      // Parse sync catalog
      if (conn?.sync_catalog) {
        try {
          const parsed = typeof conn.sync_catalog === 'string' ? JSON.parse(conn.sync_catalog) : conn.sync_catalog;
          if (Array.isArray(parsed)) setStreamCatalog(parsed);
        } catch (e) {}
      }

      // Parse discovered streams from schema_json
      if (conn?.schema_json) {
        try {
          const parsedSchema = typeof conn.schema_json === 'string' ? JSON.parse(conn.schema_json) : conn.schema_json;
          if (Array.isArray(parsedSchema?.streams)) {
            setDiscoveredStreams(parsedSchema.streams);
          }
        } catch (e) {}
      }
    } catch (err) {
      addToast('Failed to fetch connection details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnection();
  }, [id]);

  const { data: syncsData, loading: syncsLoading, refresh: refreshSyncs } = usePolling(() => getConnectionSyncs(id), 4000);

  const syncList = syncsData?.data || syncsData || [];
  const latestJobId = Array.isArray(syncList) && syncList.length > 0 ? syncList[0].id : null;

  useEffect(() => {
    if (!selectedJobId && latestJobId) {
      setSelectedJobId(latestJobId);
    }
  }, [latestJobId]);

  const handleSync = async () => {
    try {
      addToast('Starting replication job...', 'info');
      const res = await triggerSync(id);
      const newJob = res.data || res;
      if (newJob?.id) setSelectedJobId(newJob.id);
      addToast('Airbyte sync job triggered successfully', 'success');
      refreshSyncs();
    } catch (err) {
      addToast('Failed to trigger sync', 'error');
    }
  };

  const handleToggle = async () => {
    try {
      await toggleConnection(id);
      fetchConnection();
      addToast('Connection status updated', 'success');
    } catch (err) {
      addToast('Failed to toggle connection', 'error');
    }
  };

  const handleDiscover = async () => {
    try {
      addToast('Discovering streams from source...', 'info');
      const res = await discoverSchema(id);
      const data = res.data || res;
      if (Array.isArray(data?.streams)) {
        setDiscoveredStreams(data.streams);
        const defaultCatalog = data.streams.map(s => ({
          name: s.name,
          sync_mode: s.supportedSyncModes?.[0] || 'full_refresh_overwrite',
          primary_key: s.sourceDefinedPrimaryKey?.[0]?.[0] || 'id',
          cursor_field: s.defaultCursorField?.[0] || 'id',
          enabled: true
        }));
        setStreamCatalog(defaultCatalog);
      }
      addToast('Streams discovered successfully!', 'success');
      fetchConnection();
    } catch (err) {
      addToast('Failed to discover schema', 'error');
    }
  };

  const handleSaveCatalog = async () => {
    setIsSavingCatalog(true);
    try {
      await updateConnection(id, { sync_catalog: streamCatalog });
      addToast('Stream replication catalog saved successfully!', 'success');
      fetchConnection();
    } catch (err) {
      addToast('Failed to save stream configuration', 'error');
    } finally {
      setIsSavingCatalog(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading connection configuration...</div>;
  if (!connection) return <div className="p-8 text-center text-red-500">Connection not found</div>;

  const syncColumns = [
    { key: 'id', label: 'Job ID' },
    { key: 'status', label: 'Status', render: row => <StatusBadge status={row.status} /> },
    { key: 'trigger_type', label: 'Trigger' },
    { key: 'rows_synced', label: 'Records Synced' },
    { key: 'started_at', label: 'Started', render: row => row.started_at ? new Date(row.started_at).toLocaleString() : (row.created_at ? new Date(row.created_at).toLocaleString() : '-') },
    { key: 'duration', label: 'Duration', render: row => (row.started_at && row.finished_at) ? `${Math.max(0, Math.round((new Date(row.finished_at) - new Date(row.started_at)) / 1000))}s` : '-' },
    { key: 'actions', label: 'Terminal Logs', render: row => (
      <button
        onClick={() => { setSelectedJobId(row.id); setActiveTab('logs'); }}
        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-mono font-semibold"
      >
        <Terminal className="w-3.5 h-3.5 text-indigo-600" /> Logs
      </button>
    )}
  ];

  const isActive = Boolean(connection.enabled ?? connection.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/connections" className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900">{connection.name}</h1>
              <StatusBadge status={isActive ? 'active' : 'inactive'} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pipeline: <span className="font-semibold text-slate-600">{connection.connector_name || 'Source'}</span> → <span className="font-semibold text-slate-600">{connection.destination_name || 'Destination'}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleToggle} 
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 text-xs font-semibold"
          >
            {isActive ? 'Disable Pipeline' : 'Enable Pipeline'}
          </button>
          <button 
            onClick={handleSync} 
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20"
          >
            <Play className="w-4 h-4" /> Sync Now
          </button>
        </div>
      </div>

      {/* Info Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Source Connector</p>
          <p className="font-bold text-slate-900 text-sm mt-0.5">{connection.connector_name} ({connection.connector_type})</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Destination</p>
          <p className="font-bold text-slate-900 text-sm mt-0.5">{connection.destination_name} ({connection.destination_type})</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Namespace & Prefix</p>
          <p className="font-bold text-slate-900 text-sm mt-0.5 font-mono">{connection.prefix || 'airbyte_raw_'}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Schedule Frequency</p>
          <p className="font-bold text-slate-900 text-sm mt-0.5">Every {connection.schedule_interval_minutes || connection.schedule_minutes || 60} min</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200 px-2 bg-slate-50/75">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-5 py-3 font-semibold text-xs border-b-2 transition-all ${
              activeTab === 'history' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <History className="w-4 h-4" /> Replication History
          </button>
          <button
            onClick={() => setActiveTab('streams')}
            className={`flex items-center gap-2 px-5 py-3 font-semibold text-xs border-b-2 transition-all ${
              activeTab === 'streams' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" /> Streams Catalog ({discoveredStreams.length || 'Auto'})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-5 py-3 font-semibold text-xs border-b-2 transition-all ${
              activeTab === 'logs' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Terminal className="w-4 h-4" /> Live Terminal Logs
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-5 py-3 font-semibold text-xs border-b-2 transition-all ${
              activeTab === 'config' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Settings2 className="w-4 h-4" /> JSON Specification
          </button>
        </div>

        <div className="p-6">
          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-slate-800 text-sm">Recent Sync Executions</h3>
                <button
                  onClick={refreshSyncs}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncsLoading ? 'animate-spin' : ''}`} /> Refresh
                </button>
              </div>
              <DataTable columns={syncColumns} data={Array.isArray(syncList) ? syncList : []} loading={syncsLoading} />
            </div>
          )}

          {/* Streams Catalog Tab */}
          {activeTab === 'streams' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">Configured Streams & Replication Modes</h3>
                  <p className="text-xs text-slate-400">Control which tables/endpoints are replicated and choose between Full Refresh or Incremental cursors.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDiscover}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Re-discover Streams
                  </button>
                  <button
                    onClick={handleSaveCatalog}
                    disabled={isSavingCatalog}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" /> {isSavingCatalog ? 'Saving...' : 'Save Stream Configuration'}
                  </button>
                </div>
              </div>

              {discoveredStreams.length > 0 ? (
                <StreamConfigMatrix
                  streams={discoveredStreams}
                  config={streamCatalog}
                  onChange={setStreamCatalog}
                />
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
                  <Layers className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-slate-600 font-medium text-sm">No streams catalog discovered yet.</p>
                  <button
                    onClick={handleDiscover}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                  >
                    Discover Source Streams Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Live Terminal Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-slate-800 text-sm">Live Job Logs</h3>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500 font-medium">Select Job:</label>
                  <select
                    value={selectedJobId || ''}
                    onChange={(e) => setSelectedJobId(Number(e.target.value))}
                    className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium"
                  >
                    {(Array.isArray(syncList) ? syncList : []).map(j => (
                      <option key={j.id} value={j.id}>Job #{j.id} ({j.status})</option>
                    ))}
                  </select>
                </div>
              </div>

              <TerminalLogViewer syncId={selectedJobId || latestJobId} autoRefresh={true} />
            </div>
          )}

          {/* Configuration Tab */}
          {activeTab === 'config' && (
            <pre className="bg-slate-950 text-slate-200 p-5 rounded-xl overflow-x-auto text-xs font-mono border border-slate-800 shadow-inner">
              {JSON.stringify(connection, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionDetail;
