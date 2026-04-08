import { createContext, useContext, useState, useEffect } from "react";
import { setAccessToken, getAccessToken } from "../context/tokenStore";
import api from "@/utils/axiosClient";
import type { UserProfile, UserProfileApiResponse, UserRole } from "@/types/user";
import { pingBackendHealth, wakeBackend } from "@/utils/wakeBackend";

const publicAuthPaths = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/verify-otp",
  "/reset-password",
]);
const KEEP_ALIVE_INTERVAL_MS = 8 * 60 * 1000;

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  getProfile: (token?: string) => Promise<UserProfile>;
  isLoading: boolean;
  isBackendWaking: boolean;
  loadingMessage: string;
  handleOAuth2Login: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBackendWaking, setIsBackendWaking] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("Dang tai phien dang nhap...");

  const normalizeUser = (payload: UserProfileApiResponse): UserProfile => {
    const roleValue = typeof payload.role === "string" ? payload.role : payload.role?.name;
    const role = (roleValue || "STUDENT") as UserRole;

    return {
      ...payload,
      role,
    };
  };

  const login = async (email: string, password: string) => {
    setIsBackendWaking(true);
    setLoadingMessage("Dang ket noi backend Render...");

    try {
      await wakeBackend(45000);
    } finally {
      setIsBackendWaking(false);
      setLoadingMessage("Dang tai phien dang nhap...");
    }

    const res = await api.post("/api/auth/login", { email, password });

    const token = res.data.token;

    console.log(token);
    if (!token) {
      throw new Error("Login failed");
    }

    setAccessTokenState(token);
    setAccessToken(token);

    if (token) {
      const profile = await getProfile();
      setUser(profile);
    }

    return res.data;
  };

  const getProfile = async (token?: string) => {
    const res = await api.get<UserProfileApiResponse>("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token || getAccessToken()}`,
      },
    });
    return normalizeUser(res.data);
  };

  const logout = async () => {
    await api.post("/api/auth/logout");
    setAccessTokenState(null);
    setAccessToken(null);
    setUser(null);
    window.location.href = "/login";
  };

  const handleOAuth2Login = async (token: string) => {
    setAccessTokenState(token);
    setAccessToken(token);

    if (token) {
      const profile = await getProfile(token);
      setUser(profile);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoadingMessage("Dang kiem tra phien dang nhap...");

      if (publicAuthPaths.has(window.location.pathname)) {
        setIsBackendWaking(true);
        setLoadingMessage("Dang danh thuc backend tren Render...");
        wakeBackend(45000)
          .catch(() => null)
          .finally(() => {
            setIsBackendWaking(false);
            setLoadingMessage("Dang tai phien dang nhap...");
          });
        setIsLoading(false);
        return;
      }

      try {
        setIsBackendWaking(true);
        setLoadingMessage("Backend Render dang khoi dong, vui long doi...");
        await wakeBackend();

        const res = await api.post("/api/auth/refresh-token");

        const newToken = res.data.token;

        if (newToken) {
          setAccessToken(newToken);
          setAccessTokenState(newToken);

          const profile = await getProfile(newToken);
          setUser(profile);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setIsBackendWaking(false);
        setLoadingMessage("Dang tai phien dang nhap...");
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  useEffect(() => {
    const pingFrontend = async () => {
      await fetch(window.location.origin, {
        method: "HEAD",
        cache: "no-store",
        credentials: "omit",
      });
    };

    const keepServicesAlive = async () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) {
        return;
      }

      try {
        await pingFrontend();
      } catch {
        // Ignore keep-alive failures. Real navigation will still retry.
      }

      try {
        await pingBackendHealth();
      } catch {
        // Ignore background probe failures to avoid interrupting the session.
      }
    };

    let intervalId: number | null = null;

    const startKeepAlive = () => {
      if (intervalId !== null) {
        return;
      }

      intervalId = window.setInterval(() => {
        void keepServicesAlive();
      }, KEEP_ALIVE_INTERVAL_MS);
    };

    const stopKeepAlive = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    const syncKeepAlive = () => {
      if (document.visibilityState === "visible") {
        void keepServicesAlive();
        startKeepAlive();
        return;
      }

      stopKeepAlive();
    };

    syncKeepAlive();
    document.addEventListener("visibilitychange", syncKeepAlive);
    window.addEventListener("focus", syncKeepAlive);
    window.addEventListener("online", syncKeepAlive);

    return () => {
      stopKeepAlive();
      document.removeEventListener("visibilitychange", syncKeepAlive);
      window.removeEventListener("focus", syncKeepAlive);
      window.removeEventListener("online", syncKeepAlive);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        login,
        logout,
        getProfile,
        isLoading,
        isBackendWaking,
        loadingMessage,
        handleOAuth2Login,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useUser = () => {
  return useContext(AuthContext)!;
};
