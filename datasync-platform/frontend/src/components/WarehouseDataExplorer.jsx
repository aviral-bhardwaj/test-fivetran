import React, { useState, useEffect } from 'react';
import { Database, Plus, Search, RefreshCw, Terminal, CheckCircle2, Table as TableIcon, ArrowRight, Play, Sparkles } from 'lucide-react';
import { getConnectionData, insertConnectionRecord, queryDestinationWarehouse } from '../api/client';
import { useToast } from '../hooks/useToast';

export const WarehouseDataExplorer = ({ connectionId, destinationId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inserting, setInserting] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('table'); // 'table' | 'sql'
  const [search, setSearch] = useState('');
  const [sqlQuery, setSqlQuery] = useState('');
  const [queryResults, setQueryResults] = useState(null);
  const [querying, setQuerying] = useState(false);
  const { addToast } = useToast();

  const loadData = () => {
    setLoading(true);
    getConnectionData(connectionId)
      .then(res => {
        setData(res.data);
        if (!sqlQuery && res.data?.table) {
          setSqlQuery(`SELECT * FROM "${res.data.table}" LIMIT 10;`);
        }
      })
      .catch(err => {
        console.error('Failed to load warehouse records:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [connectionId]);

  const handleInsertAndSync = async () => {
    setInserting(true);
    try {
      addToast('Inserting new record into source stream...', 'info');
      const res = await insertConnectionRecord(connectionId, {});
      addToast(`Replicated! ${res.data.message}`, 'success');
      loadData();
    } catch {
      addToast('Failed to insert and sync record', 'error');
    } finally {
      setInserting(false);
    }
  };

  const handleRunSql = async () => {
    if (!sqlQuery.trim()) return;
    setQuerying(true);
    try {
      // Use destinationId or default to 2
      const targetDestId = destinationId || 2;
      const res = await queryDestinationWarehouse(targetDestId, sqlQuery);
      setQueryResults(res.data);
      addToast(`SQL query executed (${res.data.rows_count} rows returned)`, 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'SQL query failed', 'error');
    } finally {
      setQuerying(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="fivetran-card p-12 text-center text-xs text-slate-500 font-medium">
        Connecting to destination warehouse and querying table records...
      </div>
    );
  }

  const rows = data?.rows || [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  const filteredRows = rows.filter(row => {
    if (!search) return true;
    return Object.values(row).some(val =>
      String(val).toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Controls Card */}
      <div className="fivetran-card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0070F3] flex items-center justify-center border border-blue-100">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#0F172A] font-mono">
                  {data?.table || 'warehouse_table'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live Synced Table
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Target: <strong className="text-slate-700 font-semibold">{data?.destination_name || 'Snowflake Analytics'}</strong> · Total records in warehouse: <strong className="text-[#0070F3] font-bold">{data?.total || rows.length}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleInsertAndSync}
              disabled={inserting}
              className="fivetran-btn-primary py-1.5 px-3.5 text-xs shadow-xs"
            >
              <Sparkles className={`w-3.5 h-3.5 ${inserting ? 'animate-spin' : ''}`} />
              <span>{inserting ? 'Inserting & Replicating...' : '+ Insert Source Record & Sync Live'}</span>
            </button>
            <button
              onClick={loadData}
              className="fivetran-btn-secondary p-2"
              title="Refresh warehouse data"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Sub-tab navigation: Table View vs SQL Console */}
        <div className="flex items-center gap-4 border-b border-slate-100 mt-5 pt-2 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('table')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 ${
              activeSubTab === 'table'
                ? 'border-[#0070F3] text-[#0070F3]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Warehouse Records Table ({data?.total || rows.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('sql')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors border-b-2 ${
              activeSubTab === 'sql'
                ? 'border-[#0070F3] text-[#0070F3]'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>SQL Query Console</span>
          </button>
        </div>
      </div>

      {/* Subtab 1: Table Records View */}
      {activeSubTab === 'table' && (
        <div className="fivetran-card overflow-hidden">
          {/* Search bar */}
          <div className="p-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search across loaded records..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1 text-xs focus:outline-none focus:border-[#0070F3]"
              />
            </div>
            <span className="text-[11px] text-slate-500">
              Showing {filteredRows.length} of {rows.length} records in view
            </span>
          </div>

          {/* Actual Records Table */}
          {rows.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No records in this warehouse table yet. Click <strong>"Sync Now"</strong> or <strong>"+ Insert Source Record & Sync Live"</strong> above to load data.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[480px]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100/80 text-slate-600 border-b border-slate-200 sticky top-0 z-10 font-bold">
                  <tr>
                    <th className="py-2.5 px-4 w-12 text-slate-400">#</th>
                    {columns.map(col => (
                      <th key={col} className="py-2.5 px-4 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-blue-50/40 transition-colors"
                    >
                      <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>
                      {columns.map(col => (
                        <td key={col} className="py-2.5 px-4 text-slate-800 whitespace-nowrap">
                          {typeof row[col] === 'object' && row[col] !== null
                            ? JSON.stringify(row[col])
                            : String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Interactive SQL Query Console */}
      {activeSubTab === 'sql' && (
        <div className="space-y-4">
          <div className="fivetran-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-[#0070F3]" />
                Interactive Warehouse SQL Query Console
              </label>
              <span className="text-[11px] text-slate-400 font-mono">Dialect: SQLite / ANSI SQL</span>
            </div>

            <textarea
              rows={3}
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              placeholder="Enter SQL query against warehouse..."
              className="w-full font-mono text-xs p-3 bg-slate-900 text-emerald-400 rounded-lg border border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
            />

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>Quick templates:</span>
                <button
                  onClick={() => setSqlQuery(`SELECT * FROM "${data?.table || 'airbyte_raw_demo_orders'}" LIMIT 10;`)}
                  className="hover:text-[#0070F3] underline"
                >
                  Select 10
                </button>
                <span>•</span>
                <button
                  onClick={() => setSqlQuery(`SELECT status, COUNT(*) as total_orders, SUM(CAST(amount as REAL)) as revenue FROM "${data?.table || 'airbyte_raw_demo_orders'}" GROUP BY status;`)}
                  className="hover:text-[#0070F3] underline"
                >
                  Aggregate by Status
                </button>
              </div>

              <button
                onClick={handleRunSql}
                disabled={querying}
                className="fivetran-btn-primary py-1.5 px-4 text-xs"
              >
                <Play className={`w-3.5 h-3.5 ${querying ? 'animate-spin' : ''}`} />
                <span>{querying ? 'Executing SQL...' : 'Run Query'}</span>
              </button>
            </div>
          </div>

          {/* Query Results */}
          {queryResults && (
            <div className="fivetran-card overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700">Query Result ({queryResults.rows_count} rows returned)</span>
                <span className="text-emerald-600 font-bold text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Query Executed in 12ms
                </span>
              </div>
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-100/70 border-b border-slate-200 font-bold text-slate-600">
                    <tr>
                      {queryResults.rows && queryResults.rows.length > 0 &&
                        Object.keys(queryResults.rows[0]).map(k => (
                          <th key={k} className="py-2 px-4 whitespace-nowrap">{k}</th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {queryResults.rows?.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        {Object.values(row).map((v, i) => (
                          <td key={i} className="py-2 px-4 whitespace-nowrap text-slate-800">
                            {String(v ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WarehouseDataExplorer;
