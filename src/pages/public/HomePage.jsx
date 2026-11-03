import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../layouts/PublicLayout';
import Badge from '../../components/common/Badge';
import AvatarImage from '../../components/common/AvatarImage';
import { getPublicNgos } from '../../services/api';

export default function HomePage() {
  const [featuredNgos, setFeaturedNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeaturedNgos();
  }, []);

  const fetchFeaturedNgos = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPublicNgos({ page: 1, ordering: '-year_established' });
      if (data.results) {
        setFeaturedNgos(data.results.slice(0, 3));
      } else if (Array.isArray(data)) {
        setFeaturedNgos(data.slice(0, 3));
      } else {
        setFeaturedNgos([]);
      }
    } catch (err) {
      setError(err.message || 'Unable to load public verified NGOs at this time.');
      setFeaturedNgos([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-surface-container-low via-surface to-background py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary-container/30 border border-secondary/30 text-secondary text-xs font-semibold">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                <span>NITI Aayog Darpan & Statutory Compliance Review</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-on-surface leading-tight">
                Direct Social Impact Across <span className="text-primary">India</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-on-surface-variant font-normal leading-relaxed">
                Connect directly with verified local non-profits. Support transparent social impact initiatives with official compliance verification.
              </p>

              {/* Information Banner Card */}
              <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-xs flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-primary-container text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">gavel</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-primary">Administrative Governance</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Listed organizations undergo administrative review of Darpan ID, statutory registrations, and organization details.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  to="/ngos"
                  className="px-8 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-container transition-all shadow-lg text-center text-sm"
                >
                  Browse Verified NGOs
                </Link>
                <Link
                  to="/register"
                  className="px-8 py-4 bg-surface-container-lowest border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-container-low transition-all text-center text-sm"
                >
                  Register Partner Organization
                </Link>
              </div>

              {/* CSR Connect minimal CTA */}
              <p className="text-xs text-on-surface-variant">
                Corporate CSR Department?{' '}
                <Link
                  to="/csr"
                  className="text-primary font-semibold hover:underline underline-offset-2"
                >
                  Learn about CSR Connect →
                </Link>
              </p>
            </div>

            {/* Hero Right Visual Card */}
            <div className="lg:col-span-5">
              <div className="relative bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/60 shadow-2xl space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Direct Collaboration</span>
                  <Badge variant="verified">Verified Partner</Badge>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-on-surface">Transparent Partner Engagement</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Connect directly with vetted grassroots NGOs on verified community projects, with structured milestone updates and compliance documentation.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-outline-variant/40 text-center">
                  <div className="p-2 rounded-xl bg-surface-container-low">
                    <span className="block text-sm font-bold text-primary">Statutory</span>
                    <span className="text-[10px] text-on-surface-variant">Compliance</span>
                  </div>
                  <div className="p-2 rounded-xl bg-surface-container-low">
                    <span className="block text-sm font-bold text-primary">Bilateral</span>
                    <span className="text-[10px] text-on-surface-variant">Agreements</span>
                  </div>
                  <div className="p-2 rounded-xl bg-surface-container-low">
                    <span className="block text-sm font-bold text-primary">Milestone</span>
                    <span className="text-[10px] text-on-surface-variant">Tracking</span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between border-t border-outline-variant/40">
                  <span className="text-xs text-on-surface-variant font-medium">Verified Partner Directory</span>
                  <Link to="/ngos" className="text-xs font-bold text-primary hover:underline">
                    Explore Directory →
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Featured Verified NGOs Section */}
      <section className="py-16 bg-surface-container-low border-t border-outline-variant/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface">Top Verified NGO Partners</h2>
            <p className="text-sm text-on-surface-variant">
              Explore community non-profits with verified legal registrations and active impact programs.
            </p>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <span className="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
              <p className="text-xs text-on-surface-variant font-semibold">Loading verified NGO partners...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center text-red-600 text-xs font-semibold">
              {error}
            </div>
          ) : featuredNgos.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant space-y-2 bg-surface-container-lowest rounded-3xl border border-outline-variant/60 max-w-md mx-auto">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/50">storefront</span>
              <p className="text-sm font-bold text-on-surface">No verified NGOs are currently listed.</p>
              <p className="text-xs text-on-surface-variant">Approved organizations will appear here once administrative verification is complete.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredNgos.map((ngo) => (
                <div
                  key={ngo.id}
                  className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/60 space-y-4 hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <AvatarImage
                        src={ngo.logo}
                        name={ngo.display_name || ngo.legal_name}
                        size="lg"
                        shape="rounded"
                        fallbackIcon="domain"
                        objectFit="contain"
                        className="w-14 h-14 bg-white border border-slate-200"
                      />
                      <div>
                        <h4 className="font-bold text-on-surface text-base line-clamp-1">{ngo.display_name || ngo.legal_name}</h4>
                        {ngo.gujarati_name && (
                          <span className="text-xs text-secondary font-medium block">{ngo.gujarati_name}</span>
                        )}
                        <span className="text-xs text-on-surface-variant">
                          {[ngo.city, ngo.district, ngo.state].filter(Boolean).join(', ') || 'Registered Organization'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
                      {ngo.description || ngo.mission_statement || 'Dedicated to transparent community welfare initiatives.'}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-outline-variant/40">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">verified</span> Verified NGO
                      </span>
                      <span className="text-on-surface-variant font-medium">
                        {ngo.darpan_id ? `Darpan: ${ngo.darpan_id}` : 'Darpan Verified'}
                      </span>
                    </div>

                    <Link
                      to={`/ngos/${ngo.slug || ngo.id}`}
                      className="w-full py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-container transition-colors text-center block"
                    >
                      View Organization Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}