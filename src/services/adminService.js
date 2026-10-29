const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api'}/admin`;

export const fetchAdminReports = async () => {
  const response = await fetch(`${API_BASE_URL}/reports`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to fetch admin reports.');
  return data;
};

export const updateReportStatusInDb = async (reportId, status, noticeText) => {
  const response = await fetch(`${API_BASE_URL}/reports/${encodeURIComponent(reportId)}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, noticeText })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to update report status.');
  return data;
};

export const deleteRejectedReportsInDb = async () => {
  const response = await fetch(`${API_BASE_URL}/reports/rejected`, { method: 'DELETE' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to delete rejected reports.');
  return data;
};

export const banDeviceInDb = async (deviceId) => {
  const response = await fetch(`${API_BASE_URL}/devices/${encodeURIComponent(deviceId)}/ban`, {
    method: 'POST'
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to ban device.');
  return data;
};