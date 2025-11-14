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

export default apiClient;
