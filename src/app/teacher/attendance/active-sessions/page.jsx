// src/app/teacher/attendance/active-sessions/page.jsx (KODE LENGKAP DAN DIPERBAIKI)
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
  const teacherId = user?.profileData?.id; // Dapatkan teacherId
  const [refreshInterval, setRefreshInterval] = useState(null);
  // State modal dihilangkan karena kita akan navigasi ke halaman detail
  // const [selectedSession, setSelectedSession] = useState(null);
  // const [showSessionDetails, setShowSessionDetails] = useState(false);

  const {
    sessions,
    loading,
    error,
    getActiveSessions,
    markStudentPresent,
    markStudentAbsent, // Akan kita ganti ke markStudentAlpha
    markStudentLate,
    markStudentAlpha, // Tambahkan yang baru dari hook
    markStudentSick, // Tambahkan yang baru dari hook
    markStudentPermission, // Tambahkan yang baru dari hook
  } = useTeacherAttendance(teacherId);

  // Auto refresh active sessions every 30 seconds
  useEffect(() => {
    if (teacherId) {
      getActiveSessions();

      const interval = setInterval(() => {
        getActiveSessions();
      }, 30000); // Refresh every 30 seconds

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

  // Get attendance stats for a session (MODIFIED to include SICK and PERMISSION)
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

    // NEW: Tambahkan SICK dan PERMISSION stat (walaupun tidak ditampilkan di summary card, tetap bagus di logikanya)
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
        case "ABSENT": // Jika masih ada state ABSENT, ganti ke ALPHA
          await markStudentAlpha(attendanceId);
          break;
        case "LATE":
          await markStudentLate(attendanceId);
          break;
        // Status baru tidak perlu ditangani di sini karena ini untuk sesi aktif (yang sudah dimulai)
      }
      // Refresh sessions after marking attendance
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
      <div className="card p-6 hover:shadow-lg transition-shadow duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                status === "active"
                  ? "bg-green-500 animate-pulse"
                  : "bg-gray-400"
              }`}
            />
            <h3 className="text-lg font-semibold text-gray-900">
              {session.schedule?.subject?.name || "Mata Pelajaran"}
            </h3>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {status === "active" ? "Aktif" : "Berakhir"}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* **FIXED:** Tombol Detail sekarang mengarahkan ke halaman [id] */}
            <Link
              href={`/teacher/attendance/active-sessions/${session.id}`}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Eye className="w-4 h-4" />
            </Link>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Session Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>Kelas {session.schedule?.class?.name || "-"}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>Ruang {session.schedule?.room || "Tidak Ditentukan"}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(session.date).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>
                {session.schedule?.startTime} - {session.schedule?.endTime}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Timer className="w-4 h-4" />
              <span>
                {timeRemaining === "Berakhir"
                  ? "Sesi berakhir"
                  : `Berakhir ${timeRemaining}`}
              </span>
            </div>
            {/* Display GeoFence Info */}
            {isGeoFenced && (
              <div className="flex items-center space-x-2 text-sm text-orange-600 font-medium">
                <MapPin className="w-4 h-4" />
                <span>Geofence Aktif: {session.radiusMeters}m</span>
              </div>
            )}
          </div>
        </div>

        {/* Attendance Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {stats.present}
            </div>
            <div className="text-xs text-gray-500">Hadir</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">{stats.absent}</div>
            <div className="text-xs text-gray-500">Tidak Hadir</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-yellow-600">
              {stats.late}
            </div>
            <div className="text-xs text-gray-500">Terlambat</div>
          </div>
        </div>

        {/* Progress Bar */}
        {stats.total > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Progress Absensi</span>
              <span className="text-sm font-medium text-gray-900">
                {Math.round(
                  ((stats.present + stats.absent + stats.late) / stats.total) *
                    100
                )}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
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
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            ID: {session.id.slice(0, 8)}...
          </div>

          <div className="flex items-center space-x-2">
            {/* **FIXED:** Tombol Detail sekarang menggunakan Link */}
            <Link
              href={`/teacher/attendance/active-sessions/${session.id}`}
              className="btn-secondary btn-sm"
            >
              <Eye className="w-4 h-4 mr-1" />
              Detail
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // ... (SessionDetailsModal dihilangkan dari sini karena sudah tidak relevan)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Memuat sesi aktif...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="card p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Gagal Memuat Sesi Aktif
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={getActiveSessions} className="btn-primary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Coba Lagi
          </button>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Sesi Absensi Aktif
          </h1>
          <p className="text-gray-600 mt-1">
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
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sesi Aktif</p>
              <p className="text-2xl font-bold text-gray-900">
                {activeSessions.length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-br from-green-500 to-green-600">
              <Play className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sesi</p>
              <p className="text-2xl font-bold text-gray-900">
                {sessions.length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Siswa Terlibat
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalStudents}
              </p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-br from-purple-500 to-purple-600">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      {sessions.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Daftar Sesi ({sessions.length})
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Clock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Tidak Ada Sesi Aktif
          </h3>
          <p className="text-gray-600 mb-6">
            Belum ada sesi absensi yang sedang berlangsung saat ini.
          </p>
        </div>
      )}
    </div>
  );
}
