import React from 'react';
import { Layers, Key, Clock, Check, AlertCircle } from 'lucide-react';

export default function StreamConfigMatrix({ streams = [], config = [], onChange }) {
  // config is an array of { name, sync_mode, primary_key, cursor_field, enabled }
  const streamMap = (config || []).reduce((acc, s) => {
    acc[s.name] = s;
    return acc;
  }, {});

  const handleToggle = (streamName, checked) => {
    const existing = streamMap[streamName] || { name: streamName, sync_mode: 'full_refresh_overwrite', enabled: true };
    const updated = { ...existing, enabled: checked };
    updateStream(streamName, updated);
  };

  const handleModeChange = (streamName, syncMode) => {
    const existing = streamMap[streamName] || { name: streamName, enabled: true };
    const updated = { ...existing, sync_mode: syncMode };
    updateStream(streamName, updated);
  };

  const handleKeyChange = (streamName, field, value) => {
    const existing = streamMap[streamName] || { name: streamName, enabled: true };
    const updated = { ...existing, [field]: value };
    updateStream(streamName, updated);
  };

  const updateStream = (streamName, updatedObj) => {
    const newConfig = [...(config || [])];
    const idx = newConfig.findIndex(s => s.name === streamName);
    if (idx >= 0) {
      newConfig[idx] = updatedObj;
    } else {
      newConfig.push(updatedObj);
    }
    onChange(newConfig);
  };

  const selectAll = (checked) => {
    const newConfig = streams.map(s => {
      const existing = streamMap[s.name] || {};
      return {
        name: s.name,
        sync_mode: existing.sync_mode || s.supportedSyncModes?.[0] || 'full_refresh_overwrite',
        primary_key: existing.primary_key || s.sourceDefinedPrimaryKey?.[0]?.[0] || 'id',
        cursor_field: existing.cursor_field || s.defaultCursorField?.[0] || 'id',
        enabled: checked
      };
    });
    onChange(newConfig);
  };

  const enabledCount = streams.filter(s => streamMap[s.name]?.enabled !== false).length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-900 text-sm">
            Streams Replication Matrix ({enabledCount} of {streams.length} enabled)
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => selectAll(true)}
            className="text-xs px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 rounded text-slate-700 font-medium"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => selectAll(false)}
            className="text-xs px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 rounded text-slate-700 font-medium"
          >
            Deselect All
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/75 text-slate-500 font-medium uppercase tracking-wider border-b">
            <tr>
              <th className="px-4 py-3 w-12 text-center">Sync</th>
              <th className="px-4 py-3">Stream Name</th>
              <th className="px-4 py-3">Sync Mode</th>
              <th className="px-4 py-3">Primary Key</th>
              <th className="px-4 py-3">Cursor Field</th>
              <th className="px-4 py-3">Fields</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {streams.map((stream) => {
              const streamName = stream.name;
              const streamConf = streamMap[streamName] || {
                name: streamName,
                sync_mode: stream.supportedSyncModes?.[0] || 'full_refresh_overwrite',
                primary_key: stream.sourceDefinedPrimaryKey?.[0]?.[0] || 'id',
                cursor_field: stream.defaultCursorField?.[0] || 'id',
                enabled: true
              };

              const isEnabled = streamConf.enabled !== false;
              const properties = stream.jsonSchema?.properties || {};
              const propKeys = Object.keys(properties);
              const isIncremental = streamConf.sync_mode?.includes('incremental');

              return (
                <tr key={streamName} className={`hover:bg-slate-50/75 transition-colors ${!isEnabled ? 'opacity-50 bg-slate-50/50' : ''}`}>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => handleToggle(streamName, e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                      {streamName}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={streamConf.sync_mode || 'full_refresh_overwrite'}
                      onChange={(e) => handleModeChange(streamName, e.target.value)}
                      disabled={!isEnabled}
                      className="px-2 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 bg-white font-sans disabled:bg-slate-100"
                    >
                      <option value="full_refresh_overwrite">Full Refresh | Overwrite</option>
                      <option value="full_refresh_append">Full Refresh | Append</option>
                      <option value="incremental_append">Incremental | Append</option>
                      <option value="incremental_deduped">Incremental | Deduped</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={streamConf.primary_key || 'id'}
                        onChange={(e) => handleKeyChange(streamName, 'primary_key', e.target.value)}
                        disabled={!isEnabled}
                        className="px-2 py-1 border border-slate-200 rounded text-xs bg-white font-mono"
                      >
                        {propKeys.map(k => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={streamConf.cursor_field || 'id'}
                        onChange={(e) => handleKeyChange(streamName, 'cursor_field', e.target.value)}
                        disabled={!isEnabled || !isIncremental}
                        className="px-2 py-1 border border-slate-200 rounded text-xs bg-white font-mono disabled:opacity-40"
                      >
                        {propKeys.map(k => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono">
                    {propKeys.length} fields ({propKeys.slice(0, 3).join(', ')}{propKeys.length > 3 ? '...' : ''})
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
