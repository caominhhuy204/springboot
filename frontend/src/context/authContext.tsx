import { createContext, useContext, useState, useEffect } from "react";
import { setAccessToken, getAccessToken } from "../context/tokenStore";
import api from "@/utils/axiosClient";
import type { UserProfile, UserProfileApiResponse, UserRole } from "@/types/user";

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  getProfile: (token?: string) => Promise<UserProfile>;
  isLoading: boolean;
  handleOAuth2Login: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const normalizeUser = (payload: UserProfileApiResponse): UserProfile => {
    const roleValue = typeof payload.role === "string" ? payload.role : payload.role?.name;
    const role = (roleValue || "STUDENT") as UserRole;

    return {
      ...payload,
      role,
    };
  };

  const login = async (email: string, password: string) => {
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
      try {
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
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, accessToken, login, logout, getProfile, isLoading, handleOAuth2Login }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useUser = () => {
  return useContext(AuthContext)!;
};
