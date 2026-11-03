/**
 * Grievance Ticketing API Client — Phase 5.1.6A
 * ================================================
 * Isolated service module for grievance ticket and response CRUD operations.
 * Uses the same auth/request infrastructure as the core api.js.
 *
 * Endpoints (backend base: /api/v1/grievances/):
 *   POST   tickets/                    → create ticket
 *   GET    tickets/                    → list tickets (paginated, filterable)
 *   GET    tickets/:id/               → ticket detail
 *   POST   tickets/:id/transition/    → status transition
 *   POST   tickets/:id/assign/        → assign staff
 *   GET    tickets/:id/responses/     → list responses
 *   POST   tickets/:id/responses/     → add response
 *   PATCH  responses/:id/             → update response
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

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

async function grievanceRequest(endpoint, options = {}, isMultipart = false) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/grievances${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(isMultipart),
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
    let errorMsg = data.detail;
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
    error.code = data.code || 'UNKNOWN_ERROR';
    error.data = data;
    throw error;
  }

  return data;
}

// ─── Ticket CRUD ───────────────────────────────────────────

/**
 * Create a new grievance ticket.
 * @param {FormData|Object} ticketData - Ticket fields (supports file upload via FormData)
 * @returns {Promise<Object>} Created ticket detail
 */
export async function createGrievanceTicket(ticketData) {
  const isMultipart = ticketData instanceof FormData;
  return grievanceRequest('/tickets/', {
    method: 'POST',
    body: isMultipart ? ticketData : JSON.stringify(ticketData),
  }, isMultipart);
}

/**
 * List grievance tickets for current user with optional filters.
 * @param {Object} params - Query params: status, priority, category, page, page_size
 * @returns {Promise<Object>} Paginated ticket list {count, next, previous, results}
 */
export async function listGrievanceTickets(params = {}) {
  const queryParts = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  return grievanceRequest(`/tickets/${queryString}`, { method: 'GET' });
}

/**
 * Get detailed ticket information (includes responses thread).
 * @param {string} ticketId - UUID of the ticket
 * @returns {Promise<Object>} Full ticket detail with responses
 */
export async function getGrievanceTicketDetail(ticketId) {
  return grievanceRequest(`/tickets/${ticketId}/`, { method: 'GET' });
}

/**
 * Transition ticket status (state machine).
 * @param {string} ticketId - UUID of the ticket
 * @param {string} newStatus - Target status (OPEN, IN_REVIEW, RESOLVED, CLOSED, REJECTED)
 * @param {string} [resolutionSummary] - Optional resolution notes
 * @returns {Promise<Object>} Updated ticket detail
 */
export async function transitionTicketStatus(ticketId, newStatus, resolutionSummary = '') {
  return grievanceRequest(`/tickets/${ticketId}/transition/`, {
    method: 'POST',
    body: JSON.stringify({ new_status: newStatus, resolution_summary: resolutionSummary }),
  });
}

/**
 * Assign a staff member to investigate a ticket.
 * @param {string} ticketId - UUID of the ticket
 * @param {string|number} userId - ID of the staff user to assign
 * @returns {Promise<Object>} Updated ticket detail
 */
export async function assignTicket(ticketId, userId) {
  return grievanceRequest(`/tickets/${ticketId}/assign/`, {
    method: 'POST',
    body: JSON.stringify({ assigned_to_user_id: userId }),
  });
}

// ─── Response Thread ───────────────────────────────────────

/**
 * List responses/thread for a ticket.
 * @param {string} ticketId - UUID of the ticket
 * @returns {Promise<Array>} Array of response objects
 */
export async function listTicketResponses(ticketId) {
  return grievanceRequest(`/tickets/${ticketId}/responses/`, { method: 'GET' });
}

/**
 * Add a response to a ticket thread.
 * @param {string} ticketId - UUID of the ticket
 * @param {FormData|Object} responseData - Response fields (message, attachment, is_internal_note)
 * @returns {Promise<Object>} Created response
 */
export async function createTicketResponse(ticketId, responseData) {
  const isMultipart = responseData instanceof FormData;
  return grievanceRequest(`/tickets/${ticketId}/responses/`, {
    method: 'POST',
    body: isMultipart ? responseData : JSON.stringify(responseData),
  }, isMultipart);
}

/**
 * Update a response (toggle is_internal_note).
 * @param {string} responseId - UUID of the response
 * @param {Object} updateData - { is_internal_note: boolean }
 * @returns {Promise<Object>} Updated response
 */
export async function updateTicketResponse(responseId, updateData) {
  return grievanceRequest(`/responses/${responseId}/`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  });
}

// ─── Attachments ──────────────────────────────────────────

/**
 * Resolves an attachment URL to a full backend endpoint URL, handling relative or absolute paths.
 * Never resolves against frontend port 5173.
 * @param {string} attachmentUrl
 * @returns {string}
 */
export function resolveAttachmentUrl(attachmentUrl) {
  if (!attachmentUrl) return '';
  if (attachmentUrl.startsWith('http://') || attachmentUrl.startsWith('https://')) {
    return attachmentUrl;
  }
  const backendOrigin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  const cleanPath = attachmentUrl.startsWith('/') ? attachmentUrl : `/${attachmentUrl}`;
  return `${backendOrigin}${cleanPath}`;
}

/**
 * Fetch a protected grievance attachment blob and open inline in new tab or trigger download.
 * @param {string} attachmentUrl - The attachment endpoint or media path
 * @param {string} [filename] - The desired filename
 * @param {boolean} [download=false] - Whether to trigger download instead of opening inline
 * @returns {Promise<{ blobUrl: string, filename: string }>}
 */
export async function fetchGrievanceAttachment(attachmentUrl, filename = 'document.pdf', download = false) {
  const fullUrl = resolveAttachmentUrl(attachmentUrl);
  const token = localStorage.getItem('accessToken');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(fullUrl, { headers });
  } catch (err) {
    const error = new Error('Unable to connect to server. Please check your network.');
    error.status = 0;
    throw error;
  }

  if (!response.ok) {
    let detail = 'Attachment could not be loaded.';
    try {
      const data = await response.json();
      detail = data.detail || detail;
    } catch (e) {
      // ignore non-json error responses
    }
    const error = new Error(detail);
    error.status = response.status;
    throw error;
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);

  let resolvedFilename = filename;
  const disposition = response.headers.get('Content-Disposition');
  if (disposition && disposition.includes('filename=')) {
    const match = /filename="?([^"]+)"?/.exec(disposition);
    if (match && match[1]) {
      resolvedFilename = match[1];
    }
  }

  if (download) {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', resolvedFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    window.open(blobUrl, '_blank');
  }

  return { blobUrl, filename: resolvedFilename };
}

