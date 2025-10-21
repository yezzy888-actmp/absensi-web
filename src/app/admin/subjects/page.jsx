// src/app/admin/subjects/page.jsx
"use client";

import { useState } from "react";
import { useSubjectManagement } from "@/hooks/useApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import {
  PlusCircle,
  Search,
  Edit,
  Trash,
  Users,
  BookOpen,
  Loader2,
  XCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";

export default function SubjectManagementPage() {
  const {
    subjects,
    pagination,
    loading,
    error,
    changePage,
    changeLimit,
    searchSubjects,
    create,
    update,
    remove,
    getSubjectTeachers,
    assignTeacher,
    removeTeacher,
  } = useSubjectManagement();

  // State untuk modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageTeachersModal, setShowManageTeachersModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    id: "",
    name: "",
  });

  // Handle search
  const handleSearch = (e) => {
    const searchTerm = e.target.value;
    searchSubjects(searchTerm);
  };

  // Buka modal create
  const openCreateModal = () => {
    setFormData({ id: "", name: "" });
    setShowCreateModal(true);
  };

  // Buka modal edit
  const openEditModal = (subject) => {
    setFormData({ id: subject.id, name: subject.name });
    setShowCreateModal(true);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await update(formData.id, { name: formData.name });
        toast.success("Mata pelajaran berhasil diperbarui");
      } else {
        await create({ name: formData.name });
        toast.success("Mata pelajaran berhasil dibuat");
      }
      setShowCreateModal(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus mata pelajaran ini?")) {
      try {
        await remove(id);
        toast.success("Mata pelajaran berhasil dihapus");
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  // Buka modal manajemen guru
  const openManageTeachersModal = async (subject) => {
    try {
      setSelectedSubject(subject);
      const teachersResponse = await getSubjectTeachers(subject.id);
      setSelectedTeachers(teachersResponse.teachers);
      // TODO: Fetch available teachers dari API
      setAvailableTeachers([]);
      setShowManageTeachersModal(true);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Handle assign teacher
  const handleAssignTeacher = async (teacherId) => {
    try {
      await assignTeacher(selectedSubject.id, teacherId);
      const updated = await getSubjectTeachers(selectedSubject.id);
      setSelectedTeachers(updated.teachers);
      toast.success("Guru berhasil ditambahkan");
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Handle remove teacher
  const handleRemoveTeacher = async (teacherId) => {
    try {
      await removeTeacher(selectedSubject.id, teacherId);
      const updated = await getSubjectTeachers(selectedSubject.id);
      setSelectedTeachers(updated.teachers);
      toast.success("Guru berhasil dihapus");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header dan Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Mata Pelajaran</h1>
          <p className="text-gray-600">Kelola mata pelajaran sekolah</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            placeholder="Cari mata pelajaran..."
            className="max-w-xs"
            onChange={handleSearch}
          />
          <Button onClick={openCreateModal}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Tambah Baru
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Subjects Table */}
      {!loading && !error && (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Mata Pelajaran</TableHead>
                  <TableHead className="text-center">Jumlah Guru</TableHead>
                  <TableHead className="text-center">Jumlah Jadwal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects?.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">
                      {subject.name}
                    </TableCell>
                    <TableCell className="text-center">
                      {subject._count?.teachers || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {subject._count?.schedules || 0}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(subject)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openManageTeachersModal(subject)}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Guru
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(subject.id)}
                      >
                        <Trash className="w-4 h-4 mr-2" />
                        Hapus
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={changePage}
            onLimitChange={changeLimit}
            itemsPerPage={pagination.limit}
            totalItems={pagination.total}
          />
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={formData.id ? "Edit Mata Pelajaran" : "Buat Mata Pelajaran Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Nama Mata Pelajaran
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Batal
            </Button>
            <Button type="submit">
              {formData.id ? "Simpan Perubahan" : "Buat Mata Pelajaran"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manage Teachers Modal */}
      <Modal
        isOpen={showManageTeachersModal}
        onClose={() => setShowManageTeachersModal(false)}
        title={`Kelola Guru - ${selectedSubject?.name}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">Guru yang Ditugaskan</h3>
            {selectedTeachers.length === 0 ? (
              <div className="text-gray-500 text-center py-4">
                Belum ada guru yang ditugaskan
              </div>
            ) : (
              <div className="space-y-2">
                {selectedTeachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <span>{teacher.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTeacher(teacher.id)}
                    >
                      <XCircle className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
