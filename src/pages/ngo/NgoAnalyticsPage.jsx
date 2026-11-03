import React, { useEffect, useState } from 'react';
import NgoLayout from '../../layouts/NgoLayout';
import { getNgoAnalytics } from '../../services/api/analytics';
import useProfileGuard from '../../hooks/useProfileGuard';
import ProfileSetupRequired from '../../components/common/ProfileSetupRequired';
import StatCard from '../../components/analytics/StatCard';
import ChartCard from '../../components/analytics/ChartCard';
import ExportButtons from '../../components/analytics/ExportButtons';
import LoadingSkeleton from '../../components/analytics/LoadingSkeleton';
import EmptyChartState from '../../components/analytics/EmptyChartState';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function NgoAnalyticsPage() {
  const { status: profileStatus } = useProfileGuard('ngo');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getNgoAnalytics();
      setData(res);
      setError(null);
    } catch (e) {
      setError('Failed to load NGO fundraising analytics.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (profileStatus === 'ready') {
      fetchData();
    } else if (profileStatus === 'missing') {
      setLoading(false);
    }
  }, [profileStatus]);

  if (profileStatus === 'missing') {
    return (
      <NgoLayout>
        <div className="max-w-4xl mx-auto py-12">
          <ProfileSetupRequired role="NGO" />
        </div>
      </NgoLayout>
    );
  }

  return (
    <NgoLayout>
      <div className="space-y-8">
        <div className="bg-surface-container p-6 sm:p-8 rounded-3xl border border-outline-variant/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Fundraising & Growth Telemetry</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface">Organization Analytics</h1>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl font-medium">
              Monitor incoming capital inflows, donor growth, and operational appeal performance.
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard title="Total Capital Received" value={`₹${Number(data.total_received || 0).toLocaleString('en-IN')}`} subtitle="Verified monetary donations" icon="account_balance_wallet" />
              <StatCard title="Unique Donors" value={data.donor_count || 0} subtitle="Distinct individual patrons" icon="group" />
              <StatCard title="Active Campaigns" value={data.campaigns_count || 0} subtitle="Published cause appeals" icon="campaign" />
            </div>

            <ChartCard title="Disbursement & Funding Inflow Trend">
              {data.by_month && data.by_month.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.by_month}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyChartState message="No incoming funding recorded yet" />}
            </ChartCard>
          </>
        ) : null}
      </div>
    </NgoLayout>
  );
}
