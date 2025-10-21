// src/app/teacher/attendance/create-session/page.jsx (KODE LENGKAP DENGAN PERBAIKAN TAMPILAN UX)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { useTeacherSchedule, useTeacherAttendance } from "@/hooks/useApi";
import { teacherAPI } from "@/lib/api";
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  MapPin,
  ArrowLeft,
  Play,
  Settings,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Timer,
  QrCode,
} from "lucide-react";
import toast from "react-hot-toast";
import SchoolLocationPickerMap from "@/components/guru/SchoolLocationPickerMap"; // Import komponen peta baru

export default function CreateAttendanceSessionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const teacherId = user?.profileData?.id;

  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(30);
  const [sessionType, setSessionType] = useState("manual"); // manual, qr
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isCreating, setIsCreating] = useState(false);

  // State baru untuk data lokasi dari peta
  const [locationData, setLocationData] = useState(null);

  // Get teacher schedule
  const {
    schedule,
    loading: scheduleLoading,
    error: scheduleError,
    getScheduleForDay,
    refetch: refetchSchedule,
  } = useTeacherSchedule(teacherId);

  // Get teacher attendance functions
  const {
    createSession,
    getActiveSessions,
    sessions: activeSessions,
    loading: sessionLoading,
  } = useTeacherAttendance(teacherId);

  // Get today's schedule (redundant check for date logic)
  const {
    data: todayScheduleData,
    loading: todayLoading,
    refetch: refetchToday,
  } = useApi(
    teacherId
      ? () => {
          const today = new Date()
            .toLocaleDateString("id-ID", { weekday: "long" })
            .toUpperCase();
          return teacherAPI.getDaySchedule(teacherId, today);
        }
      : null,
    {
      immediate: !!teacherId,
      showToast: false,
    }
  );

  // Get active sessions on component mount
  useEffect(() => {
    if (teacherId) {
      getActiveSessions();
    }
  }, [teacherId, getActiveSessions]);

  // Get current time info
  const getCurrentTimeInfo = () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const currentDay = now
      .toLocaleDateString("id-ID", { weekday: "long" })
      .toUpperCase();
    const currentDate = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return { currentTime, currentDay, currentDate };
  };

  // Get schedule for selected date
  const getScheduleForSelectedDate = () => {
    const date = new Date(selectedDate);
    const dayName = date
      .toLocaleDateString("id-ID", { weekday: "long" })
      .toUpperCase();

    // Gunakan data dari useTeacherSchedule yang lebih lengkap
    if (!schedule) return [];
    return schedule[dayName] || [];
  };

  // Check if schedule is currently active
  const isScheduleActive = (scheduleItem) => {
    const { currentTime, currentDay } = getCurrentTimeInfo();
    const scheduleDay = new Date(selectedDate)
      .toLocaleDateString("id-ID", { weekday: "long" })
      .toUpperCase();

    if (scheduleDay !== currentDay) return false;

    return (
      currentTime >= scheduleItem.startTime &&
      currentTime <= scheduleItem.endTime
    );
  };

  // Check if schedule is upcoming
  const isScheduleUpcoming = (scheduleItem) => {
    const { currentTime, currentDay } = getCurrentTimeInfo();
    const scheduleDay = new Date(selectedDate)
      .toLocaleDateString("id-ID", { weekday: "long" })
      .toUpperCase();

    if (scheduleDay !== currentDay) return false;

    return currentTime < scheduleItem.startTime;
  };

  // Check if there's already an active session for this schedule
  const hasActiveSession = (scheduleId) => {
    return activeSessions?.some(
      (session) => session.scheduleId === scheduleId && session.isActive
    );
  };

  // Handle create session
  const handleCreateSession = async () => {
    if (!selectedSchedule) {
      toast.error("Pilih jadwal terlebih dahulu");
      return;
    }

    // Validasi Geolocation jika sessionType adalah 'qr' dan belum ada lokasi yang dipilih.
    if (sessionType === "qr" && !locationData) {
      toast.error("Mode QR Code memerlukan penentuan lokasi Geofence di peta.");
      return;
    }

    // Siapkan data lokasi yang akan dikirim
    const finalLocationData = sessionType === "qr" ? locationData : {};

    if (sessionType === "manual") {
      // Untuk mode manual, pastikan lat/lon/radius tidak dikirim (server akan mengabaikannya)
      finalLocationData.latitude = undefined;
      finalLocationData.longitude = undefined;
      finalLocationData.radiusMeters = undefined;
    }

    try {
      setIsCreating(true);

      // Panggil createSession dengan ID jadwal, durasi, dan data lokasi
      const result = await createSession(
        selectedSchedule.id,
        sessionDuration,
        finalLocationData // Kirim objek lokasi ke hook
      );

      toast.success("Sesi absensi berhasil dibuat!");

      // Redirect to manage session page
      router.push(`/teacher/attendance/active-sessions/${result.session.id}`);
    } catch (error) {
      console.error("Create session error:", error);
      // Error is already handled by the hook
    } finally {
      setIsCreating(false);
    }
  };

  // Get time range display
  const getTimeRange = (startTime, endTime) => {
    return `${startTime} - ${endTime}`; // Time strings assumed to be in HH:mm format
  };

  // Get subject color
  const getSubjectColor = (subjectName) => {
    const colors = {
      Matematika: "bg-blue-500",
      Biologi: "bg-green-500",
      Fisika: "bg-purple-500",
      Kimia: "bg-red-500",
      "Bahasa Indonesia": "bg-yellow-500",
      "Bahasa Inggris": "bg-indigo-500",
      Sejarah: "bg-orange-500",
      Geografi: "bg-teal-500",
    };
    return colors[subjectName] || "bg-gray-500";
  };

  const ScheduleCard = ({ scheduleItem, isSelected, onSelect }) => {
    const isActive = isScheduleActive(scheduleItem);
    const isUpcoming = isScheduleUpcoming(scheduleItem);
    const hasSession = hasActiveSession(scheduleItem.id);
    const isDisabled = hasSession;

    return (
      <div
        className={`card p-4 transition-all duration-200 border-2 ${
          isSelected
            ? "border-green-500 bg-green-50"
            : isDisabled
            ? "border-gray-200 bg-gray-50 cursor-not-allowed"
            : "border-gray-200 hover:border-green-300 hover:shadow-md cursor-pointer"
        } ${isActive ? "ring-2 ring-green-200" : ""}`}
        onClick={() => !isDisabled && onSelect(scheduleItem)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${getSubjectColor(
                scheduleItem.subject.name
              )}`}
            />
            <h3 className="font-semibold text-gray-900">
              {scheduleItem.subject.name}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            {isActive && (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Berlangsung
              </span>
            )}
            {isUpcoming && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                Akan Datang
              </span>
            )}
            {hasSession && (
              <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                Sesi Aktif
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>
                {getTimeRange(scheduleItem.startTime, scheduleItem.endTime)}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>Kelas {scheduleItem.class.name}</span>
            </div>
          </div>

          {scheduleItem.room && (
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{scheduleItem.room}</span>
            </div>
          )}
        </div>

        {isDisabled && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center space-x-1 text-xs text-orange-600">
              <AlertCircle className="w-3 h-3" />
              <span>Sudah ada sesi aktif untuk jadwal ini</span>
            </div>
          </div>
        )}

        {isSelected && !isDisabled && (
          <div className="mt-3 pt-3 border-t border-green-200">
            <div className="flex items-center space-x-1 text-xs text-green-600">
              <CheckCircle className="w-3 h-3" />
              <span>Jadwal dipilih</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const { currentDate } = getCurrentTimeInfo();
  const scheduleForDate = getScheduleForSelectedDate();

  if (scheduleLoading || todayLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12 card">
          <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Memuat jadwal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Buat Sesi Absensi
            </h1>
            <p className="text-gray-600 mt-1">
              Pilih jadwal, atur durasi & lokasi (jika perlu)
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule Selection (Colspan 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Date Selector */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" /> Pilih Tanggal
            </h2>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSchedule(null); // Reset selection when date changes
                  }}
                  className="input-field w-full"
                />
              </div>
              <button
                onClick={() => {
                  setSelectedDate(new Date().toISOString().split("T")[0]);
                  setSelectedSchedule(null);
                }}
                className="btn-secondary"
              >
                Hari Ini
              </button>
            </div>
          </div>

          {/* Schedule List */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Jadwal Mengajar ({currentDate})
              </h2>
              <div className="text-sm text-gray-500">
                {scheduleForDate.length} Sesi Ditemukan
              </div>
            </div>

            {scheduleForDate.length > 0 ? (
              <div className="space-y-4">
                {scheduleForDate.map((scheduleItem) => (
                  <ScheduleCard
                    key={scheduleItem.id}
                    scheduleItem={scheduleItem}
                    isSelected={selectedSchedule?.id === scheduleItem.id}
                    onSelect={setSelectedSchedule}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Tidak Ada Jadwal</p>
                <p className="text-sm">
                  Tidak ada jadwal mengajar untuk {selectedDate}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Session Configuration (Colspan 1) */}
        <div className="space-y-6">
          {/* Session Settings */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-500" /> Pengaturan Sesi
            </h2>

            <div className="space-y-4">
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durasi Sesi (menit)
                </label>
                <select
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(Number(e.target.value))}
                  className="input-field w-full"
                >
                  <option value={15}>15 menit</option>
                  <option value={30}>30 menit</option>
                  <option value={45}>45 menit</option>
                  <option value={60}>60 menit</option>
                  <option value={90}>90 menit</option>
                </select>
              </div>

              {/* Session Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipe Absensi
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-2 bg-white rounded-lg border hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="sessionType"
                      value="manual"
                      checked={sessionType === "manual"}
                      onChange={(e) => setSessionType(e.target.value)}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2 text-sm font-medium">
                      Manual (Guru mengisi)
                    </span>
                  </label>
                  <label className="flex items-center p-2 bg-white rounded-lg border hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="sessionType"
                      value="qr"
                      checked={sessionType === "qr"}
                      onChange={(e) => setSessionType(e.target.value)}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2 text-sm font-medium flex items-center gap-1">
                      QR Code (Siswa scan) <QrCode className="w-4 h-4" />
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Schedule Summary */}
          {selectedSchedule && (
            <div className="card p-6 bg-green-50 border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-4">
                Jadwal Dipilih
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-green-700">Mata Pelajaran:</span>
                  <span className="font-medium text-green-900">
                    {selectedSchedule.subject.name}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-green-700">Kelas:</span>
                  <span className="font-medium text-green-900">
                    {selectedSchedule.class.name}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-green-700">Waktu:</span>
                  <span className="font-medium text-green-900">
                    {getTimeRange(
                      selectedSchedule.startTime,
                      selectedSchedule.endTime
                    )}
                  </span>
                </div>

                {selectedSchedule.room && (
                  <div className="flex items-center justify-between">
                    <span className="text-green-700">Ruangan:</span>
                    <span className="font-medium text-green-900">
                      {selectedSchedule.room}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-green-700">Durasi Sesi:</span>
                  <span className="font-medium text-green-900">
                    {sessionDuration} menit
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-green-700">Tipe:</span>
                  <span className="font-medium text-green-900">
                    {sessionType === "manual" ? "Manual" : "QR Code"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Peta untuk Konfigurasi Lokasi (Hanya muncul jika QR Code dipilih) */}
          {sessionType === "qr" && (
            <div className="card p-4 border-orange-200 bg-orange-50">
              <h3 className="text-lg font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5" /> Konfigurasi Geofence (QR)
              </h3>
              <p className="text-sm text-orange-700 mb-3">
                Tentukan lokasi wajib siswa untuk dapat melakukan scan QR Code.
              </p>
              <SchoolLocationPickerMap
                initialLocation={locationData} // Kirim data yang sudah ada (jika ada)
                initialRadius={locationData?.radiusMeters}
                onLocationSelect={setLocationData} // Terima data dari peta
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleCreateSession}
              disabled={
                !selectedSchedule ||
                isCreating ||
                (sessionType === "qr" && !locationData)
              }
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Membuat Sesi...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  {sessionType === "qr"
                    ? "Buat Sesi QR Code"
                    : "Buat Sesi Manual"}
                </>
              )}
            </button>

            <button
              onClick={() => router.push("/teacher/attendance/active-sessions")}
              className="btn-secondary w-full"
            >
              Kembali ke Daftar Sesi
            </button>
          </div>

          {/* Help Info */}
          <div className="card p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Tips:</p>
                <ul className="space-y-1 text-xs">
                  <li>
                    • Pilih jadwal yang **sedang berlangsung** atau **akan
                    dimulai**
                  </li>
                  <li>• Mode QR Code memerlukan **lokasi (Geofence)**</li>
                  <li>
                    • Durasi sesi menentukan waktu maksimal siswa dapat absen
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
