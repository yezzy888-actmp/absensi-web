// src/app/(auth)/auth/teacher/login/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  GraduationCap,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

export default function TeacherLoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const { login, loading, isAuthenticated, user } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = user.role === "TEACHER" ? "/teacher" : "/";
      router.replace(redirectPath);
    }
  }, [isAuthenticated, user, router]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email harus diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }

    if (!formData.password) {
      newErrors.password = "Password harus diisi";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password minimal 6 karakter";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});
    setServerError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(formData, "TEACHER");

      if (result.success) {
        router.push(result.redirectTo || "/teacher");
      } else {
        setServerError(
          result.error || "Login gagal. Periksa email dan password Anda."
        );
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error.response) {
        const message = error.response.data?.message || "Login gagal";
        setServerError(message);
        if (error.response.data?.errors) {
          setErrors(error.response.data.errors);
        }
      } else if (error.request) {
        setServerError(
          "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."
        );
      } else {
        setServerError(
          "Terjadi kesalahan yang tidak terduga. Silakan coba lagi."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    // Clear server error when user makes changes
    if (serverError) {
      setServerError("");
    }
  };

  return (
    <div className="gradient-bg-reverse min-h-screen flex items-center justify-center p-4 page-transition">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-4 shadow-blue pulse-ring">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gradient-reverse mb-2">
            Login Guru
          </h1>
          <p className="text-muted-foreground">
            Akses portal guru untuk mengelola pembelajaran
          </p>
        </div>

        {/* Login Form */}
        <div className="card p-8">
          {/* Server Error Display */}
          {serverError && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg animate-fade-in">
              <div className="flex items-center text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{serverError}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-foreground mb-2"
              >
                Email Guru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <Mail className="h-5 w-5 text-blue-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input-field pl-10 relative ${
                    errors.email
                      ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  placeholder="guru@sekolah.com"
                  disabled={loading || isSubmitting}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <div className="mt-2 flex items-center text-sm text-red-600 animate-fade-in">
                  <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                  {errors.email}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-foreground mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <Lock className="h-5 w-5 text-blue-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className={`input-field pl-10 pr-12 relative ${
                    errors.password
                      ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  placeholder="Masukkan password"
                  disabled={loading || isSubmitting}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-blue-50 rounded-r-lg transition-colors z-10"
                  disabled={loading || isSubmitting}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-blue-500 hover:text-blue-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-blue-500 hover:text-blue-600 transition-colors" />
                  )}
                </button>
              </div>
              {errors.password && (
                <div className="mt-2 flex items-center text-sm text-red-600 animate-fade-in">
                  <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                  {errors.password}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="btn-primary w-full py-3 flex items-center justify-center"
            >
              {loading || isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  <span>Sedang masuk...</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-5 h-5 mr-2" />
                  <span>Masuk sebagai Guru</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 pt-6 border-t-2 border-border">
            <div className="text-center text-sm text-muted-foreground font-medium">
              Login sebagai peran lain?
            </div>
            <div className="mt-4 flex justify-center">
              <Link
                href="/auth/admin/login"
                className="btn-secondary text-sm px-6 py-2 inline-flex items-center justify-center"
              >
                Login Admin
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p className="font-medium">© 2024 Sistem Manajemen Sekolah</p>
          <p className="mt-2">Butuh bantuan? Hubungi administrator sekolah</p>
        </div>
      </div>
    </div>
  );
}
