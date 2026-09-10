import React, { useState, useEffect } from 'react';
import { getConnections, createConnection, deleteConnection, triggerSync, toggleConnection, getConnectors, getDestinations } from '../api/client';
import { useToast } from '../hooks/useToast';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { Play, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const Connections = () => {
  const [connections, setConnections] = useState([]);
  const [connectors, setConnectors] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    connector_id: '',
    destination_id: '',
    source_table: '',
    sync_mode: 'full',
    incremental_key: '',
    schedule_interval_minutes: 60,
    organization_id: 1
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [connRes, contRes, destRes] = await Promise.all([
        getConnections(),
        getConnectors(),
        getDestinations()
      ]);
      setConnections(connRes.data || []);
      setConnectors(contRes.data || []);
      setDestinations(destRes.data || []);
      
      if (contRes.data?.length) setFormData(f => ({...f, connector_id: contRes.data[0].id}));
      if (destRes.data?.length) setFormData(f => ({...f, destination_id: destRes.data[0].id}));
    } catch (err) {
      addToast('Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this connection?')) return;
    try {
      await deleteConnection(id);
      addToast('Connection deleted', 'success');
      fetchData();
    } catch (err) {
      addToast('Failed to delete connection', 'error');
    }
  };

  const handleSync = async (id) => {
    try {
      addToast('Starting sync job...', 'info');
      await triggerSync(id);
      addToast('Sync job triggered successfully', 'success');
    } catch (err) {
      addToast('Failed to trigger sync', 'error');
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleConnection(id);
      fetchData();
    } catch (err) {
      addToast('Failed to toggle connection', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createConnection(formData);
      addToast('Connection created successfully', 'success');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create connection', 'error');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (row) => (
      <Link to={`/connections/${row.id}`} className="font-medium text-blue-600 hover:underline flex items-center gap-2">
        <LinkIcon className="w-4 h-4" /> {row.name}
      </Link>
    )},
    { key: 'source', label: 'Source', render: (row) => connectors.find(c => c.id === row.connector_id)?.name || row.connector_id },
    { key: 'destination', label: 'Destination', render: (row) => destinations.find(d => d.id === row.destination_id)?.name || row.destination_id },
    { key: 'source_table', label: 'Table' },
    { key: 'sync_mode', label: 'Mode', render: row => <span className="capitalize">{row.sync_mode}</span> },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} /> },
    { key: 'actions', label: 'Actions', render: (row) => (
      <div className="flex gap-3 items-center">
        <button onClick={() => handleSync(row.id)} className="text-slate-600 hover:text-blue-600" title="Sync Now">
          <Play className="w-4 h-4" />
        </button>
        <button onClick={() => handleToggle(row.id)} className="text-slate-600 hover:underline text-sm">
          {row.is_active ? 'Disable' : 'Enable'}
        </button>
        <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:underline text-sm">Delete</button>
      </div>
    )}
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Connections</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + New Connection
        </button>
      </div>

      <DataTable columns={columns} data={connections} loading={loading} />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Connection" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input required type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
              <select required className="w-full px-3 py-2 border rounded-lg" value={formData.connector_id} onChange={(e) => setFormData({...formData, connector_id: e.target.value})}>
                {connectors.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Destination</label>
              <select required className="w-full px-3 py-2 border rounded-lg" value={formData.destination_id} onChange={(e) => setFormData({...formData, destination_id: e.target.value})}>
                {destinations.map(d => <option key={d.id} value={d.id}>{d.name} ({d.type})</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Source Table / Collection</label>
            <input required type="text" placeholder="e.g. users" className="w-full px-3 py-2 border rounded-lg" value={formData.source_table} onChange={(e) => setFormData({...formData, source_table: e.target.value})} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Sync Mode</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="mode" value="full" checked={formData.sync_mode === 'full'} onChange={(e) => setFormData({...formData, sync_mode: e.target.value})} /> Full Refresh
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="mode" value="incremental" checked={formData.sync_mode === 'incremental'} onChange={(e) => setFormData({...formData, sync_mode: e.target.value})} /> Incremental
              </label>
            </div>
          </div>

          {formData.sync_mode === 'incremental' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Incremental Key Column</label>
              <input required type="text" placeholder="e.g. updated_at" className="w-full px-3 py-2 border rounded-lg" value={formData.incremental_key} onChange={(e) => setFormData({...formData, incremental_key: e.target.value})} />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Schedule (minutes)</label>
            <input required type="number" min="1" className="w-full px-3 py-2 border rounded-lg" value={formData.schedule_interval_minutes} onChange={(e) => setFormData({...formData, schedule_interval_minutes: parseInt(e.target.value, 10)})} />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Connection</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Connections;
