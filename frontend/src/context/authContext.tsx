import { createContext, useContext, useState, useEffect } from "react";
import { setAccessToken, getAccessToken } from "../context/tokenStore";
import api from "@/utils/axiosClient";
import type { UserProfile } from "@/types/user";

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  getProfile: (token?: string) => Promise<UserProfile>;
  refreshProfile: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
      const profile = await getProfile(token);
      setUser(profile);
    }

    return res.data;
  };

  const getProfile = async (token?: string) => {
    const res = await api.get<UserProfile>("/api/profile/me", {
      headers: {
        Authorization: `Bearer ${token || getAccessToken()}`,
      },
    });
    return res.data;
  };

  const refreshProfile = async () => {
    const profile = await getProfile();
    setUser(profile);
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      setAccessTokenState(null);
      setAccessToken(null);
      setUser(null);
      window.location.href = "/login";
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
      value={{ user, accessToken, login, logout, getProfile, refreshProfile, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useUser = () => {
  return useContext(AuthContext)!;
};
