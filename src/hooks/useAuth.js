// src/hooks/useAuth.js
"use client";

import { useState, useEffect, useContext, createContext } from "react";
import { AuthManager } from "@/lib/auth";
import { authAPI } from "@/lib/api";
import toast from "react-hot-toast";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      const token = AuthManager.getToken();
      const userData = AuthManager.getUser();

      console.log(
        "Initializing auth - Token exists:",
        !!token,
        "User data:",
        userData
      );

      if (token && userData && AuthManager.isAuthenticated()) {
        setUser(userData);
        setIsAuthenticated(true);

        // Optionally refresh user data from server
        try {
          const response = await authAPI.profile();
          const freshUserData = response.data.user;
          setUser(freshUserData);
          AuthManager.setUser(freshUserData);
          console.log("Auth initialized with fresh user data:", freshUserData);
        } catch (error) {
          console.warn("Failed to refresh user profile:", error);
          if (error.response?.status === 401) {
            AuthManager.logout();
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } else {
        AuthManager.logout();
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      AuthManager.logout();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials, role = null) => {
    try {
      setLoading(true);

      console.log("Attempting login with role:", role, "credentials:", {
        email: credentials.email,
        passwordLength: credentials.password?.length,
      });

      // Role is required since backend only has role-specific endpoints
      if (!role) {
        throw new Error("Role must be specified for login");
      }

      let response;

      try {
        // Use role-specific login endpoints
        if (role === "ADMIN") {
          response = await authAPI.loginAdmin(credentials);
        } else if (role === "TEACHER") {
          response = await authAPI.loginTeacher(credentials);
        } else if (role === "STUDENT") {
          response = await authAPI.loginStudent(credentials);
        } else {
          throw new Error(`Invalid role: ${role}`);
        }

        console.log("Login API response:", response.data);
      } catch (apiError) {
        console.error("API Error:", apiError);
        throw apiError; // Don't try fallback since we don't have generic login
      }

      const { user: userData, token } = response.data;

      if (!token || !userData) {
        throw new Error(
          "Invalid response from server - missing token or user data"
        );
      }

      // Validate user role matches expected role
      if (userData.role !== role) {
        throw new Error(
          `Access denied. This login form is for ${role.toLowerCase()}s only.`
        );
      }

      // Store auth data
      AuthManager.setToken(token);
      AuthManager.setUser(userData);

      // Update state
      setUser(userData);
      setIsAuthenticated(true);

      console.log("Login successful - User:", userData);

      toast.success(
        `Login berhasil! Selamat datang, ${userData.name || userData.email}`
      );

      return {
        success: true,
        user: userData,
        redirectTo: getRedirectPath(userData.role),
      };
    } catch (error) {
      console.error("Login error:", error);

      let message = "Login gagal";

      if (error.response) {
        // Server responded with error
        const status = error.response.status;
        const serverMessage = error.response.data?.message;

        switch (status) {
          case 400:
            message = serverMessage || "Data login tidak valid";
            break;
          case 401:
            message = serverMessage || "Email atau password salah";
            break;
          case 403:
            message = serverMessage || "Akses ditolak";
            break;
          case 404:
            message = "Layanan login tidak tersedia. Hubungi administrator.";
            break;
          case 429:
            message = "Terlalu banyak percobaan login. Coba lagi nanti.";
            break;
          case 500:
            message = "Terjadi kesalahan pada server. Coba lagi nanti.";
            break;
          default:
            message = serverMessage || `Server error: ${status}`;
        }
      } else if (error.request) {
        // Network error
        message =
          "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
      } else if (error.message) {
        // Custom error message
        message = error.message;
      }

      toast.error(message);

      return {
        success: false,
        error: message,
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);

      // Call logout API (optional - continue even if it fails)
      try {
        await authAPI.logout();
      } catch (error) {
        console.warn("Logout API error:", error);
      }
    } catch (error) {
      console.warn("Logout process error:", error);
    } finally {
      // Always clear local auth data
      AuthManager.logout();
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);

      toast.success("Logout berhasil!");
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData);
      toast.success("Password berhasil diubah!");
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || "Gagal mengubah password";
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.profile();
      const userData = response.data.user;

      setUser(userData);
      AuthManager.setUser(userData);

      return userData;
    } catch (error) {
      console.error("Failed to refresh user:", error);
      if (error.response?.status === 401) {
        logout();
      }
      throw error;
    }
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  const isAdmin = () => hasRole("ADMIN");
  const isTeacher = () => hasRole("TEACHER");
  const isStudent = () => hasRole("STUDENT");

  const getRedirectPath = (role) => {
    switch (role) {
      case "ADMIN":
        return "/admin";
      case "TEACHER":
        return "/teacher";
      case "STUDENT":
        return "/student";
      default:
        return "/";
    }
  };

  // Helper functions for role-specific login
  const loginAdmin = (credentials) => login(credentials, "ADMIN");
  const loginTeacher = (credentials) => login(credentials, "TEACHER");
  const loginStudent = (credentials) => login(credentials, "STUDENT");

  const contextValue = {
    user,
    loading,
    isAuthenticated,
    login,
    loginAdmin,
    loginTeacher,
    loginStudent,
    logout,
    changePassword,
    refreshUser,
    hasRole,
    hasAnyRole,
    isAdmin,
    isTeacher,
    isStudent,
    getRedirectPath,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

// Additional hooks for specific roles
export function useAdminAuth() {
  const { user, isAdmin, loading, isAuthenticated } = useAuth();

  return {
    user,
    loading,
    isAuthenticated: isAuthenticated && isAdmin(),
    isAdmin: isAdmin(),
  };
}

export function useTeacherAuth() {
  const { user, isTeacher, loading, isAuthenticated } = useAuth();

  return {
    user,
    loading,
    isAuthenticated: isAuthenticated && isTeacher(),
    isTeacher: isTeacher(),
  };
}

export function useStudentAuth() {
  const { user, isStudent, loading, isAuthenticated } = useAuth();

  return {
    user,
    loading,
    isAuthenticated: isAuthenticated && isStudent(),
    isStudent: isStudent(),
  };
}
