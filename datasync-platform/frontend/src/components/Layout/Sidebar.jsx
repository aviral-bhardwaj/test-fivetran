import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Plug, Database, Link, History, Settings, Zap } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/connectors', icon: Plug, label: 'Connectors' },
    { to: '/destinations', icon: Database, label: 'Destinations' },
    { to: '/connections', icon: Link, label: 'Connections' },
    { to: '/syncs', icon: History, label: 'Sync History' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 text-white font-bold text-xl gap-2">
        <Zap className="h-6 w-6 text-blue-500 fill-blue-500" />
        DataSync
      </div>
      <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-slate-700/50 text-blue-400'
                  : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        DataSync v1.0
      </div>
    </div>
  );
};

export default Sidebar;
