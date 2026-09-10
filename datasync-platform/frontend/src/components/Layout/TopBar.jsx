import React, { useState } from 'react';
import { Search, Bell, HelpCircle, Plus, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopBar = ({ title }) => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-8 flex items-center justify-between shadow-2xs sticky top-0 z-10">
      {/* Left: Title & Search */}
      <div className="flex items-center gap-6 flex-1 max-w-2xl">
        <h2 className="text-base font-black text-[#0F172A] tracking-tight shrink-0">
          {title || 'Connectors'}
        </h2>

        {/* Global Search */}
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search connectors, destinations, schemas... (⌘K)"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#0070F3] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right: Actions, Notifications, Profile */}
      <div className="flex items-center gap-4">
        {/* "+ Add Connector" Button */}
        <button
          onClick={() => navigate('/catalog')}
          className="fivetran-btn-primary py-1.5 px-3.5 text-xs h-9 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Connector</span>
        </button>

        {/* Status Indicator */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>System Healthy</span>
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#0070F3] rounded-full ring-2 ring-white"></span>
        </button>

        {/* Help Docs */}
        <a
          href="https://fivetran.com/docs"
          target="_blank"
          rel="noreferrer"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors hidden sm:block"
          title="Fivetran Documentation"
        >
          <HelpCircle className="w-4 h-4" />
        </a>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#0070F3] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            AB
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-800 leading-tight">Aviral B.</span>
            <span className="text-[10px] text-slate-400 leading-tight">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
