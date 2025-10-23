// src/app/teacher/attendance/active-sessions/page.jsx (DENGAN SKEMA WARNA HARMONIS)
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTeacherAttendance } from "@/hooks/useApi";
import {
  Clock,
  Users,
  MapPin,
  BookOpen,
  Play,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  Calendar,
  Eye,
  MoreVertical,
} from "lucide-react";
import { formatDistanceToNow, parseISO, isAfter } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";

export default function ActiveSessionsPage() {
  const { user } = useAuth();
  const teacherId = user?.profileData?.id;
  const [refreshInterval, setRefreshInterval] = useState(null);

  const {
    sessions,
    loading,
    error,
    getActiveSessions,
    markStudentPresent,
    markStudentAbsent,
    markStudentLate,
    markStudentAlpha,
    markStudentSick,
    markStudentPermission,
  } = useTeacherAttendance(teacherId);

  // Auto refresh active sessions every 30 seconds
  useEffect(() => {
    if (teacherId) {
      getActiveSessions();

      const interval = setInterval(() => {
        getActiveSessions();
      }, 30000);

      setRefreshInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [teacherId, getActiveSessions]);

  // Format time remaining
  const getTimeRemaining = (session) => {
    if (!session.expiresAt) return null;

    const expiresAt = parseISO(session.expiresAt);
    const now = new Date();

    if (isAfter(now, expiresAt)) {
      return "Berakhir";
    }

    return formatDistanceToNow(expiresAt, {
      addSuffix: true,
      locale: id,
    });
  };

  // Get session status
  const getSessionStatus = (session) => {
    if (!session.expiresAt) return "active";

    const expiresAt = parseISO(session.expiresAt);
    const now = new Date();

    if (isAfter(now, expiresAt)) {
      return "expired";
    }

    return "active";
  };

  // Get attendance stats for a session
  const getAttendanceStats = (session) => {
    const attendances = session.attendances || [];
    const total = attendances.length;
    const present = attendances.filter(
      (a) => a.status === "HADIR" || a.status === "PRESENT"
    ).length;
    const absent = attendances.filter(
      (a) =>
        a.status === "TIDAK_HADIR" ||
        a.status === "ABSENT" ||
        a.status === "ALPHA"
    ).length;
    const late = attendances.filter(
      (a) => a.status === "TERLAMBAT" || a.status === "LATE"
    ).length;
    const pending = attendances.filter((a) => a.status === "PENDING").length;
    const sick = attendances.filter((a) => a.status === "SAKIT").length;
    const permission = attendances.filter((a) => a.status === "IZIN").length;

    return { total, present, absent, late, pending, sick, permission };
  };

  // Handle manual attendance marking
  const handleMarkAttendance = async (attendanceId, status) => {
    try {
      switch (status) {
        case "PRESENT":
          await markStudentPresent(attendanceId);
          break;
        case "ABSENT":
          await markStudentAlpha(attendanceId);
          break;
        case "LATE":
          await markStudentLate(attendanceId);
          break;
      }
      getActiveSessions();
    } catch (error) {
      console.error("Error marking attendance:", error);
    }
  };

  const SessionCard = ({ session }) => {
    const timeRemaining = getTimeRemaining(session);
    const status = getSessionStatus(session);
    const stats = getAttendanceStats(session);
    const isGeoFenced = session.latitude && session.radiusMeters;

    return (
      <div className="card p-6 hover:shadow-blue transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                status === "active"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 animate-pulse shadow-blue"
                  : "bg-gradient-to-r from-gray-400 to-gray-500"
              }`}
            />
            <h3 className="text-lg font-bold text-gradient">
              {session.schedule?.subject?.name || "Mata Pelajaran"}
            </h3>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                status === "active"
                  ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200"
                  : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 border border-gray-200"
              }`}
            >
              {status === "active" ? "● Aktif" : "○ Berakhir"}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href={`/teacher/attendance/active-sessions/${session.id}`}
              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
            >
              <Eye className="w-4 h-4" />
            </Link>
            <button className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Session Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm text-gray-700">
              <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-medium">
                Kelas {session.schedule?.class?.name || "-"}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-700">
              <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-medium">
                Ruang {session.schedule?.room || "Tidak Ditentukan"}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-700">
              <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-medium">
                {new Date(session.date).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm text-gray-700">
              <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-medium">
                {session.schedule?.startTime} - {session.schedule?.endTime}
              </span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-700">
              <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <Timer className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-medium">
                {timeRemaining === "Berakhir"
                  ? "Sesi berakhir"
                  : `Berakhir ${timeRemaining}`}
              </span>
            </div>
            {isGeoFenced && (
              <div className="flex items-center space-x-3 text-sm">
                <div className="p-2 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                  <MapPin className="w-4 h-4 text-orange-600" />
                </div>
                <span className="font-semibold text-orange-700">
                  Geofence: {session.radiusMeters}m
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Attendance Stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <div className="text-xl font-bold text-blue-700">{stats.total}</div>
            <div className="text-xs font-medium text-blue-600 mt-1">Total</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
            <div className="text-xl font-bold text-green-700">
              {stats.present}
            </div>
            <div className="text-xs font-medium text-green-600 mt-1">Hadir</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
            <div className="text-xl font-bold text-red-700">{stats.absent}</div>
            <div className="text-xs font-medium text-red-600 mt-1">
              Tidak Hadir
            </div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
            <div className="text-xl font-bold text-yellow-700">
              {stats.late}
            </div>
            <div className="text-xs font-medium text-yellow-600 mt-1">
              Terlambat
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {stats.total > 0 && (
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">
                Progress Absensi
              </span>
              <span className="text-sm font-bold text-blue-700">
                {Math.round(
                  ((stats.present + stats.absent + stats.late) / stats.total) *
                    100
                )}
                %
              </span>
            </div>
            <div className="w-full bg-gradient-to-r from-gray-100 to-gray-200 rounded-full h-3 overflow-hidden border border-gray-200">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 shadow-blue"
                style={{
                  width: `${
                    ((stats.present + stats.absent + stats.late) /
                      stats.total) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-blue-100">
          <div className="text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
            ID: {session.id.slice(0, 8)}...
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href={`/teacher/attendance/active-sessions/${session.id}`}
              className="btn-primary btn-sm flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Detail</span>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <RefreshCw className="w-12 h-12 animate-spin text-blue-600" />
              <div className="absolute inset-0 w-12 h-12 rounded-full bg-blue-500 opacity-20 animate-pulse"></div>
            </div>
            <span className="mt-4 text-lg font-semibold text-gray-700">
              Memuat sesi aktif...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen gradient-bg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="card p-8 text-center max-w-md mx-auto">
            <div className="p-4 bg-red-50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Gagal Memuat Sesi Aktif
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button onClick={getActiveSessions} className="btn-primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeSessions = sessions.filter(
    (s) => getSessionStatus(s) === "active"
  );
  const totalStudents = sessions.reduce((total, session) => {
    return total + (session.attendances?.length || 0);
  }, 0);

  return (
    <div className="min-h-screen gradient-bg">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-4xl font-bold text-gradient mb-2">
              Sesi Absensi Aktif
            </h1>
            <p className="text-gray-600 text-lg">
              Kelola sesi absensi yang sedang berlangsung
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="btn-secondary" onClick={getActiveSessions}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 border-gradient hover:shadow-blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Sesi Aktif
                </p>
                <p className="text-3xl font-bold text-gradient">
                  {activeSessions.length}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                <Play className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="card p-6 border-gradient hover:shadow-blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Total Sesi
                </p>
                <p className="text-3xl font-bold text-gradient">
                  {sessions.length}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <Clock className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="card p-6 border-gradient hover:shadow-blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Siswa Terlibat
                </p>
                <p className="text-3xl font-bold text-gradient">
                  {totalStudents}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        {sessions.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gradient">
              Daftar Sesi ({sessions.length})
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          </div>
        ) : (
          <div className="card p-16 text-center">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full w-28 h-28 mx-auto mb-6 flex items-center justify-center">
              <Clock className="w-16 h-16 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gradient mb-3">
              Tidak Ada Sesi Aktif
            </h3>
            <p className="text-gray-600 text-lg">
              Belum ada sesi absensi yang sedang berlangsung saat ini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
