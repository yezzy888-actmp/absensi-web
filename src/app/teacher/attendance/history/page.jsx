// src/app/teacher/attendance/history/page.jsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTeacherAttendance } from "@/hooks/useApi";
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

  const [filters, setFilters] = useState({
    status: "",
    active: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
  });
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  const {
    sessions: rawSessions,
    loading: sessionsLoading,
    error: sessionsError,
    getAttendanceSessions,
  } = useTeacherAttendance(teacherId);

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

  useEffect(() => {
    if (teacherId) {
      const fetchParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      };
      getAttendanceSessions(fetchParams);
    }
  }, [teacherId, pagination, filters, sortConfig, getAttendanceSessions]);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleSort = useCallback((key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

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
        if (filters.status && att.status !== filters.status) return false;
        return true;
      })
      .sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === undefined || bValue === undefined) return 0;

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
        return "bg-green-100 text-green-800 border border-green-200";
      case "ALPHA":
        return "bg-red-100 text-red-800 border border-red-200";
      case "IZIN":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "SAKIT":
        return "bg-orange-100 text-orange-800 border border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
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

      {/* Filter Section - Updated dengan warna blue */}
      <div className="card p-6">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Filter Data</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1">
            <label
              htmlFor="status-filter"
              className="block text-sm font-medium text-gray-700 mb-2"
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
              className="block text-sm font-medium text-gray-700 mb-2"
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
      </div>

      {/* Attendance History Table - Updated dengan warna blue */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-blue-100">
            <thead className="bg-blue-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center">
                    Tanggal
                    {sortConfig.key === "date" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="inline-block w-4 h-4 ml-1 text-blue-600" />
                      ) : (
                        <ChevronDown className="inline-block w-4 h-4 ml-1 text-blue-600" />
                      ))}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort("schedule.day")}
                >
                  <div className="flex items-center">
                    Hari
                    {sortConfig.key === "schedule.day" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="inline-block w-4 h-4 ml-1 text-blue-600" />
                      ) : (
                        <ChevronDown className="inline-block w-4 h-4 ml-1 text-blue-600" />
                      ))}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort("schedule.startTime")}
                >
                  <div className="flex items-center">
                    Waktu
                    {sortConfig.key === "schedule.startTime" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="inline-block w-4 h-4 ml-1 text-blue-600" />
                      ) : (
                        <ChevronDown className="inline-block w-4 h-4 ml-1 text-blue-600" />
                      ))}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort("schedule.subject.name")}
                >
                  <div className="flex items-center">
                    Mata Pelajaran
                    {sortConfig.key === "schedule.subject.name" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="inline-block w-4 h-4 ml-1 text-blue-600" />
                      ) : (
                        <ChevronDown className="inline-block w-4 h-4 ml-1 text-blue-600" />
                      ))}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort("schedule.class.name")}
                >
                  <div className="flex items-center">
                    Kelas
                    {sortConfig.key === "schedule.class.name" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="inline-block w-4 h-4 ml-1 text-blue-600" />
                      ) : (
                        <ChevronDown className="inline-block w-4 h-4 ml-1 text-blue-600" />
                      ))}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort("student.name")}
                >
                  <div className="flex items-center">
                    Nama Siswa
                    {sortConfig.key === "student.name" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="inline-block w-4 h-4 ml-1 text-blue-600" />
                      ) : (
                        <ChevronDown className="inline-block w-4 h-4 ml-1 text-blue-600" />
                      ))}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Status
                    {sortConfig.key === "status" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="inline-block w-4 h-4 ml-1 text-blue-600" />
                      ) : (
                        <ChevronDown className="inline-block w-4 h-4 ml-1 text-blue-600" />
                      ))}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-blue-50">
              {paginatedData.length > 0 ? (
                paginatedData.map((att, index) => (
                  <tr
                    key={att.id}
                    className={`hover:bg-blue-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-blue-25"
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(att.date).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dayNames[att.schedule?.day] || att.schedule?.day}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-blue-500 mr-2" />
                        {att.schedule?.startTime} - {att.schedule?.endTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 text-blue-500 mr-2" />
                        {att.schedule?.subject?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-blue-500 mr-2" />
                        {att.schedule?.class?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {att.student?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
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
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-blue-300" />
                    <p className="font-medium text-gray-700">
                      Tidak ada riwayat absensi ditemukan
                    </p>
                    <p className="text-sm mt-1">untuk filter yang dipilih.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls - Updated dengan warna blue */}
        <div className="flex items-center justify-between px-6 py-4 bg-blue-50 border-t-2 border-blue-100">
          <button
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                page: Math.max(1, prev.page - 1),
              }))
            }
            disabled={pagination.page === 1}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sebelumnya
          </button>
          <span className="text-sm font-medium text-blue-900">
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
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
}
