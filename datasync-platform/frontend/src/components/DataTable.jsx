import React from 'react';
import { Loader } from 'lucide-react';

const DataTable = ({ columns, data, onRowClick, emptyMessage = "No data available", loading = false }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((col, i) => (
                <th key={i} className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <Loader className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                  <p className="mt-2 text-sm text-slate-500">Loading data...</p>
                </td>
              </tr>
            ) : data && data.length > 0 ? (
              data.map((row, i) => (
                <tr 
                  key={i} 
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`even:bg-slate-50/50 hover:bg-slate-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, j) => (
                    <td key={j} className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
