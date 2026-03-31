import { createContext, useContext, useState, useEffect } from "react";
import { setAccessToken, getAccessToken } from "../context/tokenStore";
import api from "@/utils/axiosClient";

interface AuthContextType {
  user: any;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  getProfile: () => Promise<any>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
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
      const profile = await getProfile();
      console.log(profile);
      setUser(profile);
    }

    return res.data;
  };

  const getProfile = async (token?: string) => {
    const res = await api.get("/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token || getAccessToken()}`,
      },
    });
    return res.data;
  };

  const logout = async () => {
    await api.post("/api/auth/logout");
    setAccessTokenState(null);
    setAccessToken(null);
    setUser(null);
    window.location.href = "/login";
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
      value={{ user, accessToken, login, logout, getProfile, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useUser = () => {
  return useContext(AuthContext)!;
};
