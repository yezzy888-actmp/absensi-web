// src/app/admin/page.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { usePaginatedApi } from "@/hooks/useApi";
import { userAPI, subjectAPI } from "@/lib/api";
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  TrendingUp,
  Briefcase,
  ArrowRight,
  Activity,
} from "lucide-react";

// Komponen Card untuk Statistik (Reusable)
const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  isLoading,
  trend,
  trendValue,
}) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-blue-100/50 p-6 hover:shadow-lg hover:border-blue-200/70 transition-all duration-300 group">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-semibold text-blue-600/80 mb-2 uppercase tracking-wide">
          {title}
        </p>
        {isLoading ? (
          <div className="h-9 w-24 bg-gradient-to-r from-blue-100 to-blue-50 rounded animate-pulse"></div>
        ) : (
          <p className="text-3xl font-bold bg-gradient-to-br from-blue-700 to-blue-600 bg-clip-text text-transparent mb-1">
            {value}
          </p>
        )}
        {trend && !isLoading && (
          <div
            className={`flex items-center text-xs font-semibold mt-2 ${
              trend === "up" ? "text-green-600" : "text-red-600"
            }`}
          >
            <TrendingUp
              className={`w-3.5 h-3.5 mr-1 ${
                trend === "down" ? "rotate-180" : ""
              }`}
            />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div
        className={`p-4 rounded-xl ${color} flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon className="w-7 h-7 text-white" />
      </div>
    </div>
  </div>
);

// Komponen untuk Quick Action (Reusable)
const QuickActionCard = ({ href, icon: Icon, title, description, color }) => (
  <Link
    href={href}
    className="relative bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-blue-100/50 p-6 hover:shadow-lg hover:border-blue-200/70 transition-all duration-300 group overflow-hidden"
  >
    {/* Gradient overlay on hover */}
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

    <div className="relative flex items-start space-x-4">
      <div
        className={`p-3.5 rounded-xl ${color} flex-shrink-0 shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-blue-900 text-base group-hover:text-blue-700 transition-colors">
            {title}
          </h3>
          <ArrowRight className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
        </div>
        <p className="text-sm text-blue-600/70 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  </Link>
);

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    attendanceRate: 94.2,
  });

  // --- API Hooks untuk mengambil data dinamis ---
  const { pagination: studentPagination, loading: loadingStudents } =
    usePaginatedApi(userAPI.getAllUsers, {
      initialParams: { role: "STUDENT", limit: 1 },
      showToast: false,
    });

  const { pagination: teacherPagination, loading: loadingTeachers } =
    usePaginatedApi(userAPI.getAllUsers, {
      initialParams: { role: "TEACHER", limit: 1 },
      showToast: false,
    });

  const { pagination: subjectPagination, loading: loadingSubjects } =
    usePaginatedApi(subjectAPI.getAllSubjects, {
      initialParams: { limit: 1 },
      showToast: false,
    });

  // Effect untuk memperbarui state statistik ketika data dari API diterima
  useEffect(() => {
    setStats((prevStats) => ({
      ...prevStats,
      totalStudents: studentPagination?.total || 0,
      totalTeachers: teacherPagination?.total || 0,
      totalSubjects: subjectPagination?.total || 0,
    }));
  }, [studentPagination, teacherPagination, subjectPagination]);

  const isLoading = loadingStudents || loadingTeachers || loadingSubjects;

  const quickActions = [
    {
      href: "/admin/users",
      icon: Users,
      title: "Kelola Pengguna",
      description: "Tambah & edit akun pengguna sistem",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
      href: "/admin/subjects",
      icon: BookOpen,
      title: "Kelola Mapel",
      description: "Buat & atur mata pelajaran",
      color: "bg-gradient-to-br from-green-500 to-green-600",
    },
    {
      href: "/admin/classes",
      icon: GraduationCap,
      title: "Kelola Kelas",
      description: "Atur ruang kelas & wali kelas",
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
    },
    {
      href: "/admin/schedule",
      icon: Calendar,
      title: "Kelola Jadwal",
      description: "Susun jadwal pelajaran harian",
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
    },
  ];

  // Mock recent activities (static data for UI demonstration)
  const recentActivities = [
    {
      icon: Users,
      title: "User Management",
      description: "5 new students registered",
      time: "2 hours ago",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
      icon: BookOpen,
      title: "Subject Update",
      description: "Mathematics curriculum updated",
      time: "4 hours ago",
      color: "bg-gradient-to-br from-green-500 to-green-600",
    },
    {
      icon: Calendar,
      title: "Schedule Changed",
      description: "Grade 10A schedule modified",
      time: "1 day ago",
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
    },
  ];

  return (
    <div className="min-h-screen gradient-bg p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100/50 p-8 animate-fade-in">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 bg-clip-text text-transparent">
                  Welcome back, {user?.name || "Admin"}!
                </h1>
              </div>
              <p className="text-blue-600/70 text-lg ml-14">
                Kelola sistem sekolah Anda dengan mudah dan efisien
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/admin/schedule"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Lihat Jadwal
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
          <StatCard
            title="Total Siswa"
            value={stats.totalStudents.toLocaleString()}
            icon={GraduationCap}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
            isLoading={isLoading}
          />
          <StatCard
            title="Total Guru"
            value={stats.totalTeachers.toLocaleString()}
            icon={Briefcase}
            color="bg-gradient-to-br from-green-500 to-green-600"
            isLoading={isLoading}
          />
          <StatCard
            title="Total Mata Pelajaran"
            value={stats.totalSubjects.toLocaleString()}
            icon={BookOpen}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
            isLoading={isLoading}
          />
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100/50 p-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
              Quick Actions
            </h2>
            <div className="h-1 flex-1 ml-6 bg-gradient-to-r from-blue-200 to-transparent rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {quickActions.map((action) => (
              <QuickActionCard key={action.href} {...action} />
            ))}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">
                  Sistem Berjalan Normal
                </h3>
                <p className="text-blue-50 text-sm">
                  Semua layanan beroperasi dengan baik. Tidak ada masalah yang
                  terdeteksi.
                </p>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="text-right">
                <p className="text-sm text-blue-100">Terakhir diperbarui</p>
                <p className="font-semibold">
                  {new Date().toLocaleString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
