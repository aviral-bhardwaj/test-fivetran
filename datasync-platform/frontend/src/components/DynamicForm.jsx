import React, { useState } from 'react';
import { Eye, EyeOff, HelpCircle } from 'lucide-react';

export default function DynamicForm({ spec, initialValues = {}, onSubmit, submitText = 'Save', onCancel, isSubmitting = false }) {
  const properties = spec?.properties || {};
  const required = spec?.required || [];

  const [formData, setFormData] = useState(() => {
    const defaults = {};
    Object.entries(properties).forEach(([key, schema]) => {
      defaults[key] = initialValues[key] !== undefined ? initialValues[key] : (schema.default !== undefined ? schema.default : '');
    });
    return defaults;
  });

  const [showSecrets, setShowSecrets] = useState({});

  const handleChange = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const toggleSecret = (key) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {Object.entries(properties).map(([key, field]) => {
        const isRequired = required.includes(key);
        const isSecret = field.isSecret;
        const inputType = isSecret ? (showSecrets[key] ? 'text' : 'password') : (field.type === 'number' ? 'number' : 'text');

        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                {field.title || key}
                {isRequired && <span className="text-red-500 font-bold">*</span>}
              </label>
              {field.description && (
                <span className="text-xs text-slate-400 flex items-center gap-1" title={field.description}>
                  <HelpCircle className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            {field.type === 'boolean' ? (
              <label className="relative inline-flex items-center cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={Boolean(formData[key])}
                  onChange={(e) => handleChange(key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-3 text-xs text-slate-600 font-medium">Enabled</span>
              </label>
            ) : field.enum ? (
              <select
                value={formData[key] || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                required={isRequired}
              >
                {field.enum.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <div className="relative">
                <input
                  type={inputType}
                  value={formData[key] !== undefined ? formData[key] : ''}
                  onChange={(e) => handleChange(key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                  placeholder={field.description || `Enter ${field.title || key}`}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-10"
                  required={isRequired}
                />
                {isSecret && (
                  <button
                    type="button"
                    onClick={() => toggleSecret(key)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showSecrets[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            )}
            {field.description && (
              <p className="text-xs text-slate-400">{field.description}</p>
            )}
          </div>
        );
      })}

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
        >
          {isSubmitting ? 'Validating...' : submitText}
        </button>
      </div>
    </form>
  );
}
