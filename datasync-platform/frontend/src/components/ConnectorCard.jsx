import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, ArrowRight, Clock, Database, ChevronRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { ConnectorIcon } from './ConnectorIcons';

export const ConnectorCard = ({ connection, onSyncNow, onToggle }) => {
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);

  const handleSyncClick = async (e) => {
    e.stopPropagation();
    if (syncing) return;
    setSyncing(true);
    try {
      await onSyncNow(connection.id);
    } finally {
      setTimeout(() => setSyncing(false), 1200);
    }
  };

  const isEnabled = connection.enabled === 1 || connection.enabled === true;
  const isSyncing = syncing || connection.status === 'running' || connection.latest_job_status === 'running';

  // 14-run sparkline simulator based on connection stats
  const sparklineData = Array.from({ length: 14 }).map((_, i) => {
    const isLatest = i === 13;
    const height = Math.max(20, Math.floor(Math.sin(i * 1.2 + (connection.id || 1)) * 40 + 60));
    return {
      run: i + 1,
      height: `${height}%`,
      duration: `${(height * 0.08).toFixed(1)}s`,
      status: isLatest && isSyncing ? 'syncing' : (i === 6 ? 'failed' : 'success')
    };
  });

  return (
    <div
      onClick={() => navigate(`/connections/${connection.id}`)}
      className="fivetran-card p-5 cursor-pointer group hover:shadow-md hover:border-[#0070F3]/40 relative overflow-hidden"
    >
      {/* Top row: Icon, Name, Target, Status */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <ConnectorIcon type={connection.connector_type || 'postgres'} className="w-10 h-10 shadow-2xs" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-[#0070F3] transition-colors">
                {connection.name}
              </h3>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                {connection.connector_type || 'SOURCE'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-0.5">
              <span>{connection.source_table || 'Multi-Stream'}</span>
              <span>➔</span>
              <span className="font-medium text-[#334155]">{connection.destination_name || 'Snowflake Warehouse'}</span>
            </div>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2">
          {isSyncing ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EAF2FD] text-[#0070F3] border border-[#BFDBFE]">
              <span className="w-2 h-2 rounded-full bg-[#0070F3] animate-fivetran-pulse"></span>
              Syncing
            </span>
          ) : isEnabled ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
              <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Paused
            </span>
          )}
        </div>
      </div>

      {/* Middle row: Schedule & Sparkline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 border-y border-slate-100 my-3">
        {/* Left: Schedule & Sync Frequency */}
        <div className="flex flex-col justify-center gap-1 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Sync Frequency:</span>
            <span className="font-semibold text-slate-700">Every {connection.schedule_minutes || 15}m</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Next sync in ~{Math.max(1, (connection.schedule_minutes || 15) - 4)} minutes
          </div>
        </div>

        {/* Right: 14-run mini duration sparkline */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Recent Sync Durations</span>
            <span>Avg: 3.2s</span>
          </div>
          <div className="h-6 flex items-end gap-1 bg-slate-50 p-1 rounded border border-slate-100/80">
            {sparklineData.map((bar, idx) => (
              <div
                key={idx}
                title={`Run ${bar.run}: ${bar.duration} (${bar.status})`}
                style={{ height: bar.height }}
                className={`flex-1 rounded-xs transition-all ${
                  bar.status === 'failed'
                    ? 'bg-rose-500'
                    : bar.status === 'syncing'
                    ? 'bg-[#0070F3] animate-pulse'
                    : 'bg-[#10B981] hover:bg-[#059669]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row: MAR volume & Actions */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">MAR Usage:</span>
          <span className="font-bold text-[#0F172A] bg-blue-50/70 border border-blue-100 px-2 py-0.5 rounded text-[11px]">
            14.2k MAR
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncClick}
            disabled={isSyncing}
            className="fivetran-btn-primary py-1.5 px-3 text-[11px] h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/connections/${connection.id}`);
            }}
            className="p-1.5 text-slate-400 hover:text-[#0070F3] hover:bg-blue-50 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
