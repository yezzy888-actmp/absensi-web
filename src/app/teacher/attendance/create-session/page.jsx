// src/app/teacher/attendance/create-session/page.jsx (HARMONIZED COLORS)
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
import SchoolLocationPickerMap from "@/components/guru/SchoolLocationPickerMap";

export default function CreateAttendanceSessionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const teacherId = user?.profileData?.id;

  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(30);
  const [sessionType, setSessionType] = useState("manual");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isCreating, setIsCreating] = useState(false);
  const [locationData, setLocationData] = useState(null);

  const {
    schedule,
    loading: scheduleLoading,
    error: scheduleError,
    getScheduleForDay,
    refetch: refetchSchedule,
  } = useTeacherSchedule(teacherId);

  const {
    createSession,
    getActiveSessions,
    sessions: activeSessions,
    loading: sessionLoading,
  } = useTeacherAttendance(teacherId);

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

  useEffect(() => {
    if (teacherId) {
      getActiveSessions();
    }
  }, [teacherId, getActiveSessions]);

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

  const getScheduleForSelectedDate = () => {
    const date = new Date(selectedDate);
    const dayName = date
      .toLocaleDateString("id-ID", { weekday: "long" })
      .toUpperCase();

    if (!schedule) return [];
    return schedule[dayName] || [];
  };

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

  const isScheduleUpcoming = (scheduleItem) => {
    const { currentTime, currentDay } = getCurrentTimeInfo();
    const scheduleDay = new Date(selectedDate)
      .toLocaleDateString("id-ID", { weekday: "long" })
      .toUpperCase();

    if (scheduleDay !== currentDay) return false;

    return currentTime < scheduleItem.startTime;
  };

  const hasActiveSession = (scheduleId) => {
    return activeSessions?.some(
      (session) => session.scheduleId === scheduleId && session.isActive
    );
  };

  const handleCreateSession = async () => {
    if (!selectedSchedule) {
      toast.error("Pilih jadwal terlebih dahulu");
      return;
    }

    if (sessionType === "qr" && !locationData) {
      toast.error("Mode QR Code memerlukan penentuan lokasi Geofence di peta.");
      return;
    }

    const finalLocationData = sessionType === "qr" ? locationData : {};

    if (sessionType === "manual") {
      finalLocationData.latitude = undefined;
      finalLocationData.longitude = undefined;
      finalLocationData.radiusMeters = undefined;
    }

    try {
      setIsCreating(true);

      const result = await createSession(
        selectedSchedule.id,
        sessionDuration,
        finalLocationData
      );

      toast.success("Sesi absensi berhasil dibuat!");
      router.push(`/teacher/attendance/active-sessions/${result.session.id}`);
    } catch (error) {
      console.error("Create session error:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const getTimeRange = (startTime, endTime) => {
    return `${startTime} - ${endTime}`;
  };

  const getSubjectColor = (subjectName) => {
    const colors = {
      Matematika: "from-blue-400 to-blue-600",
      Biologi: "from-blue-300 to-blue-500",
      Fisika: "from-blue-500 to-blue-700",
      Kimia: "from-blue-400 to-blue-600",
      "Bahasa Indonesia": "from-blue-300 to-blue-500",
      "Bahasa Inggris": "from-blue-400 to-blue-600",
      Sejarah: "from-blue-300 to-blue-500",
      Geografi: "from-blue-400 to-blue-600",
    };
    return colors[subjectName] || "from-blue-400 to-blue-600";
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
            ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-blue"
            : isDisabled
            ? "border-blue-100 bg-blue-50/30 cursor-not-allowed opacity-60"
            : "border-blue-200 hover:border-blue-400 hover:shadow-md cursor-pointer hover:bg-blue-50/50"
        } ${isActive ? "ring-2 ring-blue-300" : ""}`}
        onClick={() => !isDisabled && onSelect(scheduleItem)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full bg-gradient-to-br ${getSubjectColor(
                scheduleItem.subject.name
              )}`}
            />
            <h3 className="font-semibold text-gray-900">
              {scheduleItem.subject.name}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            {isActive && (
              <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full">
                Berlangsung
              </span>
            )}
            {isUpcoming && (
              <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-full">
                Akan Datang
              </span>
            )}
            {hasSession && (
              <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-blue-200 to-blue-300 text-blue-900 rounded-full">
                Sesi Aktif
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>
                {getTimeRange(scheduleItem.startTime, scheduleItem.endTime)}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 text-blue-500" />
              <span>Kelas {scheduleItem.class.name}</span>
            </div>
          </div>

          {scheduleItem.room && (
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span>{scheduleItem.room}</span>
            </div>
          )}
        </div>

        {isDisabled && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex items-center space-x-1 text-xs text-blue-700">
              <AlertCircle className="w-3 h-3" />
              <span>Sudah ada sesi aktif untuk jadwal ini</span>
            </div>
          </div>
        )}

        {isSelected && !isDisabled && (
          <div className="mt-3 pt-3 border-t border-blue-300">
            <div className="flex items-center space-x-1 text-xs text-blue-700">
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
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-blue-700">Memuat jadwal...</span>
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
            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-blue-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gradient">
              Buat Sesi Absensi
            </h1>
            <p className="text-blue-600 mt-1">
              Pilih jadwal, atur durasi & lokasi (jika perlu)
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule Selection (Colspan 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Date Selector */}
          <div className="card p-6 border-blue-200">
            <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              Pilih Tanggal
            </h2>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSchedule(null);
                  }}
                  className="input-field w-full border-blue-200 focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => {
                  setSelectedDate(new Date().toISOString().split("T")[0]);
                  setSelectedSchedule(null);
                }}
                className="btn-secondary border-blue-200 hover:border-blue-400"
              >
                Hari Ini
              </button>
            </div>
          </div>

          {/* Schedule List */}
          <div className="card p-6 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-blue-900">
                Jadwal Mengajar ({currentDate})
              </h2>
              <div className="text-sm text-blue-600 font-medium">
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
              <div className="text-center py-12 text-blue-600">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                <p className="text-lg font-medium">Tidak Ada Jadwal</p>
                <p className="text-sm text-blue-500">
                  Tidak ada jadwal mengajar untuk {selectedDate}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Session Configuration (Colspan 1) */}
        <div className="space-y-6">
          {/* Session Settings */}
          <div className="card p-6 border-blue-200">
            <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <Settings className="w-4 h-4 text-blue-600" />
              </div>
              Pengaturan Sesi
            </h2>

            <div className="space-y-4">
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  Durasi Sesi (menit)
                </label>
                <select
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(Number(e.target.value))}
                  className="input-field w-full border-blue-200 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  Tipe Absensi
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-3 bg-white rounded-lg border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-400 cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="sessionType"
                      value="manual"
                      checked={sessionType === "manual"}
                      onChange={(e) => setSessionType(e.target.value)}
                      className="form-radio text-blue-600 w-4 h-4"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      Manual (Guru mengisi)
                    </span>
                  </label>
                  <label className="flex items-center p-3 bg-white rounded-lg border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-400 cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="sessionType"
                      value="qr"
                      checked={sessionType === "qr"}
                      onChange={(e) => setSessionType(e.target.value)}
                      className="form-radio text-blue-600 w-4 h-4"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-900 flex items-center gap-1">
                      QR Code (Siswa scan){" "}
                      <QrCode className="w-4 h-4 text-blue-600" />
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Schedule Summary */}
          {selectedSchedule && (
            <div className="card p-6 bg-gradient-to-br from-blue-50/80 to-blue-100/50 border-blue-300">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                Jadwal Dipilih
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-2 bg-white/70 rounded-lg">
                  <span className="text-blue-700 font-medium">
                    Mata Pelajaran:
                  </span>
                  <span className="font-semibold text-blue-900">
                    {selectedSchedule.subject.name}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-white/70 rounded-lg">
                  <span className="text-blue-700 font-medium">Kelas:</span>
                  <span className="font-semibold text-blue-900">
                    {selectedSchedule.class.name}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-white/70 rounded-lg">
                  <span className="text-blue-700 font-medium">Waktu:</span>
                  <span className="font-semibold text-blue-900">
                    {getTimeRange(
                      selectedSchedule.startTime,
                      selectedSchedule.endTime
                    )}
                  </span>
                </div>

                {selectedSchedule.room && (
                  <div className="flex items-center justify-between p-2 bg-white/70 rounded-lg">
                    <span className="text-blue-700 font-medium">Ruangan:</span>
                    <span className="font-semibold text-blue-900">
                      {selectedSchedule.room}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between p-2 bg-white/70 rounded-lg">
                  <span className="text-blue-700 font-medium">
                    Durasi Sesi:
                  </span>
                  <span className="font-semibold text-blue-900">
                    {sessionDuration} menit
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 bg-white/70 rounded-lg">
                  <span className="text-blue-700 font-medium">Tipe:</span>
                  <span className="font-semibold text-blue-900">
                    {sessionType === "manual" ? "Manual" : "QR Code"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Peta untuk Konfigurasi Lokasi */}
          {sessionType === "qr" && (
            <div className="card p-4 border-blue-300 bg-gradient-to-br from-blue-50/60 to-blue-100/40">
              <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                Konfigurasi Geofence (QR)
              </h3>
              <p className="text-sm text-blue-700 mb-3">
                Tentukan lokasi wajib siswa untuk dapat melakukan scan QR Code.
              </p>
              <SchoolLocationPickerMap
                initialLocation={locationData}
                initialRadius={locationData?.radiusMeters}
                onLocationSelect={setLocationData}
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
              className="btn-secondary w-full border-blue-200 hover:border-blue-400"
            >
              Kembali ke Daftar Sesi
            </button>
          </div>

          {/* Help Info */}
          <div className="card p-4 bg-gradient-to-br from-blue-50/80 to-blue-100/50 border-blue-200">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2">Tips:</p>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-start gap-1">
                    <span className="text-blue-600">•</span>
                    <span>
                      Pilih jadwal yang sedang berlangsung atau akan dimulai
                    </span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-blue-600">•</span>
                    <span>Mode QR Code memerlukan lokasi (Geofence)</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className="text-blue-600">•</span>
                    <span>
                      Durasi sesi menentukan waktu maksimal siswa dapat absen
                    </span>
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
