import React from 'react';
import { usePolling } from '../../hooks/usePolling';
import { getHealth } from '../../api/client';

const TopBar = ({ title }) => {
  const { data: health, loading } = usePolling(getHealth, 10000);
  
  const isHealthy = health?.status === 'ok';

  return (
    <header className="h-16 bg-white border-b shadow-sm flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-xl font-semibold text-slate-800">{title || 'DataSync'}</h1>
      <div className="flex items-center gap-2 text-sm font-medium">
        {loading ? (
          <span className="text-slate-400">Checking health...</span>
        ) : (
          <>
            <span className="text-slate-600">{isHealthy ? 'System Healthy' : 'System Down'}</span>
            <span className={`h-2.5 w-2.5 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`}></span>
          </>
        )}
      </div>
    </header>
  );
};

export default TopBar;
