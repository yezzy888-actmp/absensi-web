"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  AlertTriangle,
  Clock,
  Users,
  BookOpen,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import {
  useScheduleManagement,
  useSubjectManagement,
  useTeacherManagement,
  useClassManagement,
} from "@/hooks/useApi";
import { subjectAPI } from "@/lib/api";
import toast from "react-hot-toast";

const DAYS = [
  { value: "SENIN", label: "Senin" },
  { value: "SELASA", label: "Selasa" },
  { value: "RABU", label: "Rabu" },
  { value: "KAMIS", label: "Kamis" },
  { value: "JUMAT", label: "Jumat" },
  { value: "SABTU", label: "Sabtu" },
];

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 7; hour <= 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      slots.push(timeString);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export default function AdminSchedulesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const [formData, setFormData] = useState({
    classId: "",
    subjectId: "",
    teacherId: "",
    day: "",
    startTime: "",
    endTime: "",
  });

  const {
    schedules,
    pagination,
    loading,
    error,
    conflictData,
    changePage,
    changeLimit,
    create,
    update,
    remove,
    refetch,
    clearConflicts,
  } = useScheduleManagement();

  const { subjects } = useSubjectManagement();
  const { classes } = useClassManagement();

  const getTeachersBySubject = useCallback(async (subjectId) => {
    if (!subjectId) {
      setFilteredTeachers([]);
      return;
    }

    try {
      setLoadingTeachers(true);
      const response = await subjectAPI.getSubjectTeachers(subjectId);
      const teachersData = response.data?.teachers || [];
      setFilteredTeachers(teachersData);
    } catch (error) {
      console.error("Error fetching teachers for subject:", error);
      if (error.response?.status === 404) {
        toast.error("Mata pelajaran tidak ditemukan");
      } else if (error.response?.status === 500) {
        toast.error("Terjadi kesalahan server saat memuat guru");
      } else {
        toast.error("Gagal memuat guru untuk mata pelajaran ini");
      }
      setFilteredTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  }, []);

  useEffect(() => {
    if (formData.subjectId) {
      getTeachersBySubject(formData.subjectId);
      setFormData((prev) => ({ ...prev, teacherId: "" }));
    } else {
      setFilteredTeachers([]);
    }
  }, [formData.subjectId, getTeachersBySubject]);

  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearch =
      !searchTerm ||
      schedule.subject?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      schedule.class?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.teacher?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      schedule.room?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDay = !selectedDay || schedule.day === selectedDay;
    const matchesClass = !selectedClass || schedule.classId === selectedClass;
    const matchesSubject =
      !selectedSubject || schedule.subjectId === selectedSubject;

    return matchesSearch && matchesDay && matchesClass && matchesSubject;
  });

  const resetFormData = () => {
    setFormData({
      classId: "",
      subjectId: "",
      teacherId: "",
      day: "",
      startTime: "",
      endTime: "",
    });
    setFilteredTeachers([]);
  };

  const handleCreate = () => {
    setModalMode("create");
    setSelectedSchedule(null);
    resetFormData();
    setShowModal(true);
  };

  const formatTimeForForm = (time) => {
    if (!time) return "";
    if (time.match(/^\d{2}:\d{2}$/)) return time;
    if (time.match(/^\d{2}:\d{2}:\d{2}$/)) return time.substring(0, 5);
    return time;
  };

  const handleEdit = async (schedule) => {
    setModalMode("edit");
    setSelectedSchedule(schedule);

    setFormData({
      classId: schedule.classId || "",
      subjectId: schedule.subjectId || "",
      teacherId: schedule.teacherId || "",
      day: schedule.day || "",
      startTime: formatTimeForForm(schedule.startTime),
      endTime: formatTimeForForm(schedule.endTime),
    });

    if (schedule.subjectId) {
      await getTeachersBySubject(schedule.subjectId);
    }

    setShowModal(true);
  };

  const handleDelete = async (schedule) => {
    if (
      window.confirm(
        `Yakin ingin menghapus jadwal ${schedule.subject?.name} - ${schedule.class?.name}?`
      )
    ) {
      try {
        await remove(schedule.id);
        toast.success("Jadwal berhasil dihapus!");
        refetch();
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Gagal menghapus jadwal");
      }
    }
  };

  const validateFormData = () => {
    const errors = [];
    if (!formData.classId) errors.push("Kelas harus dipilih");
    if (!formData.subjectId) errors.push("Mata pelajaran harus dipilih");
    if (!formData.teacherId) errors.push("Guru harus dipilih");
    if (!formData.day) errors.push("Hari harus dipilih");
    if (!formData.startTime) errors.push("Waktu mulai harus dipilih");
    if (!formData.endTime) errors.push("Waktu selesai harus dipilih");

    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}:00`);
      const end = new Date(`2000-01-01T${formData.endTime}:00`);
      if (start >= end) {
        errors.push("Waktu mulai harus lebih awal dari waktu selesai");
      }
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateFormData();
    if (validationErrors.length > 0) {
      toast.error(validationErrors.join("\n"));
      return;
    }

    const submitData = {
      subjectId: formData.subjectId,
      classId: formData.classId,
      teacherId: formData.teacherId,
      day: formData.day,
      startTime: formData.startTime,
      endTime: formData.endTime,
    };

    try {
      if (modalMode === "create") {
        await create(submitData);
        toast.success("Jadwal berhasil dibuat!");
      } else {
        await update(selectedSchedule.id, submitData);
        toast.success("Jadwal berhasil diperbarui!");
      }

      setShowModal(false);
      resetFormData();
      refetch();
    } catch (error) {
      if (error.message === "Jadwal bertabrakan") {
        setShowConflictModal(true);
      } else {
        console.error("Submit error:", error);
        toast.error(
          error.response?.data?.message ||
            "Terjadi kesalahan saat menyimpan jadwal"
        );
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatTime = (time) => {
    return time ? time.substring(0, 5) : "";
  };

  const getDayLabel = (day) => {
    const dayObj = DAYS.find((d) => d.value === day);
    return dayObj ? dayObj.label : day;
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSchedule(null);
    clearConflicts();
    resetFormData();
  };

  const closeConflictModal = () => {
    setShowConflictModal(false);
    clearConflicts();
  };

  return (
    <div className="min-h-screen gradient-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header dengan glass effect */}
        <div className="glass-effect rounded-xl p-6 mb-6 animate-fade-in shadow-blue">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gradient mb-2">
                Manajemen Jadwal
              </h1>
              <p className="text-gray-600">
                Kelola jadwal pelajaran sekolah dengan mudah dan efisien
              </p>
            </div>
            <button onClick={handleCreate} className="btn-primary">
              <Plus size={20} />
              Tambah Jadwal
            </button>
          </div>
        </div>

        {/* Filters Card */}
        <div
          className="card mb-6 animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        >
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Cari jadwal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>

              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="input-field"
              >
                <option value="">Semua Hari</option>
                {DAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="input-field"
              >
                <option value="">Semua Kelas</option>
                {classes?.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="input-field"
              >
                <option value="">Semua Mata Pelajaran</option>
                {subjects?.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Schedule List Card */}
        <div
          className="card animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Memuat jadwal...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <AlertTriangle className="text-red-600" size={32} />
              </div>
              <p className="text-red-600 font-medium mb-4">{error}</p>
              <button onClick={refetch} className="btn-primary">
                Coba Lagi
              </button>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-6 gap-4 p-4 border-b-2 border-blue-100 font-semibold text-blue-800 bg-gradient-to-r from-blue-50 to-white">
                <div>Hari</div>
                <div>Waktu</div>
                <div>Kelas</div>
                <div>Mata Pelajaran</div>
                <div>Guru</div>
                <div>Aksi</div>
              </div>
              {filteredSchedules.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-full mb-4">
                    <Clock size={40} className="text-blue-400" />
                  </div>
                  <p className="text-gray-500 font-medium">
                    Tidak ada jadwal yang ditemukan
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Coba ubah filter atau tambah jadwal baru
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-blue-50">
                  {filteredSchedules.map((schedule, index) => (
                    <div
                      key={schedule.id}
                      className="grid grid-cols-6 gap-4 p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-300"
                      style={{
                        animation: "fadeIn 0.5s ease-out",
                        animationDelay: `${index * 0.05}s`,
                        animationFillMode: "backwards",
                      }}
                    >
                      <div className="font-semibold text-blue-700">
                        {getDayLabel(schedule.day)}
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock size={16} className="text-blue-500" />
                        <span className="font-medium">
                          {formatTime(schedule.startTime)} -{" "}
                          {formatTime(schedule.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Users size={16} className="text-blue-500" />
                        {schedule.class?.name || "-"}
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <BookOpen size={16} className="text-blue-500" />
                        {schedule.subject?.name || "-"}
                      </div>
                      <div className="text-gray-700">
                        {schedule.teacher?.name || "-"}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(schedule)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-300 hover:scale-110"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(schedule)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-300 hover:scale-110"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="p-4 border-t-2 border-blue-100 bg-gradient-to-r from-white to-blue-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 font-medium">
                      Menampilkan {(pagination.page - 1) * pagination.limit + 1}
                      -
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )}{" "}
                      dari{" "}
                      <span className="text-blue-600 font-semibold">
                        {pagination.total}
                      </span>{" "}
                      jadwal
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => changePage(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sebelumnya
                      </button>
                      <span className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border-2 border-blue-200 rounded-lg">
                        Halaman {pagination.page} dari {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => changePage(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                        className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Selanjutnya
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="card w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto shadow-purple animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b-2 border-blue-100 bg-gradient-to-r from-blue-50 to-white">
              <h2 className="text-2xl font-bold text-gradient">
                {modalMode === "create" ? "Tambah Jadwal Baru" : "Edit Jadwal"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-all duration-300 hover:rotate-90"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Class */}
                <div
                  className="animate-slide-in-left"
                  style={{ animationDelay: "0.1s" }}
                >
                  <label className="block text-sm font-semibold text-blue-800 mb-2">
                    Kelas <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="classId"
                    value={formData.classId}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                  >
                    <option value="">Pilih Kelas</option>
                    {classes?.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject */}
                <div
                  className="animate-slide-in-right"
                  style={{ animationDelay: "0.1s" }}
                >
                  <label className="block text-sm font-semibold text-blue-800 mb-2">
                    Mata Pelajaran <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="subjectId"
                    value={formData.subjectId}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                  >
                    <option value="">Pilih Mata Pelajaran</option>
                    {subjects?.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Teacher */}
                <div
                  className="animate-slide-in-left"
                  style={{ animationDelay: "0.2s" }}
                >
                  <label className="block text-sm font-semibold text-blue-800 mb-2">
                    Guru <span className="text-red-500">*</span>
                    {loadingTeachers && (
                      <span className="text-xs text-blue-600 ml-2 animate-pulse">
                        (Memuat guru...)
                      </span>
                    )}
                  </label>
                  <select
                    name="teacherId"
                    value={formData.teacherId}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.subjectId || loadingTeachers}
                    className="input-field disabled:opacity-100 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!formData.subjectId
                        ? "Pilih mata pelajaran terlebih dahulu"
                        : loadingTeachers
                        ? "Memuat guru..."
                        : filteredTeachers.length === 0
                        ? "Tidak ada guru untuk mata pelajaran ini"
                        : "Pilih Guru"}
                    </option>
                    {filteredTeachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                  {formData.subjectId &&
                    filteredTeachers.length === 0 &&
                    !loadingTeachers && (
                      <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        ⚠️ Belum ada guru yang ditugaskan untuk mata pelajaran
                        ini. Silakan assign guru terlebih dahulu.
                      </p>
                    )}
                </div>

                {/* Day */}
                <div
                  className="animate-slide-in-right"
                  style={{ animationDelay: "0.2s" }}
                >
                  <label className="block text-sm font-semibold text-blue-800 mb-2">
                    Hari <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="day"
                    value={formData.day}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                  >
                    <option value="">Pilih Hari</option>
                    {DAYS.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Time */}
                <div
                  className="animate-slide-in-left"
                  style={{ animationDelay: "0.3s" }}
                >
                  <label className="block text-sm font-semibold text-blue-800 mb-2">
                    Waktu Mulai <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                  >
                    <option value="">Pilih Waktu</option>
                    {TIME_SLOTS.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                {/* End Time */}
                <div
                  className="animate-slide-in-right"
                  style={{ animationDelay: "0.3s" }}
                >
                  <label className="block text-sm font-semibold text-blue-800 mb-2">
                    Waktu Selesai <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                  >
                    <option value="">Pilih Waktu</option>
                    {TIME_SLOTS.filter(
                      (time) => !formData.startTime || time > formData.startTime
                    ).map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-6 border-t-2 border-blue-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || loadingTeachers}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading || loadingTeachers
                    ? "Menyimpan..."
                    : modalMode === "create"
                    ? "Tambah Jadwal"
                    : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conflict Modal */}
      {showConflictModal && conflictData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="card w-full max-w-md m-4 shadow-purple animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b-2 border-red-100 bg-gradient-to-r from-red-50 to-white">
              <h2 className="text-2xl font-bold text-red-600 flex items-center gap-2">
                <AlertTriangle size={28} />
                Konflik Jadwal
              </h2>
              <button
                onClick={closeConflictModal}
                className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-all duration-300 hover:rotate-90"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4 font-medium">
                Jadwal yang Anda buat bertabrakan dengan jadwal yang sudah ada:
              </p>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {conflictData.conflicts?.classConflicts?.map(
                  (conflict, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl border-2 border-red-200 animate-fade-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <p className="font-bold text-red-700 mb-2 flex items-center gap-2">
                        <Users size={16} />
                        Konflik Kelas
                      </p>
                      <div className="text-sm text-red-600 space-y-1">
                        <p className="font-semibold">
                          {conflict.subject?.name} - {conflict.class?.name}
                        </p>
                        <p className="flex items-center gap-1">
                          <Clock size={14} />
                          {getDayLabel(conflict.day)},{" "}
                          {formatTime(conflict.startTime)} -{" "}
                          {formatTime(conflict.endTime)}
                        </p>
                      </div>
                    </div>
                  )
                ) || []}

                {conflictData.conflicts?.teacherConflicts?.map(
                  (conflict, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border-2 border-orange-200 animate-fade-in"
                      style={{ animationDelay: `${index * 0.1 + 0.2}s` }}
                    >
                      <p className="font-bold text-orange-700 mb-2 flex items-center gap-2">
                        <BookOpen size={16} />
                        Konflik Guru
                      </p>
                      <div className="text-sm text-orange-600 space-y-1">
                        <p className="font-semibold">
                          {conflict.teacher?.name} - {conflict.subject?.name}
                        </p>
                        <p className="flex items-center gap-1">
                          <Clock size={14} />
                          {getDayLabel(conflict.day)},{" "}
                          {formatTime(conflict.startTime)} -{" "}
                          {formatTime(conflict.endTime)}
                        </p>
                      </div>
                    </div>
                  )
                ) || []}
              </div>

              <div className="flex justify-end gap-4 mt-6 pt-6 border-t-2 border-red-100">
                <button onClick={closeConflictModal} className="btn-secondary">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
