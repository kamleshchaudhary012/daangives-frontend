import React, { useState, useEffect, useRef } from 'react';
import DonorLayout from '../../layouts/DonorLayout';
import AvatarImage from '../../components/common/AvatarImage';
import { getUserProfile, updateUserProfile, uploadDonorAvatar, removeDonorAvatar } from '../../services/api';

const ENTITY_OPTIONS = [
  { value: 'INDIVIDUAL', label: 'Individual' },
  { value: 'COMPANY', label: 'Company' },
  { value: 'TRUST', label: 'Trust' },
  { value: 'LLP', label: 'Limited Liability Partnership (LLP)' },
  { value: 'PARTNERSHIP', label: 'Partnership Firm' },
  { value: 'HUF', label: 'Hindu Undivided Family (HUF)' },
  { value: 'OTHER', label: 'Other Entity' },
];

export default function DonorProfilePage() {
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    profile_image: null,
    donor_profile: {
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      pan_number_masked: '',
      has_pan: false,
      entity_type: 'INDIVIDUAL',
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [editingPan, setEditingPan] = useState(false);
  const [panInput, setPanInput] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await getUserProfile();
      setProfile({
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        profile_image: data.profile_image || null,
        donor_profile: {
          address_line1: data.donor_profile?.address_line1 || '',
          address_line2: data.donor_profile?.address_line2 || '',
          city: data.donor_profile?.city || '',
          state: data.donor_profile?.state || '',
          pincode: data.donor_profile?.pincode || '',
          country: data.donor_profile?.country || 'India',
          pan_number_masked: data.donor_profile?.pan_number_masked || '',
          has_pan: Boolean(data.donor_profile?.has_pan),
          entity_type: data.donor_profile?.entity_type || 'INDIVIDUAL',
        },
      });
      setPanInput('');
      setEditingPan(false);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load profile from backend.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Frontend validation
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setAvatarError('Unsupported image format. Allowed: JPG, PNG, WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image size exceeds 5 MB limit.');
      return;
    }

    setAvatarError('');
    setUploadingPhoto(true);
    setSavedMsg('');

    try {
      const res = await uploadDonorAvatar(file);
      setProfile((prev) => ({
        ...prev,
        profile_image: res.user?.profile_image || null,
      }));

      // Update local user data
      const localUserStr = localStorage.getItem('user');
      if (localUserStr) {
        try {
          const u = JSON.parse(localUserStr);
          u.profile_image = res.user?.profile_image;
          localStorage.setItem('user', JSON.stringify(u));
        } catch (err) {
          // ignore
        }
      }

      setSavedMsg('Profile photo updated successfully.');
    } catch (err) {
      setAvatarError(err.message || 'Failed to upload profile photo.');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!profile.profile_image || uploadingPhoto) return;
    setUploadingPhoto(true);
    setAvatarError('');
    setSavedMsg('');

    try {
      await removeDonorAvatar();
      setProfile((prev) => ({
        ...prev,
        profile_image: null,
      }));

      const localUserStr = localStorage.getItem('user');
      if (localUserStr) {
        try {
          const u = JSON.parse(localUserStr);
          u.profile_image = null;
          localStorage.setItem('user', JSON.stringify(u));
        } catch (err) {
          // ignore
        }
      }

      setSavedMsg('Profile photo removed.');
    } catch (err) {
      setAvatarError(err.message || 'Failed to remove profile photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    setErrorMsg('');

    // Validate PAN if editing
    if (editingPan && panInput.trim()) {
      const panClean = panInput.trim().toUpperCase();
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(panClean)) {
        setErrorMsg('Please enter a valid 10-character PAN format (e.g. ABCDE1234F).');
        setSaving(false);
        return;
      }
    }

    // Validate Pincode if provided
    if (profile.donor_profile.pincode.trim()) {
      const pinClean = profile.donor_profile.pincode.trim();
      if (!/^\d{6}$/.test(pinClean)) {
        setErrorMsg('Pincode must be exactly 6 digits.');
        setSaving(false);
        return;
      }
    }

    try {
      const payload = {
        full_name: profile.full_name.trim(),
        phone: profile.phone.trim(),
        donor_profile: {
          address_line1: profile.donor_profile.address_line1.trim(),
          address_line2: profile.donor_profile.address_line2.trim(),
          city: profile.donor_profile.city.trim(),
          state: profile.donor_profile.state.trim(),
          pincode: profile.donor_profile.pincode.trim(),
          country: profile.donor_profile.country.trim() || 'India',
          entity_type: profile.donor_profile.entity_type,
        },
      };

      if (editingPan && panInput.trim()) {
        payload.donor_profile.pan_number = panInput.trim().toUpperCase();
      }

      const updated = await updateUserProfile(payload);
      
      const localUserStr = localStorage.getItem('user');
      if (localUserStr) {
        try {
          const u = JSON.parse(localUserStr);
          u.full_name = updated.full_name;
          u.phone = updated.phone;
          localStorage.setItem('user', JSON.stringify(u));
        } catch (err) {
          // ignore
        }
      }

      setProfile((prev) => ({
        ...prev,
        full_name: updated.full_name,
        phone: updated.phone,
        donor_profile: {
          address_line1: updated.donor_profile?.address_line1 || '',
          address_line2: updated.donor_profile?.address_line2 || '',
          city: updated.donor_profile?.city || '',
          state: updated.donor_profile?.state || '',
          pincode: updated.donor_profile?.pincode || '',
          country: updated.donor_profile?.country || 'India',
          pan_number_masked: updated.donor_profile?.pan_number_masked || '',
          has_pan: Boolean(updated.donor_profile?.has_pan),
          entity_type: updated.donor_profile?.entity_type || 'INDIVIDUAL',
        },
      }));
      setEditingPan(false);
      setPanInput('');
      setSavedMsg('Profile and compliance information updated successfully.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DonorLayout>
        <div className="py-16 text-center text-xs text-on-surface-variant space-y-2">
          <span className="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
          <p className="font-semibold">Loading Authenticated Donor Profile...</p>
        </div>
      </DonorLayout>
    );
  }

  return (
    <DonorLayout>
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Donor Profile & Tax Compliance</h1>
          <p className="text-xs text-on-surface-variant mt-1">Manage your identity, 80G tax registration, and communication details.</p>
        </div>

        {savedMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
            {savedMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-red-600">error</span>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. Profile Photo & Identity Card */}
          <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/60 space-y-6">
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/40 pb-3">
              <span className="material-symbols-outlined text-primary text-base">badge</span>
              <span>Account & Personal Identity</span>
            </h2>

            {/* Avatar / Photo Upload Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
              <div className="flex items-center gap-5">
                <AvatarImage
                  src={profile.profile_image}
                  name={profile.full_name || profile.email}
                  size="xl"
                  className="shadow-sm"
                />
                <div className="space-y-1">
                  <h3 className="font-bold text-on-surface text-base sm:text-lg">{profile.full_name || 'Authenticated Donor'}</h3>
                  <p className="text-xs text-on-surface-variant">{profile.email}</p>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Verified Donor Role
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-container shadow-xs inline-flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {uploadingPhoto ? 'progress_activity' : 'upload'}
                    </span>
                    <span>{uploadingPhoto ? 'Uploading...' : profile.profile_image ? 'Change Photo' : 'Upload Photo'}</span>
                  </button>

                  {profile.profile_image && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={uploadingPhoto}
                      className="px-3 py-2 bg-red-50 text-red-700 text-xs font-semibold rounded-xl hover:bg-red-100 border border-red-200 transition-all disabled:opacity-50 cursor-pointer"
                      title="Remove Photo"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-on-surface-variant">JPG, PNG, or WebP. Max 5 MB.</p>
                {avatarError && (
                  <p className="text-[11px] text-red-600 font-semibold mt-1">{avatarError}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Email Address (Account ID)</label>
                <input
                  type="email"
                  disabled
                  value={profile.email}
                  className="w-full px-4 py-2.5 bg-surface-container-low/60 border border-outline-variant/40 text-on-surface-variant/80 rounded-xl text-sm cursor-not-allowed font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-on-surface mb-1">Mobile Phone Number</label>
                <input
                  type="text"
                  required
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* 2. Statutory 80G & Tax Compliance Card */}
          <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/60 space-y-6">
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/40 pb-3">
              <span className="material-symbols-outlined text-primary text-base">receipt_long</span>
              <span>80G Tax Exemption & Legal Classification</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Donor Entity Type</label>
                <select
                  value={profile.donor_profile.entity_type}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      donor_profile: { ...profile.donor_profile, entity_type: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary"
                >
                  {ENTITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-on-surface-variant mt-1">Used for annual Form 10BD non-profit statutory filing.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Permanent Account Number (PAN)</label>
                {profile.donor_profile.has_pan && !editingPan ? (
                  <div className="flex items-center justify-between px-4 py-2 bg-surface-container-low border border-outline-variant rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-sm">verified_user</span>
                      <span className="font-mono text-sm font-bold text-on-surface tracking-wider">
                        {profile.donor_profile.pan_number_masked}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPan(true);
                        setPanInput('');
                      }}
                      className="text-xs text-primary font-bold hover:underline cursor-pointer"
                    >
                      Update PAN
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        maxLength={10}
                        value={panInput}
                        onChange={(e) => setPanInput(e.target.value.toUpperCase())}
                        placeholder="ABCDE1234F"
                        className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm uppercase font-mono tracking-wider focus:outline-none focus:border-primary"
                      />
                      {profile.donor_profile.has_pan && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPan(false);
                            setPanInput('');
                          }}
                          className="px-3 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-on-surface-variant">10-character PAN (e.g. ABCDE1234F). Masked upon saving.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Address for Tax Deductions Card */}
          <div className="bg-surface-container-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/60 space-y-6">
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-2 border-b border-outline-variant/40 pb-3">
              <span className="material-symbols-outlined text-primary text-base">location_on</span>
              <span>Communication & Tax Filing Address</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-on-surface mb-1">Address Line 1</label>
                <input
                  type="text"
                  value={profile.donor_profile.address_line1}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      donor_profile: { ...profile.donor_profile, address_line1: e.target.value },
                    })
                  }
                  placeholder="Flat / House No., Building Name, Street"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-on-surface mb-1">Address Line 2 (Optional)</label>
                <input
                  type="text"
                  value={profile.donor_profile.address_line2}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      donor_profile: { ...profile.donor_profile, address_line2: e.target.value },
                    })
                  }
                  placeholder="Landmark, Area, Sector"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">City / Town</label>
                <input
                  type="text"
                  value={profile.donor_profile.city}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      donor_profile: { ...profile.donor_profile, city: e.target.value },
                    })
                  }
                  placeholder="e.g. Mumbai"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">State</label>
                <input
                  type="text"
                  value={profile.donor_profile.state}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      donor_profile: { ...profile.donor_profile, state: e.target.value },
                    })
                  }
                  placeholder="e.g. Maharashtra"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Postal Pincode</label>
                <input
                  type="text"
                  maxLength={6}
                  value={profile.donor_profile.pincode}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      donor_profile: { ...profile.donor_profile, pincode: e.target.value },
                    })
                  }
                  placeholder="e.g. 400001"
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Country</label>
                <input
                  type="text"
                  value={profile.donor_profile.country}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      donor_profile: { ...profile.donor_profile, country: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant/40 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-container disabled:opacity-50 transition-all shadow-sm cursor-pointer inline-flex items-center gap-2"
              >
                {saving && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
                <span>{saving ? 'Saving Changes...' : 'Save Profile & Compliance'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </DonorLayout>
  );
}


