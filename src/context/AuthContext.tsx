import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_URL } from "../constants/Api_url";

// ===============================
// Types
// ===============================
export interface IUser {
  id: string;
  username: string;
  email: string;
  profileUrl?: string;
  role:string;
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

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterForm) => Promise<void>;
  getMe: () => Promise<void>;

  updateProfile: (data: Record<string, any>) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;

  requestCode: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  verifyOtp: (email: string, otpCode: string, context?: string) => Promise<void>;
  resendOtp: (email: string, context?: string) => Promise<void>;

  getProfiles: () => Promise<IUser[]>;
  deleteProfile: () => Promise<void>;
}

// ===============================
// Context
// ===============================
const AuthContext = createContext<IAuthContext | undefined>(undefined);

// ===============================
// Provider
// ===============================
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===============================
  // Axios instance
  // ===============================
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: API_URL,
      withCredentials: true, // send refresh token cookie
    });

    // Attach access token
    instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (token) {
          config.headers = config.headers ?? {};
          // cast headers to any to satisfy TS
          (config.headers as any).Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (err) => Promise.reject(err)
    );

    // Response interceptor to handle 401 + refresh token
    instance.interceptors.response.use(
      (res) => res,
      async (err: AxiosError) => {
        const originalRequest = err.config as InternalAxiosRequestConfig & { _retry?: boolean };
        if (err.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refreshRes = await axios.post(
              `${API_URL}/auth/refresh-token`,
              {},
              { withCredentials: true }
            );
            const newAccessToken = refreshRes.data.accessToken;
            setToken(newAccessToken);

            originalRequest.headers = originalRequest.headers ?? {};
            (originalRequest.headers as any).Authorization = `Bearer ${newAccessToken}`;

            return instance(originalRequest);
          } catch {
            await logout();
          }
        }
        return Promise.reject(err);
      }
    );

    return instance;
  }, [token]);

  // ===============================
  // Persist access token
  // ===============================
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
      setUser(null);
    }
  }, [token]);

  // ===============================
  // Fetch current user
  // ===============================
  useEffect(() => {
    if (token && !user) {
      getMe();
    }
  }, [token]);

  // ===============================
  // Helpers
  // ===============================
  const handleError = (err: unknown, fallback: string) => {
    if (axios.isAxiosError(err)) {
      setError(err.response?.data?.message || fallback);
    } else {
      setError(fallback);
    }
  };

  // ===============================
  // Auth functions
  // ===============================
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post("/auth/login", { email, password });
      setUser(res.data.user);
      setToken(res.data.accessToken);
    } catch (err) {
      handleError(err, "Login failed");
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };


const logout = async () => {
  try {
    // Call backend to clear refresh token cookie
    await api.post(`${API_URL}/auth/logout`);
  } catch (err) {
    console.warn("Logout request failed:", err);
  } finally {
    // Clear local state
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");

  }
};
  const register = async (data: RegisterForm) => {
    try {
      setLoading(true);
      setError(null);
      await api.post("/auth/register", data);
    } catch (err) {
      handleError(err, "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const getMe = async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/me");
      setUser(res.data.user);
    } catch {
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // Profile & Password
  // ===============================
  const updateProfile = async (data: Record<string, any>) => {
    try {
      setLoading(true);
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => formData.append(key, value as any));
      const res = await api.put("/auth/update-profile", formData);
      setUser(res.data.user);
    } catch (err) {
      handleError(err, "Update profile failed");
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setLoading(true);
      await api.put("/auth/update-password", { currentPassword, newPassword });
    } catch (err) {
      handleError(err, "Update password failed");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // OTP functions
  // ===============================
  const requestCode = async (email: string) => {
    try {
      await api.post("/auth/request-code", { email });
    } catch (err) {
      handleError(err, "Request code failed");
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    try {
      await api.post("/auth/reset-password", { email, code, newPassword });
    } catch (err) {
      handleError(err, "Reset password failed");
    }
  };

  const verifyOtp = async (email: string, otpCode: string, context = "verification") => {
    try {
      await api.post("/auth/verify-otp", { email, otpCode, context });
    } catch (err) {
      handleError(err, "OTP verification failed");
    }
  };

  const resendOtp = async (email: string, context = "verification") => {
    try {
      await api.post("/auth/resend-otp", { email, context });
    } catch (err) {
      handleError(err, "Resend OTP failed");
    }
  };

  // ===============================
  // Admin / Profiles
  // ===============================
  const getProfiles = async (): Promise<IUser[]> => {
    try {
      const res = await api.get("/auth/profiles");
      return res.data.users;
    } catch (err) {
      handleError(err, "Get profiles failed");
      return [];
    }
  };

  const deleteProfile = async () => {
    try {
      await api.delete("/auth/delete");
    } catch (err) {
      handleError(err, "Delete profile failed");
    }
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

// ===============================
// Hook
// ===============================
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
