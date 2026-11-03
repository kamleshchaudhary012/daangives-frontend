const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

function getAuthHeaders() {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...(options.headers || {}),
      },
    });
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
    let errorMsg = data.detail || data.error;
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
    error.data = data;
    throw error;
  }

  return data;
}

export async function getAdminOverview(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return request(`/analytics/admin/overview/${params ? `?${params}` : ''}`, { method: 'GET' });
}

export async function getAdminDonations(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return request(`/analytics/admin/donations/${params ? `?${params}` : ''}`, { method: 'GET' });
}

export async function getAdminNgos() {
  return request('/analytics/admin/ngos/', { method: 'GET' });
}

export async function getAdminCsr() {
  return request('/analytics/admin/csr/', { method: 'GET' });
}

export async function getAdminGrievances() {
  return request('/analytics/admin/grievances/', { method: 'GET' });
}

export async function getDonorAnalytics() {
  return request('/analytics/donor/me/', { method: 'GET' });
}

export async function getNgoAnalytics() {
  return request('/analytics/ngo/me/', { method: 'GET' });
}

export async function getCompanyAnalytics() {
  return request('/analytics/company/me/', { method: 'GET' });
}

export async function exportReport(type, format = 'csv', filters = {}) {
  const queryObj = { format, export_format: format, ...filters };
  const params = new URLSearchParams(queryObj).toString();
  const url = `${API_BASE_URL}/analytics/export/${type}/?${params}`;

  const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error('Export failed');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  const ext = format === 'excel' ? 'xlsx' : format;
  a.download = `export_${type}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
