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
      .filter((user) => user.teacher) // Only users with teacher data
      .map((user) => ({
        id: user.id, // user ID
        teacherId: user.teacher.id, // teacher ID
        name: user.teacher.name,
        nip: user.teacher.nip || "N/A",
        gender: user.teacher.gender,
        email: user.email,
        // Include full user and teacher objects for reference
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
  } = useTeacherSubjectManagement(selectedTeacher?.teacherId); // Use teacher ID, not user ID

  const [availableSubjects, setAvailableSubjects] = useState([]);

  // Load data when teacher is selected or changed
  useEffect(() => {
    const loadTeacherData = async () => {
      if (selectedTeacher?.teacherId) {
        try {
          // Fetch both assigned and available subjects
          await refetchSubjects();
          const subjects = await getUnassignedSubjects();
          setAvailableSubjects(subjects);
        } catch (error) {
          console.error("Error loading teacher data:", error);
          toast.error("Gagal memuat data mata pelajaran");
        }
      } else {
        // Clear subjects when no teacher is selected
        setAvailableSubjects([]);
      }
    };

    loadTeacherData();
  }, [selectedTeacher?.teacherId]); // Only depend on teacherId

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

    // Clear previous data immediately
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

      // Refresh data
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-blue-600" />
          Manajemen Mata Pelajaran Guru
        </h1>
        <p className="text-gray-600">
          Kelola penugasan mata pelajaran untuk guru
        </p>
      </div>

      {/* Teacher Selection */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
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
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">
                  {selectedTeacher.name}
                </p>
                <p className="text-sm text-blue-600">
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
          {/* Assigned Subjects */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  Mata Pelajaran yang Ditugaskan
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    {assignedSubjects.length}
                  </span>
                </h3>
                {assignedSubjects.length > 0 && (
                  <div className="relative w-48">
                    <Input
                      placeholder="Cari yang ditugaskan..."
                      value={assignSearchQuery}
                      onChange={(e) => setAssignSearchQuery(e.target.value)}
                      className="pr-8 h-9"
                    />
                    <Search className="h-4 w-4 absolute right-2 top-2.5 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              {subjectsLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                </div>
              ) : subjectsError ? (
                <div className="flex items-center gap-2 text-red-600 text-sm p-4 bg-red-50 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  {subjectsError}
                </div>
              ) : filteredAssignedSubjects.length === 0 ? (
                <div className="text-center p-8">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {assignSearchQuery
                      ? "Tidak ada mata pelajaran yang cocok dengan pencarian"
                      : "Belum ada mata pelajaran yang ditugaskan"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredAssignedSubjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium text-green-900">
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
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Available Subjects */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Mata Pelajaran Tersedia
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {availableSubjects.length}
                  </span>
                </h3>
                <div className="flex gap-2">
                  {availableSubjects.length > 0 && (
                    <Button
                      variant="outline"
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
                    className="pr-8"
                  />
                  <Search className="h-4 w-4 absolute right-2 top-3 text-gray-400" />
                </div>
              )}
            </div>

            <div className="p-6">
              {subjectsLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                </div>
              ) : filteredAvailableSubjects.length === 0 ? (
                <div className="text-center p-8">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchQuery
                      ? "Tidak ada mata pelajaran yang cocok dengan pencarian"
                      : "Tidak ada mata pelajaran tersedia"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredAvailableSubjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-medium text-blue-900">
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
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Plus className="h-4 w-4" />
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
        <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
          <User className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Pilih guru untuk mulai mengelola mata pelajaran
          </h3>
          <p className="text-gray-500 max-w-md">
            Silakan pilih guru dari dropdown di atas untuk melihat dan mengelola
            mata pelajaran yang ditugaskan kepada mereka
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
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              Pilih mata pelajaran yang ingin ditugaskan kepada{" "}
              <strong>{selectedTeacher?.name}</strong>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllForBulk}
                disabled={subjectsLoading}
              >
                Pilih Semua
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeselectAllForBulk}
                disabled={subjectsLoading}
              >
                Batal Pilih
              </Button>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto border rounded-lg">
            {filteredAvailableSubjects.map((subject) => (
              <div
                key={subject.id}
                className={`flex items-center gap-3 p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                  selectedSubjectsForBulk.includes(subject.id)
                    ? "bg-blue-50"
                    : ""
                }`}
                onClick={() => toggleSubjectForBulk(subject.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedSubjectsForBulk.includes(subject.id)}
                  onChange={() => toggleSubjectForBulk(subject.id)}
                  className="rounded border-gray-300"
                />
                <span>{subject.name}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-gray-600">
              {selectedSubjectsForBulk.length} mata pelajaran dipilih
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBulkAssignModal(false)}
                disabled={subjectsLoading}
              >
                Batal
              </Button>
              <Button
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
  );
}
