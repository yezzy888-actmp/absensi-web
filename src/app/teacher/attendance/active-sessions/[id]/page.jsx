// src/app/teacher/attendance/active-sessions/[id]/page.jsx (DENGAN SKEMA WARNA HARMONIS)
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTeacherAttendance } from "@/hooks/useApi";
import toast from "react-hot-toast";

import {
  Clock,
  Users,
  MapPin,
  BookOpen,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  Calendar,
  Search,
  UserCheck,
  UserX,
  Smartphone,
  Wifi,
  Heart,
  FileText,
} from "lucide-react";
import { formatDistanceToNow, parseISO, isAfter, format } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import QRCodeDisplay from "@/components/ui/QrCodeDisplay";

export default function ActiveSessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const sessionId = params.id;
  const teacherId = user?.profileData?.id;

  const [refreshInterval, setRefreshInterval] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showToken, setShowToken] = useState(false);
  const [bulkAction, setBulkAction] = useState("");

  const {
    loading,
    error,
    getAttendanceSessions,
    markStudentPresent,
    markStudentAlpha,
    markStudentSick,
    markStudentPermission,
  } = useTeacherAttendance(teacherId);

  const [currentSessionDetails, setCurrentSessionDetails] = useState(null);

  useEffect(() => {
    let interval;
    const fetchSessionDetails = async () => {
      if (teacherId && sessionId) {
        try {
          const fetchedSession = await getAttendanceSessions({ sessionId });

          if (
            fetchedSession &&
            fetchedSession.sessions &&
            fetchedSession.sessions.length > 0
          ) {
            setCurrentSessionDetails(fetchedSession.sessions[0]);
          } else if (fetchedSession && fetchedSession.id) {
            setCurrentSessionDetails(fetchedSession);
          } else {
            setCurrentSessionDetails(null);
          }
        } catch (err) {
          console.error("Error fetching session details:", err);
          setCurrentSessionDetails(null);
        }
      }
    };

    fetchSessionDetails();

    interval = setInterval(() => {
      fetchSessionDetails();
    }, 15000);

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [teacherId, sessionId, getAttendanceSessions]);

  const currentSession = currentSessionDetails;

  const getTimeRemaining = useCallback((session) => {
    if (!session?.expiresAt) return null;

    const expiresAt = parseISO(session.expiresAt);
    const now = new Date();

    if (isAfter(now, expiresAt)) {
      return "Berakhir";
    }

    return formatDistanceToNow(expiresAt, {
      addSuffix: true,
      locale: id,
    });
  }, []);

  const getSessionStatus = useCallback((session) => {
    if (!session?.expiresAt) return "active";

    const expiresAt = parseISO(session.expiresAt);
    const now = new Date();

    return isAfter(now, expiresAt) ? "expired" : "active";
  }, []);

  const getAttendanceStats = useCallback((session) => {
    const attendances = session?.attendances || [];
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

    const sick = attendances.filter((a) => a.status === "SAKIT").length;
    const permission = attendances.filter((a) => a.status === "IZIN").length;
    const pending = attendances.filter((a) => a.status === "PENDING").length;

    return { total, present, absent, sick, permission, pending };
  }, []);

  const handleMarkAttendance = async (attendanceId, status) => {
    try {
      switch (status) {
        case "PRESENT":
          await markStudentPresent(attendanceId);
          break;
        case "ALPHA":
          await markStudentAlpha(attendanceId);
          break;
        case "SICK":
          await markStudentSick(attendanceId);
          break;
        case "PERMISSION":
          await markStudentPermission(attendanceId);
          break;
        case "LATE":
          toast.error("Status 'Terlambat' tidak dapat diubah secara manual.");
          break;
      }

      const refetchSessionDetails = async () => {
        if (teacherId && sessionId) {
          try {
            const fetchedSession = await getAttendanceSessions({ sessionId });
            if (
              fetchedSession &&
              fetchedSession.sessions &&
              fetchedSession.sessions.length > 0
            ) {
              setCurrentSessionDetails(fetchedSession.sessions[0]);
            } else if (fetchedSession && fetchedSession.id) {
              setCurrentSessionDetails(fetchedSession);
            } else {
              setCurrentSessionDetails(null);
            }
          } catch (err) {
            console.error(
              "Error refetching session details after marking:",
              err
            );
          }
        }
      };
      refetchSessionDetails();
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error("Gagal memperbarui absensi.");
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedStudents.length === 0) return;

    try {
      const bulkPromises = selectedStudents.map((attendanceId) => {
        switch (bulkAction) {
          case "PRESENT":
            return markStudentPresent(attendanceId);
          case "ALPHA":
            return markStudentAlpha(attendanceId);
          case "SICK":
            return markStudentSick(attendanceId);
          case "PERMISSION":
            return markStudentPermission(attendanceId);
          case "LATE":
            return Promise.reject(
              "Status 'Terlambat' tidak dapat diubah secara massal."
            );
          default:
            return Promise.resolve();
        }
      });

      await Promise.all(bulkPromises);
      toast.success("Aksi massal berhasil diterapkan!");

      setSelectedStudents([]);
      setBulkAction("");

      const refetchSessionDetails = async () => {
        if (teacherId && sessionId) {
          try {
            const fetchedSession = await getAttendanceSessions({ sessionId });
            if (
              fetchedSession &&
              fetchedSession.sessions &&
              fetchedSession.sessions.length > 0
            ) {
              setCurrentSessionDetails(fetchedSession.sessions[0]);
            } else if (fetchedSession && fetchedSession.id) {
              setCurrentSessionDetails(fetchedSession);
            } else {
              setCurrentSessionDetails(null);
            }
          } catch (err) {
            console.error(
              "Error refetching session details after bulk action:",
              err
            );
          }
        }
      };
      refetchSessionDetails();
    } catch (error) {
      console.error("Error in bulk action:", error);
      toast.error(`Gagal menerapkan aksi massal: ${error.message || error}`);
    }
  };

  const copyToken = async () => {
    if (currentSession?.token) {
      try {
        await navigator.clipboard.writeText(currentSession.token);
        toast.success("Token berhasil disalin!");
      } catch (error) {
        console.error("Failed to copy token:", error);
        toast.error("Gagal menyalin token.");
      }
    }
  };

  const filteredAttendances = useCallback(() => {
    if (!currentSession?.attendances) return [];

    let filtered = currentSession.attendances;

    if (searchTerm) {
      filtered = filtered.filter(
        (attendance) =>
          attendance.student?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          attendance.student?.nis?.includes(searchTerm)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((attendance) => {
        const status = attendance.status?.toUpperCase();
        switch (statusFilter) {
          case "present":
            return status === "HADIR" || status === "PRESENT";
          case "absent":
            return (
              status === "TIDAK_HADIR" ||
              status === "ABSENT" ||
              status === "ALPHA"
            );
          case "pending":
            return status === "PENDING";
          case "sick":
            return status === "SAKIT";
          case "permission":
            return status === "IZIN";
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [currentSession, searchTerm, statusFilter]);

  if (loading && !currentSessionDetails) {
    return (
      <div className="min-h-screen gradient-bg-reverse">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <RefreshCw className="w-12 h-12 animate-spin text-blue-600" />
              <div className="absolute inset-0 w-12 h-12 rounded-full bg-blue-500 opacity-20 animate-pulse"></div>
            </div>
            <span className="mt-4 text-lg font-semibold text-gray-700">
              Memuat detail sesi...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen gradient-bg-reverse">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="card p-8 text-center max-w-md mx-auto">
            <div className="p-4 bg-red-50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Gagal Memuat Detail Sesi
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => {
                  if (teacherId && sessionId) {
                    getAttendanceSessions({ sessionId })
                      .then((fetchedSession) => {
                        if (
                          fetchedSession &&
                          fetchedSession.sessions &&
                          fetchedSession.sessions.length > 0
                        ) {
                          setCurrentSessionDetails(fetchedSession.sessions[0]);
                        } else if (fetchedSession && fetchedSession.id) {
                          setCurrentSessionDetails(fetchedSession);
                        } else {
                          setCurrentSessionDetails(null);
                        }
                      })
                      .catch((err) =>
                        console.error("Retry fetch failed:", err)
                      );
                  }
                }}
                className="btn-primary"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Coba Lagi
              </button>
              <Link
                href="/teacher/attendance/active-sessions"
                className="btn-secondary"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="min-h-screen gradient-bg-reverse">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="card p-8 text-center max-w-md mx-auto">
            <div className="p-4 bg-gray-50 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Sesi Tidak Ditemukan
            </h3>
            <p className="text-gray-600 mb-6">
              Sesi absensi yang Anda cari tidak ditemukan atau sudah tidak
              aktif.
            </p>
            <Link
              href="/teacher/attendance/active-sessions"
              className="btn-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar Sesi
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const timeRemaining = getTimeRemaining(currentSession);
  const sessionStatus = getSessionStatus(currentSession);
  const stats = getAttendanceStats(currentSession);
  const attendances = filteredAttendances();

  return (
    <div className="min-h-screen gradient-bg-reverse">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <Link
              href="/teacher/attendance/active-sessions"
              className="p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200 border border-blue-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-gradient mb-2">
                Detail Sesi Absensi
              </h1>
              <p className="text-gray-600 text-lg">
                {currentSession.schedule?.subject?.name} - Kelas{" "}
                {currentSession.schedule?.class?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={async () => {
                if (teacherId && sessionId) {
                  try {
                    const fetchedSession = await getAttendanceSessions({
                      sessionId,
                    });
                    if (
                      fetchedSession &&
                      fetchedSession.sessions &&
                      fetchedSession.sessions.length > 0
                    ) {
                      setCurrentSessionDetails(fetchedSession.sessions[0]);
                    } else if (fetchedSession && fetchedSession.id) {
                      setCurrentSessionDetails(fetchedSession);
                    } else {
                      setCurrentSessionDetails(null);
                    }
                  } catch (err) {
                    console.error("Error refreshing session details:", err);
                  }
                }
              }}
              className="btn-secondary"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Session Info Card */}
        <div className="card p-6 border-gradient">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div
                className={`w-4 h-4 rounded-full ${
                  sessionStatus === "active"
                    ? "bg-gradient-to-r from-green-500 to-green-600 animate-pulse shadow-lg shadow-green-500/50"
                    : "bg-gradient-to-r from-gray-400 to-gray-500"
                }`}
              />
              <h2 className="text-2xl font-bold text-gradient">
                Informasi Sesi
              </h2>
              <span
                className={`px-4 py-1.5 text-sm font-semibold rounded-full ${
                  sessionStatus === "active"
                    ? "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200"
                    : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 border border-gray-200"
                }`}
              >
                {sessionStatus === "active" ? "● Aktif" : "○ Berakhir"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-semibold text-gray-700">
                  {currentSession.schedule?.subject?.name || "Mata Pelajaran"}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-semibold text-gray-700">
                  Kelas {currentSession.schedule?.class?.name || "-"}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-semibold text-gray-700">
                  Ruang{" "}
                  {currentSession.schedule?.class?.name || "Tidak ditentukan"}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-semibold text-gray-700">
                  {currentSession.schedule?.startTime} -{" "}
                  {currentSession.schedule?.endTime}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-semibold text-gray-700">
                  {format(new Date(currentSession.date), "EEEE, dd MMMM yyyy", {
                    locale: id,
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                  <Timer className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-semibold text-gray-700">
                  {timeRemaining === "Berakhir"
                    ? "Sesi berakhir"
                    : `Berakhir ${timeRemaining}`}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="p-2 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                </div>
                <span
                  onClick={() => setShowToken(!showToken)}
                  className="cursor-pointer font-mono font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Token: {showToken ? currentSession.token : "••••••"}
                </span>
                {showToken && (
                  <button
                    onClick={copyToken}
                    className="ml-2 text-blue-600 hover:text-blue-700 text-xs font-semibold"
                    title="Salin Token"
                  >
                    Salin
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="p-2 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                  <Wifi className="w-4 h-4 text-green-600" />
                </div>
                <span className="font-semibold text-green-700">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <QRCodeDisplay
          token={currentSession.token}
          sessionInfo={{
            subject: currentSession.schedule?.subject?.name,
            class: currentSession.schedule?.class?.name,
            date: currentSession.date,
          }}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card p-5 border-gradient hover:shadow-blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Total
                </p>
                <p className="text-3xl font-bold text-gradient">
                  {stats.total}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="card p-5 border-gradient hover:shadow-blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Hadir
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.present}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="card p-5 border-gradient hover:shadow-blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Alpha
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {stats.absent}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
                <UserX className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="card p-5 border-gradient hover:shadow-blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">
                  Sakit
                </p>
                <p className="text-3xl font-bold text-blue-600">{stats.sick}</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500 shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="card p-5 border-gradient hover:shadow-blue">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Izin</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.permission}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Geolocation Display Section */}
        {currentSession.latitude && currentSession.radiusMeters && (
          <div className="card p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
            <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              Geolocation Boundary (Aktif untuk QR)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-sm">
                <p className="text-xs font-semibold text-orange-600 mb-2">
                  Latitude
                </p>
                <p className="font-mono text-lg font-bold text-gray-900">
                  {currentSession.latitude.toFixed(6)}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-sm">
                <p className="text-xs font-semibold text-orange-600 mb-2">
                  Longitude
                </p>
                <p className="font-mono text-lg font-bold text-gray-900">
                  {currentSession.longitude.toFixed(6)}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-orange-200 shadow-sm">
                <p className="text-xs font-semibold text-orange-600 mb-2">
                  Radius
                </p>
                <p className="font-mono text-lg font-bold text-gray-900">
                  {currentSession.radiusMeters} Meter
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="card p-5 border-gradient">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full lg:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input
                  type="text"
                  placeholder="Cari siswa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10 pr-4 py-2.5 w-full sm:w-64 border-2 border-blue-200 focus:!border-blue-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field border-2 border-blue-200 focus:!border-blue-500 py-2.5 px-4 w-full sm:w-auto font-semibold"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="present">Hadir</option>
                <option value="absent">Tidak Hadir (Alpha)</option>
                <option value="sick">Sakit</option>
                <option value="permission">Izin</option>
              </select>
            </div>

            {/* Bulk Actions */}
            {selectedStudents.length > 0 && (
              <div className="flex items-center space-x-3 w-full lg:w-auto">
                <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full">
                  {selectedStudents.length} dipilih
                </span>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="input-field border-2 border-blue-200 py-2.5 px-4 flex-1 font-semibold"
                >
                  <option value="">Pilih Aksi</option>
                  <option value="PRESENT">Tandai Hadir</option>
                  <option value="ALPHA">Tandai Tidak Hadir (Alpha)</option>
                  <option value="SICK">Tandai Sakit</option>
                  <option value="PERMISSION">Tandai Izin</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                  className="btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Terapkan
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Attendance List */}
        <div className="card p-6 border-gradient">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gradient">
              Daftar Kehadiran ({attendances.length})
            </h3>
          </div>

          {attendances.length > 0 ? (
            <div className="space-y-3">
              {attendances.map((attendance) => (
                <div
                  key={attendance.id}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 ${
                    selectedStudents.includes(attendance.id)
                      ? "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 shadow-blue"
                      : "bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-200"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(attendance.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents([
                            ...selectedStudents,
                            attendance.id,
                          ]);
                        } else {
                          setSelectedStudents(
                            selectedStudents.filter(
                              (id) => id !== attendance.id
                            )
                          );
                        }
                      }}
                      className="rounded-lg border-2 border-blue-300 text-blue-600 focus:ring-blue-500 w-5 h-5 cursor-pointer"
                    />

                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {attendance.student?.name?.charAt(0) || "?"}
                    </div>

                    <div>
                      <div className="font-bold text-gray-900">
                        {attendance.student?.name || "Nama Siswa"}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">
                        NIS: {attendance.student?.nis || "ID Siswa"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {attendance.checkedInAt && (
                      <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                        {format(new Date(attendance.checkedInAt), "HH:mm", {
                          locale: id,
                        })}
                      </div>
                    )}

                    <span
                      className={`px-4 py-2 text-xs font-bold rounded-xl border-2 ${
                        attendance.status === "HADIR" ||
                        attendance.status === "PRESENT"
                          ? "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-300"
                          : attendance.status === "TIDAK_HADIR" ||
                            attendance.status === "ABSENT" ||
                            attendance.status === "ALPHA"
                          ? "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-300"
                          : attendance.status === "TERLAMBAT" ||
                            attendance.status === "LATE"
                          ? "bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-300"
                          : attendance.status === "SAKIT"
                          ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-300"
                          : attendance.status === "IZIN"
                          ? "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-300"
                          : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-300"
                      }`}
                    >
                      {attendance.status === "HADIR" ||
                      attendance.status === "PRESENT"
                        ? "✓ Hadir"
                        : attendance.status === "TIDAK_HADIR" ||
                          attendance.status === "ABSENT" ||
                          attendance.status === "ALPHA"
                        ? "✗ Alpha"
                        : attendance.status === "TERLAMBAT" ||
                          attendance.status === "LATE"
                        ? "⏰ Terlambat"
                        : attendance.status === "SAKIT"
                        ? "🏥 Sakit"
                        : attendance.status === "IZIN"
                        ? "📄 Izin"
                        : "⏳ Menunggu"}
                    </span>

                    {(attendance.status === "PENDING" ||
                      !attendance.status ||
                      attendance.status === "ALPHA" ||
                      attendance.status === "SAKIT" ||
                      attendance.status === "IZIN") && (
                      <div className="flex items-center space-x-2">
                        {/* Mark Present */}
                        <button
                          onClick={() =>
                            handleMarkAttendance(attendance.id, "PRESENT")
                          }
                          className="p-2.5 text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-all duration-200 border border-green-200"
                          title="Tandai Hadir"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>

                        {/* Mark Absent/Alpha */}
                        <button
                          onClick={() =>
                            handleMarkAttendance(attendance.id, "ALPHA")
                          }
                          className="p-2.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 border border-red-200"
                          title="Tandai Tidak Hadir (Alpha)"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>

                        {/* Mark Sick */}
                        <button
                          onClick={() =>
                            handleMarkAttendance(attendance.id, "SICK")
                          }
                          className="p-2.5 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 border border-blue-200"
                          title="Tandai Sakit"
                        >
                          <Heart className="w-5 h-5" />
                        </button>

                        {/* Mark Permission */}
                        <button
                          onClick={() =>
                            handleMarkAttendance(attendance.id, "PERMISSION")
                          }
                          className="p-2.5 text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all duration-200 border border-purple-200"
                          title="Tandai Izin"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full w-28 h-28 mx-auto mb-6 flex items-center justify-center">
                <Users className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {searchTerm || statusFilter !== "all"
                  ? "Tidak Ada Hasil"
                  : "Belum Ada Siswa"}
              </h3>
              <p className="text-gray-600 text-lg">
                {searchTerm || statusFilter !== "all"
                  ? "Coba ubah filter atau kata kunci pencarian"
                  : "Belum ada siswa yang terdaftar dalam sesi ini"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
