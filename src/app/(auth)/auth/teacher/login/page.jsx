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
  // It's good practice to also have a serverError state here for consistency with the admin page
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
      // console.log("Attempting teacher login with:", { // Optional: for debugging
      //   email: formData.email,
      //   passwordLength: formData.password.length,
      // });

      const result = await login(formData, "TEACHER");

      // console.log("Login result:", result); // Optional: for debugging

      if (result.success) {
        // console.log("Login successful, redirecting to:", result.redirectTo); // Optional: for debugging
        router.push(result.redirectTo || "/teacher");
      } else {
        // Handle login failure
        setServerError(
          result.error || "Login gagal. Periksa email dan password Anda."
        );
      }
    } catch (error) {
      console.error("Login error:", error);

      // Handle different types of errors (similar to admin login for consistency)
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Login Guru</h1>
          <p className="text-gray-600">
            Akses portal guru untuk mengelola pembelajaran
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Server Error Display */}
          {serverError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
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
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Guru
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                    errors.email
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 bg-white"
                  }`}
                  placeholder="guru@sekolah.com"
                  disabled={loading || isSubmitting}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <div className="mt-2 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                  {errors.email}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                    errors.password
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300 bg-white"
                  }`}
                  placeholder="Masukkan password"
                  disabled={loading || isSubmitting}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
                  disabled={loading || isSubmitting}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <div className="mt-2 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                  {errors.password}
                </div>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  // Note: This checkbox state is not currently managed.
                  // You might want to add state for this if "Remember Me" functionality is needed.
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">Ingat saya</span>
              </label>
              <Link
                href="/auth/forgot-password" // Assuming this path is correct
                className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors hover:underline"
              >
                Lupa password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isSubmitting}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              {loading || isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Sedang masuk...
                </>
              ) : (
                <>
                  <BookOpen className="w-5 h-5 mr-2" />
                  Masuk sebagai Guru
                </>
              )}
            </button>
          </form>

          {/* Quick Access Info */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="text-sm font-medium text-green-800 mb-2">
              Akses Cepat Portal Guru:
            </h3>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• Kelola jadwal dan mata pelajaran</li>
              <li>• Input dan pantau kehadiran siswa</li>
              <li>• Catat nilai dan evaluasi</li>
              <li>• Lihat laporan pembelajaran</li>
            </ul>
          </div>

          {/* Divider */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center text-sm text-gray-500">
              Login sebagai peran lain?
            </div>
            <div className="mt-3 flex justify-center space-x-4">
              <Link
                href="/auth/admin/login"
                className="text-green-600 hover:text-green-700 text-sm font-medium transition-colors hover:underline"
              >
                Login Admin
              </Link>
              {/* Student login link removed from here */}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2024 Sistem Manajemen Sekolah</p>
          <p className="mt-1">Butuh bantuan? Hubungi administrator sekolah</p>
        </div>
      </div>
    </div>
  );
}
