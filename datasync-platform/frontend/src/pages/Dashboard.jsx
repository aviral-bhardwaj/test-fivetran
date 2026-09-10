import React, { useMemo } from 'react';
import { usePolling } from '../hooks/usePolling';
import { getMetrics, getSyncs } from '../api/client';
import MetricCard from '../components/MetricCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { Activity, CheckCircle, XCircle, Loader, Rows3, Link as LinkIcon } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const Dashboard = () => {
  const { data: metricsData, loading: metricsLoading } = usePolling(getMetrics, 10000);
  const { data: syncsData, loading: syncsLoading } = usePolling(getSyncs, 10000);

  const rawMetrics = metricsData?.data || metricsData || {};
  const metrics = {
    totalSyncs: rawMetrics.total_syncs ?? rawMetrics.totalSyncs ?? 0,
    succeededSyncs: rawMetrics.succeeded_syncs ?? rawMetrics.succeededSyncs ?? 0,
    failedSyncs: rawMetrics.failed_syncs ?? rawMetrics.failedSyncs ?? 0,
    runningSyncs: rawMetrics.running_syncs ?? rawMetrics.runningSyncs ?? 0,
    totalRowsSynced: rawMetrics.total_rows_synced ?? rawMetrics.totalRowsSynced ?? 0,
    activeConnections: rawMetrics.active_connections ?? rawMetrics.activeConnections ?? 0,
  };

  const rawSyncs = syncsData?.data || syncsData || [];
  const recentSyncs = (Array.isArray(rawSyncs) ? rawSyncs : []).slice(0, 10);

  const chartData = useMemo(() => {
    const list = syncsData?.data || syncsData || [];
    if (!Array.isArray(list)) return [];
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const dataByDate = list.reduce((acc, sync) => {
      const dateStr = sync.started_at || sync.created_at;
      if (!dateStr) return acc;
      const date = new Date(dateStr).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = { date, succeeded: 0, failed: 0 };
      if (sync.status === 'succeeded') acc[date].succeeded++;
      if (sync.status === 'failed') acc[date].failed++;
      return acc;
    }, {});

    return last7Days.map(date => dataByDate[date] || { date, succeeded: 0, failed: 0 });
  }, [syncsData]);

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'connection_id', label: 'Connection ID' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'trigger_type', label: 'Trigger' },
    { key: 'rows_synced', label: 'Rows' },
    { key: 'started_at', label: 'Started', render: (row) => row.started_at ? new Date(row.started_at).toLocaleString() : (row.created_at ? new Date(row.created_at).toLocaleString() : '-') },
    { 
      key: 'duration_seconds', 
      label: 'Duration', 
      render: (row) => (row.started_at && row.finished_at)
        ? `${Math.max(0, Math.round((new Date(row.finished_at) - new Date(row.started_at)) / 1000))}s`
        : '-' 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard title="Total Syncs" value={metricsLoading ? '...' : metrics.totalSyncs} icon={Activity} color="blue" />
        <MetricCard title="Succeeded" value={metricsLoading ? '...' : metrics.succeededSyncs} icon={CheckCircle} color="green" />
        <MetricCard title="Failed" value={metricsLoading ? '...' : metrics.failedSyncs} icon={XCircle} color="red" />
        <MetricCard title="Running" value={metricsLoading ? '...' : metrics.runningSyncs} icon={Loader} color="blue" />
        <MetricCard title="Rows Synced" value={metricsLoading ? '...' : metrics.totalRowsSynced} icon={Rows3} color="purple" />
        <MetricCard title="Active Connections" value={metricsLoading ? '...' : metrics.activeConnections} icon={LinkIcon} color="indigo" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Sync History (Last 7 Days)</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="succeeded" stackId="a" fill="#10b981" />
              <Bar dataKey="failed" stackId="a" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Sync Jobs</h2>
        <DataTable columns={columns} data={recentSyncs} loading={syncsLoading} />
      </div>
    </div>
  );
};

export default Dashboard;
