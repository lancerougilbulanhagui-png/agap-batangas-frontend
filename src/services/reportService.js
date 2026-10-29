const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Backend request failed.');
  }

  return data;
};

export const submitHazardReport = (reportData) => request('/reports', {
  method: 'POST',
  body: JSON.stringify(reportData),
});

export const fetchReports = ({ deviceId, status } = {}) => {
  const query = new URLSearchParams();
  if (deviceId) query.set('deviceId', deviceId);
  if (status) query.set('status', status);
  const suffix = query.toString();
  return request(`/reports${suffix ? `?${suffix}` : ''}`);
};

export const requestGuestOtp = (phone) => request('/auth/send-otp', {
  method: 'POST',
  body: JSON.stringify({ phone }),
});