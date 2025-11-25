const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '/api';

const defaultHeaders = {
  'Content-Type': 'application/json'
};

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    searchParams.set(key, String(value));
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

async function request(path, { method = 'GET', body, query } = {}) {
  const url = `${API_BASE_URL}${path}${buildQueryString(query)}`;

  const response = await fetch(url, {
    method,
    headers: {
      ...defaultHeaders
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include'
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Request failed';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const papersApi = {
  list: (params) => request('/papers', { query: params }),
  get: (paperId) => {
    if (!paperId) {
      throw new Error('paperId is required');
    }
    return request(`/papers/${encodeURIComponent(paperId)}`);
  }
};

export default papersApi;
