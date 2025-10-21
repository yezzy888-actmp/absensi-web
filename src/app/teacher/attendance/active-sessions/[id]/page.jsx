// src/app/teacher/attendance/active-sessions/[id]/page.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTeacherAttendance } from "@/hooks/useApi"; // Ensure this path is correct
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
  TimerIcon,
  Download,
  Search,
  UserCheck,
  UserX,
  Settings,
  Smartphone,
  Wifi,
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

  const [refreshInterval, setRefreshInterval] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showToken, setShowToken] = useState(false);
  const [bulkAction, setBulkAction] = useState("");

  const {
    sessions, // This will be the general list of sessions if no sessionId is passed to getAttendanceSessions
    loading,
    error,
    getAttendanceSessions,
    markStudentPresent,
    markStudentAlpha, // Use this for "Tidak Hadir" (Alpha)
    markStudentSick, // New: For "Sakit"
    markStudentPermission, // New: For "Izin"
    addAbsentStudent, // This seems to be for adding a new absent student, not marking an existing one. Keep if needed elsewhere.
  } = useTeacherAttendance(user?.profileData?.id);

  // Define a local state for the current session details
  const [currentSessionDetails, setCurrentSessionDetails] = useState(null);

  // Fetch session data and set up auto-refresh
  useEffect(() => {
    let interval;
    const fetchSessionDetails = async () => {
      if (user?.profileData?.id && sessionId) {
        try {
          const fetchedSession = await getAttendanceSessions({ sessionId });
          // Explicitly set the fetched session to local state
          if (
            fetchedSession &&
            fetchedSession.sessions &&
            fetchedSession.sessions.length > 0
          ) {
            setCurrentSessionDetails(fetchedSession.sessions[0]);
          } else if (fetchedSession && fetchedSession.id) {
            // If the API directly returns the session object
            setCurrentSessionDetails(fetchedSession);
          } else {
            setCurrentSessionDetails(null); // Session not found or empty response
          }
        } catch (err) {
          console.error("Error fetching session details:", err);
          setCurrentSessionDetails(null);
        }
      }
    };

    fetchSessionDetails(); // Initial fetch

    // Auto-refresh every 15 seconds for real-time updates
    interval = setInterval(() => {
      fetchSessionDetails();
    }, 15000);

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user?.profileData?.id, sessionId, getAttendanceSessions]);

  // Use currentSessionDetails for rendering
  const currentSession = currentSessionDetails;

  // Format time remaining
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

  // Get session status
  const getSessionStatus = useCallback((session) => {
    if (!session?.expiresAt) return "active";

    const expiresAt = parseISO(session.expiresAt);
    const now = new Date();

    return isAfter(now, expiresAt) ? "expired" : "active";
  }, []);

  // Get attendance stats
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

    const sick = attendances.filter((a) => a.status === "SAKIT").length; // New: Sakit stat
    const permission = attendances.filter((a) => a.status === "IZIN").length; // New: Izin stat
    const pending = attendances.filter((a) => a.status === "PENDING").length;

    return { total, present, absent, sick, permission, pending };
  }, []);

  // Handle attendance marking
  const handleMarkAttendance = async (attendanceId, status) => {
    try {
      switch (status) {
        case "PRESENT":
          await markStudentPresent(attendanceId);
          break;
        case "ALPHA": // Using markStudentAlpha
          await markStudentAlpha(attendanceId);
          break;
        case "SICK": // Using markStudentSick
          await markStudentSick(attendanceId);
          break;
        case "PERMISSION": // Using markStudentPermission
          await markStudentPermission(attendanceId);
          break;
        case "LATE": // Retained if you still have a specific 'LATE' status in your backend logic, otherwise remove.
          // If 'LATE' is also considered a variant of 'HADIR' with a timestamp,
          // you might handle it differently or remove this case if it's not a direct markable status.
          // For now, assuming you might have a separate markStudentLate. If not, remove.
          // await markStudentLate(attendanceId); // This was not part of the initial destructuring, consider if it's truly needed or if 'PRESENT' covers it.
          toast.error("Status 'Terlambat' tidak dapat diubah secara manual."); // Or implement markStudentLate if it exists
          break;
        default:
          console.warn(`Unknown status: ${status}`);
          break;
      }
      // Re-fetch session data to update the UI after marking attendance
      const refetchSessionDetails = async () => {
        if (user?.profileData?.id && sessionId) {
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

  // Handle bulk attendance actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedStudents.length === 0) return;

    try {
      // Create an array of promises for each student's attendance update
      const bulkPromises = selectedStudents.map((attendanceId) => {
        // Map the bulkAction string to the corresponding mark function
        switch (bulkAction) {
          case "PRESENT":
            return markStudentPresent(attendanceId);
          case "ALPHA": // Use markStudentAlpha for bulk "Tidak Hadir"
            return markStudentAlpha(attendanceId);
          case "SICK": // Use markStudentSick for bulk "Sakit"
            return markStudentSick(attendanceId);
          case "PERMISSION": // Use markStudentPermission for bulk "Izin"
            return markStudentPermission(attendanceId);
          case "LATE":
            // Handle LATE if you have a specific markStudentLate function
            // or if it's implicitly handled by PRESENT with a check-in time.
            // For now, we'll give an error if it's selected for bulk as we don't have markStudentLate destructured.
            return Promise.reject(
              "Status 'Terlambat' tidak dapat diubah secara massal."
            );
          default:
            return Promise.resolve(); // Do nothing for unknown bulk actions
        }
      });

      await Promise.all(bulkPromises); // Wait for all bulk actions to complete
      setSelectedStudents([]); // Clear selected students
      setBulkAction(""); // Reset bulk action
      toast.success("Aksi massal berhasil diterapkan!");

      // Re-fetch session data to update the UI after bulk actions
      const refetchSessionDetails = async () => {
        if (user?.profileData?.id && sessionId) {
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

  // Copy token to clipboard
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

  // Filter attendances based on search and status
  const filteredAttendances = useCallback(() => {
    if (!currentSession?.attendances) return [];

    let filtered = currentSession.attendances;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (attendance) =>
          attendance.student?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          attendance.student?.nis?.includes(searchTerm)
      );
    }

    // Filter by status
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
          case "sick": // Filter by SICK
            return status === "SAKIT";
          case "permission": // Filter by IZIN
            return status === "IZIN";
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [currentSession, searchTerm, statusFilter]);

  // Loading state
  // Modified loading state to use currentSessionDetails
  if (loading && !currentSessionDetails) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Memuat detail sesi...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="card p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Gagal Memuat Detail Sesi
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => {
                // Trigger re-fetch of current session details
                if (user?.profileData?.id && sessionId) {
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
                    .catch((err) => console.error("Retry fetch failed:", err));
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
    );
  }

  // Session not found
  if (!currentSession) {
    // Use currentSession (which is currentSessionDetails)
    return (
      <div className="space-y-6">
        <div className="card p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sesi Tidak Ditemukan
          </h3>
          <p className="text-gray-600 mb-4">
            Sesi absensi yang Anda cari tidak ditemukan atau sudah tidak aktif.
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
    );
  }

  const timeRemaining = getTimeRemaining(currentSession);
  const sessionStatus = getSessionStatus(currentSession);
  const stats = getAttendanceStats(currentSession);
  const attendances = filteredAttendances();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <Link
            href="/teacher/attendance/active-sessions"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Detail Sesi Absensi
            </h1>
            <p className="text-gray-600 mt-1">
              {currentSession.schedule?.subject?.name} - Kelas{" "}
              {currentSession.schedule?.class?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={async () => {
              if (user?.profileData?.id && sessionId) {
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
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className={`w-4 h-4 rounded-full ${
                sessionStatus === "active"
                  ? "bg-green-500 animate-pulse"
                  : "bg-gray-400"
              }`}
            />
            <h2 className="text-xl font-semibold text-gray-900">
              Informasi Sesi
            </h2>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                sessionStatus === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {sessionStatus === "active" ? "Aktif" : "Berakhir"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <BookOpen className="w-4 h-4" />
              <span>
                {currentSession.schedule?.subject?.name || "Mata Pelajaran"}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>Kelas {currentSession.schedule?.class?.name || "-"}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>
                Ruang{" "}
                {currentSession.schedule?.class?.name || "Tidak ditentukan"}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>
                {currentSession.schedule?.startTime} -{" "}
                {currentSession.schedule?.endTime}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                {format(new Date(currentSession.date), "EEEE, dd MMMM yyyy", {
                  locale: id,
                })}
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
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Smartphone className="w-4 h-4" />
              <span
                onClick={() => setShowToken(!showToken)}
                className="cursor-pointer"
              >
                Token: {showToken ? currentSession.token : "••••••"}
              </span>
              {showToken && (
                <button
                  onClick={copyToken}
                  className="ml-2 text-blue-500 hover:text-blue-700 text-sm"
                  title="Salin Token"
                >
                  (Salin)
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Wifi className="w-4 h-4" />
              <span className="text-green-600">Online</span>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hadir</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.present}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tidak Hadir</p>
              <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
            </div>
            <UserX className="w-8 h-8 text-red-400" />
          </div>
        </div>

        {/* New: Sakit and Izin stats */}
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sakit</p>
              <p className="text-2xl font-bold text-blue-600">{stats.sick}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Izin</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.permission}
              </p>
            </div>
            <BookOpen className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {stats.total > 0 && (
        <div className="card p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress Absensi
            </span>
            <span className="text-sm font-medium text-gray-900">
              {Math.round(
                ((stats.present +
                  stats.absent +
                  stats.sick +
                  stats.permission) /
                  stats.total) *
                  100
              )}{" "}
              %
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
              style={{
                width: `${
                  ((stats.present +
                    stats.absent +
                    stats.sick +
                    stats.permission) /
                    stats.total) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari siswa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {selectedStudents.length} dipilih
              </span>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Pilih Aksi</option>
                <option value="PRESENT">Tandai Hadir</option>
                <option value="ALPHA">Tandai Tidak Hadir (Alpha)</option>
                <option value="SICK">Tandai Sakit</option>
                <option value="PERMISSION">Tandai Izin</option>
                {/* Removed LATE from bulk action as it might not be a direct 'mark' status or could be inferred */}
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="btn-primary btn-sm"
              >
                Terapkan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Attendance List */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Daftar Kehadiran ({attendances.length})
          </h3>
        </div>

        {attendances.length > 0 ? (
          <div className="space-y-3">
            {attendances.map((attendance) => (
              <div
                key={attendance.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  selectedStudents.includes(attendance.id)
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
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
                          selectedStudents.filter((id) => id !== attendance.id)
                        );
                      }
                    }}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />

                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center text-white font-medium">
                    {attendance.student?.name?.charAt(0) || "?"}
                  </div>

                  <div>
                    <div className="font-medium text-gray-900">
                      {attendance.student?.name || "Nama Siswa"}
                    </div>
                    <div className="text-sm text-gray-600">
                      NIS: {attendance.student?.nis || "ID Siswa"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {attendance.checkedInAt && (
                    <div className="text-xs text-gray-500">
                      {format(new Date(attendance.checkedInAt), "HH:mm", {
                        locale: id,
                      })}
                    </div>
                  )}

                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      attendance.status === "HADIR" ||
                      attendance.status === "PRESENT"
                        ? "bg-green-100 text-green-800"
                        : attendance.status === "TIDAK_HADIR" ||
                          attendance.status === "ABSENT" ||
                          attendance.status === "ALPHA"
                        ? "bg-red-100 text-red-800"
                        : attendance.status === "TERLAMBAT" ||
                          attendance.status === "LATE"
                        ? "bg-yellow-100 text-yellow-800"
                        : attendance.status === "SAKIT"
                        ? "bg-blue-100 text-blue-800"
                        : attendance.status === "IZIN"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {attendance.status === "HADIR" ||
                    attendance.status === "PRESENT"
                      ? "Hadir"
                      : attendance.status === "TIDAK_HADIR" ||
                        attendance.status === "ABSENT" ||
                        attendance.status === "ALPHA"
                      ? "Tidak Hadir (Alpha)"
                      : attendance.status === "TERLAMBAT" ||
                        attendance.status === "LATE"
                      ? "Terlambat"
                      : attendance.status === "SAKIT"
                      ? "Sakit"
                      : attendance.status === "IZIN"
                      ? "Izin"
                      : "Menunggu"}
                  </span>

                  {(attendance.status === "PENDING" ||
                    !attendance.status ||
                    attendance.status === "ALPHA" || // Allow manual change from Alpha
                    attendance.status === "SAKIT" || // Allow manual change from Sakit
                    attendance.status === "IZIN") && ( // Allow manual change from Izin
                    <div className="flex items-center space-x-1">
                      {/* Mark Present */}
                      <button
                        onClick={() =>
                          handleMarkAttendance(attendance.id, "PRESENT")
                        }
                        className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Tandai Hadir"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>

                      {/* Mark Absent/Alpha - Now uses ALPHA specifically */}
                      <button
                        onClick={() =>
                          handleMarkAttendance(attendance.id, "ALPHA")
                        }
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Tandai Tidak Hadir (Alpha)"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      {/* Mark Sick - NEW */}
                      <button
                        onClick={() =>
                          handleMarkAttendance(attendance.id, "SICK")
                        }
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Tandai Sakit"
                      >
                        <AlertCircle className="w-4 h-4" />
                      </button>
                      {/* Mark Permission - NEW */}
                      <button
                        onClick={() =>
                          handleMarkAttendance(attendance.id, "PERMISSION")
                        }
                        className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                        title="Tandai Izin"
                      >
                        <BookOpen className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== "all"
                ? "Tidak Ada Hasil"
                : "Belum Ada Siswa"}
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== "all"
                ? "Coba ubah filter atau kata kunci pencarian"
                : "Belum ada siswa yang terdaftar dalam sesi ini"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
