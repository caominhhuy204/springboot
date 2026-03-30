import axios from "axios";
import { getAccessToken, setAccessToken } from "../context/tokenStore";

const api = axios.create({
  baseURL: `http://localhost:8080`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const currentToken = getAccessToken();

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/api/auth/refresh-token")
    ) {
      originalRequest._retry = true;

      try {
        const res = await api.post(
          "/api/auth/refresh-token",
          {},
          currentToken
            ? {
                headers: {
                  Authorization: `Bearer ${currentToken}`,
                },
              }
            : undefined,
        );

        const newAccessToken = res.data.token;

        if (!newAccessToken) {
          throw new Error("Missing refreshed token");
        }

        setAccessToken(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch {
        setAccessToken(null);
      }
    }

    return Promise.reject(error);
  }
);

export default api;