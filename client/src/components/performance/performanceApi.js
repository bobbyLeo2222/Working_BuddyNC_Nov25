const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '/api';

const defaultHeaders = {
  'Content-Type': 'application/json',
};

const parseResponse = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
};

async function request(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    const message = data?.message || 'Request failed.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const performanceApi = {
  recordSession: ({ token, payload }) => {
    if (!token) {
      return Promise.reject(new Error('Missing authentication token.'));
    }
    return request('/performance', { method: 'POST', body: payload, token });
  },
  fetchSummary: ({ token }) => {
    if (!token) {
      return Promise.reject(new Error('Missing authentication token.'));
    }
    return request('/performance/summary', { token });
  },
};

export default performanceApi;
