import React, { useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Play, ShieldCheck, RefreshCw } from 'lucide-react';

export const SetupTestsRunner = ({ connectorName = 'Source Connector' }) => {
  const [running, setRunning] = useState(false);
  const [stepStates, setStepStates] = useState([
    { id: 1, title: 'Validating host and port connectivity', status: 'success', time: '142ms' },
    { id: 2, title: 'Authenticating database user credentials', status: 'success', time: '210ms' },
    { id: 3, title: 'Verifying WAL / CDC replication permissions', status: 'success', time: '380ms' },
    { id: 4, title: 'Testing destination warehouse write access', status: 'success', time: '412ms' },
  ]);

  const runTests = async () => {
    setRunning(true);
    // Reset to pending
    setStepStates(prev => prev.map(s => ({ ...s, status: 'pending', time: null })));

    for (let i = 0; i < 4; i++) {
      setStepStates(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'running' } : s));
      await new Promise(r => setTimeout(r, 600));
      setStepStates(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'success', time: `${Math.floor(Math.random() * 200 + 120)}ms` } : s));
    }
    setRunning(false);
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-bold text-sm text-[#0F172A] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0070F3]" />
            Fivetran Connection Setup Tests
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated health verification checks for {connectorName}
          </p>
        </div>
        <button
          type="button"
          onClick={runTests}
          disabled={running}
          className="fivetran-btn-primary"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Running Setup Tests...' : 'Re-test Connection'}
        </button>
      </div>

      <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden bg-slate-50/50">
        {stepStates.map((step) => (
          <div key={step.id} className="p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              {step.status === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              )}
              {step.status === 'running' && (
                <Loader2 className="w-4 h-4 text-[#0070F3] animate-spin" />
              )}
              {step.status === 'pending' && (
                <div className="w-4 h-4 rounded-full border border-slate-300" />
              )}
              {step.status === 'failed' && (
                <XCircle className="w-4 h-4 text-rose-500" />
              )}
              <span className={`font-medium ${step.status === 'running' ? 'text-[#0070F3] font-bold' : 'text-slate-700'}`}>
                {step.title}
              </span>
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              {step.time ? step.time : step.status === 'running' ? 'Verifying...' : 'Pending'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
