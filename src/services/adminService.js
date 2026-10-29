import { adminSupabase } from '../supabaseClient';

const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'}/admin`;

const request = async (path, options = {}) => {
  const { data: { session }, error: sessionError } = await adminSupabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session?.access_token) throw new Error('Administrator sign-in is required.');

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Administrator request failed.');
  return data;
};

export const fetchAdminReports = async () => {
  return request('/reports');
};

export const verifyAdminAccess = async () => {
  return request('/session');
};

export const updateReportStatusInDb = async (reportId, status, noticeText) => {
  return request(`/reports/${encodeURIComponent(reportId)}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, noticeText })
  });
};

export const deleteRejectedReportsInDb = async () => {
  return request('/reports/rejected', { method: 'DELETE' });
};

export const banDeviceInDb = async (deviceId) => {
  return request(`/devices/${encodeURIComponent(deviceId)}/ban`, {
    method: 'POST'
  });
};