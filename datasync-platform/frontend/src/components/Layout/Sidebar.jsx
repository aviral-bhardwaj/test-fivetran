import React from 'react';
import { NavLink } from 'react-router-dom';
import { RefreshCw, Database, Sparkles, TrendingUp, History, BookOpen, Settings, ChevronRight, ShieldCheck } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { to: '/', icon: RefreshCw, label: 'Connectors', exact: true },
    { to: '/destinations', icon: Database, label: 'Destinations' },
    { to: '/transformations', icon: Sparkles, label: 'Transformations', badge: 'dbt' },
    { to: '/usage', icon: TrendingUp, label: 'MAR & Usage', badge: '62%' },
    { to: '/syncs', icon: History, label: 'Logs & Alerts' },
    { to: '/catalog', icon: BookOpen, label: 'Connector Directory', badge: '500+' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-[#091524] text-slate-300 flex flex-col border-r border-[#152336] shadow-xl z-20 select-none">
      {/* Fivetran Header & Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[#152336] text-white font-bold text-lg justify-between">
        <div className="flex items-center gap-2.5">
          {/* Authentic Fivetran Blue Ribbon '5' Logo */}
          <div className="w-8 h-8 rounded-lg bg-[#0070F3] flex items-center justify-center text-white shadow-md shadow-blue-500/25">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" strokeWidth="0">
              <path d="M19.5 4.5h-10l-1.5 5h7.5l-1 3.5h-7.5l-1.5 5h10.5l1.5-5H10l.5-1.5h7.5z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="leading-none text-base tracking-tight font-black text-white">fivetran</span>
            <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase mt-0.5">Automated Data</span>
          </div>
        </div>
      </div>

      {/* Organization / Workspace Switcher Pill */}
      <div className="px-4 py-3 border-b border-[#152336]/60 bg-[#0c1b2e]/60">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span className="font-semibold text-slate-200 truncate">Acme Production</span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-slate-800/80 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700/60">
            US-East
          </span>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#0070F3] text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:bg-[#122338] hover:text-white'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-4 w-4" />
              {item.label}
            </div>
            {item.badge && (
              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-white/10 text-white/90">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* MAR Usage Summary Box */}
      <div className="p-3 mx-3 mb-3 rounded-xl bg-[#0c1c30] border border-[#1b2f4a] text-xs">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
          <span className="font-semibold text-slate-300">Monthly Active Rows</span>
          <span className="text-[#0070F3] font-bold">62%</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-[#0070F3] rounded-full w-[62%]"></div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>1.24M / 2.0M MAR</span>
          <NavLink to="/usage" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center">
            Details →
          </NavLink>
        </div>
      </div>

      {/* Footer / System Status */}
      <div className="p-4 border-t border-[#152336] text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-slate-400 font-medium">All Systems Operational</span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">v2026.4</span>
      </div>
    </div>
  );
};

export default Sidebar;
