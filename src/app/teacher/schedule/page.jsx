// src/app/teacher/schedule/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { teacherAPI } from "@/lib/api";
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Printer,
  RefreshCw,
  AlertCircle,
  MapPin,
} from "lucide-react";

export default function TeacherSchedulePage() {
  const { user } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week
  const [selectedDay, setSelectedDay] = useState(null);
  const [viewMode, setViewMode] = useState("week"); // week, day

  // Fetch teacher schedule
  const {
    data: scheduleData,
    loading,
    error,
    refetch,
  } = useApi(
    user?.id ? () => teacherAPI.getSchedule(user.profileData.id) : null,
    {
      immediate: !!user?.id,
      showToast: false,
    }
  );

  const daysOfWeek = [
    "SENIN",
    "SELASA",
    "RABU",
    "KAMIS",
    "JUMAT",
    "SABTU",
    "MINGGU",
  ];

  const dayNames = {
    SENIN: "Senin",
    SELASA: "Selasa",
    RABU: "Rabu",
    KAMIS: "Kamis",
    JUMAT: "Jumat",
    SABTU: "Sabtu",
    MINGGU: "Minggu",
  };

  // Get current date info
  const getCurrentDateInfo = () => {
    const today = new Date();
    const currentDay = today
      .toLocaleDateString("id-ID", { weekday: "long" })
      .toUpperCase();
    const currentDate = today.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return { currentDay, currentDate };
  };

  // Get schedule for specific day
  const getScheduleForDay = (day) => {
    if (!scheduleData?.schedule) return [];
    return scheduleData.schedule[day] || [];
  };

  // Get all schedule items for the week
  const getAllScheduleItems = () => {
    if (!scheduleData?.schedule) return [];

    const allItems = [];
    daysOfWeek.forEach((day) => {
      const daySchedule = scheduleData.schedule[day] || [];
      daySchedule.forEach((item) => {
        allItems.push({
          ...item,
          dayName: dayNames[day],
          day: day,
        });
      });
    });

    return allItems.sort((a, b) => {
      const dayOrder = daysOfWeek.indexOf(a.day) - daysOfWeek.indexOf(b.day);
      if (dayOrder !== 0) return dayOrder;
      return a.startTime.localeCompare(b.startTime);
    });
  };

  // Format time display
  const formatTime = (time) => {
    return time;
  };

  // Get time range display
  const getTimeRange = (startTime, endTime) => {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
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

  // Check if schedule item is currently active
  const isCurrentClass = (schedule) => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const currentDay = now
      .toLocaleDateString("id-ID", { weekday: "long" })
      .toUpperCase();

    if (schedule.day !== currentDay) return false;

    return currentTime >= schedule.startTime && currentTime <= schedule.endTime;
  };

  // Check if schedule item is upcoming today
  const isUpcomingToday = (schedule) => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const currentDay = now
      .toLocaleDateString("id-ID", { weekday: "long" })
      .toUpperCase();

    if (schedule.day !== currentDay) return false;

    return currentTime < schedule.startTime;
  };

  const ScheduleCard = ({ schedule, isCompact = false }) => {
    const isActive = isCurrentClass(schedule);
    const isUpcoming = isUpcomingToday(schedule);

    return (
      <div
        className={`card p-4 border-l-4 transition-all duration-200 hover:shadow-md ${
          isActive
            ? "border-l-green-500 bg-green-50/50"
            : isUpcoming
            ? "border-l-blue-500 bg-blue-50/50"
            : "border-l-gray-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div
                className={`w-3 h-3 rounded-full ${getSubjectColor(
                  schedule.subject.name
                )}`}
              />
              <h3 className="font-semibold text-gray-900">
                {schedule.subject.name}
              </h3>
              {isActive && (
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Sedang Berlangsung
                </span>
              )}
              {isUpcoming && (
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  Akan Datang
                </span>
              )}
            </div>

            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    {getTimeRange(schedule.startTime, schedule.endTime)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>Kelas {schedule.class.name}</span>
                </div>
              </div>

              {!isCompact && schedule.room && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{schedule.room}</span>
                </div>
              )}
            </div>
          </div>

          {!isCompact && (
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {schedule.dayName || dayNames[schedule.day]}
              </div>
            </div>
          )}
        </div>

        {!isCompact && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>ID: {schedule.id.slice(0, 8)}...</span>
              <button className="text-green-600 hover:text-green-700 font-medium">
                Detail
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const WeekView = () => {
    const { currentDay } = getCurrentDateInfo();

    return (
      <div className="space-y-6">
        {daysOfWeek.map((day) => {
          const daySchedule = getScheduleForDay(day);
          const isToday = day === currentDay;

          return (
            <div key={day} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <h3
                    className={`text-lg font-semibold ${
                      isToday ? "text-green-600" : "text-gray-900"
                    }`}
                  >
                    {dayNames[day]}
                  </h3>
                  {isToday && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Hari Ini
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {daySchedule.length} Sesi
                </div>
              </div>

              {daySchedule.length > 0 ? (
                <div className="space-y-3">
                  {daySchedule.map((schedule) => (
                    <ScheduleCard
                      key={schedule.id}
                      schedule={schedule}
                      isCompact
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>Tidak ada Sesi hari ini</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const DayView = () => {
    const selectedDaySchedule = selectedDay
      ? getScheduleForDay(selectedDay)
      : [];

    return (
      <div className="space-y-4">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Jadwal {dayNames[selectedDay]}
            </h3>
            <div className="text-sm text-gray-500">
              {selectedDaySchedule.length} Sesi
            </div>
          </div>

          {selectedDaySchedule.length > 0 ? (
            <div className="space-y-4">
              {selectedDaySchedule.map((schedule) => (
                <ScheduleCard key={schedule.id} schedule={schedule} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">Tidak ada Sesi</p>
              <p className="text-sm">Tidak ada jadwal untuk hari ini</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const { currentDate } = getCurrentDateInfo();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Memuat jadwal...</span>
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
            Gagal Memuat Jadwal
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={refetch} className="btn-primary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jadwal Mengajar</h1>
          <p className="text-gray-600 mt-1">
            {scheduleData?.teacherName || user?.name || "Guru"} • {currentDate}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-secondary" onClick={refetch}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode("week")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === "week"
                ? "bg-green-100 text-green-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Tampilan Minggu
          </button>
          <button
            onClick={() => setViewMode("day")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === "day"
                ? "bg-green-100 text-green-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Tampilan Hari
          </button>
        </div>

        {viewMode === "day" && (
          <div className="flex items-center space-x-2">
            <select
              value={selectedDay || ""}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="form-select"
            >
              <option value="">Pilih Hari</option>
              {daysOfWeek.map((day) => (
                <option key={day} value={day}>
                  {dayNames[day]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Schedule Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sesi</p>
              <p className="text-2xl font-bold text-gray-900">
                {getAllScheduleItems().length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hari Aktif</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.keys(scheduleData?.schedule || {}).length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-br from-green-500 to-green-600">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Mata Pelajaran
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  new Set(getAllScheduleItems().map((item) => item.subject.id))
                    .size
                }
              </p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-br from-purple-500 to-purple-600">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Kelas</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  new Set(getAllScheduleItems().map((item) => item.class.id))
                    .size
                }
              </p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-br from-orange-500 to-orange-600">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Content */}
      {viewMode === "week" ? <WeekView /> : <DayView />}
    </div>
  );
}
