import React from 'react';

const MetricCard = ({ title, value, icon: Icon, color = 'blue', subtitle }) => {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    gray: 'bg-gray-100 text-gray-600'
  };

  const iconClass = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex items-start gap-4">
      <div className={`p-3 rounded-full flex-shrink-0 ${iconClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export default MetricCard;
