import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSourceCatalog, getDestinationCatalog, createConnector, createDestination, testConnector } from '../api/client';
import { useToast } from '../hooks/useToast';
import Modal from '../components/Modal';
import DynamicForm from '../components/DynamicForm';
import { Search, Database, Globe, FileText, Layers, Zap, Plus, CheckCircle, ExternalLink, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All Connectors', icon: Sparkles },
  { id: 'database', label: 'Databases', icon: Database },
  { id: 'api', label: 'Cloud APIs & SaaS', icon: Globe },
  { id: 'file', label: 'Files & Storage', icon: FileText },
  { id: 'warehouse', label: 'Data Warehouses', icon: Layers },
  { id: 'vector', label: 'AI & Vector DBs', icon: Zap },
];

export default function ConnectorCatalog() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sources, setSources] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConnector, setSelectedConnector] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customName, setCustomName] = useState('');

  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCatalogs = async () => {
      setLoading(true);
      try {
        const [srcRes, destRes] = await Promise.all([
          getSourceCatalog(),
          getDestinationCatalog()
        ]);
        setSources(srcRes.data || []);
        setDestinations(destRes.data || []);
      } catch (err) {
        addToast('Failed to load connector catalog', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchCatalogs();
  }, []);

  const allConnectors = [
    ...sources.map(s => ({ ...s, kind: 'source' })),
    ...destinations.map(d => ({ ...d, kind: 'destination' }))
  ];

  const filteredConnectors = allConnectors.filter(c => {
    const matchesCategory = activeTab === 'all' || c.category === activeTab;
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenSetup = (connector) => {
    setSelectedConnector(connector);
    setCustomName(`My ${connector.name}`);
    setIsModalOpen(true);
  };

  const handleCreate = async (formData) => {
    if (!selectedConnector) return;
    setIsSubmitting(true);
    try {
      if (selectedConnector.kind === 'source') {
        const res = await createConnector({
          organization_id: 1,
          name: customName || `My ${selectedConnector.name}`,
          type: selectedConnector.id,
          config: formData
        });
        addToast(`${selectedConnector.name} source configured successfully!`, 'success');
        setIsModalOpen(false);
        navigate('/connectors');
      } else {
        await createDestination({
          organization_id: 1,
          name: customName || `My ${selectedConnector.name}`,
          type: selectedConnector.id,
          config: formData
        });
        addToast(`${selectedConnector.name} destination configured successfully!`, 'success');
        setIsModalOpen(false);
        navigate('/destinations');
      }
    } catch (err) {
      addToast(err.response?.data?.error || err.message || 'Configuration failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/30 rounded-full text-indigo-300 text-xs font-semibold border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5" /> Airbyte Connector Marketplace
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Connector Catalog</h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Browse and configure over 20+ pre-built source and destination connectors. Connect your databases, APIs, cloud apps, files, and vector stores in minutes.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative z-10 mt-6 max-w-lg">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by connector name or technology (e.g. Postgres, Stripe, S3)..."
              className="w-full pl-11 pr-4 py-2.5 bg-white text-slate-900 rounded-xl text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 shadow-lg"
            />
          </div>
        </div>

        {/* Background glow */}
        <div className="absolute -right-12 -top-12 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Connectors Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading Airbyte Connector Registry...</div>
      ) : filteredConnectors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
          <p className="text-slate-500 text-sm">No connectors found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredConnectors.map((c) => {
            const isSource = c.kind === 'source';
            return (
              <div 
                key={`${c.kind}-${c.id}`}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                          {c.name}
                        </h3>
                        <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-0.5 ${
                          isSource ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                        }`}>
                          {isSource ? 'Source' : 'Destination'} • {c.category}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {c.releaseStage === 'generally_available' ? 'GA' : 'BETA'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  {c.documentationUrl && (
                    <a
                      href={c.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1"
                    >
                      Docs <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    onClick={() => handleOpenSetup(c)}
                    className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-semibold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Set Up
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dynamic Spec Setup Modal */}
      {selectedConnector && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Configure ${selectedConnector.name} ${selectedConnector.kind === 'source' ? 'Source' : 'Destination'}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-indigo-50/70 p-3 rounded-lg border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{selectedConnector.name} Specifications</p>
                <p className="text-indigo-700 mt-0.5">{selectedConnector.description}</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Display Name</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Production Postgres"
              />
            </div>

            <DynamicForm
              spec={selectedConnector.spec}
              onSubmit={handleCreate}
              onCancel={() => setIsModalOpen(false)}
              submitText={`Save & Connect ${selectedConnector.name}`}
              isSubmitting={isSubmitting}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
