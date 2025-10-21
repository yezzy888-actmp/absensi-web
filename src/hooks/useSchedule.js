// src/hooks/useSchedule.js
"use client";

import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import { scheduleAPI } from "@/lib/api";
import { useApi, usePaginatedApi, useCrud } from "./useApi";

// Helper untuk error handling jadwal dengan handling yang lebih detail
function handleScheduleError(err, defaultMessage) {
  console.error("Schedule Error:", err);

  // Extract error message dengan fallback yang lebih baik
  const message = err.response?.data?.message || err.message || defaultMessage;

  // Handle specific error types
  if (err.response?.status === 409) {
    const conflicts = err.response.data?.conflicts;
    if (conflicts) {
      const conflictMessages = [
        conflicts.classConflicts?.length > 0 && "Konflik jadwal kelas",
        conflicts.teacherConflicts?.length > 0 && "Konflik jadwal guru",
      ].filter(Boolean);

      toast.error(
        `${message}${
          conflictMessages.length > 0 ? `: ${conflictMessages.join(", ")}` : ""
        }`
      );
    } else {
      toast.error(message);
    }
  } else if (err.response?.status === 404) {
    toast.error("Data tidak ditemukan");
  } else if (err.response?.status === 400) {
    toast.error(`Data tidak valid: ${message}`);
  } else {
    toast.error(message);
  }
}

// Utility function untuk validasi client-side
function validateScheduleData(data) {
  const errors = [];
  const validDays = [
    "SENIN",
    "SELASA",
    "RABU",
    "KAMIS",
    "JUMAT",
    "SABTU",
    "MINGGU",
  ];
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

  if (!data.subjectId) errors.push("Subject ID wajib diisi");
  if (!data.classId) errors.push("Class ID wajib diisi");
  if (!data.teacherId) errors.push("Teacher ID wajib diisi");
  if (!data.day || !validDays.includes(data.day)) {
    errors.push(
      `Hari tidak valid. Harus salah satu dari: ${validDays.join(", ")}`
    );
  }
  if (!data.startTime || !timeRegex.test(data.startTime)) {
    errors.push("Waktu mulai harus dalam format HH:MM");
  }
  if (!data.endTime || !timeRegex.test(data.endTime)) {
    errors.push("Waktu selesai harus dalam format HH:MM");
  }

  // Validate time logic
  if (data.startTime && data.endTime && data.startTime >= data.endTime) {
    errors.push("Waktu mulai harus lebih awal dari waktu selesai");
  }

  return errors;
}

export function useScheduleManagement() {
  const [conflictData, setConflictData] = useState(null);

  // Menggunakan endpoint filter untuk list schedules dengan pagination
  const {
    data: apiResponse,
    pagination,
    loading: listLoading,
    error: listError,
    changePage,
    changeLimit,
    filter,
    refetch,
  } = usePaginatedApi(scheduleAPI.getFiltered, {
    initialParams: { sortBy: "day", sortOrder: "asc" },
  });

  // Extract schedules dari API response structure
  // API response: { data: { data: [...], pagination: {...} } }
  const schedules = apiResponse?.data?.data || [];
  const paginationInfo = apiResponse?.data?.pagination || pagination;

  console.log("useScheduleManagement - apiResponse:", apiResponse);
  console.log("useScheduleManagement - schedules:", schedules);
  console.log("useScheduleManagement - paginationInfo:", paginationInfo);

  const {
    create: crudCreate,
    update: crudUpdate,
    remove,
    getById,
    loading: crudLoading,
    error: crudError,
  } = useCrud({
    create: scheduleAPI.create,
    update: scheduleAPI.update,
    delete: scheduleAPI.delete,
    getById: scheduleAPI.getById,
  });

  const createWithValidation = useCallback(
    async (data) => {
      try {
        // Client-side validation
        const validationErrors = validateScheduleData(data);
        if (validationErrors.length > 0) {
          toast.error(validationErrors.join("\n"));
          throw new Error(validationErrors.join("\n"));
        }

        const result = await crudCreate(data);

        // Clear conflicts on success
        setConflictData(null);
        toast.success("Jadwal berhasil dibuat");

        return result;
      } catch (error) {
        // Handle conflict dari API response (409 status)
        if (error.response?.status === 409) {
          setConflictData({
            message: error.response.data.message,
            type: "conflict",
          });
        }
        handleScheduleError(error, "Gagal membuat jadwal");
        throw error;
      }
    },
    [crudCreate]
  );

  const updateWithValidation = useCallback(
    async (id, data) => {
      try {
        // Client-side validation
        const validationErrors = validateScheduleData(data);
        if (validationErrors.length > 0) {
          toast.error(validationErrors.join("\n"));
          throw new Error(validationErrors.join("\n"));
        }

        const result = await crudUpdate(id, data);

        // Clear conflicts on success
        setConflictData(null);
        toast.success("Jadwal berhasil diperbarui");

        return result;
      } catch (error) {
        // Handle conflict dari API response (409 status)
        if (error.response?.status === 409) {
          setConflictData({
            message: error.response.data.message,
            type: "conflict",
          });
        }
        handleScheduleError(error, "Gagal memperbarui jadwal");
        throw error;
      }
    },
    [crudUpdate]
  );

  const deleteWithConfirmation = useCallback(
    async (id) => {
      try {
        const result = await remove(id);
        toast.success("Jadwal berhasil dihapus");
        return result;
      } catch (error) {
        handleScheduleError(error, "Gagal menghapus jadwal");
        throw error;
      }
    },
    [remove]
  );

  return {
    schedules: schedules || [],
    pagination: paginationInfo,
    loading: listLoading || crudLoading,
    error: listError || crudError,
    conflictData,
    changePage,
    changeLimit,
    filter,
    create: createWithValidation,
    update: updateWithValidation,
    remove: deleteWithConfirmation,
    getById,
    refetch,
    clearConflicts: () => setConflictData(null),
  };
}

export function useScheduleDetails(id) {
  const { data, loading, error, refetch } = useApi(
    () => {
      if (!id) return null;
      return scheduleAPI.getById(id, { sessionLimit: 5, attendanceLimit: 20 });
    },
    {
      immediate: !!id,
      // Add retry logic for failed requests
      retryCount: 2,
      retryDelay: 1000,
    }
  );

  // Pastikan struktur data sesuai dengan response API
  return {
    schedule: data?.data || null, // API response: { success: true, data: {...} }
    sessions: data?.data?.sessions || [],
    attendance: data?.data?.attendances || [], // Note: API menggunakan 'attendances', bukan 'attendance'
    loading,
    error,
    refetch,
    // Helper methods
    hasData: !!data?.data,
    isEmpty: !loading && !data?.data,
  };
}

export function useWeeklySchedule(type, id) {
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchSchedule = useCallback(async () => {
    if (!id || !type) {
      setSchedule({});
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let response;
      if (type === "class") {
        response = await scheduleAPI.getClassWeekly(id);
      } else if (type === "teacher") {
        response = await scheduleAPI.getTeacherWeekly(id);
      } else {
        throw new Error("Invalid type. Must be 'class' or 'teacher'");
      }

      // API response: { success: true, data: {...} }
      setSchedule(response.data || {});
      setLastFetch(new Date());
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setError(errorMessage);
      setSchedule({});

      if (error.response?.status === 404) {
        toast.error(`${type === "class" ? "Kelas" : "Guru"} tidak ditemukan`);
      } else {
        toast.error("Gagal memuat jadwal mingguan");
      }
    } finally {
      setLoading(false);
    }
  }, [type, id]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  return {
    schedule,
    loading,
    error,
    lastFetch,
    refetch: fetchSchedule,
    // Helper methods
    hasSchedule: Object.keys(schedule).length > 0,
    isEmpty: !loading && Object.keys(schedule).length === 0,
  };
}

export function useTodaySchedule(role, id) {
  const apiFunction = useCallback(() => {
    if (!id || !role) return null;

    // Perbaikan untuk role mapping sesuai dengan API endpoint
    if (role === "student") {
      return scheduleAPI.getStudentToday(id);
    } else if (role === "teacher") {
      return scheduleAPI.getTeacherToday(id);
    }

    return null;
  }, [role, id]);

  const { data, loading, error, refetch } = useApi(apiFunction, {
    immediate: !!id && !!role,
    pollingInterval: 300000, // 5 minutes
  });

  // Parse data berdasarkan struktur API response
  const schedules = data?.data?.schedules || [];
  const today = data?.data?.today || "";

  // Calculate current and next schedule
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  const currentSchedule = schedules.find(
    (schedule) =>
      schedule.startTime <= currentTime && schedule.endTime > currentTime
  );

  const nextSchedule = schedules.find(
    (schedule) => schedule.startTime > currentTime
  );

  return {
    schedules,
    today,
    currentSchedule,
    nextSchedule,
    loading,
    error,
    refetch,
    // Helper methods
    hasSchedulesToday: schedules.length > 0,
    isCurrentlyInClass: !!currentSchedule,
  };
}

// Hook untuk get all schedules (admin only)
export function useAllSchedules() {
  const {
    data: apiResponse,
    pagination,
    loading,
    error,
    changePage,
    changeLimit,
    refetch,
  } = usePaginatedApi(scheduleAPI.getAll, {
    initialParams: { sortBy: "day", sortOrder: "asc" },
  });

  // Extract schedules dari nested response structure
  const schedules = apiResponse?.data?.data || [];
  const paginationInfo = apiResponse?.data?.pagination || pagination;

  return {
    schedules: schedules || [],
    pagination: paginationInfo,
    loading,
    error,
    changePage,
    changeLimit,
    refetch,
  };
}

// Hook untuk statistik schedule
export function useScheduleStats(filters = {}) {
  const { data, loading, error, refetch } = useApi(
    () => scheduleAPI.getFiltered({ ...filters, limit: 1000 }), // Get all for stats
    { immediate: true }
  );

  // Extract schedules dari nested response
  const schedules = data?.data?.data || [];

  const stats = {
    total: schedules.length,
    byDay: schedules.reduce((acc, schedule) => {
      acc[schedule.day] = (acc[schedule.day] || 0) + 1;
      return acc;
    }, {}),
    bySubject: schedules.reduce((acc, schedule) => {
      const subjectName = schedule.subject?.name || "Unknown";
      acc[subjectName] = (acc[subjectName] || 0) + 1;
      return acc;
    }, {}),
    byTeacher: schedules.reduce((acc, schedule) => {
      const teacherName = schedule.teacher?.name || "Unknown";
      acc[teacherName] = (acc[teacherName] || 0) + 1;
      return acc;
    }, {}),
    byClass: schedules.reduce((acc, schedule) => {
      const className = schedule.class?.name || "Unknown";
      acc[className] = (acc[className] || 0) + 1;
      return acc;
    }, {}),
  };

  return {
    stats,
    loading,
    error,
    refetch,
  };
}

// Hook khusus untuk filter schedules dengan advanced options
export function useScheduleFilter() {
  const [filters, setFilters] = useState({});

  const {
    data: apiResponse,
    pagination,
    loading,
    error,
    changePage,
    changeLimit,
    refetch,
  } = usePaginatedApi(
    (params) => scheduleAPI.getFiltered({ ...filters, ...params }),
    {
      initialParams: { sortBy: "day", sortOrder: "asc" },
      dependencies: [filters],
    }
  );

  // Extract schedules dari nested response structure
  const schedules = apiResponse?.data?.data || [];
  const paginationInfo = apiResponse?.data?.pagination || pagination;

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    schedules: schedules || [],
    pagination: paginationInfo,
    loading,
    error,
    filters,
    changePage,
    changeLimit,
    updateFilters,
    clearFilters,
    refetch,
  };
}
