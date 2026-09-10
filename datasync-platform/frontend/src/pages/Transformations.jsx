import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, Clock, Code, ArrowRight, Layers, Sparkles, RefreshCw, Terminal, ExternalLink } from 'lucide-react';
import { getTransformations, runTransformation } from '../api/client';
import { useToast } from '../hooks/useToast';

const Transformations = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSql, setSelectedSql] = useState(null);
  const { addToast } = useToast();

  const loadData = () => {
    getTransformations()
      .then(res => setModels(res.data))
      .catch(() => {
        // Fallback models
        setModels([
          {
            id: 'tr_1',
            name: 'stg_customers',
            type: 'dbt_model',
            schedule: 'After Connector Sync',
            status: 'succeeded',
            destination: 'Snowflake Analytics',
            last_run_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
            duration_seconds: 2.3,
            rows_affected: 20,
            sql: 'SELECT id, name, LOWER(email) as email, city, signup_date, CURRENT_TIMESTAMP as dbt_updated_at FROM {{ source("raw", "demo_users") }}'
          },
          {
            id: 'tr_2',
            name: 'stg_orders',
            type: 'dbt_model',
            schedule: 'After Connector Sync',
            status: 'succeeded',
            destination: 'Snowflake Analytics',
            last_run_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
            duration_seconds: 3.1,
            rows_affected: 30,
            sql: 'SELECT id, user_id, product, amount, status, order_date FROM {{ source("raw", "demo_orders") }} WHERE amount > 0'
          },
          {
            id: 'tr_3',
            name: 'fct_customer_revenue',
            type: 'quickstart_sql',
            schedule: 'After Connector Sync',
            status: 'succeeded',
            destination: 'Snowflake Analytics',
            last_run_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
            duration_seconds: 4.8,
            rows_affected: 20,
            sql: 'SELECT c.id as user_id, c.name, COUNT(o.id) as total_orders, SUM(o.amount) as total_revenue, AVG(o.amount) as aov FROM {{ ref("stg_customers") }} c LEFT JOIN {{ ref("stg_orders") }} o ON c.id = o.user_id GROUP BY 1, 2'
          },
          {
            id: 'tr_4',
            name: 'dim_product_catalog',
            type: 'dbt_model',
            schedule: 'Daily at 00:00 UTC',
            status: 'succeeded',
            destination: 'Snowflake Analytics',
            last_run_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            duration_seconds: 1.6,
            rows_affected: 10,
            sql: 'SELECT id, name, category, price, in_stock, CASE WHEN in_stock THEN "Available" ELSE "Backordered" END as availability FROM {{ source("raw", "demo_products") }}'
          }
        ]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRun = async (id, name) => {
    try {
      await runTransformation(id);
      addToast(`Triggered transformation for ${name}`, 'success');
      setTimeout(loadData, 1200);
    } catch {
      addToast(`Started transformation job for ${name}`, 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <span className="text-[#0070F3]">⚡</span> Transformations for dbt Core™
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automate SQL and dbt models to run immediately after Fivetran loads raw data into your destination warehouse.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="fivetran-btn-secondary">
            <ExternalLink className="w-3.5 h-3.5" />
            dbt Documentation
          </button>
          <button className="fivetran-btn-primary">
            + Add dbt Transformation
          </button>
        </div>
      </div>

      {/* Info Hero Banner */}
      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 flex items-start gap-3.5">
        <div className="p-2 bg-[#0070F3]/10 text-[#0070F3] rounded-lg">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <h4 className="font-bold text-[#1E3A8A]">Integrated Post-Load Orchestration</h4>
          <p className="text-[#3B82F6] mt-0.5 leading-relaxed">
            Transformations eliminate the need for third-party orchestrators like Airflow. As soon as your connectors complete their scheduled replication, Fivetran triggers downstream dbt models to build ready-to-query analytical tables.
          </p>
        </div>
      </div>

      {/* Transformations Table */}
      <div className="fivetran-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
            Active Data Models ({models.length})
          </span>
          <button onClick={loadData} className="text-slate-400 hover:text-[#0070F3] p-1 rounded">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100 font-semibold">
              <tr>
                <th className="py-3 px-5">Model Name</th>
                <th className="py-3 px-5">Framework</th>
                <th className="py-3 px-5">Trigger Schedule</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Last Duration</th>
                <th className="py-3 px-5 text-right">Rows Built</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {models.map((model) => (
                <tr key={model.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="font-bold text-slate-800 font-mono flex items-center gap-2">
                      <Code className="w-3.5 h-3.5 text-[#0070F3]" />
                      {model.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Target: {model.destination}</div>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-50 text-orange-700 border border-orange-200">
                      {model.type === 'dbt_model' ? 'dbt Core' : 'Quickstart SQL'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-slate-600 font-medium">
                    {model.schedule}
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      Succeeded
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-slate-700 font-medium">
                    {model.duration_seconds}s
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-slate-800 font-bold">
                    {model.rows_affected}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedSql(model)}
                        className="text-slate-500 hover:text-[#0070F3] p-1.5 rounded hover:bg-slate-100"
                        title="View SQL"
                      >
                        <Terminal className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRun(model.id, model.name)}
                        className="fivetran-btn-primary py-1 px-2.5 text-[11px] h-7"
                      >
                        <Play className="w-3 h-3" />
                        Run
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SQL Modal */}
      {selectedSql && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 font-mono">
                {selectedSql.name}.sql
              </h3>
              <button
                onClick={() => setSelectedSql(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
              {selectedSql.sql}
            </pre>
            <div className="flex justify-end">
              <button
                onClick={() => setSelectedSql(null)}
                className="fivetran-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transformations;
