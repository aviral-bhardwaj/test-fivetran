import React from 'react';

const StatusBadge = ({ status }) => {
  const variants = {
    pending: 'bg-amber-100 text-amber-800',
    running: 'bg-blue-100 text-blue-800 animate-pulse-dot',
    succeeded: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
  };

  const badgeClass = variants[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${badgeClass}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
