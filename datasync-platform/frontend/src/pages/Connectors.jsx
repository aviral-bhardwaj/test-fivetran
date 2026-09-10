import React, { useState, useEffect } from 'react';
import { getConnectors, createConnector, deleteConnector, testConnector } from '../api/client';
import { useToast } from '../hooks/useToast';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { Plug } from 'lucide-react';

const Connectors = () => {
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    type: 'demo',
    organization_id: 1,
    config: {}
  });

  const fetchConnectors = async () => {
    setLoading(true);
    try {
      const res = await getConnectors();
      setConnectors(res.data || []);
    } catch (err) {
      addToast('Failed to fetch connectors', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectors();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this connector?')) return;
    try {
      await deleteConnector(id);
      addToast('Connector deleted', 'success');
      fetchConnectors();
    } catch (err) {
      addToast('Failed to delete connector', 'error');
    }
  };

  const handleTest = async (id) => {
    try {
      addToast('Testing connection...', 'info');
      await testConnector(id);
      addToast('Connection successful', 'success');
    } catch (err) {
      addToast('Connection failed', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createConnector(formData);
      addToast('Connector created successfully', 'success');
      setIsModalOpen(false);
      fetchConnectors();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create connector', 'error');
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: (row) => (
      <div className="flex items-center gap-2">
        <Plug className="w-4 h-4 text-slate-500" />
        <span className="capitalize">{row.type}</span>
      </div>
    )},
    { key: 'created_at', label: 'Created At', render: (row) => new Date(row.created_at).toLocaleString() },
    { key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex gap-2">
        <button onClick={() => handleTest(row.id)} className="text-blue-600 hover:underline text-sm">Test</button>
        <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:underline text-sm">Delete</button>
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Connectors</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + New Connector
        </button>
      </div>

      <DataTable columns={columns} data={connectors} loading={loading} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Connector" size="md">
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
              onChange={(e) => setFormData({...formData, type: e.target.value, config: {}})}
            >
              <option value="demo">Demo</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="csv">CSV</option>
            </select>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg border">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Configuration</h3>
            {formData.type === 'demo' && <p className="text-sm text-slate-500">No configuration required.</p>}
            {(formData.type === 'postgresql' || formData.type === 'mysql') && (
              <div className="space-y-3">
                <input placeholder="Host" className="w-full px-3 py-2 border rounded" onChange={e => setFormData({...formData, config: {...formData.config, host: e.target.value}})} />
                <input placeholder="Port" type="number" className="w-full px-3 py-2 border rounded" onChange={e => setFormData({...formData, config: {...formData.config, port: parseInt(e.target.value, 10)}})} />
                <input placeholder="Database" className="w-full px-3 py-2 border rounded" onChange={e => setFormData({...formData, config: {...formData.config, database: e.target.value}})} />
                <input placeholder="Username" className="w-full px-3 py-2 border rounded" onChange={e => setFormData({...formData, config: {...formData.config, username: e.target.value}})} />
                <input placeholder="Password" type="password" className="w-full px-3 py-2 border rounded" onChange={e => setFormData({...formData, config: {...formData.config, password: e.target.value}})} />
              </div>
            )}
            {formData.type === 'csv' && (
              <input placeholder="File Path" className="w-full px-3 py-2 border rounded" onChange={e => setFormData({...formData, config: {...formData.config, file_path: e.target.value}})} />
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

export default Connectors;
