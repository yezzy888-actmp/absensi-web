// src/app/teacher/page.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTeacherComplete } from "@/hooks/useApi";
import {
  Users,
  BookOpen,
  UserCheck,
  Calendar,
  Award,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  PlayCircle,
  Eye,
  BarChart3,
  BookMarked,
  CalendarCheck,
  GraduationCap,
  Target,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const {
    teacher,
    profileLoading,
    schedule,
    scheduleLoading,
    sessions,
    getActiveSessions,
    createSession,
    refetchSchedule,
  } = useTeacherComplete(user?.profileData?.id);

  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    todayClasses: 0,
    attendanceRate: 0,
    activeSessions: 0,
    completedLessons: 0,
  });

  const [todaySchedule, setTodaySchedule] = useState([]);
  const [activeSessionsData, setActiveSessionsData] = useState([]);

  const calculateStats = useCallback(
    (activeSessionsResult, currentScheduleData, allSessionsData) => {
      console.log(
        "Calculating stats with schedule:",
        currentScheduleData,
        "sessions:",
        allSessionsData,
        "active:",
        activeSessionsResult
      );

      const scheduleArray = Array.isArray(currentScheduleData)
        ? currentScheduleData
        : [];
      const validAllSessions = Array.isArray(allSessionsData)
        ? allSessionsData
        : [];

      const uniqueClasses = new Set(scheduleArray.map((s) => s.classId)).size;
      const totalStudents =
        scheduleArray.reduce((acc, s) => {
          const studentList = Array.isArray(s.students) ? s.students : [];
          return acc + studentList.length;
        }, 0) || 0;

      const activeSessionsCount = activeSessionsResult?.sessions?.length || 0;

      let totalPresent = 0;
      let totalExpected = 0;

      validAllSessions.forEach((session) => {
        if (session.attendances && Array.isArray(session.attendances)) {
          totalExpected += session.attendances.length;
          totalPresent += session.attendances.filter(
            (a) => a.status === "HADIR"
          ).length;
        }
      });

      const attendanceRate =
        totalExpected > 0 ? (totalPresent / totalExpected) * 100 : 0;

      setStats({
        totalClasses: uniqueClasses,
        totalStudents,
        todayClasses: todaySchedule.length,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        activeSessions: activeSessionsCount,
        completedLessons:
          validAllSessions.filter((s) => s.status === "completed")?.length || 0,
      });
    },
    [todaySchedule]
  );

  const loadDashboardData = useCallback(async () => {
    if (!getActiveSessions) return;

    console.log(
      "loadDashboardData triggered. Schedule from hook:",
      schedule,
      "Sessions from hook:",
      sessions
    );

    try {
      const loadedActiveSessions = await getActiveSessions();
      setActiveSessionsData(loadedActiveSessions?.sessions || []);

      const scheduleArray = Array.isArray(schedule) ? schedule : [];
      if (scheduleArray.length > 0) {
        const today = format(new Date(), "yyyy-MM-dd");
        const filteredTodaySchedule = scheduleArray.filter((item) => {
          const itemDate = item.date ? new Date(item.date) : new Date();
          const scheduleDate = format(itemDate, "yyyy-MM-dd");
          return scheduleDate === today;
        });
        setTodaySchedule(filteredTodaySchedule);
      } else {
        setTodaySchedule([]);
      }

      calculateStats(loadedActiveSessions, schedule, sessions);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setTodaySchedule([]);
      calculateStats({ sessions: [] }, [], []);
    }
  }, [getActiveSessions, schedule, sessions, calculateStats]);

  useEffect(() => {
    if (user?.profileData?.id && teacher) {
      loadDashboardData();
    }
  }, [user?.profileData?.id, teacher, schedule, sessions, loadDashboardData]);

  const handleCreateSession = async (scheduleId) => {
    try {
      await createSession(scheduleId, 30);
      if (refetchSchedule) {
        await refetchSchedule();
      }
      const newActiveSessions = await getActiveSessions();
      setActiveSessionsData(newActiveSessions?.sessions || []);
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  const getScheduleStatus = (scheduleItem) => {
    const now = new Date();
    const scheduleTime = scheduleItem.startTime
      ? new Date(scheduleItem.startTime)
      : null;
    const endTime = scheduleItem.endTime
      ? new Date(scheduleItem.endTime)
      : null;

    if (!scheduleTime || !endTime) return "unknown";

    if (now > endTime) return "completed";
    if (now >= scheduleTime && now <= endTime) return "in-progress";
    return "upcoming";
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    trend,
    trendValue,
    onClick,
  }) => (
    <div
      className={`card p-6 hover:shadow-lg transition-all duration-200 ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div
              className={`flex items-center mt-2 text-sm ${
                trend === "up" ? "text-green-600" : "text-red-600"
              }`}
            >
              <TrendingUp
                className={`w-4 h-4 mr-1 ${
                  trend === "down" ? "rotate-180" : ""
                }`}
              />
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "upcoming":
        return "bg-gray-100 text-gray-700 border border-gray-200";
      default:
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "in-progress":
        return <Activity className="w-4 h-4" />;
      case "upcoming":
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const QuickActionButton = ({ title, icon: Icon, color, onClick, href }) => {
    const ButtonContent = () => (
      <div className="flex flex-col items-center text-center space-y-2">
        <div
          className={`p-3 ${color} rounded-lg group-hover:opacity-80 transition-all`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className="text-sm font-medium text-gray-900">{title}</span>
      </div>
    );
    if (href) {
      return (
        <Link
          href={href}
          className="p-4 text-left hover:bg-blue-50 rounded-lg transition-colors group"
        >
          <ButtonContent />
        </Link>
      );
    }
    return (
      <button
        onClick={onClick}
        className="p-4 text-left hover:bg-blue-50 rounded-lg transition-colors group"
      >
        <ButtonContent />
      </button>
    );
  };

  if (profileLoading || scheduleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Gagal Memuat Data Guru
        </h2>
        <p className="text-gray-600">
          Tidak dapat mengambil informasi profil guru. Silakan coba lagi nanti.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gradient">
            Welcome back, {teacher?.name || user?.name || "Teacher"}!
          </h1>
          <p className="text-gray-600 mt-1">
            Ready to inspire and educate your students today
          </p>
        </div>
      </div>

      {/* Active Sessions Alert - Menggunakan skema warna blue dari tema */}
      {activeSessionsData.length > 0 && (
        <div className="glass-effect border-2 border-blue-300 rounded-lg p-4 shadow-blue">
          <div className="flex items-center">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mr-3 shadow-sm">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900">
                Active Attendance Sessions ({activeSessionsData.length})
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                You have ongoing attendance sessions that need your attention.
              </p>
            </div>
            <Link
              href="/teacher/attendance/active-sessions"
              className="btn-primary btn-sm ml-4 flex-shrink-0"
            >
              <Eye className="w-4 h-4 mr-1" /> View Sessions
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule Section */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-blue-900">
                Today's Schedule
              </h2>
              <Link
                href="/teacher/schedule"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors flex items-center gap-1"
              >
                View Full Schedule
                <TrendingUp className="w-4 h-4 rotate-90" />
              </Link>
            </div>
            {scheduleLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : todaySchedule.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-blue-300 mx-auto mb-3" />
                <p className="text-gray-500">No classes scheduled for today</p>
                {Array.isArray(schedule) &&
                  schedule.length === 0 &&
                  !scheduleLoading && (
                    <p className="text-xs text-gray-400 mt-1">
                      (No schedule data found for this teacher)
                    </p>
                  )}
              </div>
            ) : (
              <div className="space-y-4">
                {todaySchedule.map((scheduleItem) => {
                  const status = getScheduleStatus(scheduleItem);
                  const hasActiveSession = activeSessionsData.some(
                    (s) => s.scheduleId === scheduleItem.id
                  );
                  return (
                    <div
                      key={scheduleItem.id}
                      className="flex items-center justify-between p-4 border-gradient rounded-lg hover:shadow-blue transition-all bg-white/50"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="text-center min-w-[80px] bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-2 border border-blue-200">
                          <div className="text-sm font-semibold text-blue-900">
                            {scheduleItem.startTime
                              ? format(
                                  new Date(scheduleItem.startTime),
                                  "HH:mm"
                                )
                              : "--:--"}
                          </div>
                          <div className="text-xs text-blue-600">
                            {scheduleItem.endTime
                              ? format(new Date(scheduleItem.endTime), "HH:mm")
                              : "--:--"}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-900">
                            {scheduleItem.subject?.name || "Subject"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {scheduleItem.class?.name || "Class"}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <span>
                              {scheduleItem.room || "Room not specified"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {hasActiveSession && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                            <Activity className="w-3 h-3 mr-1" />
                            Session Active
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            status
                          )}`}
                        >
                          {getStatusIcon(status)}
                          <span className="ml-1 capitalize">
                            {status.replace("-", " ")}
                          </span>
                        </span>
                        {status === "in-progress" && !hasActiveSession && (
                          <button
                            onClick={() => handleCreateSession(scheduleItem.id)}
                            className="btn-primary btn-sm"
                          >
                            <PlayCircle className="w-4 h-4 mr-1" />
                            Start Session
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Overview Sidebar - Menggunakan skema warna dari tema */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              Quick Overview
            </h2>
            <div className="space-y-4">
              {/* Active Sessions */}
              <div className="flex items-center justify-between p-3 glass-effect border-gradient rounded-lg hover:shadow-blue transition-all cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Active Sessions
                  </span>
                </div>
                <span className="font-bold text-blue-600 text-lg">
                  {stats.activeSessions}
                </span>
              </div>

              {/* Completed Lessons */}
              <div className="flex items-center justify-between p-3 glass-effect rounded-lg hover:shadow-sm transition-all cursor-pointer border border-green-200 bg-green-50/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Completed Lessons
                  </span>
                </div>
                <span className="font-bold text-green-600 text-lg">
                  {stats.completedLessons}
                </span>
              </div>

              {/* Average Attendance */}
              <div className="flex items-center justify-between p-3 glass-effect rounded-lg hover:shadow-sm transition-all cursor-pointer border border-orange-200 bg-orange-50/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-sm">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Avg. Attendance
                  </span>
                </div>
                <span className="font-bold text-orange-600 text-lg">
                  {stats.attendanceRate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
