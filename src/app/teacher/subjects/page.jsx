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
        <div className="card p-10 text-center max-w-md w-full">
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
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-blue">
                <GraduationCap className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gradient mb-4">
            Mata Pelajaran Saya
          </h1>
          <div className="inline-flex items-center px-6 py-3 card rounded-full shadow-blue border-2 border-blue-200">
            <span className="text-blue-700 font-medium">
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
          <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-blue-400"></div>
            </div>
            <p className="mt-6 text-blue-700 font-medium">
              Memuat mata pelajaran...
            </p>
          </div>
        )}

        {/* Error State */}
        {assignedError && (
          <div className="card p-10 text-center mb-8 border-2 border-red-200 animate-fade-in">
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
              <div className="card p-12 text-center border-2 border-blue-200 animate-fade-in">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <BookOpen className="w-12 h-12 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-blue-900 mb-3">
                  Belum Ada Mata Pelajaran
                </h3>
                <p className="text-blue-600 text-lg">
                  Anda belum memiliki mata pelajaran yang ditugaskan
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {assignedSubjects.map((subject, index) => (
                  <div
                    key={subject.id}
                    className="group relative card p-8 hover:scale-105 border-2 border-blue-200 overflow-hidden animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Decorative gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-blue-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Card content */}
                    <div className="relative z-10">
                      <div className="flex flex-col items-center text-center">
                        {/* Icon with gradient background */}
                        <div className="relative mb-6">
                          <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-blue group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                            <BookOpen className="w-8 h-8 text-white" />
                          </div>
                          {/* Decorative ring */}
                          <div className="absolute inset-0 rounded-2xl border-2 border-blue-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        {/* Subject name */}
                        <h3 className="font-bold text-blue-900 text-lg leading-tight group-hover:text-blue-600 transition-colors duration-300">
                          {subject.name}
                        </h3>

                        {/* Decorative line */}
                        <div className="w-12 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                      </div>
                    </div>

                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Decorative elements */}
        <div className="fixed top-20 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/15 to-blue-500/10 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
        <div
          className="fixed bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-blue-500/15 to-blue-600/10 rounded-full blur-3xl animate-pulse pointer-events-none"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>
    </div>
  );
}
