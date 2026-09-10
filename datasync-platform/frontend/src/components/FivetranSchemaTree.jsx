import React, { useState } from 'react';
import { Key, Shield, Check, ChevronDown, ChevronRight, Lock, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';

export const FivetranSchemaTree = ({ schema, onSaveSchema, isSaving }) => {
  // Parse real schema if provided, or provide defaults
  const parsedTables = React.useMemo(() => {
    if (!schema) return null;
    try {
      const parsed = typeof schema === 'string' ? JSON.parse(schema) : schema;
      if (parsed.streams && parsed.streams.length > 0) {
        return parsed.streams.map(stream => {
          const props = stream.jsonSchema?.properties || {};
          const pk = stream.sourceDefinedPrimaryKey?.[0]?.[0] || 'id';
          return {
            name: stream.name,
            enabled: true,
            estimated_rows: '1,000+',
            columns: Object.entries(props).map(([name, def]) => ({
              name,
              type: (def.type || 'string').toUpperCase(),
              is_primary_key: name === pk,
              enabled: true,
              is_hashed: name.includes('email') || name.includes('password')
            }))
          };
        });
      }
      if (parsed.columns && parsed.columns.length > 0) {
        return [{
          name: parsed.table || 'source_table',
          enabled: true,
          estimated_rows: '1,000+',
          columns: parsed.columns.map(col => ({
            name: col.name,
            type: (col.type || 'TEXT').toUpperCase(),
            is_primary_key: col.name === 'id',
            enabled: true,
            is_hashed: col.name.includes('email')
          }))
        }];
      }
    } catch (e) {
      console.error('Failed to parse schema:', e);
    }
    return null;
  }, [schema]);

  const defaultTables = [
    {
      name: 'users',
      enabled: true,
      estimated_rows: '14,200',
      columns: [
        { name: 'id', type: 'BIGINT', is_primary_key: true, enabled: true, is_hashed: false },
        { name: 'email', type: 'VARCHAR(255)', is_primary_key: false, enabled: true, is_hashed: true },
        { name: 'full_name', type: 'VARCHAR(255)', is_primary_key: false, enabled: true, is_hashed: false },
        { name: 'role', type: 'VARCHAR(50)', is_primary_key: false, enabled: true, is_hashed: false },
        { name: 'created_at', type: 'TIMESTAMP_TZ', is_primary_key: false, enabled: true, is_hashed: false },
        { name: 'updated_at', type: 'TIMESTAMP_TZ', is_primary_key: false, enabled: true, is_hashed: false }
      ]
    },
    {
      name: 'orders',
      enabled: true,
      estimated_rows: '48,900',
      columns: [
        { name: 'order_id', type: 'BIGINT', is_primary_key: true, enabled: true, is_hashed: false },
        { name: 'user_id', type: 'BIGINT', is_primary_key: false, enabled: true, is_hashed: false },
        { name: 'amount', type: 'DECIMAL(12,2)', is_primary_key: false, enabled: true, is_hashed: false },
        { name: 'currency', type: 'VARCHAR(3)', is_primary_key: false, enabled: true, is_hashed: false },
        { name: 'status', type: 'VARCHAR(50)', is_primary_key: false, enabled: true, is_hashed: false },
        { name: 'payment_method_id', type: 'VARCHAR(100)', is_primary_key: false, enabled: true, is_hashed: true },
        { name: 'order_date', type: 'TIMESTAMP_TZ', is_primary_key: false, enabled: true, is_hashed: false }
      ]
    },
    {
      name: 'products',
      enabled: true,
      estimated_rows: '1,500',
      columns: [
        { name: 'sku', type: 'VARCHAR(64)', is_primary_key: true, enabled: true, is_hashed: false },
        { name: 'title', type: 'VARCHAR(255)', is_primary_key: false, enabled: true, is_hashed: false },
        { name: 'category', type: 'VARCHAR(100)', is_primary_key: false, enabled: true, is_hashed: false },
        { name: 'unit_price', type: 'DECIMAL(10,2)', is_primary_key: false, enabled: true, is_hashed: false },
        { name: 'in_stock', type: 'BOOLEAN', is_primary_key: false, enabled: true, is_hashed: false }
      ]
    }
  ];

  const [tables, setTables] = useState(parsedTables || defaultTables);

  React.useEffect(() => {
    if (parsedTables) setTables(parsedTables);
  }, [parsedTables]);

  const [expandedTables, setExpandedTables] = useState({ [tables[0]?.name || 'users']: true });
  const [hasChanges, setHasChanges] = useState(false);

  const toggleTableExpand = (tableName) => {
    setExpandedTables(prev => ({ ...prev, [tableName]: !prev[tableName] }));
  };

  const toggleTableEnabled = (tableName) => {
    setTables(prev => prev.map(t => {
      if (t.name === tableName) {
        const nextEnabled = !t.enabled;
        return {
          ...t,
          enabled: nextEnabled,
          columns: t.columns.map(c => ({ ...c, enabled: nextEnabled }))
        };
      }
      return t;
    }));
    setHasChanges(true);
  };

  const toggleColumnEnabled = (tableName, colName) => {
    setTables(prev => prev.map(t => {
      if (t.name === tableName) {
        return {
          ...t,
          columns: t.columns.map(c => c.name === colName ? { ...c, enabled: !c.enabled } : c)
        };
      }
      return t;
    }));
    setHasChanges(true);
  };

  const toggleColumnHash = (tableName, colName) => {
    setTables(prev => prev.map(t => {
      if (t.name === tableName) {
        return {
          ...t,
          columns: t.columns.map(c => c.name === colName ? { ...c, is_hashed: !c.is_hashed } : c)
        };
      }
      return t;
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (onSaveSchema) {
      onSaveSchema(tables);
    }
    setHasChanges(false);
  };

  return (
    <div className="space-y-4">
      {/* Schema Drift Banner */}
      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 flex items-start gap-3 text-xs">
        <div className="p-1.5 bg-[#0070F3]/10 text-[#0070F3] rounded-lg mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-[#1E3A8A]">Fivetran Automated Schema Migration Active</h4>
          <p className="text-[#3B82F6] mt-0.5 leading-relaxed">
            Fivetran automatically detects changes in your source schema. New tables and columns added in the source will automatically replicate to your destination warehouse without breaking pipelines.
          </p>
        </div>
      </div>

      {/* Tables & Columns Tree */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-50/70 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Source Schema</span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-white border border-slate-200 text-[#0F172A] font-semibold">
              public
            </span>
          </div>
          <span className="text-xs text-slate-500">
            {tables.filter(t => t.enabled).length} of {tables.length} tables selected
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {tables.map(table => {
            const isExpanded = !!expandedTables[table.name];
            const activeColCount = table.columns.filter(c => c.enabled).length;

            return (
              <div key={table.name} className="transition-colors">
                {/* Table Header Row */}
                <div
                  className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/80 cursor-pointer select-none"
                  onClick={() => toggleTableExpand(table.name)}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-600" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    <input
                      type="checkbox"
                      checked={table.enabled}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleTableEnabled(table.name);
                      }}
                      className="w-4 h-4 rounded text-[#0070F3] border-slate-300 focus:ring-[#0070F3] cursor-pointer"
                    />

                    <span className="font-bold text-sm text-[#0F172A] font-mono">
                      {table.name}
                    </span>

                    <span className="text-xs text-slate-400">
                      ({activeColCount} / {table.columns.length} columns)
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-500 font-medium">
                      ~{table.estimated_rows} rows
                    </span>
                  </div>
                </div>

                {/* Columns Subtable */}
                {isExpanded && (
                  <div className="bg-slate-50/50 px-12 py-2 border-t border-slate-100">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-200/60 pb-1">
                          <th className="py-2 font-medium w-8">Sync</th>
                          <th className="py-2 font-medium">Column Name</th>
                          <th className="py-2 font-medium">Data Type</th>
                          <th className="py-2 font-medium">Key</th>
                          <th className="py-2 font-medium text-right">Privacy / PII Hashing</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {table.columns.map(col => (
                          <tr key={col.name} className="hover:bg-white/80 transition-colors">
                            <td className="py-2">
                              <input
                                type="checkbox"
                                checked={col.enabled}
                                onChange={() => toggleColumnEnabled(table.name, col.name)}
                                className="w-3.5 h-3.5 rounded text-[#0070F3] border-slate-300 focus:ring-[#0070F3] cursor-pointer"
                              />
                            </td>
                            <td className="py-2 font-semibold text-slate-800">
                              {col.name}
                            </td>
                            <td className="py-2">
                              <span className="text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                                {col.type}
                              </span>
                            </td>
                            <td className="py-2">
                              {col.is_primary_key && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                  <Key className="w-2.5 h-2.5" /> PRIMARY KEY
                                </span>
                              )}
                            </td>
                            <td className="py-2 text-right">
                              <button
                                type="button"
                                onClick={() => toggleColumnHash(table.name, col.name)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                  col.is_hashed
                                    ? 'bg-purple-100 text-purple-700 border border-purple-200 shadow-2xs'
                                    : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300 hover:text-slate-600'
                                }`}
                              >
                                <Lock className="w-2.5 h-2.5" />
                                {col.is_hashed ? 'Hashed (SHA-256)' : 'Hash Column'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Save Bar */}
      {hasChanges && (
        <div className="sticky bottom-4 bg-[#0F172A] text-white p-4 rounded-xl shadow-xl flex items-center justify-between z-30 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-xs font-semibold">You have unsaved schema adjustments</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHasChanges(false)}
              className="text-xs text-slate-300 hover:text-white px-3 py-1.5"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="fivetran-btn-primary bg-[#0070F3] hover:bg-[#005AD8] text-xs py-1.5 px-4"
            >
              {isSaving ? 'Saving Changes...' : 'Save Schema Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
