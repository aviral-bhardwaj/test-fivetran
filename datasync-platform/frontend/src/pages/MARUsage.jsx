import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Layers, CreditCard, Sparkles, CheckCircle, Info, Calendar, Download } from 'lucide-react';
import { getUsage } from '../api/client';
import { ConnectorIcon } from '../components/ConnectorIcons';

const MARUsage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsage()
      .then(res => setData(res.data))
      .catch(() => {
        // Fallback demo data
        setData({
          total_mar: 1245600,
          monthly_limit: 2000000,
          free_mar: 250000,
          paid_mar: 995600,
          usage_percent: 62.3,
          plan_name: 'Enterprise Scale',
          billing_cycle_end: '2026-10-01',
          daily_mar: Array.from({ length: 30 }).map((_, i) => ({
            date: `Sep ${i + 1}`,
            free_mar: Math.floor(Math.random() * 8000 + 4000),
            paid_mar: Math.floor(Math.random() * 32000 + 18000)
          })),
          breakdown_by_connector: [
            { connection_name: 'PostgreSQL Analytics', connector_type: 'postgres', destination_name: 'Snowflake', mar: 480000, percentage: '38.5%', sync_count: 720 },
            { connection_name: 'Stripe Billing Data', connector_type: 'stripe', destination_name: 'Snowflake', mar: 320000, percentage: '25.7%', sync_count: 720 },
            { connection_name: 'GitHub Events & PRs', connector_type: 'github', destination_name: 'Snowflake', mar: 210000, percentage: '16.9%', sync_count: 720 },
            { connection_name: 'Shopify E-Commerce', connector_type: 'shopify', destination_name: 'Snowflake', mar: 145000, percentage: '11.6%', sync_count: 720 },
            { connection_name: 'Salesforce CRM', connector_type: 'salesforce', destination_name: 'Snowflake', mar: 90600, percentage: '7.3%', sync_count: 720 }
          ],
          breakdown_by_table: [
            { schema: 'public', table: 'users', connector: 'PostgreSQL', mar: 280000, percentage: '22.5%' },
            { schema: 'public', table: 'orders', connector: 'PostgreSQL', mar: 200000, percentage: '16.1%' },
            { schema: 'stripe', table: 'charges', connector: 'Stripe', mar: 190000, percentage: '15.3%' },
            { schema: 'github', table: 'pull_requests', connector: 'GitHub', mar: 140000, percentage: '11.2%' },
            { schema: 'shopify', table: 'customers', connector: 'Shopify', mar: 95000, percentage: '7.6%' }
          ]
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium text-xs">
        Loading Monthly Active Rows (MAR) analytics...
      </div>
    );
  }

  const formatNumber = (num) => new Intl.NumberFormat().format(num || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#0F172A] tracking-tight">
            Monthly Active Rows (MAR) Usage
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track active rows synced across your connectors and warehouses during the current billing period.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-600 font-medium shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Billing Period Ends: {data.billing_cycle_end}</span>
          </div>
          <button className="fivetran-btn-secondary">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total MAR */}
        <div className="fivetran-card p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total MAR Used</span>
            <TrendingUp className="w-4 h-4 text-[#0070F3]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#0F172A] tracking-tight">
            {formatNumber(data.total_mar)}
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span>{data.usage_percent}% of {formatNumber(data.monthly_limit)} MAR</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.min(100, data.usage_percent)}%` }}
                className="h-full bg-[#0070F3] rounded-full transition-all"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Paid MAR */}
        <div className="fivetran-card p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Paid MAR</span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-purple-700 tracking-tight">
            {formatNumber(data.paid_mar)}
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            Billable row updates in current cycle
          </p>
        </div>

        {/* Card 3: Free MAR */}
        <div className="fivetran-card p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Free MAR</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700 tracking-tight">
            {formatNumber(data.free_mar)}
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            14-day free syncs & initial historical load
          </p>
        </div>

        {/* Card 4: Plan Tier */}
        <div className="fivetran-card p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Current Plan</span>
            <Layers className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#0F172A] tracking-tight">
            {data.plan_name}
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            All enterprise connectors & transformations
          </p>
        </div>
      </div>

      {/* 30-Day MAR Trend Bar Chart */}
      <div className="fivetran-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-sm text-[#0F172A]">Daily Active Rows History (Last 30 Days)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily distinct rows synced across all pipelines, categorized by Free vs Paid MAR.
            </p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.daily_mar} barSize={12}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => [`${formatNumber(value)} rows`, '']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="paid_mar" name="Paid MAR" fill="#0070F3" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="free_mar" name="Free MAR" fill="#10B981" stackId="a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown by Connector Table */}
      <div className="fivetran-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#0F172A]">MAR Breakdown by Connector</h3>
          <span className="text-xs text-slate-500">{data.breakdown_by_connector.length} active connectors</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="py-3 px-5 font-semibold">Connector</th>
                <th className="py-3 px-5 font-semibold">Destination</th>
                <th className="py-3 px-5 font-semibold text-right">Monthly Active Rows</th>
                <th className="py-3 px-5 font-semibold text-right">% of Total</th>
                <th className="py-3 px-5 font-semibold text-right">Sync Runs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.breakdown_by_connector.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 flex items-center gap-3">
                    <ConnectorIcon type={row.connector_type} className="w-7 h-7" />
                    <div>
                      <div className="font-bold text-slate-800">{row.connection_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono uppercase">{row.connector_type}</div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-slate-600 font-medium">
                    {row.destination_name}
                  </td>
                  <td className="py-3.5 px-5 text-right font-black text-slate-800 font-mono">
                    {formatNumber(row.mar)}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <span className="bg-blue-50 text-[#0070F3] font-bold text-[11px] px-2 py-0.5 rounded-full border border-blue-100">
                      {row.percentage}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right text-slate-500">
                    {row.sync_count} runs
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MARUsage;
