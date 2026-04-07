import axios from "axios";
import { getAccessToken, setAccessToken } from "../context/tokenStore";
import { apiBaseUrl } from "../config/runtime";

const publicAuthPaths = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/verify",
  "/api/auth/reset-password",
  "/api/auth/refresh-token",
];

const isPublicAuthRequest = (url?: string) =>
  !!url && publicAuthPaths.some((path) => url.includes(path));

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !isPublicAuthRequest(config.url)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      originalRequest &&
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isPublicAuthRequest(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        const res = await api.post("/api/auth/refresh-token", {}, { withCredentials: true });
        const newAccessToken = res.data.token;

        setAccessToken(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
