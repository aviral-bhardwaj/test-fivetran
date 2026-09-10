import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { ToastProvider } from '../../hooks/useToast';
import { useLocation } from 'react-router-dom';

const getTitle = (pathname) => {
  if (pathname === '/') return 'Dashboard';
  if (pathname.startsWith('/connectors')) return 'Connectors';
  if (pathname.startsWith('/destinations')) return 'Destinations';
  if (pathname.startsWith('/connections')) return 'Connections';
  if (pathname.startsWith('/syncs')) return 'Sync History';
  if (pathname.startsWith('/settings')) return 'Settings';
  return 'DataSync';
};

const Layout = ({ children }) => {
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar />
        <div className="ml-64 flex-1 flex flex-col min-w-0">
          <TopBar title={title} />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};

export default Layout;
