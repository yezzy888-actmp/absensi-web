// src/app/admin/teacher-subject/page.jsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useUserManagement, useTeacherSubjectManagement } from "@/hooks/useApi";
import {
  Loader2,
  Search,
  User,
  BookOpen,
  X,
  Check,
  Plus,
  Minus,
  AlertCircle,
  Users,
  GraduationCap,
} from "lucide-react";
import toast from "react-hot-toast";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal, ConfirmModal } from "@/components/ui/Modal";

export default function TeacherSubjectPage() {
  // State management
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [assignSearchQuery, setAssignSearchQuery] = useState("");
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [selectedSubjectsForBulk, setSelectedSubjectsForBulk] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);

  // Hooks - Fetch users with TEACHER role
  const { users: teacherUsers, loading: teachersLoading } = useUserManagement({
    role: "TEACHER",
    limit: 100,
  });

  // Transform teacher users to include both user and teacher data
  const teachers = useMemo(() => {
    if (!teacherUsers) return [];

    return teacherUsers
      .filter((user) => user.teacher)
      .map((user) => ({
        id: user.id,
        teacherId: user.teacher.id,
        name: user.teacher.name,
        nip: user.teacher.nip || "N/A",
        gender: user.teacher.gender,
        email: user.email,
        user: user,
        teacher: user.teacher,
      }));
  }, [teacherUsers]);

  const {
    assignedSubjects,
    getUnassignedSubjects,
    assignSubjects,
    removeSubject,
    loading: subjectsLoading,
    error: subjectsError,
    refetchSubjects,
  } = useTeacherSubjectManagement(selectedTeacher?.teacherId);

  const [availableSubjects, setAvailableSubjects] = useState([]);

  // Load data when teacher is selected or changed
  useEffect(() => {
    const loadTeacherData = async () => {
      if (selectedTeacher?.teacherId) {
        try {
          await refetchSubjects();
          const subjects = await getUnassignedSubjects();
          setAvailableSubjects(subjects);
        } catch (error) {
          console.error("Error loading teacher data:", error);
          toast.error("Gagal memuat data mata pelajaran");
        }
      } else {
        setAvailableSubjects([]);
      }
    };

    loadTeacherData();
  }, [selectedTeacher?.teacherId]);

  // Reset search and selections when teacher changes
  useEffect(() => {
    setSearchQuery("");
    setAssignSearchQuery("");
    setSelectedSubjectsForBulk([]);
    setShowBulkAssignModal(false);
  }, [selectedTeacher]);

  const filteredAvailableSubjects = useMemo(() => {
    return availableSubjects.filter((subject) =>
      subject.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableSubjects, searchQuery]);

  const filteredAssignedSubjects = useMemo(() => {
    return assignedSubjects.filter((subject) =>
      subject.name.toLowerCase().includes(assignSearchQuery.toLowerCase())
    );
  }, [assignedSubjects, assignSearchQuery]);

  // Handlers
  const handleTeacherChange = (e) => {
    const teacherId = e.target.value;
    const teacher = teachers.find((t) => t.teacherId === teacherId);
    setAvailableSubjects([]);
    setSelectedTeacher(teacher || null);
  };

  const refreshData = async () => {
    try {
      await refetchSubjects();
      const updatedAvailable = await getUnassignedSubjects();
      setAvailableSubjects(updatedAvailable);
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Gagal memperbarui data");
    }
  };

  const handleAssignSubject = async (subjectId) => {
    try {
      await assignSubjects([subjectId]);
      toast.success("Mata pelajaran berhasil ditugaskan");
      await refreshData();
    } catch (error) {
      console.error("Error assigning subject:", error);
      toast.error(error.message || "Gagal menugaskan mata pelajaran");
    }
  };

  const handleRemoveSubject = async (subjectId) => {
    try {
      await removeSubject(subjectId);
      toast.success("Mata pelajaran berhasil dihapus");
      await refreshData();
    } catch (error) {
      console.error("Error removing subject:", error);
      toast.error(error.message || "Gagal menghapus mata pelajaran");
    }
  };

  const handleBulkAssign = async () => {
    if (selectedSubjectsForBulk.length === 0) {
      toast.error("Pilih minimal satu mata pelajaran");
      return;
    }

    try {
      await assignSubjects(selectedSubjectsForBulk);
      toast.success(
        `${selectedSubjectsForBulk.length} mata pelajaran berhasil ditugaskan`
      );
      await refreshData();
      setSelectedSubjectsForBulk([]);
      setShowBulkAssignModal(false);
    } catch (error) {
      console.error("Error bulk assigning subjects:", error);
      toast.error(error.message || "Gagal menugaskan mata pelajaran");
    }
  };

  const handleSelectAllForBulk = () => {
    const allIds = filteredAvailableSubjects.map((s) => s.id);
    setSelectedSubjectsForBulk(allIds);
  };

  const handleDeselectAllForBulk = () => {
    setSelectedSubjectsForBulk([]);
  };

  const toggleSubjectForBulk = (subjectId) => {
    setSelectedSubjectsForBulk((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const confirmRemoveSubject = (subjectId, subjectName) => {
    setConfirmAction({
      type: "remove",
      title: "Hapus Mata Pelajaran",
      message: `Apakah Anda yakin ingin menghapus mata pelajaran "${subjectName}" dari ${selectedTeacher?.name}?`,
      action: () => handleRemoveSubject(subjectId),
    });
  };

  const confirmAssignSubject = (subjectId, subjectName) => {
    setConfirmAction({
      type: "assign",
      title: "Tugaskan Mata Pelajaran",
      message: `Apakah Anda yakin ingin menugaskan mata pelajaran "${subjectName}" kepada ${selectedTeacher?.name}?`,
      action: () => handleAssignSubject(subjectId),
    });
  };

  return (
    <div className="gradient-bg min-h-screen">
      <div className="space-y-6 p-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col space-y-3">
          <h1 className="text-3xl font-bold flex items-center gap-3 text-gradient">
            <div className="feature-icon-wrapper p-3 bg-white rounded-xl shadow-blue">
              <GraduationCap className="h-8 w-8 text-blue-600" />
            </div>
            Manajemen Mata Pelajaran Guru
          </h1>
          <p className="text-gray-700 text-lg pl-1">
            Kelola penugasan mata pelajaran untuk guru
          </p>
        </div>

        {/* Teacher Selection Card */}
        <div className="card p-6 animate-fade-in-up">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px] max-w-md">
              <Select
                label="Pilih Guru"
                placeholder="Pilih Guru"
                value={selectedTeacher?.teacherId || ""}
                onChange={handleTeacherChange}
                disabled={teachersLoading}
              >
                {teachersLoading ? (
                  <option disabled>Loading...</option>
                ) : (
                  teachers.map((teacher) => (
                    <option key={teacher.teacherId} value={teacher.teacherId}>
                      {teacher.name}{" "}
                      {teacher.nip !== "N/A" ? `(${teacher.nip})` : ""}
                    </option>
                  ))
                )}
              </Select>
            </div>

            {selectedTeacher && (
              <div className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200 shadow-sm animate-slide-in-right">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900 text-lg">
                    {selectedTeacher.name}
                  </p>
                  <p className="text-sm text-blue-700 font-medium">
                    {selectedTeacher.nip !== "N/A"
                      ? `NIP: ${selectedTeacher.nip}`
                      : selectedTeacher.email}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {selectedTeacher && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assigned Subjects Card */}
            <div className="card overflow-hidden animate-slide-in-left">
              <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <BookOpen className="h-6 w-6 text-green-600" />
                    </div>
                    <span className="text-green-800">
                      Mata Pelajaran Ditugaskan
                    </span>
                    <span className="bg-green-500 text-white text-sm px-3 py-1 rounded-full font-semibold shadow-sm">
                      {assignedSubjects.length}
                    </span>
                  </h3>
                  {assignedSubjects.length > 0 && (
                    <div className="relative w-48">
                      <Input
                        placeholder="Cari..."
                        value={assignSearchQuery}
                        onChange={(e) => setAssignSearchQuery(e.target.value)}
                        className="input-field h-10 text-sm"
                      />
                      <Search className="h-4 w-4 absolute right-3 top-3 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-white to-green-50/30">
                {subjectsLoading ? (
                  <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : subjectsError ? (
                  <div className="flex items-center gap-3 text-red-700 text-sm p-4 bg-red-50 rounded-xl border-2 border-red-200">
                    <AlertCircle className="h-5 w-5" />
                    {subjectsError}
                  </div>
                ) : filteredAssignedSubjects.length === 0 ? (
                  <div className="text-center p-12">
                    <div className="inline-flex p-4 bg-white rounded-full shadow-sm mb-4">
                      <BookOpen className="h-12 w-12 text-gray-300" />
                    </div>
                    <p className="text-gray-600 font-medium">
                      {assignSearchQuery
                        ? "Tidak ada mata pelajaran yang cocok"
                        : "Belum ada mata pelajaran ditugaskan"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {filteredAssignedSubjects.map((subject, idx) => (
                      <div
                        key={subject.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] group"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm pulse-ring"></div>
                          <span className="font-semibold text-green-900">
                            {subject.name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            confirmRemoveSubject(subject.id, subject.name)
                          }
                          disabled={subjectsLoading}
                          className="text-red-600 hover:text-red-700 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Minus className="h-5 w-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Available Subjects Card */}
            <div className="card overflow-hidden animate-slide-in-right">
              <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="text-blue-800">
                      Mata Pelajaran Tersedia
                    </span>
                    <span className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full font-semibold shadow-sm">
                      {availableSubjects.length}
                    </span>
                  </h3>
                  <div className="flex gap-2">
                    {availableSubjects.length > 0 && (
                      <Button
                        className="btn-primary"
                        size="sm"
                        onClick={() => setShowBulkAssignModal(true)}
                        disabled={subjectsLoading}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Tugaskan Bulk
                      </Button>
                    )}
                  </div>
                </div>

                {availableSubjects.length > 0 && (
                  <div className="relative">
                    <Input
                      placeholder="Cari mata pelajaran..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input-field pr-10"
                    />
                    <Search className="h-5 w-5 absolute right-3 top-3 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="p-6 bg-gradient-to-br from-white to-blue-50/30">
                {subjectsLoading ? (
                  <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : filteredAvailableSubjects.length === 0 ? (
                  <div className="text-center p-12">
                    <div className="inline-flex p-4 bg-white rounded-full shadow-sm mb-4">
                      <BookOpen className="h-12 w-12 text-gray-300" />
                    </div>
                    <p className="text-gray-600 font-medium">
                      {searchQuery
                        ? "Tidak ada mata pelajaran yang cocok"
                        : "Tidak ada mata pelajaran tersedia"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {filteredAvailableSubjects.map((subject, idx) => (
                      <div
                        key={subject.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl hover:shadow-md transition-all duration-300 hover:scale-[1.02] group"
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm pulse-ring"></div>
                          <span className="font-semibold text-blue-900">
                            {subject.name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            confirmAssignSubject(subject.id, subject.name)
                          }
                          disabled={subjectsLoading}
                          className="text-green-600 hover:text-green-700 hover:bg-green-100 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!selectedTeacher && (
          <div className="card p-16 text-center animate-fade-in-up">
            <div className="inline-flex p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full shadow-blue mb-6 floating-animation">
              <User className="h-20 w-20 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3 text-gradient">
              Pilih guru untuk mulai mengelola
            </h3>
            <p className="text-gray-600 max-w-md mx-auto text-lg">
              Silakan pilih guru dari dropdown di atas untuk melihat dan
              mengelola mata pelajaran yang ditugaskan kepada mereka
            </p>
          </div>
        )}

        {/* Bulk Assignment Modal */}
        <Modal
          isOpen={showBulkAssignModal}
          onClose={() => setShowBulkAssignModal(false)}
          title="Tugaskan Mata Pelajaran Bulk"
          size="lg"
        >
          <div className="space-y-5">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-gray-700 font-medium">
                Pilih mata pelajaran untuk{" "}
                <strong className="text-blue-700">
                  {selectedTeacher?.name}
                </strong>
              </p>
              <div className="flex gap-2">
                <Button
                  className="btn-secondary"
                  size="sm"
                  onClick={handleSelectAllForBulk}
                  disabled={subjectsLoading}
                >
                  Pilih Semua
                </Button>
                <Button
                  className="btn-secondary"
                  size="sm"
                  onClick={handleDeselectAllForBulk}
                  disabled={subjectsLoading}
                >
                  Batal Pilih
                </Button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto border-2 border-gray-200 rounded-xl">
              {filteredAvailableSubjects.map((subject) => (
                <div
                  key={subject.id}
                  className={`flex items-center gap-4 p-4 border-b last:border-b-0 cursor-pointer transition-all ${
                    selectedSubjectsForBulk.includes(subject.id)
                      ? "bg-blue-50 border-l-4 border-l-blue-500"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => toggleSubjectForBulk(subject.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedSubjectsForBulk.includes(subject.id)}
                    onChange={() => toggleSubjectForBulk(subject.id)}
                    className="rounded border-gray-300 w-5 h-5"
                  />
                  <span className="font-medium">{subject.name}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t-2">
              <p className="text-sm font-semibold text-blue-700 bg-blue-50 px-4 py-2 rounded-lg">
                {selectedSubjectsForBulk.length} mata pelajaran dipilih
              </p>
              <div className="flex gap-3">
                <Button
                  className="btn-secondary"
                  onClick={() => setShowBulkAssignModal(false)}
                  disabled={subjectsLoading}
                >
                  Batal
                </Button>
                <Button
                  className="btn-primary"
                  onClick={handleBulkAssign}
                  disabled={
                    subjectsLoading || selectedSubjectsForBulk.length === 0
                  }
                >
                  {subjectsLoading && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Tugaskan ({selectedSubjectsForBulk.length})
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => {
            confirmAction?.action();
            setConfirmAction(null);
          }}
          title={confirmAction?.title}
          message={confirmAction?.message}
          type={confirmAction?.type === "remove" ? "danger" : "default"}
          confirmText={confirmAction?.type === "remove" ? "Hapus" : "Tugaskan"}
          cancelText="Batal"
        />
      </div>
    </div>
  );
}
