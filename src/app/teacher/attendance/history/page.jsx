// src/app/teacher/attendance/history/page.jsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTeacherAttendance } from "@/hooks/useApi"; // Ensure this path is correct
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  Filter,
  RefreshCw,
  AlertCircle,
  Download,
  Printer,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function HistoryAttendancePage() {
  const { user } = useAuth();
  const teacherId = user?.profileData?.id;

  // State for filters and pagination
  const [filters, setFilters] = useState({
    status: "", // HADIR, ALPHA, IZIN, SAKIT
    active: "", // New filter for active sessions (true/false)
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  // Fetch attendance sessions using the custom hook
  const {
    sessions: rawSessions,
    loading: sessionsLoading,
    error: sessionsError,
    getAttendanceSessions,
  } = useTeacherAttendance(teacherId);

  // Memoize all subjects and classes for filter dropdowns (though now unused, keeping for reference if needed elsewhere)
  const allSubjects = useMemo(() => {
    const subjects = new Map();
    rawSessions.forEach((session) => {
      session.attendances?.forEach((att) => {
        if (att.schedule?.subject) {
          subjects.set(att.schedule.subject.id, att.schedule.subject);
        }
      });
    });
    return Array.from(subjects.values());
  }, [rawSessions]);

  const allClasses = useMemo(() => {
    const classes = new Map();
    rawSessions.forEach((session) => {
      session.attendances?.forEach((att) => {
        if (att.schedule?.class) {
          classes.set(att.schedule.class.id, att.schedule.class);
        }
      });
    });
    return Array.from(classes.values());
  }, [rawSessions]);

  // Effect to refetch sessions when filters or pagination change
  useEffect(() => {
    if (teacherId) {
      const fetchParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      };
      // Convert date to YYYY-MM-DD format if it exists for API consistency
      // This part will now only apply if 'date' filter is reintroduced.
      // if (fetchParams.date) {
      //   fetchParams.date = new Date(fetchParams.date)
      //     .toISOString()
      //     .split("T")[0];
      // }
      getAttendanceSessions(fetchParams);
    }
  }, [teacherId, pagination, filters, sortConfig, getAttendanceSessions]);

  // Handle filter changes
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page on filter change
  }, []);

  // Handle sorting
  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  // Filter and sort sessions client-side
  const filteredAndSortedSessions = useMemo(() => {
    let sessions = [];
    rawSessions.forEach((session) => {
      session.attendances?.forEach((att) => {
        sessions.push({
          ...att,
          sessionId: session.id,
          schedule: session.schedule,
          date: new Date(session.date).toISOString().split("T")[0],
        });
      });
    });

    return sessions
      .filter((att) => {
        // Only status and active filters remain
        if (filters.status && att.status !== filters.status) return false;
        // 'active' filter is typically on the session itself, not individual attendance records.
        // If the backend filters `rawSessions` by `active`, this client-side filter might be unnecessary.
        // If you need to filter individual attendance records by 'active' status of their session,
        // you'd need to add `session.active` to your session object and filter here.
        return true;
      })
      .sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined || bValue === undefined) return 0; // Handle missing keys

        if (
          sortConfig.key === "date" ||
          sortConfig.key === "schedule.startTime"
        ) {
          const dateA = new Date(
            a.date + "T" + (a.schedule?.startTime || "00:00")
          );
          const dateB = new Date(
            b.date + "T" + (b.schedule?.startTime || "00:00")
          );
          return sortConfig.direction === "asc"
            ? dateA.getTime() - dateB.getTime()
            : dateB.getTime() - dateA.getTime();
        } else if (typeof aValue === "string" && typeof bValue === "string") {
          // Handle nested properties for sorting (e.g., 'schedule.subject.name')
          const getNestedValue = (obj, path) => {
            return path.split(".").reduce((acc, part) => acc && acc[part], obj);
          };

          const nestedA = getNestedValue(a, sortConfig.key);
          const nestedB = getNestedValue(b, sortConfig.key);

          if (typeof nestedA === "string" && typeof nestedB === "string") {
            return sortConfig.direction === "asc"
              ? nestedA.localeCompare(nestedB)
              : nestedB.localeCompare(nestedA);
          }
          return 0;
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        }
        return 0;
      });
  }, [rawSessions, filters, sortConfig]);

  const totalItems = filteredAndSortedSessions.length;
  const totalPages = 1;

  const paginatedData = useMemo(() => {
    return filteredAndSortedSessions;
  }, [filteredAndSortedSessions]);

  // Helper function to format attendance status
  const formatStatus = (status) => {
    switch (status) {
      case "HADIR":
        return "Hadir";
      case "ALPHA":
        return "Tidak Hadir (Alpha)";
      case "IZIN":
        return "Izin";
      case "SAKIT":
        return "Sakit";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "HADIR":
        return "bg-green-100 text-green-800";
      case "ALPHA":
        return "bg-red-100 text-red-800";
      case "IZIN":
        return "bg-yellow-100 text-yellow-800";
      case "SAKIT":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const dayNames = {
    SENIN: "Senin",
    SELASA: "Selasa",
    RABU: "Rabu",
    KAMIS: "Kamis",
    JUMAT: "Jumat",
    SABTU: "Sabtu",
    MINGGU: "Minggu",
  };

  if (!user?.id) {
    return (
      <div className="space-y-6">
        <div className="card p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Autentikasi Diperlukan
          </h3>
          <p className="text-gray-600 mb-4">
            Silakan masuk untuk melihat riwayat absensi.
          </p>
        </div>
      </div>
    );
  }

  if (sessionsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Memuat riwayat absensi...</span>
        </div>
      </div>
    );
  }

  if (sessionsError) {
    return (
      <div className="space-y-6">
        <div className="card p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Gagal Memuat Riwayat Absensi
          </h3>
          <p className="text-gray-600 mb-4">{sessionsError}</p>
          <button
            onClick={() =>
              getAttendanceSessions({
                ...pagination,
                ...filters,
                sortBy: sortConfig.key,
                sortOrder: sortConfig.direction,
              })
            }
            className="btn-primary"
          >
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
          <h1 className="text-3xl font-bold text-gray-900">
            Riwayat Absensi Saya
          </h1>
          <p className="text-gray-600 mt-1">
            Lihat semua sesi absensi yang telah Anda kelola.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            className="btn-secondary"
            onClick={() =>
              getAttendanceSessions({
                ...pagination,
                ...filters,
                sortBy: sortConfig.key,
                sortOrder: sortConfig.direction,
              })
            }
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="card p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-1">
          <label
            htmlFor="status-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status Absensi
          </label>
          <select
            id="status-filter"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="input-field"
          >
            <option value="">Semua Status</option>
            <option value="HADIR">Hadir</option>
            <option value="ALPHA">Tidak Hadir (Alpha)</option>
            <option value="IZIN">Izin</option>
            <option value="SAKIT">Sakit</option>
          </select>
        </div>
        <div className="col-span-1">
          <label
            htmlFor="active-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Sesi Aktif
          </label>
          <select
            id="active-filter"
            name="active"
            value={filters.active}
            onChange={handleFilterChange}
            className="input-field"
          >
            <option value="">Semua Sesi</option>
            <option value="true">Aktif</option>
            <option value="false">Tidak Aktif</option>
          </select>
        </div>
      </div>

      {/* Attendance History Table/List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("date")}
                >
                  Tanggal
                  {sortConfig.key === "date" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="inline-block w-4 h-4 ml-1" />
                    ) : (
                      <ChevronDown className="inline-block w-4 h-4 ml-1" />
                    ))}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("schedule.day")}
                >
                  Hari
                  {sortConfig.key === "schedule.day" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="inline-block w-4 h-4 ml-1" />
                    ) : (
                      <ChevronDown className="inline-block w-4 h-4 ml-1" />
                    ))}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("schedule.startTime")}
                >
                  Waktu
                  {sortConfig.key === "schedule.startTime" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="inline-block w-4 h-4 ml-1" />
                    ) : (
                      <ChevronDown className="inline-block w-4 h-4 ml-1" />
                    ))}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("schedule.subject.name")}
                >
                  Mata Pelajaran
                  {sortConfig.key === "schedule.subject.name" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="inline-block w-4 h-4 ml-1" />
                    ) : (
                      <ChevronDown className="inline-block w-4 h-4 ml-1" />
                    ))}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("schedule.class.name")}
                >
                  Kelas
                  {sortConfig.key === "schedule.class.name" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="inline-block w-4 h-4 ml-1" />
                    ) : (
                      <ChevronDown className="inline-block w-4 h-4 ml-1" />
                    ))}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("student.name")}
                >
                  Nama Siswa
                  {sortConfig.key === "student.name" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="inline-block w-4 h-4 ml-1" />
                    ) : (
                      <ChevronDown className="inline-block w-4 h-4 ml-1" />
                    ))}
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("status")}
                >
                  Status
                  {sortConfig.key === "status" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className="inline-block w-4 h-4 ml-1" />
                    ) : (
                      <ChevronDown className="inline-block w-4 h-4 ml-1" />
                    ))}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.length > 0 ? (
                paginatedData.map((att) => (
                  <tr key={att.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(att.date).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dayNames[att.schedule?.day] || att.schedule?.day}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {att.schedule?.startTime} - {att.schedule?.endTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {att.schedule?.subject?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {att.schedule?.class?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {att.student?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          att.status
                        )}`}
                      >
                        {formatStatus(att.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    Tidak ada riwayat absensi ditemukan untuk filter yang
                    dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <button
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                page: Math.max(1, prev.page - 1),
              }))
            }
            disabled={pagination.page === 1}
            className="btn-secondary px-3 py-1.5 text-sm"
          >
            Sebelumnya
          </button>
          <span className="text-sm text-gray-700">
            Halaman {pagination.page} dari {totalPages}
          </span>
          <button
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                page: Math.min(totalPages, prev.page + 1),
              }))
            }
            disabled={pagination.page === totalPages}
            className="btn-secondary px-3 py-1.5 text-sm"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
}
