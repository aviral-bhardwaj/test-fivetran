import React, { useState, useEffect } from 'react';
import { getDestinations, createDestination, deleteDestination } from '../api/client';
import { useToast } from '../hooks/useToast';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Database } from 'lucide-react';

const Destinations = () => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    type: 'local_file',
    organization_id: 1,
    config: { outputDir: './data/syncs' }
  });

  const fetchDestinations = async () => {
    setLoading(true);
    try {
      const res = await getDestinations();
      setDestinations(res.data || []);
    } catch (err) {
      addToast('Failed to fetch destinations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this destination?')) return;
    try {
      await deleteDestination(id);
      addToast('Destination deleted', 'success');
      fetchDestinations();
    } catch (err) {
      addToast('Failed to delete destination', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createDestination(formData);
      addToast('Destination created successfully', 'success');
      setIsModalOpen(false);
      fetchDestinations();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create destination', 'error');
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: (row) => (
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-slate-500" />
        <span className="capitalize">{row.type.replace('_', ' ')}</span>
      </div>
    )},
    { key: 'created_at', label: 'Created At', render: (row) => new Date(row.created_at).toLocaleString() },
    { key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex gap-2">
        <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:underline text-sm">Delete</button>
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Destinations</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + New Destination
        </button>
      </div>

      <DataTable columns={columns} data={destinations} loading={loading} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Destination" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input 
              required
              type="text" 
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select 
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.type}
              onChange={(e) => {
                const type = e.target.value;
                const defaultConfig = type === 'local_file' ? { outputDir: './data/syncs' } : { dbPath: './data/warehouse.db' };
                setFormData({...formData, type, config: defaultConfig});
              }}
            >
              <option value="local_file">Local File</option>
              <option value="sqlite_warehouse">SQLite Warehouse</option>
            </select>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Configuration</h3>
            {formData.type === 'local_file' && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Output Directory</label>
                <input placeholder="./data/syncs" className="w-full px-3 py-2 border rounded" value={formData.config.outputDir || ''} onChange={e => setFormData({...formData, config: {...formData.config, outputDir: e.target.value}})} />
              </div>
            )}
            {formData.type === 'sqlite_warehouse' && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">Database Path</label>
                <input placeholder="./data/warehouse.db" className="w-full px-3 py-2 border rounded" value={formData.config.dbPath || ''} onChange={e => setFormData({...formData, config: {...formData.config, dbPath: e.target.value}})} />
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Destinations;
