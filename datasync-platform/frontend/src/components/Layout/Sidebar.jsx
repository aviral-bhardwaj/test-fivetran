import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Sparkles, Plug, Database, Link, History, Settings } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/catalog', icon: Sparkles, label: 'Connector Catalog', badge: '20+' },
    { to: '/connectors', icon: Plug, label: 'Sources' },
    { to: '/destinations', icon: Database, label: 'Destinations' },
    { to: '/connections', icon: Link, label: 'Connections' },
    { to: '/syncs', icon: History, label: 'Job History' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-900 shadow-xl z-20">
      <div className="h-16 flex items-center px-6 border-b border-slate-900 text-white font-bold text-lg gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
          <span className="text-base font-black">⚡</span>
        </div>
        <div className="flex flex-col">
          <span className="leading-none text-sm tracking-wide font-extrabold text-white">Airbyte Sync</span>
          <span className="text-[10px] text-indigo-400 font-mono">Open Protocol</span>
        </div>
      </div>
      <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 font-bold'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-4 w-4" />
              {item.label}
            </div>
            {item.badge && (
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/20">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-900 text-[11px] text-slate-500 flex items-center justify-between font-mono">
        <span>Airbyte Engine</span>
        <span className="text-emerald-400 font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> v2.0
        </span>
      </div>
    </div>
  );
};

export default Sidebar;
