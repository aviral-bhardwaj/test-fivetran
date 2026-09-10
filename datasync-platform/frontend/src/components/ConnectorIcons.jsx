import React from 'react';
import { Database, Cloud, FileText, Cpu, Zap, FolderArchive, Layers } from 'lucide-react';

export const ConnectorIcon = ({ type, className = 'w-6 h-6' }) => {
  const t = (type || '').toLowerCase();

  switch (t) {
    case 'postgres':
    case 'postgresql':
      return (
        <div className={`flex items-center justify-center bg-[#336791]/10 rounded-lg p-1.5 ${className}`}>
          <svg viewBox="0 0 128 128" className="w-full h-full">
            <path fill="#336791" d="M64 8.7C33.5 8.7 8.7 33.5 8.7 64c0 30.5 24.8 55.3 55.3 55.3 30.5 0 55.3-24.8 55.3-55.3 0-30.5-24.8-55.3-55.3-55.3zm29.8 85.6c-4.4 2.8-12.8 4.2-18.7 4.2-15.6 0-25.1-7.4-27.4-21.3-1.6-9.8 1.9-19.8 9.3-26.6 6.9-6.3 16.4-9.3 26.1-8.3 1.9.2 3.8.6 5.6 1.2v7.7c-1.8-.7-3.7-1.1-5.7-1.3-7.2-.6-14.1 1.6-18.8 6.1-5 4.8-7.3 12.1-6.1 19.4 1.7 10.3 8.3 15.6 19.6 15.6 4.3 0 10.4-1 14.1-2.9l2 6.2z"/>
          </svg>
        </div>
      );
    case 'mysql':
      return (
        <div className={`flex items-center justify-center bg-[#00758F]/10 rounded-lg p-1.5 ${className}`}>
          <svg viewBox="0 0 128 128" className="w-full h-full">
            <path fill="#00758F" d="M117.8 77.3c-.6-.7-1.3-1.3-2.1-1.7-.8-.4-1.7-.7-2.6-.7-1.8 0-3.5.7-4.8 2-1.3 1.3-2 3-2 4.8 0 1.9.7 3.6 2 4.9 1.3 1.3 3 2 4.8 2 .9 0 1.8-.2 2.6-.6.8-.4 1.5-1 2.1-1.7v2c-.7.6-1.5 1-2.4 1.3-.9.3-1.8.5-2.8.5-2.6 0-5-1-6.8-2.8-1.8-1.8-2.8-4.2-2.8-6.8 0-2.6 1-5 2.8-6.8 1.8-1.8 4.2-2.8 6.8-2.8 1 0 1.9.2 2.8.5.9.3 1.7.7 2.4 1.3v2.2zm-20.2-12.8v24.2h-5.6V76.8l-7.7 11.9h-1.6l-7.7-11.9v11.9h-5.6V64.5h4.6l9.5 14.9 9.5-14.9h4.6z"/>
          </svg>
        </div>
      );
    case 'snowflake':
    case 'snowflake_warehouse':
      return (
        <div className={`flex items-center justify-center bg-[#29B5E8]/10 rounded-lg p-1.5 ${className}`}>
          <svg viewBox="0 0 24 24" className="w-full h-full fill-[#29B5E8]">
            <path d="M12 0l2.5 4.33h-5L12 0zm0 24l-2.5-4.33h5L12 24zm10.39-6l-4.33-2.5 2.5-4.33 1.83 6.83zm-20.78 0l1.83-6.83 2.5 4.33-4.33 2.5zm18.95-12l-1.83 6.83-2.5-4.33 4.33-2.5zM3.44 6l4.33 2.5-2.5 4.33L3.44 6z"/>
          </svg>
        </div>
      );
    case 'bigquery':
      return (
        <div className={`flex items-center justify-center bg-[#4285F4]/10 rounded-lg p-1.5 ${className}`}>
          <svg viewBox="0 0 24 24" className="w-full h-full fill-[#4285F4]">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
          </svg>
        </div>
      );
    case 'stripe':
      return (
        <div className={`flex items-center justify-center bg-[#635BFF]/10 rounded-lg p-1.5 ${className}`}>
          <span className="font-extrabold text-[#635BFF] text-lg font-serif">S</span>
        </div>
      );
    case 'github':
      return (
        <div className={`flex items-center justify-center bg-[#24292F]/10 rounded-lg p-1.5 ${className}`}>
          <svg viewBox="0 0 24 24" className="w-full h-full fill-[#24292F]">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
        </div>
      );
    case 'salesforce':
      return (
        <div className={`flex items-center justify-center bg-[#00A1E0]/10 rounded-lg p-1.5 ${className}`}>
          <Cloud className="w-full h-full text-[#00A1E0]" />
        </div>
      );
    case 'shopify':
      return (
        <div className={`flex items-center justify-center bg-[#95BF47]/10 rounded-lg p-1.5 ${className}`}>
          <span className="font-black text-[#95BF47] text-lg">S</span>
        </div>
      );
    case 'demo':
    case 'demo_store':
      return (
        <div className={`flex items-center justify-center bg-[#0070F3]/10 rounded-lg p-1.5 ${className}`}>
          <Zap className="w-full h-full text-[#0070F3]" />
        </div>
      );
    case 'csv':
      return (
        <div className={`flex items-center justify-center bg-[#107C41]/10 rounded-lg p-1.5 ${className}`}>
          <FileText className="w-full h-full text-[#107C41]" />
        </div>
      );
    case 'local_file':
      return (
        <div className={`flex items-center justify-center bg-[#64748B]/10 rounded-lg p-1.5 ${className}`}>
          <FolderArchive className="w-full h-full text-[#64748B]" />
        </div>
      );
    case 'sqlite_warehouse':
    case 'sqlite':
      return (
        <div className={`flex items-center justify-center bg-[#003B57]/10 rounded-lg p-1.5 ${className}`}>
          <Database className="w-full h-full text-[#003B57]" />
        </div>
      );
    default:
      return (
        <div className={`flex items-center justify-center bg-slate-100 rounded-lg p-1.5 ${className}`}>
          <Layers className="w-full h-full text-slate-600" />
        </div>
      );
  }
};
