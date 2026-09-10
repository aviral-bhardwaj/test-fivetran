import React, { useState } from 'react';
import { usePolling } from '../hooks/usePolling';
import { getHealth, createConnector, createDestination, createConnection } from '../api/client';
import { useToast } from '../hooks/useToast';
import { Zap, Server, Activity, ArrowRight } from 'lucide-react';

const Settings = () => {
  const { data: healthData, loading } = usePolling(getHealth, 30000);
  const { addToast } = useToast();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleCreateDemo = async () => {
    setDemoLoading(true);
    try {
      addToast('Creating demo connector...', 'info');
      const connRes = await createConnector({ name: 'Demo Source', type: 'demo', organization_id: 1, config: {} });
      
      addToast('Creating local destination...', 'info');
      const destRes = await createDestination({ name: 'Local Target', type: 'local_file', organization_id: 1, config: { outputDir: './data/syncs' } });
      
      addToast('Creating connection...', 'info');
      await createConnection({
        name: 'Demo Pipeline',
        connector_id: connRes.data.id,
        destination_id: destRes.data.id,
        source_table: 'demo_users',
        sync_mode: 'full',
        schedule_interval_minutes: 60,
        organization_id: 1
      });
      
      addToast('Demo setup completed successfully!', 'success');
    } catch (err) {
      addToast('Failed to create demo setup', 'error');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" /> Platform Information
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-500">Version</p>
            <p className="font-medium text-slate-900">{healthData?.version || '1.0.0'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Status</p>
            <p className="font-medium text-slate-900 capitalize">{healthData?.status || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Uptime</p>
            <p className="font-medium text-slate-900">
              {healthData?.uptime ? `${Math.floor(healthData.uptime / 60)} minutes` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" /> Quick Actions
        </h2>
        <div className="border border-slate-100 rounded-lg p-4 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-medium text-slate-900">Create Demo Setup</h3>
            <p className="text-sm text-slate-500 mt-1">Automatically generates a demo connector, a local destination, and links them.</p>
          </div>
          <button 
            onClick={handleCreateDemo}
            disabled={demoLoading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {demoLoading ? 'Creating...' : 'Run Setup'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-slate-500" /> About DataSync
        </h2>
        <p className="text-slate-600 leading-relaxed text-sm">
          DataSync is a modern data integration platform designed to easily move data between various sources and destinations. 
          It supports full and incremental syncs, scheduling, and detailed monitoring of data pipelines.
        </p>
      </div>
    </div>
  );
};

export default Settings;
