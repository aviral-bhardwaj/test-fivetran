import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, RefreshCw, LayoutGrid, List, CheckCircle2, TrendingUp, Clock, AlertCircle, ArrowUpRight } from 'lucide-react';
import { getConnections, getMetrics, triggerSync } from '../api/client';
import { ConnectorCard } from '../components/ConnectorCard';
import { useToast } from '../hooks/useToast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [connections, setConnections] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const fetchData = () => {
    Promise.all([
      getConnections().then(res => res.data),
      getMetrics().then(res => res.data)
    ]).then(([conns, mets]) => {
      setConnections(conns || []);
      setMetrics(mets);
    }).catch(err => {
      console.error('Failed to load dashboard data:', err);
    }).finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSyncNow = async (id) => {
    try {
      await triggerSync(id);
      addToast('Sync triggered successfully', 'success');
      fetchData();
    } catch {
      addToast('Failed to trigger sync', 'error');
    }
  };

  // Filter connections
  const filtered = connections.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                          (c.connector_type || '').toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === 'active') return c.enabled === 1;
    if (statusFilter === 'paused') return c.enabled === 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="fivetran-card p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Active Connectors</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#0F172A] tracking-tight">
            {connections.filter(c => c.enabled === 1).length}
            <span className="text-xs font-normal text-slate-400 ml-1.5">/ {connections.length} Total</span>
          </div>
          <p className="mt-2 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            100% Replication Pipelines Online
          </p>
        </div>

        {/* Metric 2 */}
        <div className="fivetran-card p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Monthly Active Rows (MAR)</span>
            <TrendingUp className="w-4 h-4 text-[#0070F3]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#0F172A] tracking-tight">
            {(metrics?.total_rows_synced || 14200).toLocaleString()}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            62.3% of 2.0M MAR allocated
          </p>
        </div>

        {/* Metric 3 */}
        <div className="fivetran-card p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Sync Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-[#0070F3]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#0F172A] tracking-tight">
            99.8%
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {metrics?.succeeded_syncs || 5} successful / {metrics?.total_syncs || 5} total runs
          </p>
        </div>

        {/* Metric 4 */}
        <div className="fivetran-card p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Next Scheduled Sync</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#0F172A] tracking-tight">
            in ~8 mins
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Automatic cron trigger every 15m
          </p>
        </div>
      </div>

      {/* Action & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search & Status Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter connectors by name, source..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-[#E2E8F0] rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#0070F3] shadow-2xs"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold text-slate-600">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md transition-all ${statusFilter === 'all' ? 'bg-white text-[#0070F3] shadow-2xs' : 'hover:text-slate-900'}`}
            >
              All ({connections.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-md transition-all ${statusFilter === 'active' ? 'bg-white text-emerald-700 shadow-2xs' : 'hover:text-slate-900'}`}
            >
              Active ({connections.filter(c => c.enabled === 1).length})
            </button>
            <button
              onClick={() => setStatusFilter('paused')}
              className={`px-3 py-1 rounded-md transition-all ${statusFilter === 'paused' ? 'bg-white text-slate-800 shadow-2xs' : 'hover:text-slate-900'}`}
            >
              Paused ({connections.filter(c => c.enabled === 0).length})
            </button>
          </div>
        </div>

        {/* Right: + Add Connector & View Toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-slate-100 text-[#0070F3]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-100 text-[#0070F3]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => navigate('/catalog')}
            className="fivetran-btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add Connector</span>
          </button>
        </div>
      </div>

      {/* Connectors Grid / List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 font-medium">
          Loading connectors...
        </div>
      ) : filtered.length === 0 ? (
        <div className="fivetran-card p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0070F3] flex items-center justify-center mx-auto">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-[#0F172A]">No connectors found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search ? 'Try adjusting your search criteria.' : 'Create your first data pipeline by connecting a source database or API to your destination warehouse.'}
          </p>
          <button
            onClick={() => navigate('/catalog')}
            className="fivetran-btn-primary mt-2"
          >
            Browse Connector Directory
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((connection) => (
            <ConnectorCard
              key={connection.id}
              connection={connection}
              onSyncNow={handleSyncNow}
            />
          ))}
        </div>
      ) : (
        <div className="fivetran-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100 font-semibold">
              <tr>
                <th className="py-3.5 px-5">Connector</th>
                <th className="py-3.5 px-5">Destination</th>
                <th className="py-3.5 px-5">Frequency</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">MAR</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(connection => (
                <tr
                  key={connection.id}
                  onClick={() => navigate(`/connections/${connection.id}`)}
                  className="hover:bg-slate-50/60 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-5 font-bold text-slate-800">
                    {connection.name}
                  </td>
                  <td className="py-3.5 px-5 text-slate-600">
                    {connection.destination_name || 'Snowflake'}
                  </td>
                  <td className="py-3.5 px-5 text-slate-500">
                    Every {connection.schedule_minutes || 15}m
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Active
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-800">
                    14.2k
                  </td>
                  <td className="py-3.5 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleSyncNow(connection.id)}
                      className="fivetran-btn-primary py-1 px-3 text-[11px] h-7"
                    >
                      Sync Now
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Directory Quick Banner */}
      <div className="bg-gradient-to-r from-[#0070F3]/5 via-[#0070F3]/10 to-transparent border border-[#0070F3]/20 rounded-xl p-5 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm text-[#0F172A]">Need to add a new data source?</h4>
          <p className="text-xs text-slate-600 mt-0.5">
            Choose from over 500+ pre-built automated connectors including PostgreSQL, Snowflake, Salesforce, Stripe, and Shopify.
          </p>
        </div>
        <button
          onClick={() => navigate('/catalog')}
          className="fivetran-btn-primary shadow-xs shrink-0"
        >
          <span>Open Directory</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
