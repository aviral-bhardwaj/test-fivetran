import React, { useState } from 'react';
import { usePolling } from '../hooks/usePolling';
import { getHealth, createConnector, createDestination, createConnection } from '../api/client';
import { useToast } from '../hooks/useToast';
import { ShieldCheck, Key, Lock, Users, Globe, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

const Settings = () => {
  const { data: healthData } = usePolling(getHealth, 30000);
  const { addToast } = useToast();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleCreateDemo = async () => {
    setDemoLoading(true);
    try {
      addToast('Creating demo Postgres source...', 'info');
      const connRes = await createConnector({ name: 'PostgreSQL Analytics', type: 'postgres', organization_id: 1, config: {} });

      addToast('Connecting Snowflake warehouse...', 'info');
      const destRes = await createDestination({ name: 'Snowflake Analytics', type: 'sqlite_warehouse', organization_id: 1, config: { dbPath: './data/warehouse.db' } });

      addToast('Configuring pipeline...', 'info');
      await createConnection({
        name: 'PostgreSQL ➔ Snowflake',
        connector_id: connRes.data.id,
        destination_id: destRes.data.id,
        source_table: 'users',
        sync_mode: 'incremental',
        schedule_minutes: 15,
        organization_id: 1
      });

      addToast('Fivetran demo pipeline provisioned successfully!', 'success');
    } catch {
      addToast('Failed to create demo pipeline', 'error');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-black text-[#0F172A] tracking-tight">
          Account & Workspace Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your Fivetran workspace, API credentials, role-based access, and security policies.
        </p>
      </div>

      {/* Workspace Card */}
      <div className="fivetran-card p-6 space-y-4">
        <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#0070F3]" />
          Workspace Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400">Account Name:</span>
            <div className="font-bold text-slate-800 mt-0.5">Acme Corporation</div>
          </div>
          <div>
            <span className="text-slate-400">Cloud Region:</span>
            <div className="font-bold text-slate-800 mt-0.5">AWS US-East (N. Virginia)</div>
          </div>
          <div>
            <span className="text-slate-400">Subscription:</span>
            <div className="font-bold text-emerald-700 mt-0.5">Enterprise Scale</div>
          </div>
        </div>
      </div>

      {/* API Access Card */}
      <div className="fivetran-card p-6 space-y-3">
        <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
          <Key className="w-4 h-4 text-amber-500" />
          Fivetran REST API Credentials
        </h3>
        <p className="text-xs text-slate-500">
          Use your API key and secret to programmatically manage connectors, trigger syncs, and monitor pipeline metrics.
        </p>
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-600">API Key: <strong className="text-slate-900">ft_live_839fbc0192e41a98</strong></span>
          <button
            onClick={() => addToast('API Key copied to clipboard', 'success')}
            className="text-[#0070F3] hover:underline font-bold text-[11px]"
          >
            Copy Key
          </button>
        </div>
      </div>

      {/* Demo Pipeline Provisioner */}
      <div className="fivetran-card p-6 space-y-3">
        <h3 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#0070F3]" />
          Sample Pipeline Provisioner
        </h3>
        <p className="text-xs text-slate-500">
          Instantly set up a sample PostgreSQL ➔ Snowflake analytical pipeline to test schema discovery, incremental replication, and log streaming.
        </p>
        <button
          onClick={handleCreateDemo}
          disabled={demoLoading}
          className="fivetran-btn-primary"
        >
          {demoLoading ? 'Provisioning...' : 'Provision Sample Pipeline'}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Settings;
