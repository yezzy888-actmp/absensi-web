// src/app/teacher/attendance/page.jsx (Updated file path based on typical Next.js structure)
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTeacherAttendance } from "@/hooks/useApi"; // Ensure this path is correct
import { classAPI } from "@/lib/api"; // teacherAPI is used internally by useTeacherAttendance now
import toast from "react-hot-toast";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Save,
  Users,
  BookOpen,
  AlertTriangle,
  RefreshCw,
  Edit3,
  ClipboardCheck, // For Present
  ClipboardX, // For Alpha
  Bed, // For Sick
  FileText, // For Permission
} from "lucide-react";

// Status absensi yang akan digunakan
const AttendanceStatus = {
  HADIR: "HADIR",
  IZIN: "IZIN",
  SAKIT: "SAKIT",
  ALPHA: "ALPHA",
  NOT_MARKED: "NOT_MARKED", // Add this to represent un-marked students
};

// Helper to format time (HH:MM)
const formatTime = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const getStatusColorAndText = (status) => {
  let colorClass = "bg-gray-100 text-gray-800";
  let text = "Belum Diabsen";

  if (!status || status === AttendanceStatus.NOT_MARKED) {
    return { colorClass, text };
  }

  switch (status.toUpperCase()) {
    case AttendanceStatus.HADIR:
      colorClass = "bg-green-100 text-green-800";
      text = "Hadir";
      break;
    case AttendanceStatus.ALPHA:
      colorClass = "bg-red-100 text-red-800";
      text = "Alpha";
      break;
    case AttendanceStatus.SAKIT:
      colorClass = "bg-purple-100 text-purple-800";
      text = "Sakit";
      break;
    case AttendanceStatus.IZIN:
      colorClass = "bg-blue-100 text-blue-800";
      text = "Izin";
      break;
    default:
      if (typeof status === "string") {
        text = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
      } else {
        text = "Status Tidak Diketahui";
      }
      break;
  }
  return { colorClass, text };
};

export default function ManageAttendancePage() {
  const { user } = useAuth();
  const teacherId = user?.profileData?.id;

  const {
    loading: loadingHook,
    error: errorHook,
    getAttendanceSessions,
    createStudentAttendance, // For creating new records
    markStudentPresent, // For updating existing records
    markStudentAlpha,
    markStudentSick,
    markStudentPermission,
  } = useTeacherAttendance(teacherId);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [fetchedSessions, setFetchedSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingSessionDetails, setLoadingSessionDetails] = useState(false);
  const [showOnlyActiveSessions, setShowOnlyActiveSessions] = useState(true);
  const [studentBeingEdited, setStudentBeingEdited] = useState(null);
  const [manualStatus, setManualStatus] = useState(AttendanceStatus.HADIR);
  const [manualReason, setManualReason] = useState("");
  const [submitManualLoading, setSubmitManualLoading] = useState(false);

  // Function to fetch sessions for the selected date
  const fetchSessionsForDateCallback = useCallback(async () => {
    if (!teacherId || !selectedDate) return;
    setLoadingSessions(true);
    setSelectedSession(null); // Clear selected session when fetching new date's sessions
    try {
      const params = { date: selectedDate, limit: 100 };
      const todayISO = new Date().toISOString().split("T")[0];
      if (showOnlyActiveSessions && selectedDate === todayISO) {
        params.active = "true";
      }
      const response = await getAttendanceSessions(params);
      setFetchedSessions(response?.sessions || response || []);
    } catch (err) {
      console.error("Failed to fetch sessions for date:", err);
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Gagal memuat sesi absensi."
      );
      setFetchedSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }, [teacherId, selectedDate, getAttendanceSessions, showOnlyActiveSessions]);

  // Effect to refetch sessions when date or active session toggle changes
  useEffect(() => {
    fetchSessionsForDateCallback();
  }, [fetchSessionsForDateCallback]);

  // Handle selecting a session to view its attendance details
  const handleSessionSelect = useCallback(
    async (sessionStub) => {
      if (!teacherId || !sessionStub?.id) return;
      setLoadingSessionDetails(true);
      setSelectedSession(null); // Clear previous selection before loading new details
      try {
        // Fetch detailed session information, including attendances
        const sessionDetailsResponse = await getAttendanceSessions({
          sessionId: sessionStub.id,
          includeAttendances: true,
          limit: 1, // We only need details for this specific session
        });

        const detailedSession =
          sessionDetailsResponse?.sessions?.[0] ||
          sessionDetailsResponse?.[0] ||
          sessionDetailsResponse?.session ||
          sessionDetailsResponse;

        if (!detailedSession || !detailedSession.schedule?.class?.id) {
          toast.error(
            "Detail sesi tidak lengkap atau ID kelas tidak ditemukan."
          );
          // Fallback to displaying just the stub if details couldn't be loaded
          const currentFetched = fetchedSessions.find(
            (s) => s.id === sessionStub.id
          );
          setSelectedSession(currentFetched || sessionStub);
          setLoadingSessionDetails(false);
          return;
        }

        // Fetch class roster (students)
        const classStudentsResponse = await classAPI.getClassStudents(
          detailedSession.schedule.class.id,
          { limit: 500 } // Fetch a generous limit for class students
        );
        const classRoster =
          classStudentsResponse.data?.students ||
          classStudentsResponse.data?.users ||
          [];

        if (classRoster.length === 0 && detailedSession.schedule?.class?.id) {
          toast.warn("Tidak ada siswa yang terdaftar di kelas ini.", {
            duration: 4000,
          });
        }

        // Map existing attendances for quick lookup
        const existingAttendancesMap = new Map(
          (detailedSession.attendances || []).map((att) => [
            att.student?.id,
            att,
          ])
        );

        // Combine class roster with existing attendance data
        const finalAttendances = classRoster.map((studentFromRoster) => {
          const existingAtt = existingAttendancesMap.get(studentFromRoster.id);
          if (existingAtt) {
            return existingAtt;
          } else {
            // If no existing attendance, create a placeholder
            return {
              id: null, // Indicates no existing attendance record
              student: studentFromRoster,
              status: AttendanceStatus.NOT_MARKED,
              notes: "",
              sessionId: detailedSession.id,
              scheduleId: detailedSession.schedule.id,
              date: detailedSession.date || selectedDate,
            };
          }
        });

        // Sort students by name
        finalAttendances.sort((a, b) =>
          (a.student?.name || a.student?.fullName || "").localeCompare(
            b.student?.name || b.student?.fullName || ""
          )
        );

        setSelectedSession({
          ...detailedSession,
          attendances: finalAttendances,
        });
      } catch (error) {
        console.error("Error fetching session details and roster:", error);
        toast.error("Gagal memuat detail sesi dan daftar siswa.");
        // Revert to session stub if detailed fetch fails
        const currentFetched = fetchedSessions.find(
          (s) => s.id === sessionStub.id
        );
        setSelectedSession(currentFetched || sessionStub);
      } finally {
        setLoadingSessionDetails(false);
      }
    },
    [teacherId, getAttendanceSessions, selectedDate, fetchedSessions]
  );

  // Centralized function to handle marking or updating student attendance
  const handleUpdateOrMarkAttendance = useCallback(
    async (attendanceRecord, newStatus, notes = "") => {
      const studentId = attendanceRecord.student.id;
      const studentName =
        attendanceRecord.student?.name || attendanceRecord.student?.fullName;
      const currentAttendanceId = attendanceRecord.id;

      if (!selectedSession?.id || !studentId) {
        toast.error("Sesi atau siswa tidak valid.");
        return;
      }

      const originalAttendances = selectedSession.attendances;

      // Optimistic UI update
      setSelectedSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          attendances: prev.attendances.map((att) =>
            att.student.id === studentId
              ? {
                  ...att,
                  status: newStatus,
                  notes: notes,
                  // If it's a new record being created, we assign a temporary ID.
                  // The actual ID from the backend will replace it later.
                  id: att.id || `temp-${studentId}-${Date.now()}`,
                }
              : att
          ),
        };
      });

      try {
        let response;
        if (
          currentAttendanceId &&
          currentAttendanceId.startsWith("temp-") === false
        ) {
          // If attendance record already exists (has a real ID), use update functions
          switch (newStatus) {
            case AttendanceStatus.HADIR:
              response = await markStudentPresent(currentAttendanceId);
              break;
            case AttendanceStatus.ALPHA:
              response = await markStudentAlpha(currentAttendanceId);
              break;
            case AttendanceStatus.SAKIT:
              response = await markStudentSick(currentAttendanceId);
              break;
            case AttendanceStatus.IZIN:
              response = await markStudentPermission(currentAttendanceId);
              break;
            default:
              // Fallback to create if status is unknown or not explicitly handled for update
              // This case should ideally not be hit if statuses are strictly HADIR, ALPHA, SAKIT, IZIN
              response = await createStudentAttendance(
                selectedSession.id,
                studentId,
                newStatus,
                notes
              );
              break;
          }
        } else {
          // If no attendance record exists (id is null or temporary), create a new one
          response = await createStudentAttendance(
            selectedSession.id,
            studentId,
            newStatus,
            notes
          );
        }

        const displayStatusText = getStatusColorAndText(
          response.attendance?.status || response?.status
        ).text;

        toast.success(
          `Status ${
            studentName || "siswa"
          } berhasil diubah menjadi ${displayStatusText.toLowerCase()}.`
        );

        // Update UI with the actual response from the backend (especially important for new IDs)
        setSelectedSession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            attendances: prev.attendances.map((att) =>
              att.student.id === studentId
                ? {
                    ...att,
                    ...(response.attendance || response), // Use response data to update
                    id: response.attendance?.id || response?.id || att.id, // Ensure actual ID is set
                    status:
                      response.attendance?.status ||
                      response?.status ||
                      newStatus,
                  }
                : att
            ),
          };
        });
      } catch (error) {
        console.error("Failed to mark attendance:", error);
        toast.error(
          error.response?.data?.message ||
            error.message ||
            "Gagal memperbarui status absensi."
        );
        // Revert optimistic update on error
        setSelectedSession((prev) => ({
          ...prev,
          attendances: originalAttendances,
        }));
      }
    },
    [
      selectedSession,
      createStudentAttendance,
      markStudentPresent,
      markStudentAlpha,
      markStudentSick,
      markStudentPermission,
    ]
  );

  // Handler for direct status buttons (Hadir, Alpha)
  const handleQuickMark = useCallback(
    (attendanceRecord, status) => {
      handleUpdateOrMarkAttendance(attendanceRecord, status);
    },
    [handleUpdateOrMarkAttendance]
  );

  // Handler for manual status submission (from the modal/inline edit)
  const handleManualStatusSubmit = async (studentId, studentName) => {
    if (!selectedSession?.id || !studentId) {
      toast.error("Sesi atau siswa tidak valid.");
      return;
    }

    setSubmitManualLoading(true);

    try {
      // Find the attendance record to pass to the generic handler
      const attendanceRecord = selectedSession.attendances.find(
        (att) => att.student.id === studentId
      );

      if (!attendanceRecord) {
        throw new Error("Attendance record for student not found in session.");
      }

      await handleUpdateOrMarkAttendance(
        attendanceRecord,
        manualStatus,
        manualReason
      );

      // Reset form
      setStudentBeingEdited(null);
      setManualStatus(AttendanceStatus.HADIR);
      setManualReason("");
    } catch (error) {
      // Error handling is already done in handleUpdateOrMarkAttendance
    } finally {
      setSubmitManualLoading(false);
    }
  };

  if (!user || !teacherId) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Memuat data pengguna...</p>
      </div>
    );
  }

  if (loadingHook && !fetchedSessions.length && !selectedSession) {
    return (
      <div className="flex justify-center items-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
        <span className="ml-2">Memuat data awal...</span>
      </div>
    );
  }

  if (errorHook) {
    return (
      <div className="text-center p-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-lg font-medium text-red-700">
          Terjadi Kesalahan
        </h3>
        <p className="mt-1 text-sm text-red-600">
          {typeof errorHook === "string"
            ? errorHook
            : errorHook.message || "Gagal memuat data absensi dasar."}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Manajemen Absensi Siswa
        </h1>
      </div>

      {/* Date Picker and Refresh */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-end gap-2">
            <div>
              <label
                htmlFor="attendance-date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Pilih Tanggal:
              </label>
              <input
                type="date"
                id="attendance-date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSession(null); // Clear selected session when date changes
                }}
                className="form-input rounded-md shadow-sm"
              />
            </div>
            <div className="pt-5">
              <label
                htmlFor="show-active-toggle"
                className="flex items-center text-sm text-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  id="show-active-toggle"
                  checked={showOnlyActiveSessions}
                  onChange={(e) => {
                    setShowOnlyActiveSessions(e.target.checked);
                    setSelectedSession(null); // Clear selected session when toggle changes
                  }}
                  className="form-checkbox h-4 w-4 text-green-600 rounded mr-2"
                />
                Hanya Sesi Aktif (Hari Ini)
              </label>
            </div>
            <button
              onClick={fetchSessionsForDateCallback}
              className="btn-secondary p-2 ml-2 self-end"
              title="Refresh Sesi"
              disabled={loadingSessions}
            >
              <RefreshCw
                size={20}
                className={loadingSessions ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      {loadingSessions ? (
        <div className="text-center py-8">
          <RefreshCw className="w-6 h-6 mx-auto animate-spin text-green-500" />
          <p className="mt-2 text-gray-600">Memuat sesi absensi...</p>
        </div>
      ) : fetchedSessions.length === 0 ? (
        <div className="card p-6 text-center text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-lg">Tidak ada sesi absensi</p>
          <p className="text-sm">
            {showOnlyActiveSessions &&
            selectedDate === new Date().toISOString().split("T")[0]
              ? `Tidak ditemukan sesi aktif untuk tanggal ${selectedDate}. Coba nonaktifkan filter "Hanya Sesi Aktif".`
              : `Tidak ditemukan sesi untuk tanggal ${selectedDate}.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fetchedSessions.map((session) => (
            <div
              key={session.id}
              className={`card p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-lg ${
                selectedSession?.id === session.id
                  ? "border-green-500 bg-green-50 scale-105 shadow-green-200"
                  : "border-gray-300 hover:border-green-400"
              }`}
              onClick={() => handleSessionSelect(session)}
            >
              <div className="flex items-center space-x-3 mb-1">
                <BookOpen className="w-5 h-5 text-green-600 flex-shrink-0" />
                <h3
                  className="font-semibold text-gray-800 truncate"
                  title={session.schedule?.subject?.name || "Tanpa Nama Subjek"}
                >
                  {session.schedule?.subject?.name || "Subjek N/A"}
                </h3>
              </div>
              <div className="flex items-center space-x-3 mb-2">
                <Users className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <p
                  className="text-sm text-gray-600 truncate"
                  title={session.schedule?.class?.name || "Tanpa Nama Kelas"}
                >
                  Kelas {session.schedule?.class?.name || "N/A"}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <p className="text-xs text-gray-500">
                  {formatTime(session.schedule?.startTime)} -{" "}
                  {formatTime(session.schedule?.endTime)}
                </p>
              </div>
              {session.expiresAt &&
                new Date(session.expiresAt) > new Date() && (
                  <p className="text-xs text-green-600 font-semibold mt-1">
                    Aktif hingga: {formatTime(session.expiresAt)}
                  </p>
                )}
              {loadingSessionDetails && selectedSession?.id === session.id && (
                <RefreshCw className="w-4 h-4 animate-spin text-green-500 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Selected Session Details - Student List */}
      {loadingSessionDetails && !selectedSession ? (
        <div className="card p-6 mt-6 text-center">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-green-500" />
          <p className="mt-2 text-gray-600">
            Memuat detail sesi dan daftar siswa...
          </p>
        </div>
      ) : (
        selectedSession && (
          <div className="card p-6 mt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              Detail Sesi: {selectedSession.schedule?.subject?.name || "N/A"} -
              Kelas {selectedSession.schedule?.class?.name || "N/A"}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Tanggal:{" "}
              {new Date(
                selectedSession.date || selectedDate
              ).toLocaleDateString("id-ID", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              , Waktu Jadwal: {formatTime(selectedSession.schedule?.startTime)}{" "}
              - {formatTime(selectedSession.schedule?.endTime)}
            </p>

            {selectedSession.attendances &&
            selectedSession.attendances.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Siswa
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedSession.attendances.map((att) => {
                      const { colorClass, text: statusText } =
                        getStatusColorAndText(att.status);
                      const isBeingEdited =
                        studentBeingEdited === att.student.id;

                      return (
                        <tr key={att.student.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {att.student?.name ||
                              att.student?.fullName ||
                              "Nama Siswa Tidak Tersedia"}
                            <span className="block text-xs text-gray-500">
                              NIS: {att.student?.nis || "N/A"}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <span
                              className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}
                            >
                              {statusText}
                            </span>
                            {att.notes && (
                              <p className="text-xs text-gray-500 mt-1">
                                Catatan: {att.notes}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            {isBeingEdited ? (
                              <div className="space-y-2 min-w-max">
                                <div className="flex items-center space-x-2">
                                  <select
                                    value={manualStatus}
                                    onChange={(e) =>
                                      setManualStatus(e.target.value)
                                    }
                                    className="form-select text-xs py-1 px-2 rounded border-gray-300"
                                  >
                                    {Object.values(AttendanceStatus)
                                      .filter(
                                        (s) => s !== AttendanceStatus.NOT_MARKED
                                      ) // Don't show NOT_MARKED as an option to set
                                      .map((statusOption) => (
                                        <option
                                          key={statusOption}
                                          value={statusOption}
                                        >
                                          {
                                            getStatusColorAndText(statusOption)
                                              .text
                                          }
                                        </option>
                                      ))}
                                  </select>
                                </div>
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() =>
                                      handleManualStatusSubmit(
                                        att.student.id,
                                        att.student?.name
                                      )
                                    }
                                    disabled={submitManualLoading}
                                    className="btn-primary text-xs py-1 px-2 inline-flex items-center"
                                  >
                                    {submitManualLoading ? (
                                      <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                                    ) : (
                                      <Save className="w-3 h-3 mr-1" />
                                    )}
                                    Simpan
                                  </button>
                                  <button
                                    onClick={() => {
                                      setStudentBeingEdited(null);
                                      setManualStatus(AttendanceStatus.HADIR);
                                    }}
                                    className="btn-secondary text-xs py-1 px-2"
                                  >
                                    Batal
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() =>
                                    handleQuickMark(att, AttendanceStatus.HADIR)
                                  }
                                  className="p-1 rounded-full hover:bg-green-100 text-green-500 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                  disabled={
                                    att.status === AttendanceStatus.HADIR
                                  }
                                  title="Tandai Hadir"
                                >
                                  <ClipboardCheck size={20} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleQuickMark(att, AttendanceStatus.ALPHA)
                                  }
                                  className="p-1 rounded-full hover:bg-red-100 text-red-500 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                  disabled={
                                    att.status === AttendanceStatus.ALPHA
                                  }
                                  title="Tandai Alpha"
                                >
                                  <ClipboardX size={20} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleQuickMark(att, AttendanceStatus.SAKIT)
                                  }
                                  className="p-1 rounded-full hover:bg-purple-100 text-purple-500 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                  disabled={
                                    att.status === AttendanceStatus.SAKIT
                                  }
                                  title="Tandai Sakit"
                                >
                                  <Bed size={20} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleQuickMark(att, AttendanceStatus.IZIN)
                                  }
                                  className="p-1 rounded-full hover:bg-blue-100 text-blue-500 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                  disabled={
                                    att.status === AttendanceStatus.IZIN
                                  }
                                  title="Tandai Izin"
                                >
                                  <FileText size={20} />
                                </button>
                                <button
                                  onClick={() => {
                                    setStudentBeingEdited(att.student.id);
                                    // Pre-fill manual status with current status if available, otherwise default to HADIR
                                    setManualStatus(
                                      att.status !== AttendanceStatus.NOT_MARKED
                                        ? att.status
                                        : AttendanceStatus.HADIR
                                    );
                                    setManualReason(att.notes || "");
                                  }}
                                  className="p-1 rounded-full hover:bg-blue-100 text-blue-500"
                                  title="Edit Status & Catatan"
                                >
                                  <Edit3 size={20} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-6 text-gray-500">
                {selectedSession.schedule?.class?.id
                  ? "Tidak ada siswa terdaftar di kelas ini atau data absensi siswa belum termuat."
                  : "Informasi kelas tidak tersedia untuk sesi ini."}
              </p>
            )}
          </div>
        )
      )}
    </div>
  );
}
