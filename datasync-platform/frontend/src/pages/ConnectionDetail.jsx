import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Play, Pause, RefreshCw, CheckCircle2, Clock, Database,
  Settings, AlertTriangle, ShieldCheck, Terminal as TerminalIcon, FileText, ChevronRight, Layers
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getConnection, triggerSync, toggleConnection, getConnectionSyncs, getSyncLogs } from '../api/client';
import { ConnectorIcon } from '../components/ConnectorIcons';
import { FivetranSchemaTree } from '../components/FivetranSchemaTree';
import { SetupTestsRunner } from '../components/SetupTestsRunner';
import TerminalLogViewer from '../components/TerminalLogViewer';
import { useToast } from '../hooks/useToast';

const ConnectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [connection, setConnection] = useState(null);
  const [syncHistory, setSyncHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('status'); // 'status' | 'schema' | 'alerts' | 'history' | 'logs' | 'setup'
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    getConnection(id)
      .then(res => {
        setConnection(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));

    getConnectionSyncs(id)
      .then(res => {
        setSyncHistory(res.data || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 6000);
    return () => clearInterval(timer);
  }, [id]);

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await triggerSync(id);
      addToast('Sync triggered successfully', 'success');
      fetchData();
    } catch {
      addToast('Failed to trigger sync', 'error');
    } finally {
      setTimeout(() => setSyncing(false), 1200);
    }
  };

  const handleToggle = async () => {
    try {
      await toggleConnection(id);
      addToast('Pipeline status toggled', 'success');
      fetchData();
    } catch {
      addToast('Failed to update status', 'error');
    }
  };

  if (loading || !connection) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 font-medium">
        Loading connector details...
      </div>
    );
  }

  const isEnabled = connection.enabled === 1 || connection.enabled === true;
  const isSyncing = syncing || connection.status === 'running';

  // Format sync history for Recharts
  const chartData = (syncHistory.length > 0 ? syncHistory.slice(0, 12).reverse() : [
    { id: 1, duration: 2.4, rows: 20, time: '14:00' },
    { id: 2, duration: 1.8, rows: 0, time: '14:15' },
    { id: 3, duration: 2.1, rows: 15, time: '14:30' },
    { id: 4, duration: 3.2, rows: 35, time: '14:45' },
    { id: 5, duration: 2.0, rows: 0, time: '15:00' }
  ]).map((job, idx) => ({
    name: job.time || `Sync ${job.id || idx + 1}`,
    duration: typeof job.duration === 'number' ? job.duration : 2.5,
    rows: job.rows_synced || 20,
    status: job.status || 'succeeded'
  }));

  const tabs = [
    { id: 'status', label: 'Status' },
    { id: 'schema', label: 'Schema' },
    { id: 'alerts', label: 'Alerts', badge: '1' },
    { id: 'history', label: 'Historical Syncs' },
    { id: 'logs', label: 'Real-Time Logs' },
    { id: 'setup', label: 'Setup Tests' }
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Top Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <button
            onClick={() => navigate('/')}
            className="hover:text-[#0070F3] transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Connectors
          </button>
          <span>/</span>
          <span className="text-slate-800 font-bold">{connection.name}</span>
        </div>

        {/* Hero Header Card */}
        <div className="fivetran-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <ConnectorIcon type={connection.connector_type || 'postgres'} className="w-14 h-14 shadow-sm" />
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-[#0F172A] tracking-tight">
                  {connection.name}
                </h1>
                {isSyncing ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF2FD] text-[#0070F3] border border-[#BFDBFE]">
                    <span className="w-2 h-2 rounded-full bg-[#0070F3] animate-fivetran-pulse"></span>
                    Syncing Now
                  </span>
                ) : isEnabled ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                    <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                    Healthy & Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    Paused
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span className="font-semibold text-slate-700 uppercase">{connection.connector_type || 'POSTGRES'}</span>
                <span>➔</span>
                <span className="font-semibold text-slate-700">{connection.destination_name || 'Snowflake Warehouse'}</span>
                <span>•</span>
                <span>Frequency: Every {connection.schedule_minutes || 15}m</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggle}
              className="fivetran-btn-secondary"
            >
              {isEnabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{isEnabled ? 'Pause Sync' : 'Resume Sync'}</span>
            </button>
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="fivetran-btn-primary"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Fivetran 6 Tabs Navigation Bar */}
      <div className="border-b border-slate-200 flex items-center gap-8 text-xs font-bold">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 relative transition-all flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'text-[#0070F3]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-[#0070F3] text-[10px] font-bold">
                {tab.badge}
              </span>
            )}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0070F3] rounded-t-md"></span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          {/* Health Shield Banner */}
          <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-5 flex items-start gap-3.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-emerald-900">
                All systems healthy. Connector is syncing on schedule.
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                Historical initial load is 100% complete. Incremental change data capture (CDC) is active and replicating row changes to your warehouse every {connection.schedule_minutes || 15} minutes.
              </p>
            </div>
          </div>

          {/* Sync Schedule Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="fivetran-card p-5">
              <div className="text-xs text-slate-500 font-medium">Next Scheduled Sync</div>
              <div className="mt-1.5 text-xl font-black text-[#0F172A]">in ~11 minutes</div>
              <div className="mt-2 text-[11px] text-slate-400">Syncs every {connection.schedule_minutes || 15}m</div>
            </div>

            <div className="fivetran-card p-5">
              <div className="text-xs text-slate-500 font-medium">Total Rows Synced</div>
              <div className="mt-1.5 text-xl font-black text-[#0F172A] font-mono">
                {syncHistory.reduce((sum, j) => sum + (j.rows_synced || 0), 0).toLocaleString() || '14,200'}
              </div>
              <div className="mt-2 text-[11px] text-slate-400">Total volume loaded to warehouse</div>
            </div>

            <div className="fivetran-card p-5">
              <div className="text-xs text-slate-500 font-medium">Average Sync Duration</div>
              <div className="mt-1.5 text-xl font-black text-[#0F172A] font-mono">2.8s</div>
              <div className="mt-2 text-[11px] text-emerald-600 font-semibold">● Fast warehouse ingestion</div>
            </div>
          </div>

          {/* Sync History Hourly Bar Chart */}
          <div className="fivetran-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-[#0F172A]">Recent Sync Durations</h3>
                <p className="text-xs text-slate-500 mt-0.5">Duration in seconds per sync execution</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">Last 12 runs</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={16}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} unit="s" />
                  <Tooltip
                    formatter={(val) => [`${val}s duration`, '']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px' }}
                  />
                  <Bar dataKey="duration" fill="#0070F3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Schema Tab */}
      {activeTab === 'schema' && (
        <FivetranSchemaTree
          schema={connection.schema_json}
          onSaveSchema={() => addToast('Schema preferences saved successfully', 'success')}
        />
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="fivetran-card p-5 flex items-start gap-4">
            <div className="p-2 bg-blue-50 text-[#0070F3] rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#0F172A]">Automated Schema Evolution Detected</h4>
                <span className="text-slate-400 font-mono text-[11px]">10 mins ago</span>
              </div>
              <p className="text-slate-600 mt-1 leading-relaxed">
                Fivetran detected new column <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-blue-600">discount_code</code> on table <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">orders</code>. Column was automatically added to destination warehouse with backfilled NULLs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="fivetran-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-5">Job ID</th>
                <th className="py-3 px-5">Trigger</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Rows Synced</th>
                <th className="py-3 px-5 text-right">Started At</th>
                <th className="py-3 px-5 text-right">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {syncHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No sync jobs recorded yet. Click "Sync Now" to start.
                  </td>
                </tr>
              ) : (
                syncHistory.map(job => (
                  <tr key={job.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-5 font-mono font-bold text-slate-800">#{job.id}</td>
                    <td className="py-3 px-5 capitalize text-slate-600">{job.trigger_type || 'manual'}</td>
                    <td className="py-3 px-5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Succeeded
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right font-mono font-bold text-slate-800">
                      {job.rows_synced || 0}
                    </td>
                    <td className="py-3 px-5 text-right text-slate-500 font-mono text-[11px]">
                      {job.started_at ? new Date(job.started_at).toLocaleTimeString() : 'Just now'}
                    </td>
                    <td className="py-3 px-5 text-right text-slate-600 font-mono">
                      2.4s
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <TerminalLogViewer syncId={syncHistory[0]?.id || 1} />
      )}

      {/* Setup Tab */}
      {activeTab === 'setup' && (
        <div className="space-y-6">
          <SetupTestsRunner connectorName={connection.name} />

          <div className="fivetran-card p-6 space-y-4">
            <h4 className="font-bold text-sm text-[#0F172A]">Connector Configuration Details</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Source Table / Collection:</span>
                <div className="font-mono font-bold text-slate-800 mt-0.5">{connection.source_table}</div>
              </div>
              <div>
                <span className="text-slate-400">Replication Mode:</span>
                <div className="font-mono font-bold text-slate-800 mt-0.5 uppercase">{connection.sync_mode || 'INCREMENTAL'}</div>
              </div>
              <div>
                <span className="text-slate-400">Target Warehouse:</span>
                <div className="font-mono font-bold text-slate-800 mt-0.5">{connection.destination_name}</div>
              </div>
              <div>
                <span className="text-slate-400">Schema Prefix:</span>
                <div className="font-mono font-bold text-slate-800 mt-0.5">{connection.prefix || 'fivetran_raw_'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionDetail;
