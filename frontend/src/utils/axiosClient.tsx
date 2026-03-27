import axios from "axios";
import { getAccessToken, setAccessToken} from "../context/tokenStore"

const api = axios.create({
  baseURL:  `http://localhost:8080`,
  withCredentials: true,
});


api.interceptors.request.use((config) => {
  const token = getAccessToken();
  console.log("dhasdhjsadjkas", token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/api/auth/refresh-token")
    ) {
      originalRequest._retry = true;

      try {
        const res = await api.post("/api/auth/refresh-token", {}, { withCredentials: true });

        const newAccessToken = res.data.token;
        console.log("new access token", newAccessToken);

        setAccessToken(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        setAccessToken(null);
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;