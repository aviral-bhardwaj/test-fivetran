import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSourceCatalog, getDestinationCatalog, createConnector, createDestination } from '../api/client';
import { useToast } from '../hooks/useToast';
import Modal from '../components/Modal';
import DynamicForm from '../components/DynamicForm';
import { Search, Database, Globe, FileText, Layers, Zap, Plus, CheckCircle, Sparkles, Clock, ShieldCheck } from 'lucide-react';
import { ConnectorIcon } from '../components/ConnectorIcons';

const CATEGORIES = [
  { id: 'all', label: 'All Connectors (500+)', icon: Sparkles },
  { id: 'database', label: 'Databases', icon: Database },
  { id: 'api', label: 'Applications & SaaS', icon: Globe },
  { id: 'file', label: 'Files & Cloud Storage', icon: FileText },
  { id: 'warehouse', label: 'Destinations & Warehouses', icon: Layers },
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
      } catch {
        addToast('Failed to load connector catalog', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchCatalogs();
  }, []);

  const allConnectors = [
    ...sources.map(s => ({ ...s, kind: 'source', tier: 'Fivetran Standard' })),
    ...destinations.map(d => ({ ...d, kind: 'destination', tier: 'Destination' }))
  ];

  const filteredConnectors = allConnectors.filter(c => {
    const matchesCategory = activeTab === 'all' || c.category === activeTab;
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.description || '').toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenSetup = (connector) => {
    setSelectedConnector(connector);
    setCustomName(`${connector.name} Production`);
    setIsModalOpen(true);
  };

  const handleCreate = async (formData) => {
    if (!selectedConnector) return;
    setIsSubmitting(true);
    try {
      if (selectedConnector.kind === 'source') {
        await createConnector({
          organization_id: 1,
          name: customName || `${selectedConnector.name} Production`,
          type: selectedConnector.id,
          config: formData
        });
        addToast(`${selectedConnector.name} connector created successfully!`, 'success');
        setIsModalOpen(false);
        navigate('/');
      } else {
        await createDestination({
          organization_id: 1,
          name: customName || `${selectedConnector.name} Production`,
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
      {/* Fivetran Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 shadow-2xs relative overflow-hidden">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#0070F3] border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5" /> Fivetran Automated Connectors
          </div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
            Connector Directory
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Fivetran builds, maintains, and automatically updates over 500+ zero-maintenance data connectors. From databases and SaaS tools to events and files, replication begins with zero code.
          </p>
        </div>

        {/* Search Input */}
        <div className="mt-5 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search 500+ connectors (e.g. Postgres, Salesforce, Stripe)..."
            className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0070F3] focus:bg-white transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#0070F3] text-white shadow-2xs'
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
        <div className="p-12 text-center text-xs text-slate-500 font-medium">
          Loading Fivetran directory...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredConnectors.map((c) => (
            <div
              key={`${c.kind}-${c.id}`}
              className="fivetran-card p-5 flex flex-col justify-between hover:shadow-md hover:border-[#0070F3]/40 group transition-all"
            >
              <div>
                {/* Brand icon and tier badges */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <ConnectorIcon type={c.id} className="w-11 h-11 shadow-2xs" />
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                      {c.tier}
                    </span>
                    <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      14-Day Free Trial
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-[#0F172A] group-hover:text-[#0070F3] transition-colors">
                  {c.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {c.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Setup: ~5 mins</span>
                </div>
                <button
                  onClick={() => handleOpenSetup(c)}
                  className="fivetran-btn-primary py-1 px-3 text-xs"
                >
                  Set Up Connector
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Setup Modal */}
      {isModalOpen && selectedConnector && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Set Up ${selectedConnector.name}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <ConnectorIcon type={selectedConnector.id} className="w-10 h-10" />
              <div>
                <h4 className="font-bold text-xs text-slate-900">{selectedConnector.name}</h4>
                <p className="text-[11px] text-slate-500">Automated zero-maintenance replication</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Connector Destination Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Production Postgres"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#0070F3]"
              />
            </div>

            <DynamicForm
              schema={selectedConnector.spec}
              onSubmit={handleCreate}
              isLoading={isSubmitting}
              submitText="Save & Run Setup Tests"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
