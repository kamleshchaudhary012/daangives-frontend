/**
 * Projects API Client — Phase 7.2 Village Project Posting
 * ========================================================
 * Client service module for Village/Sanstha project lifecycle operations.
 *
 * Endpoints (backend base: /api/v1/projects/):
 *   POST   /                          → create draft project
 *   GET    /me/                       → list own projects (paginated & filterable)
 *   GET    /:id/                      → project detail (with documents & milestones)
 *   PATCH  /:id/                      → update project (DRAFT or DOCS_PENDING)
 *   POST   /:id/submit/               → submit project for verification (requires >= 1 doc)
 *   POST   /:id/withdraw/             → withdraw submitted project back to draft
 *   POST   /:id/documents/            → upload statutory/support document (multipart)
 *   DELETE /:id/documents/:doc_id/    → delete attached document
 *   POST   /:id/milestones/           → add milestone
 *   DELETE /:id/milestones/:mid/      → delete milestone
 *   GET    /public/                   → list verified projects (Phase 7.3 marketplace)
 *   GET    /public/:id/               → detail of verified project
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

async function projectRequest(endpoint, options = {}, isMultipart = false) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/projects${endpoint}`, {
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

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
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
        errorMsg = `${firstKey}: ${data[firstKey].join(' ')}`;
      } else if (firstKey && typeof data[firstKey] === 'string') {
        errorMsg = `${firstKey}: ${data[firstKey]}`;
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

// ─── Project Operations ──────────────────────────────────────────────────

/**
 * Create a new draft project.
 * @param {Object} projectData
 * @returns {Promise<Object>} Created project
 */
export async function createProjectDraft(projectData) {
  return projectRequest('/', {
    method: 'POST',
    body: JSON.stringify(projectData),
  });
}

/**
 * List projects posted by the authenticated Village/Sanstha user.
 * @param {Object} params - Query params (status, category, search, page)
 * @returns {Promise<Object>} Paginated project list {count, next, previous, results}
 */
export async function getMyProjects(params = {}) {
  const queryParts = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const data = await projectRequest(`/me/${queryString}`, { method: 'GET' });

  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      results: data,
      stats: {
        total: data.length,
        draft: data.filter((p) => p.status === 'DRAFT').length,
        submitted: data.filter((p) => p.status === 'SUBMITTED').length,
        under_review: data.filter((p) => p.status === 'UNDER_REVIEW').length,
        action_required: data.filter((p) => p.status === 'DOCS_PENDING').length,
        verified: data.filter((p) => p.status === 'VERIFIED').length,
        funded: data.filter((p) => ['FUNDED', 'IN_PROGRESS'].includes(p.status)).length,
        completed: data.filter((p) => ['COMPLETED', 'CLOSED'].includes(p.status)).length,
        rejected: data.filter((p) => p.status === 'REJECTED').length,
      },
    };
  }

  return {
    count: data?.count ?? (data?.results ? data.results.length : 0),
    next: data?.next ?? null,
    previous: data?.previous ?? null,
    results: data?.results ?? [],
    stats: data?.stats ?? {},
  };
}

/**
 * Get full project detail with documents and milestones.
 * @param {string} projectId - UUID of the project
 * @returns {Promise<Object>} Project details
 */
export async function getProjectDetail(projectId) {
  return projectRequest(`/${projectId}/`, { method: 'GET' });
}

/**
 * Update project details (allowed only in DRAFT or DOCS_PENDING status).
 * @param {string} projectId
 * @param {Object} updateData
 * @returns {Promise<Object>} Updated project
 */
export async function updateProject(projectId, updateData) {
  return projectRequest(`/${projectId}/`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  });
}

/**
 * Submit project for Admin verification.
 * Requires at least 1 document uploaded.
 * @param {string} projectId
 * @returns {Promise<Object>} Updated project with status SUBMITTED
 */
export async function submitProjectForVerification(projectId) {
  const data = await projectRequest(`/${projectId}/submit/`, {
    method: 'POST',
  });
  return data?.project || data;
}

/**
 * Withdraw submitted project back to DRAFT for further editing.
 * @param {string} projectId
 * @returns {Promise<Object>} Updated project with status DRAFT
 */
export async function withdrawProjectSubmission(projectId) {
  const data = await projectRequest(`/${projectId}/withdraw/`, {
    method: 'POST',
  });
  return data?.project || data;
}

// ─── Document Operations ─────────────────────────────────────────────────

/**
 * Upload a statutory or supporting document.
 * @param {string} projectId
 * @param {FormData} formData - Contains 'file', 'document_type', optional 'notes'
 * @returns {Promise<Object>} Created ProjectDocument
 */
export async function uploadProjectDocument(projectId, formData) {
  return projectRequest(`/${projectId}/documents/`, {
    method: 'POST',
    body: formData,
  }, true);
}

/**
 * Delete an uploaded project document.
 * @param {string} projectId
 * @param {string} docId
 * @returns {Promise<null>}
 */
export async function deleteProjectDocument(projectId, docId) {
  return projectRequest(`/${projectId}/documents/${docId}/`, {
    method: 'DELETE',
  });
}

// ─── Milestone Operations ────────────────────────────────────────────────

/**
 * Add a milestone to a project.
 * @param {string} projectId
 * @param {Object} milestoneData - {title, description, target_date, order, amount}
 * @returns {Promise<Object>} Created ProjectMilestone
 */
export async function addProjectMilestone(projectId, milestoneData) {
  return projectRequest(`/${projectId}/milestones/`, {
    method: 'POST',
    body: JSON.stringify(milestoneData),
  });
}

/**
 * Delete a milestone.
 * @param {string} projectId
 * @param {string} milestoneId
 * @returns {Promise<null>}
 */
export async function deleteProjectMilestone(projectId, milestoneId) {
  return projectRequest(`/${projectId}/milestones/${milestoneId}/`, {
    method: 'DELETE',
  });
}

// ─── Photo Evidence Operations (Phase 7.2 Milestone Evidence) ──────────────

/**
 * Upload a milestone execution or field progress photo.
 * @param {string} projectId
 * @param {FormData} formData - Contains 'file', optional 'caption'
 * @returns {Promise<Object>} Created ProjectPhoto
 */
export async function uploadProjectPhoto(projectId, formData) {
  return projectRequest(`/${projectId}/photos/`, {
    method: 'POST',
    body: formData,
  }, true);
}

/**
 * Delete an uploaded project evidence photo.
 * @param {string} projectId
 * @param {string} photoId
 * @returns {Promise<null>}
 */
export async function deleteProjectPhoto(projectId, photoId) {
  return projectRequest(`/${projectId}/photos/${photoId}/`, {
    method: 'DELETE',
  });
}

// ─── Public Endpoints (Marketplace read) ──────────────────────────────────

/**
 * List public VERIFIED projects.
 * @param {Object} params
 * @returns {Promise<Object>}
 */
export async function getPublicProjects(params = {}) {
  const queryParts = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  return projectRequest(`/public/${queryString}`, { method: 'GET' });
}

/**
 * Get public detail of a verified project.
 * @param {string} projectId
 * @returns {Promise<Object>}
 */
export async function getPublicProjectDetail(projectId) {
  return projectRequest(`/public/${projectId}/`, { method: 'GET' });
}

// ─── Admin Verification Endpoints ────────────────────────────────────────

/**
 * List projects across all NGOs for administrative review.
 * @param {Object} params - { status, category, search, ordering, page, page_size }
 * @returns {Promise<Object>} Paginated projects list with stats { count, results, stats, next, previous }
 */
export async function getAdminProjects(params = {}) {
  const queryParts = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  return projectRequest(`/admin/${queryString}`, { method: 'GET' });
}

/**
 * Get full administrative project details including documents, milestones, and audit history.
 * @param {string} projectId
 * @returns {Promise<Object>}
 */
export async function getAdminProjectDetail(projectId) {
  return projectRequest(`/admin/${projectId}/`, { method: 'GET' });
}

/**
 * Get verification history audit log for a project.
 * @param {string} projectId
 * @returns {Promise<Array>}
 */
export async function getAdminProjectHistory(projectId) {
  return projectRequest(`/admin/${projectId}/history/`, { method: 'GET' });
}

/**
 * Admin action to verify, reject, request changes, or add a project to the review queue.
 * @param {string} projectId
 * @param {Object} verificationData - { action, notes, rejection_reason }
 * @returns {Promise<Object>}
 */
export async function adminVerifyProject(projectId, verificationData) {
  return projectRequest(`/${projectId}/verify/`, {
    method: 'POST',
    body: JSON.stringify(verificationData),
  });
}


