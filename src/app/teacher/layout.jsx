// src/app/teacher/layout.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { GraduationCap, AlertCircle } from "lucide-react";

export default function TeacherLayout({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // Redirect to teacher login if not authenticated
        router.replace("/auth/teacher/login");
        return;
      }

      if (user && user.role !== "TEACHER") {
        // Redirect to appropriate dashboard if user is not teacher
        const redirectPath = user.role === "ADMIN" ? "/admin" : "/";
        router.replace(redirectPath);
        return;
      }
    }
  }, [isAuthenticated, user, loading, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying teacher access...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not authenticated or not teacher
  if (!isAuthenticated || (user && user.role !== "TEACHER")) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the teacher portal. Please login
            with teacher credentials.
          </p>
          <button
            onClick={() => router.push("/auth/teacher/login")}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Go to Teacher Login
          </button>
        </div>
      </div>
    );
  }

  // Render teacher dashboard layout
  return <DashboardLayout userRole="teacher">{children}</DashboardLayout>;
}
