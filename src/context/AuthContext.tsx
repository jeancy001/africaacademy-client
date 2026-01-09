import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { API_URL } from "../constants/Api_url";

/* =============================== */
/* TYPES */
/* =============================== */

export interface IUser {
  _id: string;
  username: string;
  email: string;
  profileUrl?: string;
  role: string;
  isVerified?: boolean;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  country: string;
  city: string;
  gender: string;
  tel: string;
}

interface IAuthContext {
  user: IUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  register: (data: RegisterForm) => Promise<void>;
  getMe: () => Promise<void>;

  updateProfile: (data: Record<string, any>) => Promise<void>;
  updatePassword: (current: string, next: string) => Promise<void>;

  requestCode: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  verifyOtp: (email: string, otp: string, context?: string) => Promise<void>;
  resendOtp: (email: string, context?: string) => Promise<void>;

  getProfiles: () => Promise<IUser[]>;
  deleteProfile: () => Promise<void>;
}

/* =============================== */
/* CONTEXT */
/* =============================== */

const AuthContext = createContext<IAuthContext | undefined>(undefined);

/* =============================== */
/* AXIOS SINGLETON */
/* =============================== */

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

/* =============================== */
/* PROVIDER */
/* =============================== */

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshInProgress = useRef(false);
  const channel = useRef<BroadcastChannel | null>(null);

  /* =============================== */
  /* BROADCAST CHANNEL (REAL TIME) */
  /* =============================== */

  useEffect(() => {
    channel.current = new BroadcastChannel("auth_channel");
    channel.current.onmessage = (event) => {
      if (event.data.type === "TOKEN_UPDATE") {
        setToken(event.data.token);
      }
      if (event.data.type === "LOGOUT") {
        setUser(null);
        setToken(null);
      }
    };
    return () => channel.current?.close();
  }, []);

  /* =============================== */
  /* REQUEST INTERCEPTOR */
  /* =============================== */

  useEffect(() => {
    const reqId = api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      }
    );

    const resId = api.interceptors.response.use(
      (res) => res,
      async (err: AxiosError) => {
        const original = err.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (
          err.response?.status === 401 &&
          !original._retry &&
          !refreshInProgress.current
        ) {
          original._retry = true;
          refreshInProgress.current = true;

          try {
            const refreshRes = await axios.post(
              `${API_URL}/auth/refresh-token`,
              {},
              { withCredentials: true }
            );

            const newToken = refreshRes.data.accessToken;
            setToken(newToken);
            localStorage.setItem("token", newToken);
            channel.current?.postMessage({
              type: "TOKEN_UPDATE",
              token: newToken,
            });

            original.headers.Authorization = `Bearer ${newToken}`;
            return api(original);
          } catch {
            await logout();
          } finally {
            refreshInProgress.current = false;
          }
        }

        return Promise.reject(err);
      }
    );

    return () => {
      api.interceptors.request.eject(reqId);
      api.interceptors.response.eject(resId);
    };
  }, [token]);

  /* =============================== */
  /* TOKEN PERSISTENCE */
  /* =============================== */

  useEffect(() => {
    if (!token) {
      localStorage.removeItem("token");
      setUser(null);
    }
  }, [token]);

  /* =============================== */
  /* GET CURRENT USER */
  /* =============================== */

  const getMe = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.user);
    } catch {
      setUser(null);
      setToken(null);
    }
  };

  useEffect(() => {
    if (token && !user) getMe();
  }, [token]);

  /* =============================== */
  /* AUTH METHODS */
  /* =============================== */

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.post("/auth/login", { email, password });

      setUser(res.data.user);
      setToken(res.data.accessToken);
      localStorage.setItem("token", res.data.accessToken);
      channel.current?.postMessage({
        type: "TOKEN_UPDATE",
        token: res.data.accessToken,
      });

      return res.data;
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    channel.current?.postMessage({ type: "LOGOUT" });
  };

  const register = async (data: RegisterForm) => {
    await api.post("/auth/register", data);
  };

  /* =============================== */
  /* PROFILE / PASSWORD */
  /* =============================== */

  const updateProfile = async (data: Record<string, any>) => {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => form.append(k, v as any));
    const res = await api.put("/auth/update-profile", form);
    setUser(res.data.user);
  };

  const updatePassword = async (current: string, next: string) => {
    await api.put("/auth/update-password", { currentPassword: current, newPassword: next });
  };

  /* =============================== */
  /* OTP */
  /* =============================== */

  const requestCode = async (email: string) => {
    await api.post("/auth/request-code", { email });
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    await api.post("/auth/reset-password", { email, code, newPassword });
  };

  const verifyOtp = async (email: string, otp: string, context = "verification") => {
    await api.post("/auth/verify-otp", { email, otpCode: otp, context });
  };

  const resendOtp = async (email: string, context = "verification") => {
    await api.post("/auth/resend-otp", { email, context });
  };

  /* =============================== */
  /* ADMIN */
  /* =============================== */

  const getProfiles = async () => {
    const res = await api.get("/auth/profiles");
    return res.data.users;
  };

  const deleteProfile = async () => {
    await api.delete("/auth/delete");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        logout,
        register,
        getMe,
        updateProfile,
        updatePassword,
        requestCode,
        resetPassword,
        verifyOtp,
        resendOtp,
        getProfiles,
        deleteProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* =============================== */
/* HOOK */
/* =============================== */

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
