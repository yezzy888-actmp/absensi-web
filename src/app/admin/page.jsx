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
  UserCheck,
  TrendingUp,
  Calendar,
  Bell,
  BarChart3,
  Activity,
  Clock,
  Briefcase,
  UserPlus,
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
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500 mb-2">{title}</p>
        {isLoading ? (
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
        ) : (
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
        )}
        {trend && !isLoading && (
          <div
            className={`flex items-center text-xs font-medium ${
              trend === "up" ? "text-green-600" : "text-red-600"
            }`}
          >
            <TrendingUp
              className={`w-3 h-3 mr-1 ${trend === "down" ? "rotate-180" : ""}`}
            />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color} flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

// Komponen untuk Quick Action (Reusable)
const QuickActionCard = ({ href, icon: Icon, title, description, color }) => (
  <Link
    href={href}
    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all duration-300 group block"
  >
    <div className="flex items-start space-x-4">
      <div
        className={`p-3 rounded-lg ${color} flex-shrink-0 group-hover:scale-105 transition-transform`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-base mb-1 group-hover:text-gray-800">
          {title}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
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
    attendanceRate: 94.2, // Placeholder, requires complex calculation
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

  const { data: recentUsers, loading: loadingRecent } = usePaginatedApi(
    userAPI.getAllUsers,
    {
      initialParams: { sortBy: "createdAt", sortOrder: "desc", limit: 5 },
      showToast: false,
    }
  );

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
      description: "Tambah/edit akun pengguna",
      color: "bg-blue-500",
    },
    {
      href: "/admin/subjects",
      icon: BookOpen,
      title: "Kelola Mapel",
      description: "Buat & atur mata pelajaran",
      color: "bg-green-500",
    },
    {
      href: "/admin/classes",
      icon: GraduationCap,
      title: "Kelola Kelas",
      description: "Atur ruang kelas & wali",
      color: "bg-purple-500",
    },
    {
      href: "/admin/schedule",
      icon: Calendar,
      title: "Kelola Jadwal",
      description: "Susun jadwal pelajaran",
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.name || "Admin"}!
              </h1>
              <p className="text-gray-600">
                Here's what's happening in your school system today.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/admin/schedule"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Calendar className="w-4 h-4 mr-2" />
                View Schedule
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Total Students"
            value={stats.totalStudents.toLocaleString()}
            icon={GraduationCap}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
            isLoading={isLoading}
          />
          <StatCard
            title="Total Teachers"
            value={stats.totalTeachers.toLocaleString()}
            icon={Briefcase}
            color="bg-gradient-to-br from-green-500 to-green-600"
            isLoading={isLoading}
          />
          <StatCard
            title="Total Subjects"
            value={stats.totalSubjects.toLocaleString()}
            icon={BookOpen}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
            isLoading={isLoading}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Quick Actions Section */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action) => (
                  <QuickActionCard key={action.href} {...action} />
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activities Section */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Recent Registrations
                </h2>
                <Link
                  href="/admin/users"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-4">
                {loadingRecent ? (
                  // Loading skeleton
                  <>
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  // Actual data
                  <>
                    {recentUsers?.map((activityUser) => (
                      <div
                        key={activityUser.id}
                        className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div
                          className={`p-2 rounded-full flex-shrink-0 ${
                            activityUser.role === "TEACHER"
                              ? "bg-green-100 text-green-600"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          <UserPlus className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            New {activityUser.role.toLowerCase()} registered
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {activityUser.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
