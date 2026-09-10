import React, { useState, useEffect } from 'react';
import { getDestinations, createDestination, deleteDestination } from '../api/client';
import { useToast } from '../hooks/useToast';
import Modal from '../components/Modal';
import { Database, Plus, CheckCircle2, Trash2, ArrowUpRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { ConnectorIcon } from '../components/ConnectorIcons';

const Destinations = () => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    type: 'sqlite_warehouse',
    organization_id: 1,
    config: { dbPath: './data/warehouse.db' }
  });

  const fetchDestinations = async () => {
    setLoading(true);
    try {
      const res = await getDestinations();
      setDestinations(res.data || []);
    } catch {
      addToast('Failed to fetch destinations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this destination warehouse?')) return;
    try {
      await deleteDestination(id);
      addToast('Destination removed', 'success');
      fetchDestinations();
    } catch {
      addToast('Failed to delete destination', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createDestination(formData);
      addToast('Destination warehouse created', 'success');
      setIsModalOpen(false);
      fetchDestinations();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create destination', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#0F172A] tracking-tight">
            Destinations & Data Warehouses
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Fivetran replicates clean, normalized data directly into your cloud data warehouse or data lake.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="fivetran-btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>Add Destination</span>
        </button>
      </div>

      {/* Destinations Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500 font-medium">
          Loading destination warehouses...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {destinations.map((dest) => (
            <div
              key={dest.id}
              className="fivetran-card p-6 flex flex-col justify-between hover:shadow-md hover:border-[#0070F3]/40 group transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <ConnectorIcon type={dest.type} className="w-12 h-12 shadow-2xs" />
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Connected
                  </span>
                </div>

                <h3 className="font-bold text-base text-[#0F172A] group-hover:text-[#0070F3] transition-colors">
                  {dest.name}
                </h3>
                <div className="text-xs text-slate-500 mt-1 capitalize">
                  {dest.type.replace('_', ' ')}
                </div>

                {/* Warehouse Stats */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400">Status:</span>
                    <div className="font-bold text-slate-700 mt-0.5">Healthy (0 errors)</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Write Latency:</span>
                    <div className="font-bold text-slate-700 mt-0.5">~180ms</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  ID: #{dest.id}
                </span>
                <button
                  onClick={() => handleDelete(dest.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                  title="Remove Destination"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Connect Destination Warehouse"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Destination Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Snowflake Production"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#0070F3]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Warehouse Engine
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#0070F3]"
              >
                <option value="sqlite_warehouse">SQLite Analytical Warehouse (Local / Embedded)</option>
                <option value="snowflake_warehouse">Snowflake Cloud Data Warehouse</option>
                <option value="bigquery">Google BigQuery</option>
                <option value="postgres">PostgreSQL Warehouse</option>
                <option value="local_file">Partitioned Local JSONL Archive</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="fivetran-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="fivetran-btn-primary"
              >
                Save Destination
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Destinations;
