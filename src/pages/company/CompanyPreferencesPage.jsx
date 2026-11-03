import React, { useState, useEffect } from 'react';
import CompanyLayout from '../../layouts/CompanyLayout';
import { getCompanyPreferences, updateCompanyPreferences } from '../../services/api';
import useProfileGuard from '../../hooks/useProfileGuard';
import ProfileSetupRequired from '../../components/common/ProfileSetupRequired';

const SCHEDULE_VII_CATEGORIES = [
  {
    key: 'ERADICATING_HUNGER',
    label: 'Hunger, Poverty & Healthcare',
    description: 'Eradicating hunger, poverty, and malnutrition; promoting healthcare and sanitation.',
    icon: 'nutrition',
  },
  {
    key: 'PROMOTING_EDUCATION',
    label: 'Education & Vocational Skilling',
    description: 'Promoting education, special education, and employment-enhancing vocation skills.',
    icon: 'school',
  },
  {
    key: 'GENDER_EQUALITY',
    label: 'Gender Equality & Women Empowerment',
    description: 'Promoting gender equality, empowering women, setting up hostels and support centers.',
    icon: 'female',
  },
  {
    key: 'ENVIRONMENTAL_SUSTAINABILITY',
    label: 'Environmental Sustainability',
    description: 'Ensuring environmental sustainability, ecological balance, agroforestry, and animal welfare.',
    icon: 'forest',
  },
  {
    key: 'NATIONAL_HERITAGE',
    label: 'National Heritage, Art & Culture',
    description: 'Protection of national heritage, art and culture, restoration of historical buildings.',
    icon: 'account_balance',
  },
  {
    key: 'ARMED_FORCES_VETERANS',
    label: 'Armed Forces Veterans & Widows',
    description: 'Measures for the benefit of armed forces veterans, war widows and their dependents.',
    icon: 'military_tech',
  },
  {
    key: 'RURAL_SPORTS',
    label: 'Rural & Paralympic Sports',
    description: 'Training to promote rural sports, nationally recognized sports, and Paralympic sports.',
    icon: 'sports_soccer',
  },
  {
    key: 'PM_NATIONAL_RELIEF',
    label: 'PM National Relief / PM CARES',
    description: 'Statutory contributions to PM National Relief Fund, Clean Ganga, or Swachh Bharat Kosh.',
    icon: 'volunteer_activism',
  },
  {
    key: 'TECHNOLOGY_INCUBATORS',
    label: 'Technology Incubators & R&D',
    description: 'Contributions to technology incubators in academic institutions, CSIR, ICMR, and DST.',
    icon: 'biotech',
  },
  {
    key: 'RURAL_DEVELOPMENT',
    label: 'Rural Development Projects',
    description: 'Infrastructure, livelihoods, sanitation, and sustainable growth in rural villages.',
    icon: 'holiday_village',
  },
  {
    key: 'SLUM_DEVELOPMENT',
    label: 'Slum Area Development',
    description: 'Upgrading civic amenities, housing, health, and basic sanitation in urban slums.',
    icon: 'location_city',
  },
  {
    key: 'DISASTER_MANAGEMENT',
    label: 'Disaster Management & Relief',
    description: 'Disaster relief, rehabilitation, flood/earthquake response, and reconstruction activities.',
    icon: 'crisis_alert',
  },
];

const BENEFICIARY_DEMOGRAPHICS = [
  { key: 'CHILDREN_EDUCATION', label: 'Children & Primary Students', icon: 'child_care' },
  { key: 'WOMEN_EMPOWERMENT', label: 'Women & Self-Help Groups (SHGs)', icon: 'groups' },
  { key: 'RURAL_COMMUNITIES', label: 'Rural & Tribal Communities', icon: 'nature_people' },
  { key: 'YOUTH_SKILLING', label: 'Unemployed Youth & Job Seekers', icon: 'engineering' },
  { key: 'HEALTHCARE_PATIENTS', label: 'Critical Healthcare Patients', icon: 'local_hospital' },
  { key: 'SPECIALLY_ABLED', label: 'Persons with Disabilities (PwD)', icon: 'accessible' },
  { key: 'ELDERLY_CARE', label: 'Senior Citizens & Elderly Care', icon: 'elderly' },
  { key: 'ENVIRONMENTAL_HABITATS', label: 'Wildlife & Ecosystem Habitats', icon: 'pets' },
  { key: 'DISASTER_AFFECTED', label: 'Disaster-Affected Families', icon: 'emergency' },
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export default function CompanyPreferencesPage() {
  const [preferredCategories, setPreferredCategories] = useState([]);
  const [isNationwide, setIsNationwide] = useState(false);
  const [hasNoLocationPref, setHasNoLocationPref] = useState(false);
  const [preferredStates, setPreferredStates] = useState([]);
  const [districtInput, setDistrictInput] = useState('');
  const [preferredDistricts, setPreferredDistricts] = useState([]);
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [preferredDurationMonths, setPreferredDurationMonths] = useState('');
  const [preferredBeneficiaries, setPreferredBeneficiaries] = useState([]);

  const { status: profileStatus } = useProfileGuard('company');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const fetchPreferences = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await getCompanyPreferences();
      if (res) {
        setPreferredCategories(res.preferred_categories || []);
        setIsNationwide(Boolean(res.is_nationwide));
        setHasNoLocationPref(Boolean(res.has_no_location_pref));
        setPreferredStates(res.preferred_states || []);
        setPreferredDistricts(res.preferred_districts || []);
        setDistrictInput((res.preferred_districts || []).join(', '));
        setMinBudget(res.min_budget !== null && res.min_budget !== undefined ? String(res.min_budget) : '');
        setMaxBudget(res.max_budget !== null && res.max_budget !== undefined ? String(res.max_budget) : '');
        setPreferredDurationMonths(res.preferred_duration_months ? String(res.preferred_duration_months) : '');
        setPreferredBeneficiaries(res.preferred_beneficiaries || []);
      }
    } catch (err) {
      // If 404 or empty, leave defaults for creation
      if (!err.message?.includes('404')) {
        setErrorMsg(err.message || 'Failed to load matchmaking preferences.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profileStatus === 'ready') {
      fetchPreferences();
    } else if (profileStatus === 'missing') {
      setLoading(false);
    }
  }, [profileStatus]);

  // Category Toggle Handler
  const toggleCategory = (catKey) => {
    setPreferredCategories((prev) =>
      prev.includes(catKey) ? prev.filter((k) => k !== catKey) : [...prev, catKey]
    );
  };

  const selectAllCategories = () => {
    setPreferredCategories(SCHEDULE_VII_CATEGORIES.map((c) => c.key));
  };

  const clearAllCategories = () => {
    setPreferredCategories([]);
  };

  // Demographic Toggle Handler
  const toggleBeneficiary = (benKey) => {
    setPreferredBeneficiaries((prev) =>
      prev.includes(benKey) ? prev.filter((b) => b !== benKey) : [...prev, benKey]
    );
  };

  const selectAllBeneficiaries = () => {
    setPreferredBeneficiaries(BENEFICIARY_DEMOGRAPHICS.map((b) => b.key));
  };

  const clearAllBeneficiaries = () => {
    setPreferredBeneficiaries([]);
  };

  // State Toggle Handler
  const toggleState = (stateName) => {
    setPreferredStates((prev) =>
      prev.includes(stateName) ? prev.filter((s) => s !== stateName) : [...prev, stateName]
    );
  };

  const validateClientForm = () => {
    const errors = {};
    const minB = minBudget !== '' ? Number(minBudget) : null;
    const maxB = maxBudget !== '' ? Number(maxBudget) : null;

    if (minB !== null && minB < 0) {
      errors.min_budget = 'Minimum budget cannot be negative.';
    }
    if (maxB !== null && maxB < 0) {
      errors.max_budget = 'Maximum budget cannot be negative.';
    }
    if (minB !== null && maxB !== null && maxB > 0 && minB > maxB) {
      errors.min_budget = 'Minimum budget cannot exceed maximum budget.';
    }

    if (preferredDurationMonths !== '') {
      const dur = Number(preferredDurationMonths);
      if (dur < 1) {
        errors.preferred_duration_months = 'Preferred duration must be at least 1 month.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    if (!validateClientForm()) {
      setErrorMsg('Please resolve form validation errors before saving.');
      return;
    }

    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    setFieldErrors({});

    // Parse districts from comma-separated string
    const parsedDistricts = districtInput
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    const payload = {
      preferred_categories: preferredCategories,
      is_nationwide: isNationwide,
      has_no_location_pref: hasNoLocationPref,
      preferred_states: isNationwide || hasNoLocationPref ? [] : preferredStates,
      preferred_districts: isNationwide || hasNoLocationPref ? [] : parsedDistricts,
      min_budget: minBudget !== '' ? minBudget : null,
      max_budget: maxBudget !== '' ? maxBudget : null,
      preferred_duration_months: preferredDurationMonths !== '' ? Number(preferredDurationMonths) : null,
      preferred_beneficiaries: preferredBeneficiaries,
    };

    try {
      const updated = await updateCompanyPreferences(payload);
      setPreferredCategories(updated.preferred_categories || []);
      setIsNationwide(Boolean(updated.is_nationwide));
      setHasNoLocationPref(Boolean(updated.has_no_location_pref));
      setPreferredStates(updated.preferred_states || []);
      setPreferredDistricts(updated.preferred_districts || []);
      setSuccessMsg('CSR matchmaking preferences saved successfully. Algorithm scores will update automatically.');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      if (err.data && typeof err.data === 'object') {
        setFieldErrors(err.data);
      }
      setErrorMsg(err.message || 'Failed to save corporate CSR preferences.');
    } finally {
      setSaving(false);
    }
  };

  if (profileStatus === 'missing') {
    return (
      <CompanyLayout>
        <div className="max-w-5xl mx-auto py-12">
          <ProfileSetupRequired role="COMPANY" />
        </div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-16">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              CSR Matchmaking Preferences
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Configure your statutory Schedule VII categories, target geographies, and financial bounds for automated NGO matching.
            </p>
          </div>
        </div>

        {/* Global Loading */}
        {(loading || profileStatus === 'loading') && (
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-12 text-center animate-pulse space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 mx-auto" />
            <div className="h-6 bg-surface-container rounded-lg max-w-sm mx-auto" />
            <div className="h-4 bg-surface-container rounded-lg max-w-md mx-auto" />
          </div>
        )}

        {!loading && profileStatus === 'ready' && (
          <form onSubmit={handleSavePreferences} className="space-y-8">
            {/* Feedback Alerts */}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs sm:text-sm text-emerald-800 font-semibold flex items-center gap-2.5 shadow-xs">
                <span className="material-symbols-outlined text-emerald-700 text-lg">check_circle</span>
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-xs sm:text-sm text-red-800 font-semibold flex items-center gap-2.5 shadow-xs">
                <span className="material-symbols-outlined text-red-700 text-lg">error</span>
                {errorMsg}
              </div>
            )}

            {/* Section A: Schedule VII Categories */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">category</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-on-surface">
                      Schedule VII CSR Focus Areas (35% Weight)
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Select all statutory themes aligned with your corporate CSR charter
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-on-surface-variant mr-1">
                    {preferredCategories.length} of {SCHEDULE_VII_CATEGORIES.length} selected
                  </span>
                  <button
                    type="button"
                    onClick={selectAllCategories}
                    className="px-2.5 py-1 bg-surface-container text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearAllCategories}
                    className="px-2.5 py-1 bg-surface-container text-on-surface-variant hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {fieldErrors.preferred_categories && (
                <p className="text-red-500 text-xs">{fieldErrors.preferred_categories}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SCHEDULE_VII_CATEGORIES.map((cat) => {
                  const selected = preferredCategories.includes(cat.key);
                  return (
                    <div
                      key={cat.key}
                      onClick={() => toggleCategory(cat.key)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between select-none ${
                        selected
                          ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30'
                          : 'border-outline-variant/60 hover:border-outline hover:bg-surface-container-low'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                              selected ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                            }`}
                          >
                            <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => {}}
                            className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer mt-1"
                          />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-on-surface">{cat.label}</div>
                          <p className="text-[11px] text-on-surface-variant mt-1 line-clamp-2">
                            {cat.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section B: Geographic Scope & State Filters */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/40">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">map</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">
                    Geographic Priorities (25% Weight)
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Define target Indian states & districts or enable nationwide matchmaking
                  </p>
                </div>
              </div>

              {/* Scope Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-start gap-3 p-4 rounded-2xl border border-outline-variant/60 hover:bg-surface-container-low cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={isNationwide}
                    onChange={(e) => {
                      setIsNationwide(e.target.checked);
                      if (e.target.checked) setHasNoLocationPref(false);
                    }}
                    className="rounded text-primary focus:ring-primary w-4 h-4 mt-0.5"
                  />
                  <div>
                    <div className="text-xs font-bold text-on-surface">Pan-India / Nationwide Allocation</div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">
                      Company is open to funding high-impact programs across any state in India.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-2xl border border-outline-variant/60 hover:bg-surface-container-low cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={hasNoLocationPref}
                    onChange={(e) => {
                      setHasNoLocationPref(e.target.checked);
                      if (e.target.checked) setIsNationwide(false);
                    }}
                    className="rounded text-primary focus:ring-primary w-4 h-4 mt-0.5"
                  />
                  <div>
                    <div className="text-xs font-bold text-on-surface">No Specific Location Preference</div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">
                      Prioritize project alignment, team credibility, and impact metrics over physical territory.
                    </div>
                  </div>
                </label>
              </div>

              {/* State Multi-Select Pills (enabled if not nationwide / no-pref) */}
              {!isNationwide && !hasNoLocationPref && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-on-surface">
                      Target States & Union Territories ({preferredStates.length} selected)
                    </label>
                    <button
                      type="button"
                      onClick={() => setPreferredStates([])}
                      className="text-xs text-primary hover:underline font-bold"
                    >
                      Clear Selection
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 rounded-2xl border border-outline-variant/60 bg-surface-container-low">
                    {INDIAN_STATES.map((state) => {
                      const active = preferredStates.includes(state);
                      return (
                        <button
                          type="button"
                          key={state}
                          onClick={() => toggleState(state)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            active
                              ? 'bg-primary text-white shadow-xs'
                              : 'bg-surface-container text-on-surface-variant hover:bg-slate-200'
                          }`}
                        >
                          {state} {active ? '✓' : '+'}
                        </button>
                      );
                    })}
                  </div>

                  {/* Preferred Districts Input */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      Preferred Districts (Optional, comma-separated)
                    </label>
                    <input
                      type="text"
                      value={districtInput}
                      onChange={(e) => setDistrictInput(e.target.value)}
                      placeholder="e.g. Pune, Thane, Bengaluru Urban, Kamrup"
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-outline-variant bg-surface-container-low focus:border-primary transition-colors"
                    />
                    <p className="text-[11px] text-on-surface-variant mt-1">
                      List specific aspirational or priority districts separated by commas.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Section C: Budget Range & Duration */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/40">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">payments</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-surface">
                    Budget & Timeline Bounds (30% Combined Weight)
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Define minimum and maximum project ticket size and preferred execution horizon
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Min Budget */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Minimum Project Budget (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    placeholder="e.g. 500000"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-surface-container-low ${
                      fieldErrors.min_budget ? 'border-red-500' : 'border-outline-variant focus:border-primary'
                    }`}
                  />
                  {fieldErrors.min_budget && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.min_budget}</p>
                  )}
                </div>

                {/* Max Budget */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Maximum Project Budget (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={maxBudget}
                    onChange={(e) => setMaxBudget(e.target.value)}
                    placeholder="e.g. 5000000"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-surface-container-low ${
                      fieldErrors.max_budget ? 'border-red-500' : 'border-outline-variant focus:border-primary'
                    }`}
                  />
                  {fieldErrors.max_budget && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.max_budget}</p>
                  )}
                </div>

                {/* Preferred Duration */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1">
                    Preferred Duration (Months)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={preferredDurationMonths}
                    onChange={(e) => setPreferredDurationMonths(e.target.value)}
                    placeholder="e.g. 12"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-surface-container-low ${
                      fieldErrors.preferred_duration_months ? 'border-red-500' : 'border-outline-variant focus:border-primary'
                    }`}
                  />
                  {fieldErrors.preferred_duration_months && (
                    <p className="text-red-500 text-xs mt-1">{fieldErrors.preferred_duration_months}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section D: Target Beneficiary Demographics */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">diversity_1</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-on-surface">
                      Target Beneficiary Demographics (10% Weight)
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Focus on specific vulnerable or underserved community groups
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={selectAllBeneficiaries}
                    className="px-2.5 py-1 bg-surface-container text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearAllBeneficiaries}
                    className="px-2.5 py-1 bg-surface-container text-on-surface-variant hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {fieldErrors.preferred_beneficiaries && (
                <p className="text-red-500 text-xs">{fieldErrors.preferred_beneficiaries}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {BENEFICIARY_DEMOGRAPHICS.map((b) => {
                  const active = preferredBeneficiaries.includes(b.key);
                  return (
                    <div
                      key={b.key}
                      onClick={() => toggleBeneficiary(b.key)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 select-none ${
                        active
                          ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30'
                          : 'border-outline-variant/60 hover:border-outline hover:bg-surface-container-low'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          active ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">{b.icon}</span>
                      </div>
                      <span className="text-xs font-bold text-on-surface leading-snug">{b.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save Button Floating / Bottom Bar */}
            <div className="sticky bottom-4 z-20 bg-surface-container-lowest/90 backdrop-blur-md border border-outline-variant/80 p-4 rounded-2xl shadow-lg flex items-center justify-between gap-4">
              <div className="text-xs text-on-surface-variant hidden sm:block">
                All changes immediately update your AI matchmaking algorithm recommendations.
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary text-white text-sm font-bold rounded-xl shadow-xs hover:bg-primary-container disabled:opacity-50 transition-all"
              >
                <span className="material-symbols-outlined text-base">
                  {saving ? 'sync' : 'tune'}
                </span>
                {saving ? 'Saving Preferences...' : 'Save CSR Match Preferences'}
              </button>
            </div>
          </form>
        )}
      </div>
    </CompanyLayout>
  );
}
