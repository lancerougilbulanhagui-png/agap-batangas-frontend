import { supabase } from '../supabaseClient';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const request = async (path, options = {}) => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session?.access_token) throw new Error('Sign in to AGAP before using this feature.');

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
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

export const fetchReports = ({ status } = {}) => {
  const query = new URLSearchParams();
  if (status) query.set('status', status);
  const suffix = query.toString();
  return request(`/reports${suffix ? `?${suffix}` : ''}`);
};

export const requestGuestOtp = (phone) => request('/auth/send-otp', {
  method: 'POST',
  body: JSON.stringify({ phone }),
});