import React from 'react';
import { getSyncs } from '../api/client';
import { usePolling } from '../hooks/usePolling';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { RefreshCw } from 'lucide-react';

const SyncHistory = () => {
  const { data, loading, refresh } = usePolling(getSyncs, 10000);
  const rawSyncs = data?.data || data || [];
  const syncs = Array.isArray(rawSyncs) ? rawSyncs : [];

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'connection_id', label: 'Connection ID' },
    { key: 'status', label: 'Status', render: row => <StatusBadge status={row.status} /> },
    { key: 'trigger_type', label: 'Trigger' },
    { key: 'rows_synced', label: 'Rows Synced' },
    { key: 'bytes_synced', label: 'Bytes' },
    { key: 'started_at', label: 'Started At', render: row => row.started_at ? new Date(row.started_at).toLocaleString() : (row.created_at ? new Date(row.created_at).toLocaleString() : '-') },
    { key: 'duration_seconds', label: 'Duration', render: row => (row.started_at && row.finished_at) ? `${Math.max(0, Math.round((new Date(row.finished_at) - new Date(row.started_at)) / 1000))}s` : '-' },
    { key: 'message', label: 'Message', render: row => <span className="text-slate-600 text-xs truncate max-w-[200px] block">{row.message || row.error_details || '-'}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Sync History</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">Total records: {syncs.length}</span>
          <button 
            onClick={refresh}
            className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={syncs} loading={loading} />
    </div>
  );
};

export default SyncHistory;
