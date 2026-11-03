import React, { useEffect, useState } from 'react';
import CompanyLayout from '../../layouts/CompanyLayout';
import { getCompanyAnalytics } from '../../services/api/analytics';
import StatCard from '../../components/analytics/StatCard';
import ChartCard from '../../components/analytics/ChartCard';
import ExportButtons from '../../components/analytics/ExportButtons';
import LoadingSkeleton from '../../components/analytics/LoadingSkeleton';
import EmptyChartState from '../../components/analytics/EmptyChartState';

export default function CompanyAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getCompanyAnalytics();
      setData(res);
      setError(null);
    } catch (e) {
      setError('Failed to load CSR portfolio analytics.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <CompanyLayout>
      <div className="space-y-8">
        <div className="bg-surface-container p-6 sm:p-8 rounded-3xl border border-outline-variant/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-1">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Corporate Social Responsibility</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface">CSR Portfolio & Impact Analytics</h1>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl font-medium">
              Real-time monitoring of Section 135 compliance, Schedule VII sector allocations, and partnership execution.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButtons moduleType="csr" showFormCsr1={true} />
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
              <StatCard title="Total CSR Capital Deployed" value={`₹${Number(data.total_csr_spend || 0).toLocaleString('en-IN')}`} subtitle="Agreed partnership funding" icon="payments" />
              <StatCard title="Active Partnerships" value={data.active_partnerships || 0} subtitle="In-progress projects" icon="handshake" />
              <StatCard title="Completed Partnerships" value={data.completed_partnerships || 0} subtitle="Executed & verified" icon="done_all" />
              <StatCard title="MCA Compliance Status" value={data.compliance_status || 'Compliant'} subtitle="Section 135 guidelines" icon="verified_user" />
            </div>

            <ChartCard title="Schedule VII Sector Allocation">
              <EmptyChartState message="Sector distribution breakdown will appear once multi-sector projects are active" />
            </ChartCard>
          </>
        ) : null}
      </div>
    </CompanyLayout>
  );
}
