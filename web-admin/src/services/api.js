import axios from 'axios';

// Web-specific configuration
const PORT = 3000;
const HOST = 'localhost'; // or your server IP
export const API_BASE_URL = `http://${HOST}:${PORT}`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

api.interceptors.request.use(cfg => {
  console.log('[api] ->', cfg.method?.toUpperCase(), cfg.baseURL + cfg.url);
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    console.log('[api] <- error', err.response?.status, err.config?.url, err.response?.data);
    throw err;
  }
);

// Mock data for web version
const MOCK_ACCOUNTS = {
  "admin@smartplant.dev": { password: "admin123", role: "admin" },
  "ranger@smartplant.dev": { password: "user1234", role: "user" },
};

// Login function for web
export const loginUser = async (email, password) => {
  const key = email.trim().toLowerCase();
  console.log("Logging in:", key);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const account = MOCK_ACCOUNTS[key];
      if (account && account.password === password) {
        resolve({ success: true, role: account.role, email: key });
      } else {
        reject(new Error("Invalid email or password"));
      }
    }, 700);
  });
};

// Chat function for web
export const postChatMessage = async (query) => {
  // TODO: Replace this mock with real backend connection
  // Mock response for testing until backend is ready
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        reply: `I received your message: "${query}". This is a mock response until the AI backend is connected.`
      });
    }, 1000);
  });

  // Real implementation (commented out until backend is ready):
  /*
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to get chat response');
    }
    
    return response.json();
  } catch (error) {
    console.error("Error in postChatMessage:", error);
    throw error;
  }
  */
};

// Add other functions you need for web...
export const fetchSensorData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/iot/latest`);
    if (!response.ok) throw new Error("Failed to fetch sensor data");
    return await response.json();
  } catch (error) {
    console.error("Error fetching sensor data:", error);
    throw error;
  }
};

