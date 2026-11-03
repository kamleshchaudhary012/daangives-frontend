export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Single-flight refresh state & queue
let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token = null) {
  refreshQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  refreshQueue = [];
}

export function clearSessionAndRedirect(message = 'Session expired. Please log in again.') {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  if (message) {
    sessionStorage.setItem('sessionExpiredMsg', message);
  }

  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

export async function logoutUser() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  sessionStorage.removeItem('sessionExpiredMsg');
  
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    clearSessionAndRedirect('Your session has expired. Please log in again.');
    throw new Error('No refresh token available.');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      clearSessionAndRedirect('Your session has expired. Please log in again.');
      throw new Error('Token refresh failed.');
    }

    const data = await response.json();
    if (data.access) {
      localStorage.setItem('accessToken', data.access);
      if (data.refresh) {
        localStorage.setItem('refreshToken', data.refresh);
      }
      return data.access;
    } else {
      clearSessionAndRedirect('Your session has expired. Please log in again.');
      throw new Error('Invalid refresh response.');
    }
  } catch (err) {
    clearSessionAndRedirect('Your session has expired. Please log in again.');
    throw err;
  }
}

function getAuthHeaders(isMultipart = false) {
  const token = localStorage.getItem('accessToken');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

async function request(endpoint, options = {}, isMultipart = false, isRetry = false) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(isMultipart),
        ...(options.headers || {}),
      },
    });
  } catch (err) {
    if (err.name === 'AbortError' || err.isAborted) {
      throw err;
    }
    const error = new Error('Unable to connect to server. Please try again.');
    error.status = 0;
    throw error;
  }

  // Handle 401 Expiry & Automatic Refresh Flow (Single-Flight Queue)
  if (
    response.status === 401 &&
    !isRetry &&
    !endpoint.includes('/auth/login/') &&
    !endpoint.includes('/auth/refresh/')
  ) {
    if (isRefreshing) {
      // Queue concurrent 401 requests while single refresh request is in-flight
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      })
        .then(() => request(endpoint, options, isMultipart, true))
        .catch((err) => {
          throw err;
        });
    }

    isRefreshing = true;

    try {
      const newAccessToken = await refreshAccessToken();
      processQueue(null, newAccessToken);
      isRefreshing = false;
      // Retry original failed request exactly once with new access token
      return request(endpoint, options, isMultipart, true);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      isRefreshing = false;
      throw refreshErr;
    }
  }

  let data = {};
  try {
    data = await response.json();
  } catch (err) {
    data = {};
  }

  if (!response.ok) {
    if (response.status === 401 && isRetry) {
      clearSessionAndRedirect('Your session has expired. Please log in again.');
    }
    let errorMsg = data.detail;
    if (!errorMsg && Array.isArray(data.non_field_errors)) {
      errorMsg = data.non_field_errors.join(' ');
    }
    if (!errorMsg && typeof data === 'object' && data !== null) {
      const firstKey = Object.keys(data)[0];
      if (firstKey && Array.isArray(data[firstKey])) {
        errorMsg = data[firstKey].join(' ');
      } else if (firstKey && typeof data[firstKey] === 'string') {
        errorMsg = data[firstKey];
      }
    }
    const error = new Error(errorMsg || 'Request failed.');
    error.status = response.status;
    error.fieldErrors = data;
    error.data = data;
    throw error;
  }
  return data;
}

export async function loginUser(email, password) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });
  } catch (err) {
    throw new Error('Unable to connect to server. Please try again.');
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = {};
  }

  if (!response.ok) {
    if (response.status === 401) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }
    
    const err = new Error(data.detail || data.non_field_errors?.[0] || 'Authentication failed. Please check your inputs.');
    err.status = response.status;
    err.fieldErrors = data;
    throw err;
  }
  return data;
}

export async function registerUser(userData) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userData.email,
        full_name: userData.fullName,
        phone: userData.phone,
        password: userData.password,
        password_confirm: userData.password,
        role: userData.role || 'DONOR',
      }),
    });
  } catch (err) {
    throw new Error('Unable to connect to server. Please try again.');
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = {};
  }

  if (!response.ok) {
    const errorMsg = typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Registration failed.';
    const err = new Error(errorMsg);
    err.fieldErrors = data;
    throw err;
  }
  return data;
}

// User Profile APIs (GET/PATCH /api/v1/auth/me/)
export async function getUserProfile() {
  return request('/auth/me/', { method: 'GET' });
}

export async function updateUserProfile(profileData) {
  return request('/auth/me/', {
    method: 'PATCH',
    body: JSON.stringify(profileData),
  });
}

// Password Reset APIs
export async function requestPasswordReset(email) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/password-reset/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });
  } catch (err) {
    throw new Error('Unable to connect to server. Please try again.');
  }

  let data = {};
  try {
    data = await response.json();
  } catch (err) {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(data.detail || 'Password reset request failed.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function confirmPasswordReset(payload) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/password-reset/confirm/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: payload.uid,
        token: payload.token,
        new_password: payload.newPassword,
        new_password_confirm: payload.newPassword,
      }),
    });
  } catch (err) {
    throw new Error('Unable to connect to server. Please try again.');
  }

  let data = {};
  try {
    data = await response.json();
  } catch (err) {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(data.detail || data.new_password?.[0] || 'Password reset confirmation failed.');
    error.status = response.status;
    throw error;
  }
  return data;
}

// ---------------------------------------------------------------------------
// NGO OWNER REGISTRATION & APPLICATION APIS
// ---------------------------------------------------------------------------

// 1. Profile APIs
export async function getNgoProfile() {
  try {
    return await request('/ngo/profile/me/', { method: 'GET' });
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function createNgoProfile(profileData) {
  return request('/ngo/profile/', {
    method: 'POST',
    body: JSON.stringify(profileData),
  });
}

export async function updateNgoProfile(profileData) {
  return request('/ngo/profile/me/', {
    method: 'PATCH',
    body: JSON.stringify(profileData),
  });
}

// 2. Address APIs
export async function getNgoAddress() {
  try {
    return await request('/ngo/address/me/', { method: 'GET' });
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function saveNgoAddress(addressData, exists = false) {
  return request('/ngo/address/me/', {
    method: exists ? 'PUT' : 'POST',
    body: JSON.stringify(addressData),
  });
}

// 3. Legal Information APIs
export async function getNgoLegalInfo() {
  try {
    return await request('/ngo/legal/me/', { method: 'GET' });
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function saveNgoLegalInfo(legalData, exists = false) {
  return request('/ngo/legal/me/', {
    method: exists ? 'PATCH' : 'POST',
    body: JSON.stringify(legalData),
  });
}

// 4. Bank Information APIs
export async function getNgoBankInfo() {
  try {
    return await request('/ngo/bank/me/', { method: 'GET' });
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function saveNgoBankInfo(bankData, exists = false) {
  return request('/ngo/bank/me/', {
    method: exists ? 'PATCH' : 'POST',
    body: JSON.stringify(bankData),
  });
}

// 5. Leadership APIs
export async function getNgoLeadership() {
  return request('/ngo/leadership/', { method: 'GET' });
}

export async function createNgoLeader(leaderData) {
  return request('/ngo/leadership/', {
    method: 'POST',
    body: JSON.stringify(leaderData),
  });
}

export async function updateNgoLeader(id, leaderData) {
  return request(`/ngo/leadership/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(leaderData),
  });
}

export async function deleteNgoLeader(id) {
  return request(`/ngo/leadership/${id}/`, {
    method: 'DELETE',
  });
}

// 6. Document APIs
export async function getNgoDocuments() {
  return request('/ngo/documents/', { method: 'GET' });
}

export async function uploadNgoDocument(formData) {
  return request('/ngo/documents/', {
    method: 'POST',
    body: formData,
  }, true);
}

export async function deleteNgoDocument(id) {
  return request(`/ngo/documents/${id}/`, {
    method: 'DELETE',
  });
}

export async function downloadNgoDocumentFile(id) {
  const token = localStorage.getItem('accessToken');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/ngo/documents/${id}/download/`, {
      method: 'GET',
      headers,
    });
  } catch (err) {
    const error = new Error('Unable to connect to server. Please try again.');
    error.status = 0;
    throw error;
  }

  // Handle 401 in document download with single refresh
  if (response.status === 401) {
    try {
      const newToken = await refreshAccessToken();
      response = await fetch(`${API_BASE_URL}/ngo/documents/${id}/download/`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${newToken}` },
      });
    } catch (e) {
      clearSessionAndRedirect('Your session has expired. Please log in again.');
      throw e;
    }
  }

  if (!response.ok) {
    let detail = 'Failed to download document.';
    try {
      const errData = await response.json();
      detail = errData.detail || detail;
    } catch (e) {
      // Ignore if not JSON
    }
    const error = new Error(detail);
    error.status = response.status;
    throw error;
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  let filename = 'document';
  const disposition = response.headers.get('Content-Disposition');
  if (disposition && disposition.includes('filename=')) {
    const matches = /filename="?([^"]+)"?/.exec(disposition);
    if (matches && matches[1]) {
      filename = matches[1];
    }
  }

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export const getNgoDocumentDownloadUrl = downloadNgoDocumentFile;

// 7. Submission & History APIs
export async function submitNgoApplication() {
  return request('/ngo/submit/', { method: 'POST' });
}

export async function getNgoVerificationHistory() {
  try {
    return await request('/ngo/history/', { method: 'GET' });
  } catch (err) {
    if (err.status === 404) return [];
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 8. PUBLIC NGO APIS
// ---------------------------------------------------------------------------
export async function getPublicNgos(params = {}, options = {}) {
  const queryParams = new URLSearchParams();

  if (params.search?.trim()) queryParams.set('search', params.search.trim());
  if (params.category && params.category !== 'All' && params.category !== 'all') queryParams.set('category', params.category);
  if (params.city?.trim()) queryParams.set('city', params.city.trim());
  if (params.district?.trim()) queryParams.set('district', params.district.trim());
  if (params.state?.trim()) queryParams.set('state', params.state.trim());
  if (params.service_areas?.trim()) queryParams.set('service_areas', params.service_areas.trim());
  if (params.has_12a === true || params.has_12a === 'true') queryParams.set('has_12a', 'true');
  if (params.has_80g === true || params.has_80g === 'true') queryParams.set('has_80g', 'true');
  if (params.has_fcra === true || params.has_fcra === 'true') queryParams.set('has_fcra', 'true');
  if (params.ordering) queryParams.set('ordering', params.ordering);
  if (params.page) queryParams.set('page', params.page);

  const queryString = queryParams.toString();
  const endpoint = `/public/ngos/${queryString ? `?${queryString}` : ''}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      ...options,
    });
  } catch (err) {
    if (err.name === 'AbortError' || err.isAborted) {
      throw err;
    }
    const error = new Error('Unable to connect to server. Please try again.');
    error.status = 0;
    throw error;
  }

  let data = {};
  try {
    data = await response.json();
  } catch (err) {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(data.detail || 'Failed to fetch public NGOs.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function getPublicNgoBySlug(slug) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/public/ngos/${slug}/`, { method: 'GET' });
  } catch (err) {
    const error = new Error('Unable to connect to server. Please try again.');
    error.status = 0;
    throw error;
  }

  let data = {};
  try {
    data = await response.json();
  } catch (err) {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(data.detail || 'NGO not found.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function getPublicNgoById(uuid) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/public/ngos/id/${uuid}/`, { method: 'GET' });
  } catch (err) {
    const error = new Error('Unable to connect to server. Please try again.');
    error.status = 0;
    throw error;
  }

  let data = {};
  try {
    data = await response.json();
  } catch (err) {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(data.detail || 'NGO not found.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function getPublicNgoBySlugOrId(identifier) {
  try {
    return await getPublicNgoBySlug(identifier);
  } catch (err) {
    if (err.status === 404) {
      try {
        return await getPublicNgoById(identifier);
      } catch (err2) {
        throw err2;
      }
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 9. ADMIN VERIFICATION & INSPECTION APIS
// ---------------------------------------------------------------------------
export async function getAdminNgos(params = {}, options = {}) {
  const queryParams = new URLSearchParams();

  if (params.search?.trim()) queryParams.set('search', params.search.trim());
  if (params.status && params.status !== 'All') queryParams.set('status', params.status);
  if (params.category && params.category !== 'All') queryParams.set('category', params.category);
  if (params.page) queryParams.set('page', params.page);

  const queryString = queryParams.toString();
  const endpoint = `/admin/ngos/${queryString ? `?${queryString}` : ''}`;

  return request(endpoint, { method: 'GET', ...options });
}

export async function getAdminNgoById(id) {
  return request(`/admin/ngos/${id}/`, { method: 'GET' });
}

export async function getAdminNgoHistory(id) {
  return request(`/admin/ngos/${id}/history/`, { method: 'GET' });
}

// Admin Status Actions
export async function startAdminNgoReview(id) {
  return request(`/admin/ngos/${id}/start-review/`, { method: 'POST' });
}

export async function approveAdminNgo(id, data = {}) {
  return request(`/admin/ngos/${id}/approve/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function recordAdminNgoGovCheck(id, data) {
  return request(`/admin/ngos/${id}/record-gov-check/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function requestAdminNgoCorrection(id, data) {
  return request(`/admin/ngos/${id}/request-correction/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function rejectAdminNgo(id, data) {
  return request(`/admin/ngos/${id}/reject/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function suspendAdminNgo(id, data) {
  return request(`/admin/ngos/${id}/suspend/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function unsuspendAdminNgo(id, data) {
  return request(`/admin/ngos/${id}/unsuspend/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function reopenAdminNgo(id) {
  return request(`/admin/ngos/${id}/reopen/`, { method: 'POST' });
}

// ============================================================================
// CAMPAIGN & NEED REQUEST APIs — Phase 4.1
// ============================================================================

export async function getNgoCampaigns(params = {}, options = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'All') query.append('status', params.status);
  if (params.search) query.append('search', params.search);
  if (params.page) query.append('page', params.page);
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return request(`/ngo/campaigns/${queryString}`, options);
}

export async function createNgoCampaign(campaignData) {
  const isFormData = campaignData instanceof FormData;
  return request('/ngo/campaigns/', {
    method: 'POST',
    body: isFormData ? campaignData : JSON.stringify(campaignData),
  }, isFormData);
}

export async function getNgoCampaignById(id) {
  return request(`/ngo/campaigns/${id}/`);
}

export async function updateNgoCampaign(id, campaignData) {
  const isFormData = campaignData instanceof FormData;
  return request(`/ngo/campaigns/${id}/`, {
    method: 'PATCH',
    body: isFormData ? campaignData : JSON.stringify(campaignData),
  }, isFormData);
}

export async function deleteNgoCampaign(id) {
  return request(`/ngo/campaigns/${id}/`, { method: 'DELETE' });
}

export async function getPublicCampaigns(params = {}, options = {}) {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.append('search', params.search.trim());
  if (params.category && params.category !== 'All' && params.category !== 'all') query.append('category', params.category);
  if (params.campaign_type && params.campaign_type !== 'All' && params.campaign_type !== 'all') query.append('campaign_type', params.campaign_type);
  if (params.ngo_slug) query.append('ngo_slug', params.ngo_slug);
  if (params.is_featured === true || params.is_featured === 'true') query.append('is_featured', 'true');
  if (params.ordering) query.append('ordering', params.ordering);
  if (params.page) query.append('page', params.page);
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return request(`/public/campaigns/${queryString}`, options);
}

export async function getPublicCampaignBySlug(slug) {
  return request(`/public/campaigns/${slug}/`);
}

// PUBLIC CAMPAIGN TRACKING & DISTRIBUTION PROOF APIs (Phase 5.2.6)
export async function getPublicCampaignTracking(slug) {
  return request(`/public/campaigns/${slug}/tracking/`);
}

export async function getPublicCampaignDistributionProofs(campaignIdOrSlug, params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.search) query.append('search', params.search);
  if (params.milestone) query.append('milestone', params.milestone);
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return request(`/public/campaigns/${campaignIdOrSlug}/distribution-proofs/${queryString}`);
}

export async function getPublicDistributionProofDetail(proofId) {
  return request(`/public/campaigns/distribution-proofs/${proofId}/`);
}

export async function getNgoDistributionProofs(params = {}, options = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.milestone) query.append('milestone', params.milestone);
  if (params.campaign) query.append('campaign', params.campaign);
  if (params.search) query.append('search', params.search);
  if (params.ordering) query.append('ordering', params.ordering);
  if (params.page) query.append('page', params.page);
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return request(`/ngo/campaigns/distribution-proofs/${queryString}`, options);
}

// ============================================================================
export async function submitNgoCampaignReview(id) {
  return request(`/ngo/campaigns/${id}/submit-review/`, { method: 'POST' });
}


// ============================================================================
// ADMIN CAMPAIGN MODERATION API HELPERS (Phase 4.1.1)
// ============================================================================

export async function getAdminCampaigns(statusFilter = 'PENDING_REVIEW') {
  const query = statusFilter && statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
  return request(`/admin/campaigns/${query}`);
}

export async function getAdminCampaignById(id) {
  return request(`/admin/campaigns/${id}/`);
}

export async function approveAdminCampaign(id, note = '') {
  return request(`/admin/campaigns/${id}/approve/`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

export async function requestChangesAdminCampaign(id, note) {
  return request(`/admin/campaigns/${id}/request-changes/`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

export async function rejectAdminCampaign(id, rejectionReason) {
  return request(`/admin/campaigns/${id}/reject/`, {
    method: 'POST',
    body: JSON.stringify({ rejection_reason: rejectionReason }),
  });
}

export async function suspendAdminCampaign(id) {
  return request(`/admin/campaigns/${id}/suspend/`, { method: 'POST' });
}

export async function reopenAdminCampaign(id) {
  return request(`/admin/campaigns/${id}/reopen/`, { method: 'POST' });
}

// ==========================================
// DONOR MONETARY CONTRIBUTION APIS (Phase 4.1.7 & Phase 4.2)
// ==========================================
export async function validateMonetaryContribution(data) {
  return request('/donor/monetary-donations/validate/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createMonetaryDonationOrder(data) {
  return request('/donor/monetary-donations/create-order/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function verifyMonetaryDonationPayment(data) {
  return request('/donor/monetary-donations/verify-payment/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getDonorMonetaryDonations(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/donor/monetary-donations/${query ? `?${query}` : ''}`);
}

export async function getDonorMonetaryDonationDetail(id) {
  return request(`/donor/monetary-donations/${id}/`);
}

export async function getNgoMonetaryDonations(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/ngo/monetary-donations/${query ? `?${query}` : ''}`);
}

export async function getAdminMonetaryDonations(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/admin/monetary-donations/${query ? `?${query}` : ''}`);
}

// ---------------------------------------------------------------------------
// RECEIPT PDF DOWNLOAD HELPERS (Phase 4.3.3)
// ---------------------------------------------------------------------------

async function requestBlob(endpoint, options = {}, isRetry = false) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(false),
        ...(options.headers || {}),
      },
    });
  } catch (err) {
    const error = new Error('Unable to connect to the server. Please check your connection.');
    error.status = 0;
    throw error;
  }

  // Handle 401 Expiry & Automatic Refresh Flow (Single-Flight Queue)
  if (
    response.status === 401 &&
    !isRetry &&
    !endpoint.includes('/auth/login/') &&
    !endpoint.includes('/auth/refresh/')
  ) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      })
        .then(() => requestBlob(endpoint, options, true))
        .catch((err) => {
          throw err;
        });
    }

    isRefreshing = true;

    try {
      const newAccessToken = await refreshAccessToken();
      processQueue(null, newAccessToken);
      isRefreshing = false;
      return requestBlob(endpoint, options, true);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      isRefreshing = false;
      throw refreshErr;
    }
  }

  if (!response.ok) {
    let errorMsg = 'Failed to download receipt.';
    if (response.status === 401) {
      errorMsg = 'Your session has expired. Please sign in again.';
    } else if (response.status === 403) {
      errorMsg = 'You are not authorized to download this receipt.';
    } else if (response.status === 404) {
      errorMsg = 'Receipt not found or no longer available.';
    } else if (response.status >= 500) {
      errorMsg = 'Unable to download the receipt right now. Please try again.';
    }
    const error = new Error(errorMsg);
    error.status = response.status;
    throw error;
  }

  const blob = await response.blob();
  let filename = '';
  const disposition = response.headers.get('Content-Disposition');
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) {
      filename = match[1].replace(/[\/\\\\]/g, '').trim();
    }
  }

  return { blob, filename };
}

export async function downloadFileFromBlob(blob, fallbackFilename = 'DaanGives_Receipt.pdf') {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fallbackFilename || 'DaanGives_Receipt.pdf';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
}

export async function downloadDonorReceiptPdf(donationId) {
  const { blob, filename } = await requestBlob(`/donor/monetary-donations/${donationId}/receipt-pdf/`);
  await downloadFileFromBlob(blob, filename || `DaanGives_Receipt_${donationId}.pdf`);
}

export async function emailDonorMonetaryReceipt(donationId) {
  return request(`/donor/monetary-donations/${donationId}/receipt-email/`, {
    method: 'POST',
  });
}

export async function downloadNgoReceiptPdf(donationId) {
  const { blob, filename } = await requestBlob(`/ngo/campaigns/monetary-donations/${donationId}/receipt-pdf/`);
  await downloadFileFromBlob(blob, filename || `DaanGives_Receipt_${donationId}.pdf`);
}

export async function downloadAdminReceiptPdf(donationId) {
  const { blob, filename } = await requestBlob(`/admin/monetary-donations/${donationId}/receipt-pdf/`);
  await downloadFileFromBlob(blob, filename || `DaanGives_Receipt_${donationId}.pdf`);
}

// ---------------------------------------------------------------------------
// FORM 10BD ANNUAL COMPLIANCE LEDGER & EXPORT (Phase 4.3.4)
// ---------------------------------------------------------------------------

export async function getNgoForm10BdLedger(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/ngo/compliance/form-10bd/${query ? `?${query}` : ''}`);
}

export async function downloadNgoForm10BdCsv(financialYear = 'FY 2026-27') {
  const params = financialYear ? `?financial_year=${encodeURIComponent(financialYear)}` : '';
  const { blob, filename } = await requestBlob(`/ngo/compliance/form-10bd/export/${params}`);
  const fallback = `DaanGives_Form10BD_Preparation_${financialYear.replace(/\s+/g, '')}.csv`;
  await downloadFileFromBlob(blob, filename || fallback);
}

export async function getAdminForm10BdLedger(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/admin/compliance/form-10bd/${query ? `?${query}` : ''}`);
}

export async function downloadAdminForm10BdCsv(params = {}) {
  const query = new URLSearchParams(params).toString();
  const { blob, filename } = await requestBlob(`/admin/compliance/form-10bd/export/${query ? `?${query}` : ''}`);
  const fallback = 'DaanGives_Admin_Form10BD_Preparation.csv';
  await downloadFileFromBlob(blob, filename || fallback);
}

// ---------------------------------------------------------------------------
// FORM 10BE OFFICIAL CERTIFICATE MANAGEMENT (Phase 4.3.8)
// ---------------------------------------------------------------------------

export async function uploadNgoForm10BeCertificate(donationId, formData) {
  return request(`/ngo/compliance/donations/${donationId}/form-10be/`, {
    method: 'POST',
    body: formData,
  });
}

export async function downloadDonorForm10BePdf(donationId) {
  const { blob, filename } = await requestBlob(`/donor/monetary-donations/${donationId}/form-10be/`);
  await downloadFileFromBlob(blob, filename || `DaanGives_Form10BE_${donationId}.pdf`);
}

export async function notifyDonorForm10Be(donationId) {
  return request(`/donor/monetary-donations/${donationId}/form-10be/notify/`, {
    method: 'POST',
  });
}

export async function downloadNgoForm10BePdf(donationId) {
  const { blob, filename } = await requestBlob(`/ngo/compliance/donations/${donationId}/form-10be/download/`);
  await downloadFileFromBlob(blob, filename || `DaanGives_Form10BE_${donationId}.pdf`);
}

export async function downloadAdminForm10BePdf(donationId) {
  const { blob, filename } = await requestBlob(`/admin/compliance/donations/${donationId}/form-10be/`);
  await downloadFileFromBlob(blob, filename || `DaanGives_Form10BE_${donationId}.pdf`);
}

// ---------------------------------------------------------------------------
// MEDIA & IMAGE UPLOAD HELPERS (Phase 4.3.5)
// ---------------------------------------------------------------------------

export function getMediaUrl(path) {
  if (!path || typeof path !== 'string') return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  const baseUrl = (API_BASE_URL || '').replace(/\/api\/v1\/?$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${baseUrl}${cleanPath}`;
}

export async function uploadDonorAvatar(file) {
  const formData = new FormData();
  formData.append('profile_image', file);
  return request('/auth/avatar/', {
    method: 'POST',
    body: formData,
  }, true);
}

export async function removeDonorAvatar() {
  return request('/auth/avatar/', {
    method: 'DELETE',
  });
}

export async function uploadNgoLogo(file) {
  const formData = new FormData();
  formData.append('logo', file);
  return request('/ngo/profile/logo/', {
    method: 'POST',
    body: formData,
  }, true);
}

export async function removeNgoLogo() {
  return request('/ngo/profile/logo/', {
    method: 'DELETE',
  });
}


// ============================================================================
// CSR CONNECT API SERVICES — Phase CSR-2.9.1
// ============================================================================

// ---------------------------------------------------------------------------
// 1. COMPANY NAMESPACE (20 Endpoints)
// ---------------------------------------------------------------------------

// Profile & Verification Document (#1 - #4)
export async function getCompanyProfile() {
  return request('/csr/profile/me/', { method: 'GET' });
}

export async function createCompanyProfile(data) {
  return request('/csr/profile/me/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCompanyProfile(data) {
  return request('/csr/profile/me/', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function uploadCompanyVerificationDocument(formData) {
  return request('/csr/profile/verification-document/', {
    method: 'POST',
    body: formData,
  }, true);
}

export async function submitCompanyVerification() {
  return request('/csr/profile/submit/', {
    method: 'POST',
  });
}

// Matchmaking Preferences (#5 - #6)
export async function getCompanyPreferences() {
  return request('/csr/preferences/me/', { method: 'GET' });
}

export async function updateCompanyPreferences(data) {
  return request('/csr/preferences/me/', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Dashboard (#7)
export async function getCompanyDashboard() {
  return request('/csr/dashboard/', { method: 'GET' });
}

// Requirements & Marketplace Discovery (#8 - #10)
export async function getCsrMarketplace(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/csr/requirements/${query ? `?${query}` : ''}`, { method: 'GET' });
}

export async function getCsrRecommended(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/csr/requirements/recommended/${query ? `?${query}` : ''}`, { method: 'GET' });
}

export async function getCsrRequirementDetail(id) {
  return request(`/csr/requirements/${id}/`, { method: 'GET' });
}

// Support Requests / Expressions of Interest (#11 - #14)
export async function createCsrSupportRequest(data) {
  return request('/csr/support-requests/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function listCompanySupportRequests(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/csr/support-requests/${query ? `?${query}` : ''}`, { method: 'GET' });
}

export async function getCompanySupportRequestDetail(id) {
  return request(`/csr/support-requests/${id}/`, { method: 'GET' });
}

export async function withdrawSupportRequest(id, data = {}) {
  return request(`/csr/support-requests/${id}/withdraw/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Bilateral Partnerships & Milestones (#15 - #20)
export async function listCompanyPartnerships(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/csr/partnerships/${query ? `?${query}` : ''}`, { method: 'GET' });
}

export async function getCompanyPartnershipDetail(id) {
  return request(`/csr/partnerships/${id}/`, { method: 'GET' });
}

export async function uploadPartnershipMou(id, formData) {
  return request(`/csr/partnerships/${id}/upload-mou/`, {
    method: 'POST',
    body: formData,
  }, true);
}

export async function reportPartnershipDisbursement(id, data) {
  return request(`/csr/partnerships/${id}/report-disbursement/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function listPartnershipMilestones(id) {
  return request(`/csr/partnerships/${id}/milestones/`, { method: 'GET' });
}

export async function reviewMilestone(partnershipId, milestoneId, data) {
  return request(`/csr/partnerships/${partnershipId}/milestones/${milestoneId}/review/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}


// ---------------------------------------------------------------------------
// 2. NGO CSR NAMESPACE (16 Endpoints)
// ---------------------------------------------------------------------------

// NGO CSR Dashboard (#21)
export async function getNgoCsrDashboard() {
  return request('/ngo/csr/dashboard/', { method: 'GET' });
}

// NGO Proposals / Requirements Management (#22 - #28)
export async function listNgoCsrRequirements(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/ngo/csr/requirements/${query ? `?${query}` : ''}`, { method: 'GET' });
}

export async function createNgoCsrRequirement(data) {
  return request('/ngo/csr/requirements/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getNgoCsrRequirementDetail(id) {
  return request(`/ngo/csr/requirements/${id}/`, { method: 'GET' });
}

export async function updateNgoCsrRequirement(id, data) {
  return request(`/ngo/csr/requirements/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteNgoCsrRequirement(id) {
  return request(`/ngo/csr/requirements/${id}/`, { method: 'DELETE' });
}

export async function submitNgoCsrRequirement(id) {
  return request(`/ngo/csr/requirements/${id}/submit/`, { method: 'POST' });
}

export async function uploadNgoCsrRequirementDocument(id, formData) {
  return request(`/ngo/csr/requirements/${id}/upload-document/`, {
    method: 'POST',
    body: formData,
  }, true);
}

// Incoming Support Requests (#29 - #32)
export async function listNgoCsrSupportRequests(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/ngo/csr/support-requests/${query ? `?${query}` : ''}`, { method: 'GET' });
}

export async function getNgoCsrSupportRequestDetail(id) {
  return request(`/ngo/csr/support-requests/${id}/`, { method: 'GET' });
}

export async function acceptNgoCsrSupportRequest(id, data = {}) {
  return request(`/ngo/csr/support-requests/${id}/accept/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function rejectNgoCsrSupportRequest(id, data) {
  return request(`/ngo/csr/support-requests/${id}/reject/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Bilateral Partnerships & Milestones (#33 - #36)
export async function listNgoCsrPartnerships(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/ngo/csr/partnerships/${query ? `?${query}` : ''}`, { method: 'GET' });
}

export async function getNgoCsrPartnershipDetail(id) {
  return request(`/ngo/csr/partnerships/${id}/`, { method: 'GET' });
}

export async function uploadNgoPartnershipMou(id, formData) {
  return request(`/ngo/csr/partnerships/${id}/upload-mou/`, {
    method: 'POST',
    body: formData,
  }, true);
}

export async function createNgoCsrMilestone(partnershipId, data) {
  return request(`/ngo/csr/partnerships/${partnershipId}/milestones/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function submitNgoCsrMilestoneEvidence(partnershipId, milestoneId, formData) {
  return request(`/ngo/csr/partnerships/${partnershipId}/milestones/${milestoneId}/submit-evidence/`, {
    method: 'POST',
    body: formData,
  }, true);
}


// ---------------------------------------------------------------------------
// 3. ADMIN CSR NAMESPACE (13 Endpoints)
// ---------------------------------------------------------------------------

// Corporate Verification Queue (#37 - #41)
export async function listAdminCsrCompanies(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/admin/csr/companies/${query ? `?${query}` : ''}`, { method: 'GET' });
}

export async function getAdminCsrCompanyDetail(id) {
  return request(`/admin/csr/companies/${id}/`, { method: 'GET' });
}

export async function approveAdminCsrCompany(id, data = {}) {
  return request(`/admin/csr/companies/${id}/approve/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function rejectAdminCsrCompany(id, data) {
  return request(`/admin/csr/companies/${id}/reject/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function suspendAdminCsrCompany(id, data) {
  return request(`/admin/csr/companies/${id}/suspend/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function requestCorrectionAdminCsrCompany(id, data) {
  return request(`/admin/csr/companies/${id}/request-correction/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function recordAdminCsrCompanyGovCheck(id, data) {
  return request(`/admin/csr/companies/${id}/record-gov-check/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Requirement Moderation Queue (#42 - #46)
export async function listAdminCsrRequirements(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/admin/csr/requirements/${query ? `?${query}` : ''}`, { method: 'GET' });
}

export async function getAdminCsrRequirementDetail(id) {
  return request(`/admin/csr/requirements/${id}/`, { method: 'GET' });
}

export async function approveAdminCsrRequirement(id, data = {}) {
  return request(`/admin/csr/requirements/${id}/approve/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function rejectAdminCsrRequirement(id, data) {
  return request(`/admin/csr/requirements/${id}/reject/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function suspendAdminCsrRequirement(id, data) {
  return request(`/admin/csr/requirements/${id}/suspend/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Platform Monitoring, Audit Ledger & Analytics (#47 - #49)
export async function listAdminCsrPartnerships(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/admin/csr/partnerships/${query ? `?${query}` : ''}`, { method: 'GET' });
}

export async function listAdminCsrAuditHistory(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/admin/csr/audit-history/${query ? `?${query}` : ''}`, { method: 'GET' });
}

export async function getAdminCsrAnalytics() {
  return request('/admin/csr/analytics/', { method: 'GET' });
}


// ---------------------------------------------------------------------------
// 4. CSR FINANCIAL TRACKING & TRANSPARENCY (Disbursements, Ack, Expenses, Dossiers)
// ---------------------------------------------------------------------------

export async function getPartnershipFinancials(partnershipId, role = 'company') {
  const prefix = role === 'ngo' ? '/ngo/csr' : role === 'admin' ? '/admin/csr' : '/csr';
  return request(`${prefix}/partnerships/${partnershipId}/financials/`, { method: 'GET' });
}

export async function listPartnershipDisbursements(partnershipId, role = 'company') {
  const prefix = role === 'ngo' ? '/ngo/csr' : role === 'admin' ? '/admin/csr' : '/csr';
  return request(`${prefix}/partnerships/${partnershipId}/disbursements/`, { method: 'GET' });
}

export async function recordPartnershipDisbursementWithEvidence(partnershipId, formData) {
  return request(`/csr/partnerships/${partnershipId}/disbursements/`, {
    method: 'POST',
    body: formData,
  }, true);
}

export async function reviewDisbursementEvidence(disbursementId, data, role = 'admin') {
  const prefix = role === 'admin' ? '/admin/csr' : '/csr';
  return request(`${prefix}/disbursements/${disbursementId}/review/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function acknowledgeDisbursementReceipt(disbursementId, formData) {
  return request(`/ngo/csr/disbursements/${disbursementId}/acknowledge/`, {
    method: 'POST',
    body: formData,
  }, true);
}

export async function listPartnershipExpenses(partnershipId, role = 'company') {
  const prefix = role === 'ngo' ? '/ngo/csr' : role === 'admin' ? '/admin/csr' : '/csr';
  return request(`${prefix}/partnerships/${partnershipId}/expenses/`, { method: 'GET' });
}

export async function reportPartnershipExpenseWithInvoice(partnershipId, formData) {
  return request(`/ngo/csr/partnerships/${partnershipId}/expenses/`, {
    method: 'POST',
    body: formData,
  }, true);
}

export async function reviewExpenseProof(expenseId, data, role = 'company') {
  const prefix = role === 'admin' ? '/admin/csr' : '/csr';
  return request(`${prefix}/expenses/${expenseId}/review/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function listPartnershipGrantChanges(partnershipId, role = 'company') {
  const prefix = role === 'ngo' ? '/ngo/csr' : role === 'admin' ? '/admin/csr' : '/csr';
  return request(`${prefix}/partnerships/${partnershipId}/grant-changes/`, { method: 'GET' });
}

export async function createPartnershipGrantChange(partnershipId, formData, role = 'ngo') {
  const prefix = role === 'ngo' ? '/ngo/csr' : '/csr';
  return request(`${prefix}/partnerships/${partnershipId}/grant-changes/`, {
    method: 'POST',
    body: formData,
  }, true);
}

export async function reviewGrantChangeAdmin(changeId, formData) {
  return request(`/admin/csr/grant-changes/${changeId}/review/`, {
    method: 'POST',
    body: formData,
  }, true);
}

export async function reviewGrantChangeCompany(changeId, data) {
  return request(`/csr/grant-changes/${changeId}/review/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ---------------------------------------------------------------------------
// PROJECT VERIFICATION & QUEUE (Admin & Village)
// ---------------------------------------------------------------------------
export async function getAdminProjects(params = {}) {
  const queryParts = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  return request(`/admin/projects/${queryString}`, { method: 'GET' });
}

export async function getAdminProjectDetail(projectId) {
  return request(`/admin/projects/${projectId}/`, { method: 'GET' });
}

export async function getAdminProjectHistory(projectId) {
  return request(`/admin/projects/${projectId}/history/`, { method: 'GET' });
}

export async function adminVerifyProject(projectId, verificationData) {
  return request(`/projects/${projectId}/verify/`, {
    method: 'POST',
    body: JSON.stringify(verificationData),
  });
}














