import { useState, useEffect } from 'react';
import { getCompanyProfile, getNgoProfile } from '../services/api';

/**
 * useProfileGuard
 * Checks if the current authenticated user has an active profile for their role (COMPANY or NGO).
 *
 * @param {'company' | 'ngo' | 'COMPANY' | 'NGO'} role
 * @returns {{
 *   status: 'loading' | 'missing' | 'ready',
 *   profile: object | null,
 *   error: { code?: string, detail?: string } | null,
 *   refetch: () => Promise<void>
 * }}
 */
export function useProfileGuard(role = 'company') {
  const [status, setStatus] = useState('loading');
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  const normalizedRole = String(role).toUpperCase();

  const checkProfile = async () => {
    setStatus('loading');
    setError(null);

    try {
      let res;
      if (normalizedRole === 'COMPANY') {
        res = await getCompanyProfile();
      } else if (normalizedRole === 'NGO') {
        res = await getNgoProfile();
      } else {
        // Default or unhandled role
        setStatus('ready');
        return;
      }

      if (res && (res.id || res.legal_name || res.company_name)) {
        setProfile(res);
        setStatus('ready');
        setError(null);
      } else {
        setProfile(null);
        setStatus('missing');
        setError({ code: 'PROFILE_NOT_FOUND', detail: 'Profile does not exist yet.' });
      }
    } catch (err) {
      const isNotFound =
        err.status === 404 ||
        err.data?.code === 'NO_COMPANY_PROFILE' ||
        err.code === 'NO_COMPANY_PROFILE' ||
        err.message?.toLowerCase().includes('no company profile') ||
        err.message?.toLowerCase().includes('not found') ||
        err.message?.toLowerCase().includes('no ngo profile');

      if (isNotFound) {
        setProfile(null);
        setStatus('missing');
        setError({
          code: err.data?.code || err.code || 'PROFILE_NOT_FOUND',
          detail: err.message || 'Profile not found.',
        });
      } else {
        // Unexpected network or server error - fallback to ready with error object so page can display retry if needed
        setProfile(null);
        setStatus('ready');
        setError({
          code: err.data?.code || 'FETCH_ERROR',
          detail: err.message || 'Failed to verify profile status.',
        });
      }
    }
  };

  useEffect(() => {
    checkProfile();
  }, [role]);

  return {
    status,
    profile,
    error,
    refetch: checkProfile,
  };
}

export default useProfileGuard;
