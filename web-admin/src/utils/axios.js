import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:3001/api", 
  timeout: 8000,
});

// ✅ Attach Token (if needed later)
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default instance;
