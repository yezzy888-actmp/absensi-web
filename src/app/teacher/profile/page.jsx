// src/app/teacher/profile/page.jsx
"use client";

import { useRouter } from "next/navigation";
import { User, Mail, Calendar, X, Shield, CheckCircle2 } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { authAPI } from "@/lib/api";

export default function TeacherProfile() {
  const router = useRouter();

  // Fetch user profile data
  const {
    data: userProfile,
    loading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useApi(authAPI.profile, {
    immediate: true,
    showToast: false,
  });

  if (profileLoading) {
    return (
      <div className="gradient-bg min-h-screen flex items-center justify-center">
        <div className="card p-8 flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-blue-700 font-medium">Memuat profil...</span>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="gradient-bg min-h-screen flex items-center justify-center">
        <div className="card p-8 text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Gagal Memuat Profil
          </h3>
          <p className="text-gray-600 mb-4">{profileError}</p>
          <button onClick={refetchProfile} className="btn-primary">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // Fix data access based on API structure
  const user = userProfile?.user || {};
  const profile = user.profileData || {};

  return (
    <div className="gradient-bg min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">Profil Guru</h1>
          <p className="text-blue-600">
            Informasi profil dan pengaturan akun Anda
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-4 animate-slide-in-left">
            <div className="card p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 overflow-hidden shadow-blue ring-4 ring-blue-100">
                  {profile.name?.charAt(0)?.toUpperCase() || "G"}
                </div>
                <h3 className="text-lg font-bold text-blue-900 mb-1">
                  {profile.name || "Nama Belum Diisi"}
                </h3>
                <p className="text-sm text-blue-600 mb-3">{user.email}</p>
                <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold border border-blue-200">
                  <Shield className="h-3.5 w-3.5" />
                  {user.role || "TEACHER"}
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <button className="w-full flex items-center gap-3 text-left">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-blue-900 text-sm">
                        Informasi Profil
                      </p>
                      <p className="text-xs text-blue-600">
                        Lihat data pribadi
                      </p>
                    </div>
                  </button>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      Akun Terverifikasi
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content - Only Profile Section */}
          <div className="lg:col-span-8 animate-slide-in-right">
            <div className="card">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Informasi Profil</h2>
                  <p className="card-description">Informasi pribadi Anda</p>
                </div>
              </div>

              <div className="card-content">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-blue-600 font-medium mb-0.5">
                          Nama Lengkap
                        </p>
                        <p className="font-semibold text-blue-900 truncate">
                          {profile.name || "Belum diisi"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                        <Mail className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-blue-600 font-medium mb-0.5">
                          Email
                        </p>
                        <p className="font-semibold text-blue-900 truncate">
                          {user.email || "Belum diisi"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-blue-600 font-medium mb-0.5">
                          Jenis Kelamin
                        </p>
                        <p className="font-semibold text-blue-900">
                          {profile.gender === "LAKI_LAKI"
                            ? "Laki-laki"
                            : profile.gender === "PEREMPUAN"
                            ? "Perempuan"
                            : "Belum diisi"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:shadow-md transition-shadow">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-blue-600 font-medium mb-0.5">
                          Bergabung
                        </p>
                        <p className="font-semibold text-blue-900">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString(
                                "id-ID"
                              )
                            : "Tidak diketahui"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="section-divider"></div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-blue-900 mb-3">
                      Informasi Tambahan
                    </h3>

                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-blue-600 font-medium mb-0.5">
                          Role
                        </p>
                        <p className="font-semibold text-blue-900">
                          {user.role || "TEACHER"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-blue-600 font-medium mb-0.5">
                          User ID
                        </p>
                        <p className="font-mono text-xs text-blue-900 break-all bg-white px-2 py-1 rounded border border-blue-200">
                          {user.id || "Tidak diketahui"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
