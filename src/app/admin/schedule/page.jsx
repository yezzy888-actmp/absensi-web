"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
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

// Generate time slots with proper format
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

  // State for filtered teachers based on selected subject
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  // Form state - Updated to match API structure
  const [formData, setFormData] = useState({
    classId: "",
    subjectId: "",
    teacherId: "",
    day: "",
    startTime: "",
    endTime: "",
  });

  // Hooks
  const {
    schedules,
    pagination,
    loading,
    error,
    conflictData,
    changePage,
    changeLimit,
    filter,
    create,
    update,
    remove,
    getById,
    refetch,
    clearConflicts,
  } = useScheduleManagement();

  const { subjects } = useSubjectManagement();
  const { teachers } = useTeacherManagement();
  const { classes } = useClassManagement();

  // Function to get teachers by subject
  const getTeachersBySubject = useCallback(async (subjectId) => {
    if (!subjectId) {
      setFilteredTeachers([]);
      return;
    }

    try {
      setLoadingTeachers(true);
      console.log(`Fetching teachers for subject ID: ${subjectId}`);

      // Use the subject API to get teachers assigned to the subject
      const response = await subjectAPI.getSubjectTeachers(subjectId);
      console.log("Teachers response:", response.data);

      const teachersData = response.data?.teachers || [];
      setFilteredTeachers(teachersData);

      if (teachersData.length === 0) {
        console.log(`No teachers found for subject ${subjectId}`);
      } else {
        console.log(
          `Found ${teachersData.length} teachers for subject ${subjectId}`
        );
      }
    } catch (error) {
      console.error("Error fetching teachers for subject:", error);

      // Show specific error message
      if (error.response?.status === 404) {
        toast.error("Mata pelajaran tidak ditemukan");
      } else if (error.response?.status === 500) {
        toast.error("Terjadi kesalahan server saat memuat guru");
      } else {
        toast.error("Gagal memuat guru untuk mata pelajaran ini");
      }

      // Set empty array on error
      setFilteredTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  }, []);

  // Effect to filter teachers when subject changes
  useEffect(() => {
    if (formData.subjectId) {
      getTeachersBySubject(formData.subjectId);
      // Reset teacher selection when subject changes
      setFormData((prev) => ({ ...prev, teacherId: "" }));
    } else {
      setFilteredTeachers([]);
    }
  }, [formData.subjectId, getTeachersBySubject]);

  // Filter schedules based on search and filters
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

  // Reset form data - Updated to match API structure
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

  // Handle create
  const handleCreate = () => {
    setModalMode("create");
    setSelectedSchedule(null);
    resetFormData();
    setShowModal(true);
  };

  // Format time to HH:MM format for form display
  const formatTimeForForm = (time) => {
    if (!time) return "";
    // If time is already in HH:MM format, return as is
    if (time.match(/^\d{2}:\d{2}$/)) return time;
    // If time includes seconds, remove them
    if (time.match(/^\d{2}:\d{2}:\d{2}$/)) return time.substring(0, 5);
    return time;
  };

  // Handle edit - Updated to match API structure
  const handleEdit = async (schedule) => {
    setModalMode("edit");
    setSelectedSchedule(schedule);

    // Populate form with existing data
    setFormData({
      classId: schedule.classId || "",
      subjectId: schedule.subjectId || "",
      teacherId: schedule.teacherId || "",
      day: schedule.day || "",
      startTime: formatTimeForForm(schedule.startTime),
      endTime: formatTimeForForm(schedule.endTime),
    });

    // Load teachers for the selected subject
    if (schedule.subjectId) {
      await getTeachersBySubject(schedule.subjectId);
    }

    setShowModal(true);
  };

  // Handle delete
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

  // Validate form data - Updated validation
  const validateFormData = () => {
    const errors = [];

    if (!formData.classId) errors.push("Kelas harus dipilih");
    if (!formData.subjectId) errors.push("Mata pelajaran harus dipilih");
    if (!formData.teacherId) errors.push("Guru harus dipilih");
    if (!formData.day) errors.push("Hari harus dipilih");
    if (!formData.startTime) errors.push("Waktu mulai harus dipilih");
    if (!formData.endTime) errors.push("Waktu selesai harus dipilih");

    // Validate time logic
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}:00`);
      const end = new Date(`2000-01-01T${formData.endTime}:00`);

      if (start >= end) {
        errors.push("Waktu mulai harus lebih awal dari waktu selesai");
      }
    }

    return errors;
  };

  // Handle form submit - Updated to send correct data structure
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateFormData();
    if (validationErrors.length > 0) {
      toast.error(validationErrors.join("\n"));
      return;
    }

    // Prepare data according to API structure
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

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Format time for display
  const formatTime = (time) => {
    return time ? time.substring(0, 5) : "";
  };

  // Get day label
  const getDayLabel = (day) => {
    const dayObj = DAYS.find((d) => d.value === day);
    return dayObj ? dayObj.label : day;
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedSchedule(null);
    clearConflicts();
    resetFormData();
  };

  // Close conflict modal
  const closeConflictModal = () => {
    setShowConflictModal(false);
    clearConflicts();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Jadwal</h1>
          <p className="text-gray-600 mt-1">Kelola jadwal pelajaran sekolah</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Tambah Jadwal
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Cari jadwal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Day Filter */}
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Hari</option>
            {DAYS.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Semua Kelas</option>
            {classes?.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

      {/* Schedule List */}
      <div className="bg-white rounded-lg shadow-sm border">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Memuat jadwal...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <AlertTriangle size={48} className="mx-auto mb-4" />
            <p>{error}</p>
            <button
              onClick={refetch}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 border-b font-medium text-gray-700">
              <div>Hari</div>
              <div>Waktu</div>
              <div>Kelas</div>
              <div>Mata Pelajaran</div>
              <div>Guru</div>
              <div>Aksi</div>
            </div>

            {/* Table Body */}
            {filteredSchedules.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                <p>Tidak ada jadwal yang ditemukan</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="grid grid-cols-6 gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium">
                      {getDayLabel(schedule.day)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={16} className="text-gray-400" />
                      {formatTime(schedule.startTime)} -{" "}
                      {formatTime(schedule.endTime)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={16} className="text-gray-400" />
                      {schedule.class?.name || "-"}
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen size={16} className="text-gray-400" />
                      {schedule.subject?.name || "-"}
                    </div>
                    <div>{schedule.teacher?.name || "-"}</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(schedule)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(schedule)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
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
              <div className="p-4 border-t flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Menampilkan {(pagination.page - 1) * pagination.limit + 1}-
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  dari {pagination.total} jadwal
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changePage(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sebelumnya
                  </button>
                  <span className="px-3 py-1">
                    Halaman {pagination.page} dari {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => changePage(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Schedule Modal - Enhanced with auto-filtering */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">
                {modalMode === "create" ? "Tambah Jadwal" : "Edit Jadwal"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Class */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kelas *
                  </label>
                  <select
                    name="classId"
                    value={formData.classId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Pilih Kelas</option>
                    {classes?.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject - Now triggers teacher filtering */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mata Pelajaran *
                  </label>
                  <select
                    name="subjectId"
                    value={formData.subjectId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Pilih Mata Pelajaran</option>
                    {subjects?.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Teacher - Now shows filtered teachers based on subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guru *
                    {loadingTeachers && (
                      <span className="text-xs text-blue-600 ml-2">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                      <p className="text-xs text-amber-600 mt-1">
                        Belum ada guru yang ditugaskan untuk mata pelajaran ini.
                        Silakan assign guru ke mata pelajaran terlebih dahulu di
                        menu Mata Pelajaran.
                      </p>
                    )}
                </div>

                {/* Day */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hari *
                  </label>
                  <select
                    name="day"
                    value={formData.day}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Waktu Mulai *
                  </label>
                  <select
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Waktu Selesai *
                  </label>
                  <select
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || loadingTeachers}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading || loadingTeachers
                    ? "Menyimpan..."
                    : modalMode === "create"
                    ? "Tambah"
                    : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conflict Modal */}
      {showConflictModal && conflictData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-red-600">
                Konflik Jadwal
              </h2>
              <button
                onClick={closeConflictModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="text-red-500" size={24} />
                <p className="text-gray-700">
                  Jadwal yang Anda buat bertabrakan dengan jadwal yang sudah
                  ada:
                </p>
              </div>

              <div className="space-y-3">
                {conflictData.conflicts?.classConflicts?.map(
                  (conflict, index) => (
                    <div key={index} className="bg-red-50 p-3 rounded-lg">
                      <p className="font-medium text-red-700">Konflik Kelas:</p>
                      <p className="text-sm text-red-600">
                        {conflict.subject?.name} - {conflict.class?.name}
                        <br />
                        {getDayLabel(conflict.day)},{" "}
                        {formatTime(conflict.startTime)} -{" "}
                        {formatTime(conflict.endTime)}
                      </p>
                    </div>
                  )
                ) || []}

                {conflictData.conflicts?.teacherConflicts?.map(
                  (conflict, index) => (
                    <div key={index} className="bg-orange-50 p-3 rounded-lg">
                      <p className="font-medium text-orange-700">
                        Konflik Guru:
                      </p>
                      <p className="text-sm text-orange-600">
                        {conflict.teacher?.name} - {conflict.subject?.name}
                        <br />
                        {getDayLabel(conflict.day)},{" "}
                        {formatTime(conflict.startTime)} -{" "}
                        {formatTime(conflict.endTime)}
                      </p>
                    </div>
                  )
                ) || []}
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={closeConflictModal}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                >
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
