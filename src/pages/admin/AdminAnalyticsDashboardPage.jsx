import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { getAdminOverview } from '../../services/api/analytics';
import StatCard from '../../components/analytics/StatCard';
import ChartCard from '../../components/analytics/ChartCard';
import DateRangeFilter from '../../components/analytics/DateRangeFilter';
import ExportButtons from '../../components/analytics/ExportButtons';
import LoadingSkeleton from '../../components/analytics/LoadingSkeleton';
import EmptyChartState from '../../components/analytics/EmptyChartState';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminAnalyticsDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30d');

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getAdminOverview({ range: dateRange });
      setData(result);
      setError(null);
    } catch (e) {
      setError('Failed to load analytics dashboard.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];

  const ngoData = data?.ngos ? [
    { name: 'Verified', value: data.ngos.verified || 0 },
    { name: 'Pending', value: data.ngos.pending || 0 },
    { name: 'Rejected', value: data.ngos.rejected || 0 }
  ] : [];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Governance Intelligence</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Platform Analytics & Intelligence</h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl font-medium">
              National monetary donation trends, trust verification health, corporate CSR volume, and grievance resolution telemetry.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DateRangeFilter onChange={setDateRange} />
            <ExportButtons moduleType="donations" showFormCsr1={true} extraFilters={{ range: dateRange }} />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchData} className="underline">Retry</button>
          </div>
        )}

        {loading && !data ? (
          <LoadingSkeleton />
        ) : data ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Donations" value={`₹${Number(data.donations.total_amount).toLocaleString('en-IN')}`} subtitle={`${data.donations.total_count} transactions`} icon="payments" />
              <StatCard title="Active NGOs" value={data.ngos.verified} subtitle={`Out of ${data.ngos.total} total trusts`} icon="volunteer_activism" />
              <StatCard title="CSR Spend" value={`₹${Number(data.csr.total_spend).toLocaleString('en-IN')}`} subtitle={`${data.csr.active_partnerships} active partnerships`} icon="corporate_fare" />
              <StatCard title="Open Grievances" value={data.grievances.open} subtitle={`${data.grievances.total} total tickets`} icon="warning" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Monetary Donation Trend">
                {data.donations.by_month && data.donations.by_month.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.donations.by_month}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <EmptyChartState message="No donation trend data recorded yet" />}
              </ChartCard>

              <ChartCard title="NGO Verification Distribution">
                {ngoData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={ngoData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {ngoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <EmptyChartState message="No NGO verification data recorded yet" />}
              </ChartCard>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
