import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Copy, Download, Search, Check, RefreshCw } from 'lucide-react';
import { getSyncLogs } from '../api/client';

export default function TerminalLogViewer({ syncId, autoRefresh = false }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');
  const terminalEndRef = useRef(null);

  const fetchLogs = async () => {
    if (!syncId) return;
    try {
      const res = await getSyncLogs(syncId);
      setLogs(res.data || []);
    } catch (e) {
      console.error('Failed to fetch job logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 3000);
      return () => clearInterval(interval);
    }
  }, [syncId, autoRefresh]);

  const copyLogs = () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadLogs = () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job_${syncId}_logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(l => 
    !search || l.message?.toLowerCase().includes(search.toLowerCase()) || l.level?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-slate-950 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col font-mono text-xs">
      {/* Top Header */}
      <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-xs">
            <Terminal className="w-4 h-4 text-indigo-400" />
            Airbyte Replication Console — Job #{syncId}
          </div>
        </div>

        <div className="flex items-center gap-3 font-sans">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter logs..."
              className="bg-slate-800/80 text-slate-200 pl-8 pr-3 py-1 rounded-md text-xs border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36"
            />
          </div>

          <button
            onClick={fetchLogs}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={copyLogs}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          <button
            onClick={downloadLogs}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Console Output */}
      <div className="p-4 overflow-y-auto max-h-[420px] min-h-[220px] space-y-1.5 selection:bg-indigo-900">
        {loading && logs.length === 0 ? (
          <div className="text-slate-500 py-6 text-center">Loading live container logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-slate-500 py-6 text-center">No log messages recorded for this execution.</div>
        ) : (
          filteredLogs.map((log, idx) => {
            const isError = log.level === 'ERROR';
            const isWarn = log.level === 'WARN';
            const levelColor = isError ? 'text-red-400 bg-red-950/60 border-red-800/50' : (isWarn ? 'text-yellow-400 bg-yellow-950/60 border-yellow-800/50' : 'text-indigo-400 bg-indigo-950/50 border-indigo-800/40');

            return (
              <div key={log.id || idx} className="flex items-start gap-2.5 hover:bg-slate-900/60 px-1 py-0.5 rounded transition-colors">
                <span className="text-slate-600 select-none text-[11px] w-20 flex-shrink-0">
                  {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '00:00:00'}
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold border ${levelColor} flex-shrink-0`}>
                  {log.level || 'INFO'}
                </span>
                <span className={`flex-1 break-all ${isError ? 'text-red-300' : 'text-slate-300'}`}>
                  {log.message}
                </span>
              </div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
