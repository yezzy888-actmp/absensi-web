"use client";
import { BookOpen, AlertCircle, GraduationCap, Sparkles } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { teacherAPI } from "@/lib/api";
import { AuthManager } from "@/lib/auth";

export default function TeacherSubjectsPage() {
  // Get current teacher ID from auth
  const currentUser = AuthManager.getUser();
  const teacherId = currentUser?.profileData?.id;

  // Fetch teacher's assigned subjects
  const {
    data: assignedSubjectsData,
    loading: loadingAssigned,
    error: assignedError,
    refetch: refetchAssigned,
  } = useApi(teacherId ? () => teacherAPI.getSubjects(teacherId) : null, {
    immediate: !!teacherId,
    showToast: false,
  });

  const assignedSubjects = assignedSubjectsData?.subjects || [];

  if (!teacherId) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-lg p-10 rounded-3xl shadow-2xl text-center max-w-md w-full border border-white/20">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Akses Ditolak
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Anda tidak memiliki akses ke halaman ini.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 rounded-2xl shadow-xl">
                <GraduationCap className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent mb-4">
            Mata Pelajaran Saya
          </h1>
          <div className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-white/30">
            <span className="text-gray-700 font-medium">
              Total:{" "}
              <span className="font-bold text-blue-600">
                {assignedSubjects.length}
              </span>{" "}
              mata pelajaran
            </span>
          </div>
        </div>

        {/* Loading State */}
        {loadingAssigned && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-blue-400"></div>
            </div>
            <p className="mt-6 text-gray-600 font-medium">
              Memuat mata pelajaran...
            </p>
          </div>
        )}

        {/* Error State */}
        {assignedError && (
          <div className="bg-white/90 backdrop-blur-lg p-10 rounded-3xl shadow-xl text-center mb-8 border border-red-200">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Gagal Memuat Data
            </h3>
            <p className="text-gray-600 mb-6">{assignedError}</p>
            <button onClick={refetchAssigned} className="btn-primary">
              Coba Lagi
            </button>
          </div>
        )}

        {/* Subjects Grid */}
        {!loadingAssigned && !assignedError && (
          <>
            {assignedSubjects.length === 0 ? (
              <div className="bg-white/90 backdrop-blur-lg p-12 rounded-3xl shadow-xl text-center border border-white/30">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Belum Ada Mata Pelajaran
                </h3>
                <p className="text-gray-600 text-lg">
                  Anda belum memiliki mata pelajaran yang ditugaskan
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {assignedSubjects.map((subject, index) => (
                  <div
                    key={subject.id}
                    className="group relative bg-white/90 backdrop-blur-lg p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 border border-white/30 overflow-hidden"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Decorative gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Card content */}
                    <div className="relative z-10">
                      <div className="flex flex-col items-center text-center">
                        {/* Icon with gradient background */}
                        <div className="relative mb-6">
                          <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                            <BookOpen className="w-8 h-8 text-white" />
                          </div>
                          {/* Decorative ring */}
                          <div className="absolute inset-0 rounded-2xl border-2 border-blue-200 opacity-0 group-hover:opacity-100 animate-pulse"></div>
                        </div>

                        {/* Subject name */}
                        <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-blue-600 transition-colors duration-300">
                          {subject.name}
                        </h3>

                        {/* Decorative line */}
                        <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                      </div>
                    </div>

                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"></div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Decorative elements */}
        <div className="fixed top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="fixed bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>
    </div>
  );
}
