import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DonorLayout from '../../layouts/DonorLayout';
import Badge from '../../components/common/Badge';
import { getPublicNgos } from '../../services/api';

export default function MoneyDonationStep1Page() {
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  const initialNgoId = searchParams.get('ngoId');

  const cleanInitialNgoId = (initialNgoId != null && String(initialNgoId).trim() !== '')
    ? String(initialNgoId).trim()
    : null;

  const [ngos, setNgos] = useState([]);
  const [selectedNgoId, setSelectedNgoId] = useState(cleanInitialNgoId);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchNgos();
  }, []);

  const fetchNgos = async () => {
    setLoading(true);
    try {
      const res = await getPublicNgos({ page: 1 });
      if (res.results && res.results.length > 0) {
        setNgos(res.results);
        const matchNgo = cleanInitialNgoId
          ? res.results.find((n) => String(n.id) === cleanInitialNgoId)
          : null;
        setSelectedNgoId(matchNgo ? String(matchNgo.id) : String(res.results[0].id));
      } else {
        setNgos([]);
      }
    } catch (err) {
      setNgos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!selectedNgoId) return;
    const params = new URLSearchParams();
    if (campaignId) params.append('campaignId', campaignId);
    params.append('ngoId', selectedNgoId);
    navigate(`/donor/donations/money/step-2?${params.toString()}`);
  };

  return (
    <DonorLayout>
      <div className="max-w-4xl space-y-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant border-b border-outline-variant/40 pb-4">
          <span className="text-primary font-bold">Step 1: Select Verified Non-Profit</span>
          <span>Step 2: Amount & Tax 80G</span>
          <span>Step 3: Review & Notice</span>
          <span>Step 4: Summary</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-on-surface">Monetary Contribution - Select Organization</h1>
          <p className="text-xs text-on-surface-variant mt-1">Choose a state-verified non-profit partner to direct your financial support.</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-on-surface-variant space-y-2">
            <span className="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
            <p className="font-semibold">Loading verified NGO partners...</p>
          </div>
        ) : ngos.length === 0 ? (
          <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/60 space-y-2 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">storefront</span>
            <p className="font-bold text-on-surface">No verified NGO partners currently available.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ngos.map((ngo) => (
              <div
                key={ngo.id}
                onClick={() => setSelectedNgoId(String(ngo.id))}
                className={`p-6 rounded-2xl border cursor-pointer transition-all flex flex-col sm:flex-row items-center gap-6 ${
                  String(selectedNgoId) === String(ngo.id)
                    ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                    : 'border-outline-variant/60 bg-surface-container-lowest hover:border-outline-variant'
                }`}
              >
                {ngo.logo && !imgError[ngo.id] ? (
                  <img 
                    src={ngo.logo.startsWith('http') ? ngo.logo : `${import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, '') : ''}${ngo.logo}`} 
                    alt={ngo.display_name || ngo.legal_name} 
                    className="w-16 h-16 rounded-xl object-cover border border-outline-variant shrink-0" 
                    onError={() => setImgError(prev => ({ ...prev, [ngo.id]: true }))}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary font-bold text-xl flex items-center justify-center border border-outline-variant shrink-0">
                    {(ngo.display_name || ngo.legal_name)?.charAt(0) || 'N'}
                  </div>
                )}
                <div className="flex-1 space-y-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary">{ngo.category}</span>
                    <Badge variant="verified">Verified Partner</Badge>
                  </div>
                  <h3 className="font-bold text-on-surface text-base">{ngo.display_name || ngo.legal_name}</h3>
                  <p className="text-xs text-on-surface-variant line-clamp-2">
                    {ngo.description || ngo.mission_statement || 'Dedicated to transparent community welfare.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {ngos.length > 0 && (
          <div className="flex justify-end pt-4">
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-container shadow-md transition-all text-sm flex items-center gap-2"
            >
              Continue to Amount Entry
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        )}
      </div>
    </DonorLayout>
  );
}
