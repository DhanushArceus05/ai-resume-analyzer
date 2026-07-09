import axios from "axios";
import { getToken, clearToken } from "@/utils/tokenStorage";

/**
 * Base URL for the backend API. Configured via Vite env variables so
 * it can differ between local development, staging, and production.
 */
const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the stored JWT (if any) to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 means the token is missing, invalid, or expired — clear it so
// the app doesn't keep sending a dead token on subsequent requests.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearToken();
    }
    return Promise.reject(error);
  }
);
