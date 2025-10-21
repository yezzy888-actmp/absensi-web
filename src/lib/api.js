// src/lib/api.js
import axios from "axios";
import { AuthManager } from "./auth";

// Create axios instance with proper configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api",
  timeout: 30000, // Increased timeout to 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = AuthManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request for debugging
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data,
    });

    return config;
  },
  (error) => {
    console.error("Request Interceptor Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging
    console.log(
      `API Response: ${response.config.method?.toUpperCase()} ${
        response.config.url
      }`,
      {
        status: response.status,
        data: response.data,
      }
    );
    return response;
  },
  async (error) => {
    // Log all errors for debugging
    console.error("API Error:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
    });

    if (error.response?.status === 401) {
      // Token is invalid or expired
      AuthManager.logout();

      // Only redirect if we're not already on a login page
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/login")
      ) {
        window.location.href = "/auth/admin/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  // Role-specific login endpoints (matching your backend routes)
  loginAdmin: (credentials) => api.post("/auth/login/admin", credentials),
  loginTeacher: (credentials) => api.post("/auth/login/teacher", credentials),
  loginStudent: (credentials) => api.post("/auth/login/student", credentials),

  // Generic login function that determines the role and calls appropriate endpoint
  login: async (credentials, role = null) => {
    if (role) {
      // If role is specified, use the appropriate endpoint
      switch (role) {
        case "ADMIN":
          return api.post("/auth/login/admin", credentials);
        case "TEACHER":
          return api.post("/auth/login/teacher", credentials);
        case "STUDENT":
          return api.post("/auth/login/student", credentials);
        default:
          throw new Error(`Invalid role: ${role}`);
      }
    } else {
      // If no role specified, we need to try each endpoint or require role
      throw new Error("Role must be specified for login");
    }
  },

  // Other auth endpoints
  logout: () => api.post("/auth/logout"),
  register: (userData) => api.post("/auth/register", userData),
  registerAdmin: (userData) => api.post("/auth/register-admin", userData),
  profile: () => api.get("/auth/me"),
  changePassword: (passwordData) =>
    api.put("/auth/change-password", passwordData),

  // Password reset
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (data) => api.post("/auth/reset-password", data),

  // Email verification
  verifyEmail: (token) => api.post("/auth/verify-email", { token }),
  resendVerification: (email) =>
    api.post("/auth/resend-verification", { email }),
};

export const userAPI = {
  // Get all users with pagination and filtering
  getAllUsers: (params = {}) => {
    console.log("userAPI.getAllUsers called with params:", params);
    return api.get("/users", {
      params: {
        page: 1,
        limit: 10,
        ...params,
      },
    });
  },

  // Get user by ID
  getUserById: (id) => api.get(`/users/${id}`),

  // Create new user
  createUser: (userData) => api.post("/users", userData),

  // Update user
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),

  // Delete user
  deleteUser: (id) => api.delete(`/users/${id}`),

  // Reset user password
  resetUserPassword: (id, passwordData) =>
    api.post(`/users/${id}/reset-password`, passwordData),

  // CRUD object for use with useCrud hook
  crud: {
    getAll: (params = {}) =>
      api.get("/users", {
        params: {
          page: 1,
          limit: 10,
          ...params,
        },
      }),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post("/users", data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
  },
};

// Class API endpoints - NEW IMPLEMENTATION
export const classAPI = {
  // Get all classes with pagination and filtering
  getAllClasses: (params = {}) => {
    console.log("classAPI.getAllClasses called with params:", params);
    return api.get("/classes", {
      params: {
        page: 1,
        limit: 10,
        ...params,
      },
    });
  },

  // Get class by ID with students and schedules
  getClassById: (id) => api.get(`/classes/${id}`),

  // Get class schedule
  getClassSchedule: (id, params = {}) => {
    return api.get(`/classes/${id}/schedule`, { params });
  },

  // Get students in a class
  getClassStudents: (id, params = {}) => {
    return api.get(`/classes/${id}/students`, {
      params: {
        page: 1,
        limit: 10,
        ...params,
      },
    });
  },

  // Create new class
  createClass: (classData) => api.post("/classes", classData),

  // Update class
  updateClass: (id, classData) => api.put(`/classes/${id}`, classData),

  // Delete class
  deleteClass: (id) => api.delete(`/classes/${id}`),

  // CRUD object for use with useCrud hook
  crud: {
    getAll: (params = {}) =>
      api.get("/classes", {
        params: {
          page: 1,
          limit: 10,
          ...params,
        },
      }),
    getById: (id) => api.get(`/classes/${id}`),
    create: (data) => api.post("/classes", data),
    update: (id, data) => api.put(`/classes/${id}`, data),
    delete: (id) => api.delete(`/classes/${id}`),
  },
};

// Subject API endpoints
export const subjectAPI = {
  // Get all subjects with pagination and filtering
  getAllSubjects: (params = {}) => {
    console.log("subjectAPI.getAllSubjects called with params:", params);
    return api.get("/subjects", {
      params: {
        page: 1,
        limit: 10,
        ...params,
      },
    });
  },

  // Get subject by ID with teachers and schedules
  getSubjectById: (id) => api.get(`/subjects/${id}`),

  // Get teachers assigned to a subject
  getSubjectTeachers: (id) => api.get(`/subjects/${id}/teachers`),

  // Create new subject
  createSubject: (subjectData) => api.post("/subjects", subjectData),

  // Update subject
  updateSubject: (id, subjectData) => api.put(`/subjects/${id}`, subjectData),

  // Delete subject
  deleteSubject: (id) => api.delete(`/subjects/${id}`),

  // Assign teacher to subject
  assignTeacher: (id, teacherData) =>
    api.post(`/subjects/${id}/assign-teacher`, teacherData),

  // Remove teacher from subject
  removeTeacher: (id, teacherId) =>
    api.delete(`/subjects/${id}/remove-teacher/${teacherId}`),

  // CRUD object for use with useCrud hook
  crud: {
    getAll: (params = {}) =>
      api.get("/subjects", {
        params: {
          page: 1,
          limit: 10,
          ...params,
        },
      }),
    getById: (id) => api.get(`/subjects/${id}`),
    create: (data) => api.post("/subjects", data),
    update: (id, data) => api.put(`/subjects/${id}`, data),
    delete: (id) => api.delete(`/subjects/${id}`),
  },
};

// Teacher Subject API Endpoints
export const teacherSubjectAPI = {
  // Get all subjects assigned to a teacher
  // GET /api/teacher-subjects/:teacherId/subjects
  getTeacherSubjects: (teacherId) => {
    console.log(
      "teacherSubjectAPI.getTeacherSubjects called with teacherId:",
      teacherId
    );
    return api.get(`/teacher-subjects/${teacherId}/subjects`);
  },

  // Assign multiple subjects to a teacher at once
  // POST /api/teacher-subjects/:teacherId/subjects
  assignSubjectsToTeacher: (teacherId, subjectIds) => {
    console.log("teacherSubjectAPI.assignSubjectsToTeacher called with:", {
      teacherId,
      subjectIds,
    });
    return api.post(`/teacher-subjects/${teacherId}/subjects`, {
      subjectIds: Array.isArray(subjectIds) ? subjectIds : [subjectIds],
    });
  },

  // Remove a subject assignment from a teacher
  // DELETE /api/teacher-subjects/:teacherId/subjects/:subjectId
  removeSubjectFromTeacher: (teacherId, subjectId) => {
    console.log("teacherSubjectAPI.removeSubjectFromTeacher called with:", {
      teacherId,
      subjectId,
    });
    return api.delete(`/teacher-subjects/${teacherId}/subjects/${subjectId}`);
  },

  // Replace all subject assignments for a teacher
  // PUT /api/teacher-subjects/:teacherId/subjects
  updateTeacherSubjects: (teacherId, subjectIds) => {
    console.log("teacherSubjectAPI.updateTeacherSubjects called with:", {
      teacherId,
      subjectIds,
    });
    return api.put(`/teacher-subjects/${teacherId}/subjects`, {
      subjectIds: Array.isArray(subjectIds) ? subjectIds : [subjectIds],
    });
  },

  // Convenience methods for easier usage
  // Assign a single subject to a teacher
  assignSingleSubject: (teacherId, subjectId) => {
    return api.post(`/teacher-subjects/${teacherId}/subjects`, {
      subjectIds: [subjectId],
    });
  },

  // Check if teacher is assigned to a specific subject
  isTeacherAssignedToSubject: async (teacherId, subjectId) => {
    try {
      const response = await api.get(`/teacher-subjects/${teacherId}/subjects`);
      const subjects = response.data.subjects || [];
      return subjects.some((subject) => subject.id === subjectId);
    } catch (error) {
      console.error("Error checking teacher subject assignment:", error);
      return false;
    }
  },

  // Get subjects not assigned to a teacher (useful for assignment UI)
  getUnassignedSubjects: async (teacherId) => {
    try {
      // Get all subjects
      const allSubjectsResponse = await api.get("/subjects");
      const allSubjects =
        allSubjectsResponse.data.subjects || allSubjectsResponse.data || [];

      // Get teacher's assigned subjects
      const teacherSubjectsResponse = await api.get(
        `/teacher-subjects/${teacherId}/subjects`
      );
      const assignedSubjects = teacherSubjectsResponse.data.subjects || [];

      // Filter out assigned subjects
      const assignedSubjectIds = assignedSubjects.map((subject) => subject.id);
      const unassignedSubjects = allSubjects.filter(
        (subject) => !assignedSubjectIds.includes(subject.id)
      );

      return { data: { subjects: unassignedSubjects } };
    } catch (error) {
      console.error("Error getting unassigned subjects:", error);
      throw error;
    }
  },
};
// Schedule API endpoints - NEW IMPLEMENTATION
export const scheduleAPI = {
  getAll: (params = {}) => api.get("/schedules/all", { params }),
  getFiltered: (params = {}) => api.get("/schedules/filter", { params }),
  getById: (id, params = {}) => api.get(`/schedules/${id}`, { params }), // Fixed template literal
  create: (data) => api.post("/schedules", data),
  update: (id, data) => api.put(`/schedules/${id}`, data), // Fixed template literal
  delete: (id) => api.delete(`/schedules/${id}`), // Fixed template literal
  getClassWeekly: (classId) => api.get(`/schedules/class/${classId}/week`), // Fixed template literal
  getTeacherWeekly: (teacherId) =>
    api.get(`/schedules/teacher/${teacherId}/week`), // Fixed template literal
  getStudentToday: (studentId) =>
    api.get(`/schedules/student/${studentId}/today`), // Fixed template literal
  getTeacherToday: (teacherId) =>
    api.get(`/schedules/teacher/${teacherId}/today`), // Fixed template literal
  getSubjects: async () => api.get("/subjects"),
  getClasses: async () => api.get("/classes"),
  getTeachers: async () => api.get("/teachers"),

  // Enhanced validation
  validate: {
    timeFormat: (time) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(time),
    scheduleData: (data) => {
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

      if (!data.subjectId) errors.push("Subject ID is required");
      if (!data.classId) errors.push("Class ID is required");
      if (!data.teacherId) errors.push("Teacher ID is required");
      if (!validDays.includes(data.day))
        errors.push(`Invalid day: ${data.day}`); // Fixed template literal

      const timeFormat = (time) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);

      if (!timeFormat(data.startTime)) errors.push("Invalid start time format");
      if (!timeFormat(data.endTime)) errors.push("Invalid end time format");

      // Validate time logic
      if (
        data.startTime &&
        data.endTime &&
        timeFormat(data.startTime) &&
        timeFormat(data.endTime)
      ) {
        const start = new Date(`2000-01-01T${data.startTime}:00`); // Fixed template literal
        const end = new Date(`2000-01-01T${data.endTime}:00`); // Fixed template literal

        if (start >= end) {
          errors.push("Start time must be earlier than end time");
        }
      }

      return errors;
    },
  },

  // Conflict check helper
  checkConflicts: async (data) => {
    try {
      return await api.post("/schedules/check-conflicts", data);
    } catch (error) {
      return error.response;
    }
  },
};

// Teacher API endpoints - UPDATED IMPLEMENTATION
export const teacherAPI = {
  // Basic teacher information
  getAllTeachers: (params = {}) => {
    console.log("teacherAPI.getAllTeachers called with params:", params);
    return api.get("/teachers", {
      params: {
        page: 1,
        limit: 10,
        ...params,
      },
    });
  },

  getTeacherById: (id) => api.get(`/teachers/${id}`),

  // Teacher schedule/timetable
  getTeacherSchedule: (id, params = {}) => {
    return api.get(`/teachers/${id}/schedule`, { params });
  },

  // Attendance session management
  createAttendanceSession: (teacherId, sessionData) => {
    return api.post(`/teachers/${teacherId}/attendance-sessions`, sessionData);
  },

  getAttendanceSessions: (teacherId, params = {}) => {
    return api.get(`/teachers/${teacherId}/attendance-sessions`, { params });
  },

  // Attendance management
  manageAttendance: (teacherId, attendanceId, statusData) => {
    return api.put(
      `/teachers/${teacherId}/attendance/${attendanceId}`,
      statusData
    );
  },

  addManualAttendance: (teacherId, attendanceData) => {
    return api.post(`/teachers/${teacherId}/manual-attendance`, attendanceData);
  },

  // Score management
  addScore: (teacherId, scoreData) => {
    return api.post(`/teachers/${teacherId}/scores`, scoreData);
  },

  updateScore: (teacherId, scoreId, scoreData) => {
    return api.put(`/teachers/${teacherId}/scores/${scoreId}`, scoreData);
  },

  // Student and class data
  getClassStudents: (teacherId, classId) => {
    return api.get(`/teachers/${teacherId}/class-students/${classId}`);
  },

  getStudentScores: (teacherId, studentId, params = {}) => {
    return api.get(`/teachers/${teacherId}/student-scores/${studentId}`, {
      params,
    });
  },

  getClassScores: (teacherId, classId, params = {}) => {
    return api.get(`/teachers/${teacherId}/class-scores/${classId}`, {
      params,
    });
  },

  // Convenience methods for common operations
  getSubjects: (teacherId) => {
    return api.get(`/teacher-subjects/${teacherId}/subjects`);
  },

  assignSubjects: (teacherId, subjectIds) => {
    return api.post(`/teacher-subjects/${teacherId}/subjects`, {
      subjectIds: Array.isArray(subjectIds) ? subjectIds : [subjectIds],
    });
  },

  removeSubject: (teacherId, subjectId) => {
    return api.delete(`/teacher-subjects/${teacherId}/subjects/${subjectId}`);
  },

  updateSubjects: (teacherId, subjectIds) => {
    return api.put(`/teacher-subjects/${teacherId}/subjects`, {
      subjectIds: Array.isArray(subjectIds) ? subjectIds : [subjectIds],
    });
  },

  getAssignedClassesForSubjects: async (teacherId) => {
    try {
      const subjectsResponse = await api.get(
        `/teacher-subjects/${teacherId}/subjects`
      );
      const subjects = subjectsResponse.data.subjects || [];

      // This would require additional backend endpoint to get classes by teacher and subject
      // For now, return the subjects with note that classes need separate endpoint
      return {
        data: {
          subjects,
          note: "Classes per subject require separate endpoint implementation",
        },
      };
    } catch (error) {
      console.error("Error getting assigned classes for subjects:", error);
      throw error;
    }
  },
  // These wrap the above methods with better naming for specific use cases

  // Profile management (assuming teacher can get their own data)
  getProfile: (teacherId) => api.get(`/teachers/${teacherId}`),

  // Schedule management
  getSchedule: (teacherId, params = {}) => {
    return api.get(`/teachers/${teacherId}/schedule`, { params });
  },

  getDaySchedule: (teacherId, day) => {
    return api.get(`/teachers/${teacherId}/schedule`, {
      params: { day },
    });
  },

  getClassSchedule: (teacherId, classId) => {
    return api.get(`/teachers/${teacherId}/schedule`, {
      params: { classId },
    });
  },

  // Attendance session helpers
  createSession: (teacherId, scheduleId, durationMinutes = 30) => {
    return api.post(`/teachers/${teacherId}/attendance-sessions`, {
      scheduleId,
      durationMinutes,
    });
  },

  getActiveSessions: (teacherId) => {
    return api.get(`/teachers/${teacherId}/attendance-sessions`, {
      params: { active: "true" },
    });
  },

  getSessionsForDate: (teacherId, date) => {
    return api.get(`/teachers/${teacherId}/attendance-sessions`, {
      params: { date },
    });
  },

  getSessionsBySchedule: (teacherId, scheduleId) => {
    return api.get(`/teachers/${teacherId}/attendance-sessions`, {
      params: { scheduleId },
    });
  },

  // Attendance management helpers
  markStudentPresent: (teacherId, attendanceId) => {
    return api.put(`/teachers/${teacherId}/attendance/${attendanceId}`, {
      status: "HADIR",
    });
  },

  markStudentAlpha: (teacherId, attendanceId) => {
    return api.put(`/teachers/${teacherId}/attendance/${attendanceId}`, {
      status: "ALPHA",
    });
  },
  markStudentSick: (teacherId, attendanceId) => {
    return api.put(`/teachers/${teacherId}/attendance/${attendanceId}`, {
      status: "SAKIT",
    });
  },
  markStudentPermission: (teacherId, attendanceId) => {
    return api.put(`/teachers/${teacherId}/attendance/${attendanceId}`, {
      status: "IZIN",
    });
  },

  addAbsentStudent: (teacherId, sessionId, studentId) => {
    return api.post(`/teachers/${teacherId}/manual-attendance`, {
      sessionId,
      studentId,
      status: "ALPHA",
    });
  },

  // Score management helpers
  addQuizScore: (
    teacherId,
    studentId,
    subjectId,
    value,
    description = null
  ) => {
    return api.post(`/teachers/${teacherId}/scores`, {
      studentId,
      subjectId,
      type: "QUIZ",
      value,
      description,
    });
  },

  addAssignmentScore: (
    teacherId,
    studentId,
    subjectId,
    value,
    description = null
  ) => {
    return api.post(`/teachers/${teacherId}/scores`, {
      studentId,
      subjectId,
      type: "TUGAS",
      value,
      description,
    });
  },

  addMidtermScore: (
    teacherId,
    studentId,
    subjectId,
    value,
    description = null
  ) => {
    return api.post(`/teachers/${teacherId}/scores`, {
      studentId,
      subjectId,
      type: "UTS",
      value,
      description,
    });
  },

  addFinalScore: (
    teacherId,
    studentId,
    subjectId,
    value,
    description = null
  ) => {
    return api.post(`/teachers/${teacherId}/scores`, {
      studentId,
      subjectId,
      type: "UAS",
      value,
      description,
    });
  },

  // Score retrieval helpers
  getStudentSubjectScores: (teacherId, studentId, subjectId) => {
    return api.get(`/teachers/${teacherId}/student-scores/${studentId}`, {
      params: { subjectId },
    });
  },

  getClassSubjectScores: (teacherId, classId, subjectId, type = null) => {
    const params = { subjectId };
    if (type) params.type = type;

    return api.get(`/teachers/${teacherId}/class-scores/${classId}`, {
      params,
    });
  },

  getClassQuizScores: (teacherId, classId, subjectId) => {
    return api.get(`/teachers/${teacherId}/class-scores/${classId}`, {
      params: { subjectId, type: "QUIZ" },
    });
  },

  getClassAssignmentScores: (teacherId, classId, subjectId) => {
    return api.get(`/teachers/${teacherId}/class-scores/${classId}`, {
      params: { subjectId, type: "ASSIGNMENT" },
    });
  },

  getClassMidtermScores: (teacherId, classId, subjectId) => {
    return api.get(`/teachers/${teacherId}/class-scores/${classId}`, {
      params: { subjectId, type: "MIDTERM" },
    });
  },

  getClassFinalScores: (teacherId, classId, subjectId) => {
    return api.get(`/teachers/${teacherId}/class-scores/${classId}`, {
      params: { subjectId, type: "FINAL" },
    });
  },

  // CRUD object for use with useCrud hook (for basic teacher management)
  crud: {
    getAll: (params = {}) =>
      api.get("/teachers", {
        params: {
          page: 1,
          limit: 10,
          ...params,
        },
      }),
    getById: (id) => api.get(`/teachers/${id}`),
    // Note: Create, update, delete might be handled differently for teachers
    // as they're usually created through user management
    create: (data) => api.post("/teachers", data),
    update: (id, data) => api.put(`/teachers/${id}`, data),
    delete: (id) => api.delete(`/teachers/${id}`),
  },
};

// Student API endpoints
export const studentAPI = {
  // Profile
  getProfile: () => api.get("/student/profile"),
  updateProfile: (data) => api.put("/student/profile", data),

  // Classes
  getClasses: () => api.get("/student/classes"),
  getClassById: (id) => api.get(`/student/classes/${id}`),

  // Grades
  getGrades: () => api.get("/student/grades"),
  getGradesBySubject: (subjectId) =>
    api.get(`/student/grades/subject/${subjectId}`),

  // Assignments
  getAssignments: () => api.get("/student/assignments"),
  submitAssignment: (assignmentId, data) =>
    api.post(`/student/assignments/${assignmentId}/submit`, data),

  // Attendance
  getAttendance: () => api.get("/student/attendance"),

  // Schedule
  getSchedule: () => api.get("/student/schedule"),
};

export default api;
