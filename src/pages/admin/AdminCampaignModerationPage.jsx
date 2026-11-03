import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import Badge from '../../components/common/Badge';
import {
  getAdminCampaigns,
  approveAdminCampaign,
  requestChangesAdminCampaign,
  rejectAdminCampaign,
  suspendAdminCampaign,
  reopenAdminCampaign,
} from '../../services/api';

export default function AdminCampaignModerationPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING_REVIEW');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Modal Actions
  const [actionType, setActionType] = useState(null); // 'APPROVE', 'REQUEST_CHANGES', 'REJECT', 'SUSPEND', 'REOPEN'
  const [noteInput, setNoteInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, [statusFilter]);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getAdminCampaigns(statusFilter);
      const list = res.results || (Array.isArray(res) ? res : []);
      setCampaigns(list);
      if (list.length > 0) {
        setSelectedCampaign(list[0]);
      } else {
        setSelectedCampaign(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load campaign moderation queue.');
      setCampaigns([]);
      setSelectedCampaign(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!selectedCampaign || !actionType) return;

    if ((actionType === 'REQUEST_CHANGES' || actionType === 'REJECT') && !noteInput.trim()) {
      alert('Please provide a note or reason for this action.');
      return;
    }

    setSubmitting(true);
    try {
      if (actionType === 'APPROVE') {
        await approveAdminCampaign(selectedCampaign.id, noteInput);
      } else if (actionType === 'REQUEST_CHANGES') {
        await requestChangesAdminCampaign(selectedCampaign.id, noteInput);
      } else if (actionType === 'REJECT') {
        await rejectAdminCampaign(selectedCampaign.id, noteInput);
      } else if (actionType === 'SUSPEND') {
        await suspendAdminCampaign(selectedCampaign.id);
      } else if (actionType === 'REOPEN') {
        await reopenAdminCampaign(selectedCampaign.id);
      }

      setActionType(null);
      setNoteInput('');
      fetchCampaigns();
    } catch (err) {
      alert(err.message || 'Action failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaign Appeal Moderation Queue</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Review and approve campaign appeals before they become active and publicly visible to donors.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
          {[
            { label: 'Pending Review Queue', value: 'PENDING_REVIEW' },
            { label: 'Active / Published', value: 'ACTIVE' },
            { label: 'Changes Requested', value: 'CHANGES_REQUESTED' },
            { label: 'Rejected', value: 'REJECTED' },
            { label: 'All Appeals', value: 'ALL' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                statusFilter === tab.value
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-blue-600 animate-spin">progress_activity</span>
            <p className="text-xs font-semibold text-slate-500 mt-3">Loading Moderation Queue...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3 shadow-xs">
            <span className="material-symbols-outlined text-4xl text-slate-400">task_alt</span>
            <h3 className="text-base font-bold text-slate-900">No Campaigns in {statusFilter} Queue</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
              There are currently no campaigns matching the selected moderation status filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Campaign List */}
            <div className="lg:col-span-1 space-y-3 max-h-[75vh] overflow-y-auto pr-1">
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCampaign(c)}
                  className={`p-4 rounded-2xl border cursor-pointer space-y-2 transition-all ${
                    selectedCampaign?.id === c.id
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={
                      c.status === 'ACTIVE' ? 'success' :
                      c.status === 'PENDING_REVIEW' ? 'warning' :
                      c.status === 'CHANGES_REQUESTED' ? 'info' : 'danger'
                    }>
                      {c.status}
                    </Badge>
                    <span className="text-[10px] font-bold text-slate-500">{c.category}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{c.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1 font-medium">NGO: {c.ngo_display_name}</p>
                </div>
              ))}
            </div>

            {/* Campaign Details & Review Actions */}
            {selectedCampaign && (
              <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-6 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={selectedCampaign.status === 'ACTIVE' ? 'success' : 'warning'}>
                        {selectedCampaign.status}
                      </Badge>
                      <span className="text-xs font-bold text-slate-500">{selectedCampaign.campaign_type}</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedCampaign.title}</h2>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">NGO: <strong className="text-slate-900">{selectedCampaign.ngo_display_name}</strong></p>
                  </div>
                </div>

                {/* Campaign Description */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">Campaign Appeal Summary</h4>
                  <p className="text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200 leading-relaxed font-medium">
                    {selectedCampaign.description}
                  </p>
                </div>

                {/* Admin Actions Bar */}
                <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center gap-3">
                  {selectedCampaign.status === 'PENDING_REVIEW' && (
                    <>
                      <button
                        onClick={() => { setActionType('APPROVE'); setNoteInput(''); }}
                        className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-all shadow-xs"
                      >
                        Approve & Publish ✓
                      </button>
                      <button
                        onClick={() => { setActionType('REQUEST_CHANGES'); setNoteInput(''); }}
                        className="px-5 py-2.5 bg-amber-600 text-white font-bold text-xs rounded-xl hover:bg-amber-700 transition-all shadow-xs"
                      >
                        Request Changes ✎
                      </button>
                      <button
                        onClick={() => { setActionType('REJECT'); setNoteInput(''); }}
                        className="px-5 py-2.5 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition-all shadow-xs"
                      >
                        Reject Campaign ✗
                      </button>
                    </>
                  )}

                  {selectedCampaign.status === 'ACTIVE' && (
                    <button
                      onClick={() => { setActionType('SUSPEND'); setNoteInput(''); }}
                      className="px-5 py-2.5 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition-all shadow-xs"
                    >
                      Suspend Campaign 🚫
                    </button>
                  )}

                  {(selectedCampaign.status === 'REJECTED' || selectedCampaign.status === 'CHANGES_REQUESTED') && (
                    <button
                      onClick={() => { setActionType('REOPEN'); setNoteInput(''); }}
                      className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-all shadow-xs"
                    >
                      Reopen as Draft ↺
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal for Note / Reason */}
        {actionType && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 max-w-md w-full space-y-4 shadow-2xl">
              <h3 className="text-base font-bold text-slate-900">
                {actionType === 'APPROVE' ? 'Confirm Campaign Approval' :
                 actionType === 'REQUEST_CHANGES' ? 'Specify Required Corrections' :
                 actionType === 'REJECT' ? 'Specify Rejection Reason' :
                 actionType === 'SUSPEND' ? 'Confirm Campaign Suspension' : 'Reopen Campaign'}
              </h3>

              {(actionType === 'REQUEST_CHANGES' || actionType === 'REJECT' || actionType === 'APPROVE') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {actionType === 'REQUEST_CHANGES' ? 'Review Note for NGO *' :
                     actionType === 'REJECT' ? 'Rejection Reason *' : 'Approval Note (Optional)'}
                  </label>
                  <textarea
                    rows={3}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Enter review feedback..."
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setActionType(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteAction}
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xs"
                >
                  {submitting ? 'Executing...' : 'Confirm Action'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
