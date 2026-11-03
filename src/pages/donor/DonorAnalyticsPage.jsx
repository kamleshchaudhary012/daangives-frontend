import React, { useEffect, useState } from 'react';
import DonorLayout from '../../layouts/DonorLayout';
import { getDonorAnalytics } from '../../services/api/analytics';
import StatCard from '../../components/analytics/StatCard';
import ChartCard from '../../components/analytics/ChartCard';
import ExportButtons from '../../components/analytics/ExportButtons';
import LoadingSkeleton from '../../components/analytics/LoadingSkeleton';
import EmptyChartState from '../../components/analytics/EmptyChartState';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DonorAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getDonorAnalytics();
      setData(res);
      setError(null);
    } catch (e) {
      setError('Failed to load your giving analytics.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DonorLayout>
      <div className="space-y-8">
        <div className="bg-surface-container p-6 sm:p-8 rounded-3xl border border-outline-variant/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Philanthropic Profile</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface">My Giving Impact Analytics</h1>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl font-medium">
              Track your cumulative contributions, verified 80G tax deductions, and supported causes across India.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButtons moduleType="donations" />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-error-container text-on-error-container border border-error/20 rounded-2xl text-xs font-semibold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchData} className="underline">Retry</button>
          </div>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : data ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Donated" value={`₹${Number(data.total_donated || 0).toLocaleString('en-IN')}`} subtitle="Verified lifetime contributions" icon="payments" />
              <StatCard title="Donations Made" value={data.donation_count || 0} subtitle="Successful monetary transactions" icon="receipt_long" />
              <StatCard title="Est. Tax Savings (80G)" value={`₹${Number(data.tax_savings_estimate || 0).toLocaleString('en-IN')}`} subtitle="50% eligible deduction" icon="account_balance" />
              <StatCard title="Campaigns Supported" value={data.campaigns_supported || 0} subtitle="Active social causes" icon="favorite" />
            </div>

            <ChartCard title="Monthly Donation Velocity">
              {data.by_month && data.by_month.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.by_month}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyChartState message="No donation history recorded yet" />}
            </ChartCard>
          </>
        ) : null}
      </div>
    </DonorLayout>
  );
}
