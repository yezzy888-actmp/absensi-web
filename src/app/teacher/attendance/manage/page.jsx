// src/app/teacher/attendance/page.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTeacherAttendance } from "@/hooks/useApi";
import { classAPI } from "@/lib/api";
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
  ClipboardCheck,
  ClipboardX,
  Bed,
  FileText,
} from "lucide-react";

const AttendanceStatus = {
  HADIR: "HADIR",
  IZIN: "IZIN",
  SAKIT: "SAKIT",
  ALPHA: "ALPHA",
  NOT_MARKED: "NOT_MARKED",
};

const formatTime = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const getStatusColorAndText = (status) => {
  let colorClass = "bg-gray-100 text-gray-800 border border-gray-200";
  let text = "Belum Diabsen";

  if (!status || status === AttendanceStatus.NOT_MARKED) {
    return { colorClass, text };
  }

  switch (status.toUpperCase()) {
    case AttendanceStatus.HADIR:
      colorClass = "bg-green-100 text-green-800 border border-green-200";
      text = "Hadir";
      break;
    case AttendanceStatus.ALPHA:
      colorClass = "bg-red-100 text-red-800 border border-red-200";
      text = "Alpha";
      break;
    case AttendanceStatus.SAKIT:
      colorClass = "bg-purple-100 text-purple-800 border border-purple-200";
      text = "Sakit";
      break;
    case AttendanceStatus.IZIN:
      colorClass = "bg-blue-100 text-blue-800 border border-blue-200";
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
    createStudentAttendance,
    markStudentPresent,
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

  const fetchSessionsForDateCallback = useCallback(async () => {
    if (!teacherId || !selectedDate) return;
    setLoadingSessions(true);
    setSelectedSession(null);
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

  useEffect(() => {
    fetchSessionsForDateCallback();
  }, [fetchSessionsForDateCallback]);

  const handleSessionSelect = useCallback(
    async (sessionStub) => {
      if (!teacherId || !sessionStub?.id) return;
      setLoadingSessionDetails(true);
      setSelectedSession(null);
      try {
        const sessionDetailsResponse = await getAttendanceSessions({
          sessionId: sessionStub.id,
          includeAttendances: true,
          limit: 1,
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
          const currentFetched = fetchedSessions.find(
            (s) => s.id === sessionStub.id
          );
          setSelectedSession(currentFetched || sessionStub);
          setLoadingSessionDetails(false);
          return;
        }

        const classStudentsResponse = await classAPI.getClassStudents(
          detailedSession.schedule.class.id,
          { limit: 500 }
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

        const existingAttendancesMap = new Map(
          (detailedSession.attendances || []).map((att) => [
            att.student?.id,
            att,
          ])
        );

        const finalAttendances = classRoster.map((studentFromRoster) => {
          const existingAtt = existingAttendancesMap.get(studentFromRoster.id);
          if (existingAtt) {
            return existingAtt;
          } else {
            return {
              id: null,
              student: studentFromRoster,
              status: AttendanceStatus.NOT_MARKED,
              notes: "",
              sessionId: detailedSession.id,
              scheduleId: detailedSession.schedule.id,
              date: detailedSession.date || selectedDate,
            };
          }
        });

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
              response = await createStudentAttendance(
                selectedSession.id,
                studentId,
                newStatus,
                notes
              );
              break;
          }
        } else {
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

        setSelectedSession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            attendances: prev.attendances.map((att) =>
              att.student.id === studentId
                ? {
                    ...att,
                    ...(response.attendance || response),
                    id: response.attendance?.id || response?.id || att.id,
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

  const handleQuickMark = useCallback(
    (attendanceRecord, status) => {
      handleUpdateOrMarkAttendance(attendanceRecord, status);
    },
    [handleUpdateOrMarkAttendance]
  );

  const handleManualStatusSubmit = async (studentId, studentName) => {
    if (!selectedSession?.id || !studentId) {
      toast.error("Sesi atau siswa tidak valid.");
      return;
    }

    setSubmitManualLoading(true);

    try {
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

      setStudentBeingEdited(null);
      setManualStatus(AttendanceStatus.HADIR);
      setManualReason("");
    } catch (error) {
      // Error already handled
    } finally {
      setSubmitManualLoading(false);
    }
  };

  if (!user || !teacherId) {
    return (
      <div className="flex justify-center items-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mr-2" />
        <p className="text-gray-600">Memuat data pengguna...</p>
      </div>
    );
  }

  if (loadingHook && !fetchedSessions.length && !selectedSession) {
    return (
      <div className="flex justify-center items-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mr-2" />
        <span className="text-gray-600">Memuat data awal...</span>
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

      {/* Date Picker and Refresh - Updated dengan warna blue */}
      <div className="card p-4 border-2 border-blue-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-end gap-2">
            <div>
              <label
                htmlFor="attendance-date"
                className="block text-sm font-medium text-blue-900 mb-1"
              >
                Pilih Tanggal:
              </label>
              <input
                type="date"
                id="attendance-date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSession(null);
                }}
                className="input-field"
              />
            </div>
            <div className="pt-5">
              <label
                htmlFor="show-active-toggle"
                className="flex items-center text-sm text-gray-700 cursor-pointer hover:text-blue-700 transition-colors"
              >
                <input
                  type="checkbox"
                  id="show-active-toggle"
                  checked={showOnlyActiveSessions}
                  onChange={(e) => {
                    setShowOnlyActiveSessions(e.target.checked);
                    setSelectedSession(null);
                  }}
                  className="form-checkbox h-4 w-4 text-blue-600 rounded mr-2"
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

      {/* Sessions List - Updated dengan warna blue */}
      {loadingSessions ? (
        <div className="text-center py-8">
          <RefreshCw className="w-6 h-6 mx-auto animate-spin text-blue-600" />
          <p className="mt-2 text-gray-600">Memuat sesi absensi...</p>
        </div>
      ) : fetchedSessions.length === 0 ? (
        <div className="card p-6 text-center text-gray-500 border-2 border-blue-100">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-blue-300" />
          <p className="text-lg font-semibold text-gray-700">
            Tidak ada sesi absensi
          </p>
          <p className="text-sm mt-2">
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
                  ? "border-blue-500 bg-blue-50 scale-105 shadow-blue"
                  : "border-blue-200 hover:border-blue-400"
              }`}
              onClick={() => handleSessionSelect(session)}
            >
              <div className="flex items-center space-x-3 mb-1">
                <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0" />
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
                  <p className="text-xs text-blue-600 font-semibold mt-1">
                    Aktif hingga: {formatTime(session.expiresAt)}
                  </p>
                )}
              {loadingSessionDetails && selectedSession?.id === session.id && (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Selected Session Details - Updated dengan warna blue */}
      {loadingSessionDetails && !selectedSession ? (
        <div className="card p-6 mt-6 text-center border-2 border-blue-100">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-600" />
          <p className="mt-2 text-gray-600">
            Memuat detail sesi dan daftar siswa...
          </p>
        </div>
      ) : (
        selectedSession && (
          <div className="card p-6 mt-6 border-2 border-blue-100">
            <h2 className="text-xl font-bold text-blue-900 mb-1">
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
                <table className="min-w-full divide-y divide-blue-100">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                        Siswa
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-blue-50">
                    {selectedSession.attendances.map((att, index) => {
                      const { colorClass, text: statusText } =
                        getStatusColorAndText(att.status);
                      const isBeingEdited =
                        studentBeingEdited === att.student.id;

                      return (
                        <tr
                          key={att.student.id}
                          className={`hover:bg-blue-50 transition-colors ${
                            index % 2 === 0 ? "bg-white" : "bg-blue-25"
                          }`}
                        >
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
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}
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
                                    className="form-select text-xs py-1 px-2 rounded border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                                  >
                                    {Object.values(AttendanceStatus)
                                      .filter(
                                        (s) => s !== AttendanceStatus.NOT_MARKED
                                      )
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
                                  className="p-1 rounded-full hover:bg-green-100 text-green-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
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
                                  className="p-1 rounded-full hover:bg-red-100 text-red-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
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
                                  className="p-1 rounded-full hover:bg-purple-100 text-purple-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
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
                                  className="p-1 rounded-full hover:bg-blue-100 text-blue-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
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
                                    setManualStatus(
                                      att.status !== AttendanceStatus.NOT_MARKED
                                        ? att.status
                                        : AttendanceStatus.HADIR
                                    );
                                    setManualReason(att.notes || "");
                                  }}
                                  className="p-1 rounded-full hover:bg-blue-100 text-blue-600 transition-colors"
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
