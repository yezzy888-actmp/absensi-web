// src/hooks/useApi.js
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import {
  userAPI,
  classAPI,
  subjectAPI,
  teacherAPI,
  teacherSubjectAPI,
  scheduleAPI,
} from "@/lib/api";

/**
 * Generic API hook for data fetching with loading states
 */
export function useApi(apiFunction, options = {}) {
  const [data, setData] = useState(options.initialData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { immediate = true, onSuccess, onError, showToast = true } = options;

  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiFunction(...args);
        const result = response.data;

        setData(result);

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        console.error("API Error:", err);

        let errorMessage = "An error occurred";

        // Handle different error types
        if (err.code === "ECONNABORTED") {
          errorMessage =
            "Request timeout - server tidak merespons dalam waktu yang ditentukan";
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);

        if (showToast) {
          toast.error(errorMessage);
        }

        if (onError) {
          onError(err);
        }

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, onSuccess, onError, showToast]
  );

  useEffect(() => {
    if (immediate && apiFunction) {
      execute();
    }
  }, [immediate]); // Remove execute from dependencies to prevent infinite loop

  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  return {
    data,
    loading,
    error,
    execute,
    refetch,
  };
}

/**
 * Hook for paginated API calls - FIXED infinite loop issue
 */
export function usePaginatedApi(apiFunction, options = {}) {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use refs to prevent dependency issues
  const initializedRef = useRef(false);
  const currentRequestRef = useRef(null);
  const lastParamsRef = useRef(""); // Track last params to prevent duplicate requests

  const { initialParams = {}, onSuccess, onError, showToast = true } = options;

  const fetchData = useCallback(
    async (params = {}) => {
      // Create a stable params object
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...initialParams,
        ...params,
      };

      // Generate a key to compare params and prevent duplicate requests
      const paramsKey = JSON.stringify(queryParams);

      // Cancel previous request if same params
      if (currentRequestRef.current && lastParamsRef.current === paramsKey) {
        console.log("Preventing duplicate request with same params");
        return currentRequestRef.current;
      }

      // Cancel previous request if exists
      if (currentRequestRef.current) {
        console.log("Cancelling previous request");
      }

      lastParamsRef.current = paramsKey;

      const requestPromise = (async () => {
        try {
          setLoading(true);
          setError(null);

          console.log("Fetching data with params:", queryParams);

          const response = await apiFunction(queryParams);
          const result = response.data;

          console.log("API Response:", result);

          // Handle different response structures - FIXED FOR SUBJECTS
          if (result && typeof result === "object") {
            // Tambahkan pengecekan untuk schedules dan teachers
            const dataArray =
              result.schedules ||
              result.teachers ||
              result.subjects ||
              result.users ||
              result.classes ||
              result.data?.data ||
              [];

            const paginationData = result.pagination || {};

            setData(dataArray);
            setPagination({
              page: paginationData.page || queryParams.page || 1,
              limit: paginationData.limit || queryParams.limit || 10,
              total: paginationData.total || 0,
              totalPages: paginationData.totalPages || 0,
            });

            console.log("Set data:", dataArray);
            console.log("Set pagination:", paginationData);
          } else {
            setData([]);
            setPagination({
              page: 1,
              limit: 10,
              total: 0,
              totalPages: 0,
            });
          }

          if (onSuccess) {
            onSuccess(result);
          }

          return result;
        } catch (err) {
          console.error("Paginated API Error:", err);

          let errorMessage = "An error occurred";

          if (err.code === "ECONNABORTED") {
            errorMessage =
              "Request timeout - pastikan server berjalan dan dapat diakses";
          } else if (err.response?.status === 404) {
            errorMessage = "Endpoint tidak ditemukan - periksa konfigurasi API";
          } else if (err.response?.status === 500) {
            errorMessage = "Server error - hubungi administrator";
          } else if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
          } else if (err.message) {
            errorMessage = err.message;
          }

          setError(errorMessage);

          if (showToast) {
            toast.error(errorMessage);
          }

          if (onError) {
            onError(err);
          }

          return {
            subjects: [],
            users: [],
            classes: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          };
        } finally {
          setLoading(false);
          currentRequestRef.current = null;
          lastParamsRef.current = "";
        }
      })();

      currentRequestRef.current = requestPromise;
      return requestPromise;
    },
    [apiFunction, initialParams, onSuccess, onError, showToast] // Removed pagination from dependencies
  );

  const changePage = useCallback(
    (page) => {
      setPagination((prev) => ({ ...prev, page }));
      // Use setTimeout to ensure state update is complete
      setTimeout(() => {
        fetchData({ page });
      }, 0);
    },
    [fetchData]
  );

  const changeLimit = useCallback(
    (limit) => {
      setPagination((prev) => ({ ...prev, limit, page: 1 }));
      setTimeout(() => {
        fetchData({ limit, page: 1 });
      }, 0);
    },
    [fetchData]
  );

  const search = useCallback(
    (searchTerm) => {
      setPagination((prev) => ({ ...prev, page: 1 }));
      setTimeout(() => {
        fetchData({ search: searchTerm, page: 1 });
      }, 0);
    },
    [fetchData]
  );

  const filter = useCallback(
    (filters) => {
      setPagination((prev) => ({ ...prev, page: 1 }));
      setTimeout(() => {
        fetchData({ ...filters, page: 1 });
      }, 0);
    },
    [fetchData]
  );

  const refetch = useCallback(() => {
    lastParamsRef.current = ""; // Reset params tracking
    return fetchData({});
  }, [fetchData]);

  // Initial fetch - only once when component mounts
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      console.log("Initial fetch triggered");
      fetchData();
    }
  }, []); // Empty dependency array

  return {
    data,
    pagination,
    loading,
    error,
    changePage,
    changeLimit,
    search,
    filter,
    refetch,
    fetchData,
  };
}

/**
 * Hook for CRUD operations
 */
export function useCrud(apiObject, options = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { onSuccess, onError, showToast = true } = options;

  const executeOperation = useCallback(
    async (operation, ...args) => {
      try {
        setLoading(true);
        setError(null);

        const response = await operation(...args);
        const result = response.data;

        if (showToast) {
          toast.success("Operasi berhasil!");
        }

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        console.error("CRUD Operation Error:", err);

        let errorMessage = "An error occurred";

        if (err.code === "ECONNABORTED") {
          errorMessage =
            "Request timeout - operasi gagal karena server tidak merespons";
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);

        if (showToast) {
          toast.error(errorMessage);
        }

        if (onError) {
          onError(err);
        }

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [onSuccess, onError, showToast]
  );

  const create = useCallback(
    async (data) => {
      return executeOperation(apiObject.create, data);
    },
    [apiObject.create, executeOperation]
  );

  const update = useCallback(
    async (id, data) => {
      return executeOperation(apiObject.update, id, data);
    },
    [apiObject.update, executeOperation]
  );

  const remove = useCallback(
    async (id) => {
      return executeOperation(apiObject.delete, id);
    },
    [apiObject.delete, executeOperation]
  );

  const getById = useCallback(
    async (id) => {
      return executeOperation(apiObject.getById, id);
    },
    [apiObject.getById, executeOperation]
  );

  return {
    loading,
    error,
    create,
    update,
    remove,
    getById,
  };
}

/**
 * Hook for form submissions
 */
export function useFormSubmit(submitFunction, options = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const {
    onSuccess,
    onError,
    showToast = true,
    successMessage = "Berhasil!",
    resetOnSuccess = true,
  } = options;

  const submit = useCallback(
    async (data) => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(false);

        const response = await submitFunction(data);
        const result = response.data;

        setSuccess(true);

        if (showToast) {
          toast.success(successMessage);
        }

        if (onSuccess) {
          onSuccess(result);
        }

        if (resetOnSuccess) {
          setTimeout(() => setSuccess(false), 3000);
        }

        return result;
      } catch (err) {
        console.error("Form Submit Error:", err);

        let errorMessage = "An error occurred";

        if (err.code === "ECONNABORTED") {
          errorMessage = "Request timeout - form submission gagal";
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);

        if (showToast) {
          toast.error(errorMessage);
        }

        if (onError) {
          onError(err);
        }

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [
      submitFunction,
      onSuccess,
      onError,
      showToast,
      successMessage,
      resetOnSuccess,
    ]
  );

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    submit,
    loading,
    error,
    success,
    reset,
  };
}

/**
 * Hook for handling optimistic updates
 */
export function useOptimisticUpdate(apiFunction, options = {}) {
  const [data, setData] = useState(options.initialData || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { onSuccess, onError, showToast = true } = options;

  const updateOptimistically = useCallback(
    async (optimisticUpdate, apiCall) => {
      const previousData = data;

      try {
        // Apply optimistic update
        setData(optimisticUpdate(data));
        setLoading(true);
        setError(null);

        // Execute API call
        const response = await apiCall();
        const result = response.data;

        // Update with actual result
        setData(result);

        if (showToast) {
          toast.success("Berhasil!");
        }

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        // Revert optimistic update
        setData(previousData);

        console.error("Optimistic Update Error:", err);

        let errorMessage = "An error occurred";

        if (err.code === "ECONNABORTED") {
          errorMessage = "Request timeout - perubahan dibatalkan";
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);

        if (showToast) {
          toast.error(errorMessage);
        }

        if (onError) {
          onError(err);
        }

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [data, onSuccess, onError, showToast]
  );

  return {
    data,
    setData,
    loading,
    error,
    updateOptimistically,
  };
}

// FIXED SUBJECT MANAGEMENT HOOK
export function useSubjectManagement() {
  const {
    data: subjects,
    pagination,
    loading: loadingList,
    error,
    changePage,
    changeLimit,
    filter,
    refetch,
  } = usePaginatedApi(subjectAPI.getAllSubjects, {
    showToast: false, // Don't show toast for initial load, only for errors
  });

  const {
    create,
    update,
    remove,
    getById,
    loading: crudLoading,
  } = useCrud(subjectAPI.crud, {
    onSuccess: () => {
      // Add a small delay before refetch to ensure backend has processed the change
      setTimeout(() => {
        refetch();
      }, 500);
    },
    showToast: false, // We'll handle toast messages manually for better UX
  });

  // Get subject teachers - FIXED
  const getSubjectTeachers = useCallback(async (subjectId) => {
    try {
      console.log(`Getting teachers for subject ${subjectId}`);
      const response = await subjectAPI.getSubjectTeachers(subjectId);
      console.log("Subject teachers response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get Subject Teachers Error:", error);

      let message = "Error retrieving subject teachers";
      if (error.code === "ECONNABORTED") {
        message = "Request timeout - gagal mengambil data guru mata pelajaran";
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }

      toast.error(message);
      throw error;
    }
  }, []);

  // Get available teachers (not assigned to this subject) - NEW
  const getAvailableTeachers = useCallback(async (subjectId = null) => {
    try {
      console.log(`Getting available teachers for subject ${subjectId}`);
      // Call user API to get all teachers
      const response = await userAPI.getAllUsers({
        role: "TEACHER",
        limit: 100, // Get all teachers
      });

      let availableTeachers = response.data.users || [];

      // If we have a subject ID, filter out already assigned teachers
      if (subjectId) {
        try {
          const subjectTeachersResponse = await subjectAPI.getSubjectTeachers(
            subjectId
          );
          const assignedTeacherIds = (
            subjectTeachersResponse.data.teachers || []
          ).map((t) => t.id);
          availableTeachers = availableTeachers.filter(
            (teacher) => !assignedTeacherIds.includes(teacher.id)
          );
        } catch (err) {
          console.warn(
            "Could not fetch assigned teachers, showing all teachers:",
            err
          );
        }
      }

      console.log("Available teachers:", availableTeachers);
      return availableTeachers;
    } catch (error) {
      console.error("Get Available Teachers Error:", error);

      let message = "Error retrieving available teachers";
      if (error.code === "ECONNABORTED") {
        message = "Request timeout - gagal mengambil data guru tersedia";
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }

      toast.error(message);
      return [];
    }
  }, []);

  // Assign teacher to subject - FIXED
  const assignTeacher = useCallback(
    async (subjectId, teacherId) => {
      try {
        console.log(`Assigning teacher ${teacherId} to subject ${subjectId}`);
        const response = await subjectAPI.assignTeacher(subjectId, {
          teacherId,
        });
        toast.success("Guru berhasil ditugaskan ke mata pelajaran!");

        // Refresh the subject list
        setTimeout(() => {
          refetch();
        }, 500);

        return response.data;
      } catch (error) {
        console.error("Assign Teacher Error:", error);

        let message = "Error assigning teacher to subject";
        if (error.code === "ECONNABORTED") {
          message = "Request timeout - gagal menugaskan guru";
        } else if (error.response?.data?.message) {
          message = error.response.data.message;
        }

        toast.error(message);
        throw error;
      }
    },
    [refetch]
  );

  // Remove teacher from subject - FIXED
  const removeTeacher = useCallback(
    async (subjectId, teacherId) => {
      try {
        console.log(`Removing teacher ${teacherId} from subject ${subjectId}`);
        const response = await subjectAPI.removeTeacher(subjectId, teacherId);
        toast.success("Guru berhasil dihapus dari mata pelajaran!");

        // Refresh the subject list
        setTimeout(() => {
          refetch();
        }, 500);

        return response.data;
      } catch (error) {
        console.error("Remove Teacher Error:", error);

        let message = "Error removing teacher from subject";
        if (error.code === "ECONNABORTED") {
          message = "Request timeout - gagal menghapus guru";
        } else if (error.response?.data?.message) {
          message = error.response.data.message;
        }

        toast.error(message);
        throw error;
      }
    },
    [refetch]
  );

  // Search subjects by name
  const searchSubjects = useCallback(
    (name) => {
      if (name && name.trim()) {
        filter({ name: name.trim() });
      } else {
        // If search is empty, reset filter
        filter({});
      }
    },
    [filter]
  );

  return {
    subjects,
    pagination,
    loading: loadingList || crudLoading,
    error,
    changePage,
    changeLimit,
    filter,
    searchSubjects,
    refetch,
    create,
    update,
    remove,
    getById,
    getSubjectTeachers,
    getAvailableTeachers, // NEW
    assignTeacher,
    removeTeacher,
  };
}

export function useSubjectDetails(subjectId) {
  const {
    data: subjectData,
    loading,
    error,
    refetch,
  } = useApi(subjectId ? () => subjectAPI.getSubjectById(subjectId) : null, {
    immediate: !!subjectId,
    showToast: false,
  });

  const {
    data: subjectTeachers,
    loading: teachersLoading,
    refetch: refetchTeachers,
  } = useApi(
    subjectId ? () => subjectAPI.getSubjectTeachers(subjectId) : null,
    {
      immediate: !!subjectId,
      showToast: false,
    }
  );

  return {
    subjectData: subjectData?.subject || null,
    subjectTeachers: subjectTeachers?.teachers || null,
    loading: loading || teachersLoading,
    error,
    refetch,
    refetchTeachers,
  };
}

/**
 * Hook specifically for user management with all CRUD operations - FIXED
 */
export function useUserManagement() {
  const {
    data: users,
    pagination,
    loading: loadingList,
    error,
    changePage,
    changeLimit,
    filter,
    refetch,
  } = usePaginatedApi(userAPI.getAllUsers, {
    showToast: false, // Don't show toast for initial load, only for errors
  });

  const {
    create,
    update,
    remove,
    getById,
    loading: crudLoading,
  } = useCrud(userAPI.crud, {
    onSuccess: () => {
      // Add a small delay before refetch to ensure backend has processed the change
      setTimeout(() => {
        refetch();
      }, 500); // Increased delay to 500ms
    },
  });

  const resetPassword = useCallback(async (userId, newPassword) => {
    try {
      const response = await userAPI.resetUserPassword(userId, { newPassword });
      toast.success("Password berhasil direset!");
      return response.data;
    } catch (error) {
      console.error("Reset Password Error:", error);

      let message = "Error resetting password";
      if (error.code === "ECONNABORTED") {
        message = "Request timeout - reset password gagal";
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }

      toast.error(message);
      throw error;
    }
  }, []);

  return {
    users,
    pagination,
    loading: loadingList || crudLoading,
    error,
    changePage,
    changeLimit,
    filter,
    refetch,
    create,
    update,
    remove,
    getById,
    resetPassword,
  };
}
/**
 * Hook untuk manajemen jadwal lengkap dengan operasi CRUD dan filter
 */

export function useScheduleManagement() {
  const [conflictData, setConflictData] = useState(null);

  const {
    data: schedules,
    pagination,
    loading: listLoading,
    error: listError,
    changePage,
    changeLimit,
    filter,
    refetch,
  } = usePaginatedApi(scheduleAPI.getFiltered, {
    initialParams: { sortBy: "day", sortOrder: "asc" },
    dataFormatter: (result) => result.schedules,
  });

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

  // Enhanced create with conflict check
  const create = async (data) => {
    try {
      // Client-side validation
      const validationErrors = scheduleAPI.validate.scheduleData(data);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join("\n"));
      }

      // Server-side conflict check
      const conflictCheck = await scheduleAPI.checkConflicts(data);
      if (conflictCheck.status === 409) {
        setConflictData(conflictCheck.data);
        throw new Error("Jadwal bertabrakan");
      }

      return await crudCreate(data);
    } catch (error) {
      handleScheduleError(error, "Gagal membuat jadwal");
      throw error;
    }
  };

  // Enhanced update with conflict check
  const update = async (id, data) => {
    try {
      const validationErrors = scheduleAPI.validate.scheduleData(data);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join("\n"));
      }

      const conflictCheck = await scheduleAPI.checkConflicts({ ...data, id });
      if (conflictCheck.status === 409) {
        setConflictData(conflictCheck.data);
        throw new Error("Jadwal bertabrakan");
      }

      return await crudUpdate(id, data);
    } catch (error) {
      handleScheduleError(error, "Gagal memperbarui jadwal");
      throw error;
    }
  };

  // Enhanced error handling
  const handleScheduleError = (error, defaultMessage) => {
    console.error("Schedule Error:", error);
    const res = error.response?.data;
    const message = res?.message || error.message || defaultMessage;

    if (res?.conflicts) {
      const conflictTypes = [];
      if (res.conflicts.classConflicts) conflictTypes.push("Kelas");
      if (res.conflicts.teacherConflicts) conflictTypes.push("Guru");

      toast.error(`${message}: Konflik dengan ${conflictTypes.join(" dan ")}`);
    } else {
      toast.error(message);
    }
  };

  // Additional schedule functions
  const getWeekly = async (type, id) => {
    try {
      const endpoint =
        type === "class"
          ? scheduleAPI.getClassWeekly
          : scheduleAPI.getTeacherWeekly;

      const response = await endpoint(id);
      return response.data;
    } catch (error) {
      handleScheduleError(error, "Gagal mengambil jadwal mingguan");
      throw error;
    }
  };

  const getToday = async (type, id) => {
    try {
      const endpoint =
        type === "student"
          ? scheduleAPI.getStudentToday
          : scheduleAPI.getTeacherToday;

      const response = await endpoint(id);
      return response.data;
    } catch (error) {
      handleScheduleError(error, "Gagal mengambil jadwal hari ini");
      throw error;
    }
  };

  return {
    schedules: schedules || [],
    pagination,
    loading: listLoading || crudLoading,
    error: listError || crudError,
    conflictData,
    changePage,
    changeLimit,
    filter,
    create,
    update,
    remove,
    getById,
    refetch,
    getWeekly,
    getToday,
    clearConflicts: () => setConflictData(null),
  };
}

// Helper untuk error handling
function handleScheduleError(err, defaultMessage) {
  console.error("Schedule Error:", err);
  const message = err.response?.data?.message || err.message || defaultMessage;

  // Handle konflik waktu khusus
  if (err.response?.status === 409) {
    const conflicts = err.response.data.conflicts;
    const conflictMessages = [
      conflicts.classConflicts?.length > 0 && "Konflik jadwal kelas",
      conflicts.teacherConflicts?.length > 0 && "Konflik jadwal guru",
    ].filter(Boolean);

    toast.error(`${message}: ${conflictMessages.join(", ")}`);
  } else {
    toast.error(message);
  }
}
/**
 * Hook untuk detail jadwal dengan konflik
 */
export function useScheduleDetails(id) {
  const { data, loading, error, refetch } = useApi(
    () => scheduleAPI.getById(id, { sessionLimit: 5, attendanceLimit: 20 }),
    { immediate: !!id }
  );

  return {
    schedule: data?.data,
    sessions: data?.sessions || [],
    attendance: data?.attendance || [],
    loading,
    error,
    refetch,
  };
}

/**
 * Hook untuk weekly schedule
 */
export function useWeeklySchedule(type, id) {
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response =
        type === "class"
          ? await scheduleAPI.getClassWeekly(id)
          : await scheduleAPI.getTeacherWeekly(id);

      setSchedule(response.data);
    } catch (error) {
      setError(error.message);
      toast.error("Gagal memuat jadwal mingguan");
    } finally {
      setLoading(false);
    }
  }, [type, id]);

  useEffect(() => {
    if (id) fetchSchedule();
  }, [id, fetchSchedule]);

  return {
    schedule,
    loading,
    error,
    refetch: fetchSchedule,
  };
}

/**
 * Hook untuk jadwal hari ini berdasarkan peran pengguna
 */
export function useTodaySchedule(role, id) {
  const apiFunction = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    return scheduleAPI.getFilteredSchedules({
      [role === "teacher" ? "teacherId" : "studentId"]: id,
      day: new Date()
        .toLocaleDateString("en-US", { weekday: "long" })
        .toUpperCase(),
      date: today,
      limit: 10,
    });
  }, [role, id]);

  const { data, loading, error, refetch } = useApi(apiFunction, {
    immediate: !!id,
    pollingInterval: 300000, // Refresh setiap 5 menit
  });

  return {
    schedule: data?.data || [],
    loading,
    error,
    refetch,
  };
}
/**
 * Hook for managing teacher-subject assignments
 */
export function useTeacherSubjectManagement(teacherId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get all subjects assigned to a teacher
  const {
    data: assignedSubjects,
    loading: loadingSubjects,
    error: subjectsError,
    refetch: refetchSubjects,
  } = useApi(
    teacherId ? () => teacherSubjectAPI.getTeacherSubjects(teacherId) : null,
    {
      immediate: !!teacherId,
      showToast: false,
    }
  );

  // Get unassigned subjects (available for assignment)
  const getUnassignedSubjects = useCallback(async () => {
    if (!teacherId) return [];
    try {
      const response = await teacherSubjectAPI.getUnassignedSubjects(teacherId);
      return response.data.subjects || [];
    } catch (err) {
      throw new Error(
        err.response?.data?.message || "Gagal memuat mata pelajaran tersedia"
      );
    }
  }, [teacherId]);

  // Assign subjects to teacher
  const assignSubjects = useCallback(
    async (subjectIds) => {
      if (!teacherId) return;
      try {
        const response = await teacherSubjectAPI.assignSubjectsToTeacher(
          teacherId,
          subjectIds
        );
        return response.data;
      } catch (err) {
        throw new Error(
          err.response?.data?.message || "Gagal menugaskan mata pelajaran"
        );
      }
    },
    [teacherId]
  );

  // Assign single subject to teacher
  const assignSingleSubject = useCallback(
    async (subjectId) => {
      return assignSubjects([subjectId]);
    },
    [assignSubjects]
  );

  // Remove subject from teacher
  const removeSubject = useCallback(
    async (subjectId) => {
      if (!teacherId) return;
      try {
        const response = await teacherSubjectAPI.removeSubjectFromTeacher(
          teacherId,
          subjectId
        );
        return response.data;
      } catch (err) {
        throw new Error(
          err.response?.data?.message || "Gagal menghapus mata pelajaran"
        );
      }
    },
    [teacherId]
  );

  // Update all teacher subjects (replace current assignments)
  const updateAllSubjects = useCallback(
    async (subjectIds) => {
      if (!teacherId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await teacherSubjectAPI.updateTeacherSubjects(
          teacherId,
          subjectIds
        );

        toast.success("Mata pelajaran guru berhasil diperbarui!");

        // Refresh the assigned subjects list
        setTimeout(() => {
          refetchSubjects();
        }, 500);

        return response.data;
      } catch (err) {
        console.error("Update All Subjects Error:", err);
        const message =
          err.response?.data?.message || "Gagal memperbarui mata pelajaran";
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [teacherId, refetchSubjects]
  );

  // Check if teacher is assigned to specific subject
  const isAssignedToSubject = useCallback(
    async (subjectId) => {
      if (!teacherId) return false;

      try {
        return await teacherSubjectAPI.isTeacherAssignedToSubject(
          teacherId,
          subjectId
        );
      } catch (err) {
        console.error("Check Assignment Error:", err);
        return false;
      }
    },
    [teacherId]
  );

  // Get assigned classes for subjects (if implemented in backend)
  const getAssignedClassesForSubjects = useCallback(async () => {
    if (!teacherId) return [];

    try {
      setLoading(true);
      const response = await teacherSubjectAPI.getAssignedClassesForSubjects(
        teacherId
      );
      return response.data;
    } catch (err) {
      console.error("Get Assigned Classes Error:", err);
      const message =
        err.response?.data?.message || "Gagal mengambil kelas yang diajar";
      toast.error(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  return {
    assignedSubjects: assignedSubjects?.subjects || [],
    loading: loading || loadingSubjects,
    error: error || subjectsError,
    getUnassignedSubjects,
    assignSubjects,
    removeSubject,
    refetchSubjects,
  };
}
/**
 * Hook for complete teacher subject management with bulk operations
 */
export function useTeacherSubjectBulkManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Bulk assign subjects to multiple teachers
  const bulkAssignSubjects = useCallback(async (teacherSubjectPairs) => {
    // teacherSubjectPairs format: [{ teacherId, subjectIds }, ...]
    try {
      setLoading(true);
      setError(null);

      const promises = teacherSubjectPairs.map(({ teacherId, subjectIds }) =>
        teacherSubjectAPI.assignSubjectsToTeacher(teacherId, subjectIds)
      );

      const results = await Promise.allSettled(promises);

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (successful > 0) {
        toast.success(`${successful} penugasan berhasil!`);
      }

      if (failed > 0) {
        toast.error(`${failed} penugasan gagal!`);
      }

      return results;
    } catch (err) {
      console.error("Bulk Assign Error:", err);
      const message = "Gagal melakukan penugasan massal";
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Bulk remove subjects from multiple teachers
  const bulkRemoveSubjects = useCallback(async (teacherSubjectPairs) => {
    // teacherSubjectPairs format: [{ teacherId, subjectId }, ...]
    try {
      setLoading(true);
      setError(null);

      const promises = teacherSubjectPairs.map(({ teacherId, subjectId }) =>
        teacherSubjectAPI.removeSubjectFromTeacher(teacherId, subjectId)
      );

      const results = await Promise.allSettled(promises);

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      if (successful > 0) {
        toast.success(`${successful} penghapusan berhasil!`);
      }

      if (failed > 0) {
        toast.error(`${failed} penghapusan gagal!`);
      }

      return results;
    } catch (err) {
      console.error("Bulk Remove Error:", err);
      const message = "Gagal melakukan penghapusan massal";
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    bulkAssignSubjects,
    bulkRemoveSubjects,
  };
}
/**
 * Hook for subject-teacher overview (reverse perspective)
 */
export function useSubjectTeacherOverview() {
  const [subjectTeacherMap, setSubjectTeacherMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get all subjects with their assigned teachers
  const getAllSubjectsWithTeachers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // This would require a new API endpoint to get all subjects with teachers
      // For now, we'll use the existing subject API and then get teachers for each
      const subjectsResponse = await subjectAPI.getAllSubjects();
      const subjects = subjectsResponse.data.subjects || [];

      const subjectTeacherPromises = subjects.map(async (subject) => {
        try {
          const teachersResponse = await subjectAPI.getSubjectTeachers(
            subject.id
          );
          return {
            subject,
            teachers: teachersResponse.data.teachers || [],
          };
        } catch (err) {
          console.warn(
            `Could not get teachers for subject ${subject.id}:`,
            err
          );
          return {
            subject,
            teachers: [],
          };
        }
      });

      const subjectTeacherResults = await Promise.allSettled(
        subjectTeacherPromises
      );

      const subjectTeacherData = subjectTeacherResults
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      // Create map for easy lookup
      const map = {};
      subjectTeacherData.forEach(({ subject, teachers }) => {
        map[subject.id] = {
          subject,
          teachers,
        };
      });

      setSubjectTeacherMap(map);
      return subjectTeacherData;
    } catch (err) {
      console.error("Get Subjects With Teachers Error:", err);
      const message = "Gagal mengambil data mata pelajaran dengan guru";
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get teachers for specific subject
  const getTeachersForSubject = useCallback(
    (subjectId) => {
      return subjectTeacherMap[subjectId]?.teachers || [];
    },
    [subjectTeacherMap]
  );

  // Check if subject has teachers assigned
  const hasTeachersAssigned = useCallback(
    (subjectId) => {
      const teachers = getTeachersForSubject(subjectId);
      return teachers.length > 0;
    },
    [getTeachersForSubject]
  );

  return {
    subjectTeacherMap,
    loading,
    error,
    getAllSubjectsWithTeachers,
    getTeachersForSubject,
    hasTeachersAssigned,
  };
}

/**
 * Enhanced useTeacherComplete hook with subject management
 * This replaces/enhances the existing useTeacherComplete
 */
export function useTeacherCompleteWithSubjects(teacherId) {
  // Get existing teacher functionality
  const teacherComplete = useTeacherComplete(teacherId);

  // Add subject management
  const subjectManagement = useTeacherSubjectManagement(teacherId);

  return {
    // Existing teacher functionality
    ...teacherComplete,

    // Subject management
    assignedSubjects: subjectManagement.assignedSubjects,
    subjectLoading: subjectManagement.loading,
    subjectError: subjectManagement.error,
    refetchSubjects: subjectManagement.refetchSubjects,

    // Subject operations
    getUnassignedSubjects: subjectManagement.getUnassignedSubjects,
    assignSubjects: subjectManagement.assignSubjects,
    assignSingleSubject: subjectManagement.assignSingleSubject,
    removeSubject: subjectManagement.removeSubject,
    updateAllSubjects: subjectManagement.updateAllSubjects,
    isAssignedToSubject: subjectManagement.isAssignedToSubject,
    getAssignedClassesForSubjects:
      subjectManagement.getAssignedClassesForSubjects,
  };
}

/**
 * Hook for teacher management with all CRUD operations all this file is also in useApi.js
 */
export function useTeacherManagement() {
  const {
    data: teachers,
    pagination,
    loading: loadingList,
    error,
    changePage,
    changeLimit,
    filter,
    refetch,
  } = usePaginatedApi(teacherAPI.getAllTeachers, {
    showToast: false,
    dataFormatter: (result) => result.teachers,
  });

  const {
    create,
    update,
    remove,
    getById,
    loading: crudLoading,
  } = useCrud(teacherAPI.crud, {
    onSuccess: () => {
      setTimeout(() => {
        refetch();
      }, 500);
    },
  });

  // Search teachers by name or subject
  const searchTeachers = useCallback(
    (searchTerm) => {
      if (searchTerm && searchTerm.trim()) {
        filter({ search: searchTerm.trim() });
      } else {
        filter({});
      }
    },
    [filter]
  );

  // Filter teachers by subject
  const filterBySubject = useCallback(
    (subjectId) => {
      filter({ subjectId });
    },
    [filter]
  );

  return {
    teachers,
    pagination,
    loading: loadingList || crudLoading,
    error,
    changePage,
    changeLimit,
    filter,
    searchTeachers,
    filterBySubject,
    refetch,
    create,
    update,
    remove,
    getById,
  };
}

/**
 * Hook for individual teacher profile and basic operations
 */
export function useTeacherProfile(teacherId) {
  const {
    data: teacherData,
    loading,
    error,
    refetch,
  } = useApi(teacherId ? () => teacherAPI.getProfile(teacherId) : null, {
    immediate: !!teacherId,
    showToast: false,
  });

  return {
    teacher: teacherData?.teacher || null,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for teacher schedule management
 */
export function useTeacherSchedule(teacherId) {
  const [scheduleParams, setScheduleParams] = useState({});

  const {
    data: scheduleData,
    loading,
    error,
    refetch,
  } = useApi(
    teacherId ? () => teacherAPI.getSchedule(teacherId, scheduleParams) : null,
    {
      immediate: !!teacherId,
      showToast: false,
    }
  );

  // Get schedule for specific day
  const getScheduleForDay = useCallback(
    async (day) => {
      try {
        const response = await teacherAPI.getDaySchedule(teacherId, day);
        return response.data;
      } catch (error) {
        console.error("Get Day Schedule Error:", error);
        toast.error("Gagal mengambil jadwal harian");
        throw error;
      }
    },
    [teacherId]
  );

  // Get schedule for specific class
  const getScheduleForClass = useCallback(
    async (classId) => {
      try {
        const response = await teacherAPI.getClassSchedule(teacherId, classId);
        return response.data;
      } catch (error) {
        console.error("Get Class Schedule Error:", error);
        toast.error("Gagal mengambil jadwal kelas");
        throw error;
      }
    },
    [teacherId]
  );

  // Filter schedule
  const filterSchedule = useCallback(
    (params) => {
      setScheduleParams(params);
      setTimeout(() => refetch(), 100);
    },
    [refetch]
  );

  return {
    schedule: scheduleData?.schedule || [],
    loading,
    error,
    refetch,
    getScheduleForDay,
    getScheduleForClass,
    filterSchedule,
  };
}

/**
 * Hook for teacher attendance session management
 */
/**
 * Hook for teacher attendance session management
 */
export function useTeacherAttendance(teacherId) {
  const [sessionsData, setSessionsData] = useState([]);
  const [loading, setLoading] = useState(false); // General loading for the hook
  const [error, setError] = useState(null);

  const getAttendanceSessions = useCallback(
    async (params = {}) => {
      if (!teacherId) {
        const err = new Error("Teacher ID tidak tersedia.");
        setError(err.message);
        throw err;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await teacherAPI.getAttendanceSessions(
          teacherId,
          params
        );
        if (params.sessionId) {
          return response.data;
        }
        setSessionsData(response.data.sessions || []);
        return response.data;
      } catch (err) {
        console.error("Get Attendance Sessions Error:", err);
        const message =
          err.response?.data?.message || "Gagal mengambil data sesi absensi";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [teacherId]
  );

  const createSession = useCallback(
    // MODIFIED: Tambahkan locationData sebagai parameter ketiga
    async (scheduleId, durationMinutes = 30, locationData = {}) => {
      // Tambahkan locationData
      if (!teacherId) {
        const err = new Error("Teacher ID tidak tersedia.");
        setError(err.message);
        throw err;
      }
      setLoading(true);
      setError(null);
      try {
        const sessionData = {
          // Buat objek data yang dikirim ke API
          scheduleId,
          durationMinutes,
          ...locationData, // Spread data geolokasi (latitude, longitude, radiusMeters)
        };

        const response = await teacherAPI.createAttendanceSession(
          teacherId,
          sessionData // Kirim objek data tunggal
        );
        toast.success("Sesi absensi berhasil dibuat!");
        return response.data;
      } catch (err) {
        console.error("Create Session Error:", err);
        const message =
          err.response?.data?.message || "Gagal membuat sesi absensi";
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [teacherId]
  );

  const getActiveSessions = useCallback(async () => {
    return getAttendanceSessions({ active: "true" });
  }, [getAttendanceSessions]);

  const getSessionsForDate = useCallback(
    async (date) => {
      return getAttendanceSessions({ date });
    },
    [getAttendanceSessions]
  );

  const getSessionsBySchedule = useCallback(
    async (scheduleId) => {
      return getAttendanceSessions({ scheduleId });
    },
    [getAttendanceSessions]
  ); // --- Functions to UPDATE existing attendance status ---
  const updateAttendanceStatus = useCallback(
    async (
      attendanceId,
      statusUpdateFunction,
      successMessage,
      errorMessagePrefix
    ) => {
      if (!teacherId) {
        const err = new Error("Teacher ID tidak tersedia.");
        setError(err.message); // Set hook-level error
        toast.error(err.message); // Show toast for this specific error
        throw err;
      }
      setLoading(true); // Consider if individual loading states per action are needed
      setError(null);
      try {
        const response = await statusUpdateFunction(teacherId, attendanceId);
        toast.success(successMessage || "Status absensi berhasil diperbarui!");
        return response.data;
      } catch (error) {
        console.error(`${errorMessagePrefix} Error:`, error);
        const message =
          error.response?.data?.message ||
          `Gagal memperbarui status: ${errorMessagePrefix}`;
        setError(message);
        toast.error(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [teacherId]
  );

  const markStudentPresent = useCallback(
    (attendanceId) => {
      return updateAttendanceStatus(
        attendanceId,
        teacherAPI.markStudentPresent,
        "Siswa ditandai HADIR.",
        "Mark Present"
      );
    },
    [updateAttendanceStatus]
  );

  const markStudentAlpha = useCallback(
    // Renamed from markStudentAbsent
    (attendanceId) => {
      return updateAttendanceStatus(
        attendanceId,
        teacherAPI.markStudentAlpha, // Ensure this exists in teacherAPI and sets status to ALPHA
        "Siswa ditandai ALPHA.",
        "Mark Alpha"
      );
    },
    [updateAttendanceStatus]
  );

  const markStudentSick = useCallback(
    (attendanceId) => {
      return updateAttendanceStatus(
        attendanceId,
        teacherAPI.markStudentSick, // Ensure this exists in teacherAPI and sets status to SAKIT
        "Siswa ditandai SAKIT.",
        "Mark Sick"
      );
    },
    [updateAttendanceStatus]
  );

  const markStudentPermission = useCallback(
    (attendanceId) => {
      return updateAttendanceStatus(
        attendanceId,
        teacherAPI.markStudentPermission, // Ensure this exists in teacherAPI and sets status to IZIN
        "Siswa ditandai IZIN.",
        "Mark Permission"
      );
    },
    [updateAttendanceStatus]
  ); // --- Function to CREATE new manual attendance record ---

  const createStudentAttendance = useCallback(
    async (sessionId, studentId, status, notes = "") => {
      if (!teacherId) {
        const err = new Error("Teacher ID tidak tersedia.");
        setError(err.message); // Set hook-level error
        toast.error(err.message); // Show toast
        throw err;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await teacherAPI.addManualAttendance(teacherId, {
          // This calls POST /api/teachers/:id/manual-attendance
          sessionId,
          studentId,
          status, // status should be one of HADIR, IZIN, SAKIT, ALPHA
          notes,
        });
        toast.success(
          response.data.message || "Absensi siswa berhasil dicatat!"
        );
        return response.data;
      } catch (err) {
        console.error("Create Student Attendance Error:", err);
        const message =
          err.response?.data?.message || "Gagal mencatat absensi siswa.";
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [teacherId]
  ); // addAbsentStudent might be redundant if createStudentAttendance is used with status "ALPHA" // For clarity, if it's kept, ensure it calls createStudentAttendance or directly teacherAPI.addManualAttendance with "ALPHA"

  const addAbsentStudent = useCallback(
    async (sessionId, studentId) => {
      // This function creates a NEW attendance record with status ALPHA
      // It's a specific case of createStudentAttendance
      return createStudentAttendance(
        sessionId,
        studentId,
        "ALPHA",
        "Ditandai tidak hadir oleh guru"
      );
    },
    [createStudentAttendance] // Depends on the more generic createStudentAttendance
  );

  return {
    sessions: sessionsData,
    loading,
    error,
    getAttendanceSessions,
    createSession,
    getActiveSessions,
    getSessionsForDate,
    getSessionsBySchedule, // Functions for UPDATING status of an EXISTING attendance record
    markStudentPresent,
    markStudentAlpha, // Formerly markStudentAbsent
    markStudentSick, // New
    markStudentPermission, // New // Function for CREATING a NEW manual attendance record
    createStudentAttendance,
    addAbsentStudent, // Kept for convenience, uses createStudentAttendance
  };
}

/**
 * Hook for teacher score management
 */
export function useTeacherScores(teacherId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add score functions with proper error handling
  const addQuizScore = useCallback(
    async (studentId, subjectId, value, description = null) => {
      try {
        setLoading(true);
        setError(null);

        const response = await teacherAPI.addQuizScore(
          teacherId,
          studentId,
          subjectId,
          value,
          description
        );
        toast.success("Nilai kuis berhasil ditambahkan!");
        return response.data;
      } catch (err) {
        console.error("Add Quiz Score Error:", err);
        const message =
          err.response?.data?.message || "Gagal menambahkan nilai kuis";
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [teacherId]
  );

  const addAssignmentScore = useCallback(
    async (studentId, subjectId, value, description = null) => {
      try {
        setLoading(true);
        setError(null);

        const response = await teacherAPI.addAssignmentScore(
          teacherId,
          studentId,
          subjectId,
          value,
          description
        );
        toast.success("Nilai tugas berhasil ditambahkan!");
        return response.data;
      } catch (err) {
        console.error("Add Assignment Score Error:", err);
        const message =
          err.response?.data?.message || "Gagal menambahkan nilai tugas";
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [teacherId]
  );

  const addMidtermScore = useCallback(
    async (studentId, subjectId, value, description = null) => {
      try {
        setLoading(true);
        setError(null);

        const response = await teacherAPI.addMidtermScore(
          teacherId,
          studentId,
          subjectId,
          value,
          description
        );
        toast.success("Nilai UTS berhasil ditambahkan!");
        return response.data;
      } catch (err) {
        console.error("Add Midterm Score Error:", err);
        const message =
          err.response?.data?.message || "Gagal menambahkan nilai UTS";
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [teacherId]
  );

  const addFinalScore = useCallback(
    async (studentId, subjectId, value, description = null) => {
      try {
        setLoading(true);
        setError(null);

        const response = await teacherAPI.addFinalScore(
          teacherId,
          studentId,
          subjectId,
          value,
          description
        );
        toast.success("Nilai UAS berhasil ditambahkan!");
        return response.data;
      } catch (err) {
        console.error("Add Final Score Error:", err);
        const message =
          err.response?.data?.message || "Gagal menambahkan nilai UAS";
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [teacherId]
  );

  // Update score
  const updateScore = useCallback(
    async (scoreId, scoreData) => {
      try {
        setLoading(true);
        setError(null);

        const response = await teacherAPI.updateScore(
          teacherId,
          scoreId,
          scoreData
        );
        toast.success("Nilai berhasil diperbarui!");
        return response.data;
      } catch (err) {
        console.error("Update Score Error:", err);
        const message =
          err.response?.data?.message || "Gagal memperbarui nilai";
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [teacherId]
  );

  // Get scores functions
  const getStudentScores = useCallback(
    async (studentId, params = {}) => {
      try {
        setLoading(true);
        const response = await teacherAPI.getStudentScores(
          teacherId,
          studentId,
          params
        );
        return response.data;
      } catch (err) {
        console.error("Get Student Scores Error:", err);
        const message =
          err.response?.data?.message || "Gagal mengambil nilai siswa";
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [teacherId]
  );

  const getClassScores = useCallback(
    async (classId, params = {}) => {
      try {
        setLoading(true);
        const response = await teacherAPI.getClassScores(
          teacherId,
          classId,
          params
        );
        return response.data;
      } catch (err) {
        console.error("Get Class Scores Error:", err);
        const message =
          err.response?.data?.message || "Gagal mengambil nilai kelas";
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [teacherId]
  );

  // Specific score type getters
  const getStudentSubjectScores = useCallback(
    async (studentId, subjectId) => {
      try {
        const response = await teacherAPI.getStudentSubjectScores(
          teacherId,
          studentId,
          subjectId
        );
        return response.data;
      } catch (err) {
        console.error("Get Student Subject Scores Error:", err);
        toast.error("Gagal mengambil nilai mata pelajaran siswa");
        throw err;
      }
    },
    [teacherId]
  );

  const getClassSubjectScores = useCallback(
    async (classId, subjectId, type = null) => {
      try {
        const response = await teacherAPI.getClassSubjectScores(
          teacherId,
          classId,
          subjectId,
          type
        );
        return response.data;
      } catch (err) {
        console.error("Get Class Subject Scores Error:", err);
        toast.error("Gagal mengambil nilai mata pelajaran kelas");
        throw err;
      }
    },
    [teacherId]
  );

  return {
    loading,
    error,
    // Add score functions
    addQuizScore,
    addAssignmentScore,
    addMidtermScore,
    addFinalScore,
    updateScore,
    // Get score functions
    getStudentScores,
    getClassScores,
    getStudentSubjectScores,
    getClassSubjectScores,
  };
}

/**
 * Hook for teacher class and student management
 */
export function useTeacherClassStudents(teacherId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getClassStudents = useCallback(
    async (classId) => {
      try {
        setLoading(true);
        setError(null);

        const response = await teacherAPI.getClassStudents(teacherId, classId);
        return response.data;
      } catch (err) {
        console.error("Get Class Students Error:", err);
        const message =
          err.response?.data?.message || "Gagal mengambil data siswa kelas";
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [teacherId]
  );

  return {
    loading,
    error,
    getClassStudents,
  };
}

/**
 * Combined hook for complete teacher functionality
 */
export function useTeacherComplete(teacherId) {
  const profile = useTeacherProfile(teacherId);
  const schedule = useTeacherSchedule(teacherId);
  const attendance = useTeacherAttendance(teacherId);
  const scores = useTeacherScores(teacherId);
  const classStudents = useTeacherClassStudents(teacherId);

  return {
    // Profile
    teacher: profile.teacher,
    profileLoading: profile.loading,
    profileError: profile.error,
    refetchProfile: profile.refetch,

    // Schedule
    schedule: schedule.schedule,
    scheduleLoading: schedule.loading,
    scheduleError: schedule.error,
    getScheduleForDay: schedule.getScheduleForDay,
    getScheduleForClass: schedule.getScheduleForClass,
    filterSchedule: schedule.filterSchedule,
    refetchSchedule: schedule.refetch,

    // Attendance
    sessions: attendance.sessions,
    attendanceLoading: attendance.loading,
    attendanceError: attendance.error,
    createSession: attendance.createSession,
    getActiveSessions: attendance.getActiveSessions,
    getSessionsForDate: attendance.getSessionsForDate,
    getSessionsBySchedule: attendance.getSessionsBySchedule,
    markStudentPresent: attendance.markStudentPresent,
    markStudentAbsent: attendance.markStudentAbsent,
    markStudentLate: attendance.markStudentLate,
    addAbsentStudent: attendance.addAbsentStudent,

    // Scores
    scoresLoading: scores.loading,
    scoresError: scores.error,
    addQuizScore: scores.addQuizScore,
    addAssignmentScore: scores.addAssignmentScore,
    addMidtermScore: scores.addMidtermScore,
    addFinalScore: scores.addFinalScore,
    updateScore: scores.updateScore,
    getStudentScores: scores.getStudentScores,
    getClassScores: scores.getClassScores,
    getStudentSubjectScores: scores.getStudentSubjectScores,
    getClassSubjectScores: scores.getClassSubjectScores,

    // Class Students
    classStudentsLoading: classStudents.loading,
    classStudentsError: classStudents.error,
    getClassStudents: classStudents.getClassStudents,
  };
}
/**
 * Hook specifically for class management with all CRUD operations - NEW
 */
export function useClassManagement() {
  const {
    data: classes,
    pagination,
    loading: loadingList,
    error,
    changePage,
    changeLimit,
    filter,
    refetch,
  } = usePaginatedApi(classAPI.getAllClasses, {
    showToast: false, // Don't show toast for initial load, only for errors
  });

  const {
    create,
    update,
    remove,
    getById,
    loading: crudLoading,
  } = useCrud(classAPI.crud, {
    onSuccess: () => {
      // Add a small delay before refetch to ensure backend has processed the change
      setTimeout(() => {
        refetch();
      }, 500);
    },
  });

  // Get class schedule
  const getClassSchedule = useCallback(async (classId, filters = {}) => {
    try {
      const response = await classAPI.getClassSchedule(classId, filters);
      return response.data;
    } catch (error) {
      console.error("Get Class Schedule Error:", error);

      let message = "Error retrieving class schedule";
      if (error.code === "ECONNABORTED") {
        message = "Request timeout - gagal mengambil jadwal kelas";
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }

      toast.error(message);
      throw error;
    }
  }, []);

  // Get class students with pagination
  const getClassStudents = useCallback(async (classId, params = {}) => {
    try {
      const response = await classAPI.getClassStudents(classId, params);
      return response.data;
    } catch (error) {
      console.error("Get Class Students Error:", error);

      let message = "Error retrieving class students";
      if (error.code === "ECONNABORTED") {
        message = "Request timeout - gagal mengambil data siswa";
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }

      toast.error(message);
      throw error;
    }
  }, []);

  // Search classes by name
  const searchClasses = useCallback(
    (name) => {
      filter({ name });
    },
    [filter]
  );

  return {
    classes,
    pagination,
    loading: loadingList || crudLoading,
    error,
    changePage,
    changeLimit,
    filter,
    searchClasses,
    refetch,
    create,
    update,
    remove,
    getById,
    getClassSchedule,
    getClassStudents,
  };
}

/**
 * Hook for class details with students and schedules
 */
export function useClassDetails(classId) {
  const {
    data: classData,
    loading,
    error,
    refetch,
  } = useApi(classId ? () => classAPI.getClassById(classId) : null, {
    immediate: !!classId,
    showToast: false,
  });

  const {
    data: classSchedule,
    loading: scheduleLoading,
    refetch: refetchSchedule,
  } = useApi(classId ? () => classAPI.getClassSchedule(classId) : null, {
    immediate: !!classId,
    showToast: false,
  });

  return {
    classData: classData?.class || null,
    classSchedule: classSchedule?.schedule || null,
    loading: loading || scheduleLoading,
    error,
    refetch,
    refetchSchedule,
  };
}
