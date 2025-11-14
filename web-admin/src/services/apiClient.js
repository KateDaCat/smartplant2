import axios from "axios";

const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) ||
  "http://localhost:3001"; 

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const fetchUsers = async () => {
  const { data } = await apiClient.get("/users");
  return data;
};

export const fetchRoles = async () => {
  const { data } = await apiClient.get("/roles");
  return data;
};

export const updateUser = async (userId, payload) => {
  const { data } = await apiClient.put(`/users/${userId}`, payload);
  return data;
};

// --- ⬇️ NEW FUNCTIONS FOR IOT PAGE ⬇️ ---

/**
 * Fetches the full list of all devices for the admin dashboard.
 * API Endpoint: GET /api/devices/all
 */
export const fetchDevices = async () => {
  const { data } = await apiClient.get("/api/devices/all");
  return data;
};

/**
 * Resolves all active alerts for a specific device.
 * API Endpoint: POST /api/alerts/resolve/device/:id
 */
export const resolveDeviceAlerts = async (deviceId) => {
  // We send the raw deviceId (e.g., 14), not "DEV-014"
  const { data } = await apiClient.post(
    `/api/alerts/resolve/device/${deviceId}`
  );
  return data;
};

/**
 * Fetches the time-series history for a single device.
 * API Endpoint: GET /api/devices/:id/history
 */
export const fetchDeviceHistory = async (deviceId, range) => {
  // We use 'params' to send the range as a query string
  // e.g., /api/devices/12/history?range=7D
  const { data } = await apiClient.get(`/api/devices/${deviceId}/history`, {
    params: { range }, // 👈 --- This adds '?range=...' to the URL
  });
  return data;
};

/**
 * Logs in a user.
 * API Endpoint: POST /api/users/login
 */
export const loginUser = async (email, password) => {
  const { data } = await apiClient.post("/api/users/login", {
    email,
    password,
  });
  return data; // Returns { success: true, user: {...} } or { success: false, message: "..." }
};

export default apiClient;