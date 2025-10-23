"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUserManagement } from "@/hooks/useApi";
import { userAPI, classAPI } from "@/lib/api";
import toast from "react-hot-toast";
import {
  Users,
  Plus,
  Filter,
  Edit,
  Trash2,
  Key,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

export default function AdminUsersPage() {
  const {
    users,
    pagination,
    loading,
    error,
    changePage,
    changeLimit,
    filter,
    refetch,
    create,
    update,
    remove,
    resetPassword,
  } = useUserManagement();

  const [selectedRole, setSelectedRole] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "STUDENT",
    name: "",
    nis: "",
    gender: "LAKI_LAKI",
    classId: "",
  });

  const [newPassword, setNewPassword] = useState("");
  const [classes, setClasses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);

  const searchTimeoutRef = useRef(null);
  const lastSearchRef = useRef({ role: "" });

  // Load classes for student assignment
  useEffect(() => {
    const loadClasses = async () => {
      setIsLoadingClasses(true);
      try {
        const response = await classAPI.getAllClasses();
        setClasses(response.data.classes || []);
      } catch (error) {
        console.error("Error loading classes:", error);
        toast.error("Gagal memuat daftar kelas");
      } finally {
        setIsLoadingClasses(false);
      }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const currentSearch = { role: selectedRole };
    const hasChanged = currentSearch.role !== lastSearchRef.current.role;

    if (!hasChanged) {
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      console.log("Filter triggered:", { selectedRole });
      lastSearchRef.current = currentSearch;

      if (selectedRole) {
        filter({
          role: selectedRole,
        });
      } else {
        refetch();
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [selectedRole, filter, refetch]);

  const stableFilter = useCallback(
    (params) => {
      console.log("Filter called with:", params);
      filter(params);
    },
    [filter]
  );

  const stableRefetch = useCallback(() => {
    console.log("Refetch called");
    refetch();
  }, [refetch]);

  const prepareUserData = (formData) => {
    const baseData = {
      email: formData.email,
      password: formData.password,
      role: formData.role,
    };

    if (formData.role === "STUDENT") {
      baseData.name = formData.name;
      baseData.nis = formData.nis;
      baseData.gender = formData.gender;
      baseData.classId = formData.classId;

      if (!baseData.classId) {
        throw new Error("Pilih kelas untuk siswa");
      }
      if (!baseData.name) {
        throw new Error("Nama siswa harus diisi");
      }
      if (!baseData.nis) {
        throw new Error("NIS siswa harus diisi");
      }
    } else if (formData.role === "TEACHER") {
      baseData.name = formData.name;
      baseData.gender = formData.gender;

      if (!baseData.name) {
        throw new Error("Nama guru harus diisi");
      }
    }

    return baseData;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const userData = prepareUserData(formData);
      await create(userData);
      setShowCreateModal(false);
      resetForm();
      toast.success("User berhasil dibuat!");
    } catch (error) {
      toast.error(error.message || "Gagal membuat user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const userData = prepareUserData(formData);
      await update(selectedUser.id, userData);
      setShowEditModal(false);
      resetForm();
      toast.success("User berhasil diupdate!");
    } catch (error) {
      toast.error(error.message || "Gagal mengupdate user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await remove(selectedUser.id);
      setShowDeleteModal(false);
      setSelectedUser(null);
      toast.success("User berhasil dihapus!");
    } catch (error) {
      console.error("Delete user error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isSubmitting || !newPassword.trim()) return;

    setIsSubmitting(true);
    try {
      await resetPassword(selectedUser.id, newPassword);
      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewPassword("");
      toast.success("Password berhasil direset!");
    } catch (error) {
      console.error("Reset password error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      role: "STUDENT",
      name: "",
      nis: "",
      gender: "LAKI_LAKI",
      classId: "",
    });
    setSelectedUser(null);
    setIsSubmitting(false);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    const baseData = {
      email: user.email,
      password: "",
      role: user.role,
      name: "",
      nis: "",
      gender: "LAKI_LAKI",
      classId: "",
    };

    if (user.role === "STUDENT" && user.student) {
      baseData.name = user.student.name || "";
      baseData.nis = user.student.nis || "";
      baseData.gender = user.student.gender || "LAKI_LAKI";
      baseData.classId = user.student.class?.id || "";

      console.log("Student data loaded:", {
        name: baseData.name,
        nis: baseData.nis,
        gender: baseData.gender,
        classId: baseData.classId,
      });
    } else if (user.role === "TEACHER" && user.teacher) {
      baseData.name = user.teacher.name || "";
      baseData.gender = user.teacher.gender || "LAKI_LAKI";

      console.log("Teacher data loaded:", {
        name: baseData.name,
        gender: baseData.gender,
      });
    }

    setFormData(baseData);
    setShowEditModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    resetForm();
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
    setIsSubmitting(false);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setSelectedUser(null);
    setNewPassword("");
    setIsSubmitting(false);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-blue-600 text-white border-blue-700";
      case "TEACHER":
        return "bg-blue-400 text-white border-blue-500";
      case "STUDENT":
        return "bg-blue-200 text-blue-900 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading && !users.length) {
    return (
      <div className="gradient-bg min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-blue-100 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-blue-50 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-bg min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-blue-900 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg shadow-blue">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-gradient">Manajemen User</span>
            </h1>
            <p className="text-blue-700 mt-2">
              Kelola semua user dalam sistem ({pagination.total} total)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
            <div className="w-full sm:w-auto">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="input-field border-blue-300 focus:border-blue-500 text-blue-900"
              >
                <option value="">Semua Role</option>
                <option value="ADMIN">Admin</option>
                <option value="TEACHER">Teacher</option>
                <option value="STUDENT">Student</option>
              </select>
            </div>
            <button
              onClick={refetch}
              disabled={loading}
              className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto"
              type="button"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
              type="button"
            >
              <Plus className="h-4 w-4" />
              Tambah User
            </button>
          </div>
        </div>

        {/* Users Table / Mobile List */}
        <div className="card p-0 border-blue-200">
          {/* Desktop Table Header */}
          <div className="hidden lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
                  <th className="text-left py-4 px-6 font-semibold text-blue-900 w-1/3">
                    User
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-blue-900 w-1/6">
                    Role
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-blue-900 w-1/3">
                    Info Tambahan
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-blue-900 w-1/12">
                    Dibuat
                  </th>
                  <th className="text-right py-4 px-6 font-semibold text-blue-900 w-1/12">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-blue-100 hover:bg-blue-50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-blue">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-blue-900">
                            {user.student?.name || user.teacher?.name || "N/A"}
                          </div>
                          <div className="text-sm text-blue-600">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {user.student && (
                        <div className="text-sm text-blue-800">
                          <div>NIS: {user.student.nis}</div>
                          <div>Kelas: {user.student.class?.name || "N/A"}</div>
                          <div>Gender: {user.student.gender}</div>
                        </div>
                      )}
                      {user.teacher && (
                        <div className="text-sm text-blue-800">
                          <div>Gender: {user.teacher.gender}</div>
                        </div>
                      )}
                      {user.role === "ADMIN" && (
                        <div className="text-sm text-blue-600">
                          Administrator
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-blue-700">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openEditModal(user);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors active:scale-95 shadow-sm hover:shadow-blue"
                          title="Edit User"
                          type="button"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedUser(user);
                            setShowPasswordModal(true);
                          }}
                          className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors active:scale-95 shadow-sm hover:shadow-blue"
                          title="Reset Password"
                          type="button"
                        >
                          <Key className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedUser(user);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors active:scale-95 shadow-sm hover:shadow"
                          title="Delete User"
                          type="button"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="lg:hidden space-y-4 p-4 sm:p-6">
            {users.map((user) => (
              <div
                key={user.id}
                className="card p-4 border-l-4 border-blue-500 hover:shadow-blue transition-shadow space-y-3 bg-gradient-to-br from-white to-blue-50"
              >
                {/* User Identity & Role (Top Row) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-blue">
                      {user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-blue-900">
                        {user.student?.name || user.teacher?.name || "N/A"}
                      </div>
                      <div className="text-xs text-blue-600 truncate max-w-[150px]">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                      user.role
                    )} whitespace-nowrap`}
                  >
                    {user.role}
                  </span>
                </div>

                <div className="text-xs text-blue-600 border-t border-blue-200 pt-2 mt-2 flex justify-between items-center">
                  <span>Dibuat: {formatDate(user.createdAt)}</span>
                  {user.student && <span>NIS: {user.student.nis}</span>}
                </div>

                {/* Additional Info Section */}
                {(user.student || user.teacher || user.role === "ADMIN") && (
                  <div className="text-sm space-y-1 pt-1 text-blue-800">
                    {user.student && (
                      <p>
                        <span className="font-medium text-blue-900">
                          Kelas:
                        </span>{" "}
                        {user.student.class?.name || "N/A"}
                      </p>
                    )}
                    {(user.student || user.teacher) && (
                      <p>
                        <span className="font-medium text-blue-900">
                          Gender:
                        </span>{" "}
                        {user.student?.gender || user.teacher?.gender || "N/A"}
                      </p>
                    )}
                    {user.role === "ADMIN" && (
                      <p className="text-blue-600">Administrator</p>
                    )}
                  </div>
                )}

                {/* Actions (Bottom Row) */}
                <div className="flex justify-end gap-2 pt-3 border-t border-blue-200 mt-3">
                  <button
                    onClick={() => openEditModal(user)}
                    className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-full transition-colors active:scale-90 shadow-sm hover:shadow-blue"
                    title="Edit User"
                    type="button"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowPasswordModal(true);
                    }}
                    className="p-2.5 text-blue-500 hover:bg-blue-100 rounded-full transition-colors active:scale-90 shadow-sm hover:shadow-blue"
                    title="Reset Password"
                    type="button"
                  >
                    <Key className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowDeleteModal(true);
                    }}
                    className="p-2.5 text-red-600 hover:bg-red-100 rounded-full transition-colors active:scale-90 shadow-sm"
                    title="Delete User"
                    type="button"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {error && (
            <div className="p-6 text-red-600 bg-red-50 border-l-4 border-red-500">
              Error: {error.message || "Gagal memuat data user."}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-t border-blue-200 bg-gradient-to-r from-blue-50 to-white">
              <div className="text-sm text-blue-700 mb-2 sm:mb-0">
                Menampilkan {(pagination.page - 1) * pagination.limit + 1} -{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                dari {pagination.total} user
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changePage(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-sm hover:shadow-blue"
                  type="button"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-3 py-1 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium shadow-blue">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => changePage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-sm hover:shadow-blue"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto backdrop-blur-sm">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-blue border border-blue-200">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 text-gradient">
                  Tambah User Baru
                </h2>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-blue-900">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="input-field border-blue-300 focus:border-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-blue-900">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="input-field border-blue-300 focus:border-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-blue-900">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="input-field border-blue-300 focus:border-blue-500"
                      disabled={isSubmitting}
                    >
                      <option value="STUDENT">Student</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  {(formData.role === "STUDENT" ||
                    formData.role === "TEACHER") && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-blue-900">
                          Nama
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="input-field border-blue-300 focus:border-blue-500"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-blue-900">
                          Jenis Kelamin
                        </label>
                        <select
                          value={formData.gender}
                          onChange={(e) =>
                            setFormData({ ...formData, gender: e.target.value })
                          }
                          className="input-field border-blue-300 focus:border-blue-500"
                          disabled={isSubmitting}
                        >
                          <option value="LAKI_LAKI">Laki-laki</option>
                          <option value="PEREMPUAN">Perempuan</option>
                        </select>
                      </div>
                    </>
                  )}

                  {formData.role === "STUDENT" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-blue-900">
                          NIS
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.nis}
                          onChange={(e) =>
                            setFormData({ ...formData, nis: e.target.value })
                          }
                          className="input-field border-blue-300 focus:border-blue-500"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-blue-900">
                          Kelas
                        </label>
                        <select
                          required
                          value={formData.classId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              classId: e.target.value,
                            })
                          }
                          className="input-field border-blue-300 focus:border-blue-500"
                          disabled={isSubmitting || isLoadingClasses}
                        >
                          {isLoadingClasses ? (
                            <option value="">Memuat daftar kelas...</option>
                          ) : (
                            <>
                              <option value="">Pilih Kelas</option>
                              {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                  {cls.name}
                                </option>
                              ))}
                            </>
                          )}
                        </select>
                      </div>
                    </>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeCreateModal}
                      className="btn-secondary flex-1"
                      disabled={isSubmitting}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary flex-1"
                    >
                      {isSubmitting ? "Menyimpan..." : "Simpan"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto backdrop-blur-sm">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-blue border border-blue-200">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 text-gradient">
                  Edit User
                </h2>
                <form onSubmit={handleUpdateUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-blue-900">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="input-field border-blue-300 focus:border-blue-500"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-blue-900">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="input-field border-blue-300 focus:border-blue-500"
                      disabled={isSubmitting}
                    >
                      <option value="STUDENT">Student</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  {(formData.role === "STUDENT" ||
                    formData.role === "TEACHER") && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-blue-900">
                          Nama Lengkap
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="input-field border-blue-300 focus:border-blue-500"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-blue-900">
                          Jenis Kelamin
                        </label>
                        <select
                          value={formData.gender}
                          onChange={(e) =>
                            setFormData({ ...formData, gender: e.target.value })
                          }
                          className="input-field border-blue-300 focus:border-blue-500"
                          disabled={isSubmitting}
                        >
                          <option value="LAKI_LAKI">Laki-laki</option>
                          <option value="PEREMPUAN">Perempuan</option>
                        </select>
                      </div>
                    </>
                  )}

                  {formData.role === "STUDENT" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-blue-900">
                          NIS
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.nis}
                          onChange={(e) =>
                            setFormData({ ...formData, nis: e.target.value })
                          }
                          className="input-field border-blue-300 focus:border-blue-500"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-blue-900">
                          Kelas
                        </label>
                        <select
                          required
                          value={formData.classId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              classId: e.target.value,
                            })
                          }
                          className="input-field border-blue-300 focus:border-blue-500"
                          disabled={isSubmitting || isLoadingClasses}
                        >
                          {isLoadingClasses ? (
                            <option value="">Memuat daftar kelas...</option>
                          ) : (
                            <>
                              <option value="">Pilih Kelas</option>
                              {classes.map((cls) => (
                                <option
                                  key={cls.id}
                                  value={cls.id}
                                  selected={cls.id === formData.classId}
                                >
                                  {cls.name}
                                </option>
                              ))}
                            </>
                          )}
                        </select>
                      </div>
                    </>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeEditModal}
                      className="btn-secondary flex-1"
                      disabled={isSubmitting}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary flex-1"
                    >
                      {isSubmitting ? "Menyimpan..." : "Update"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete User Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg max-w-md w-full shadow-blue border border-red-200">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 text-red-600">
                  Hapus User
                </h2>
                <p className="text-blue-800 mb-6">
                  Apakah Anda yakin ingin menghapus user{" "}
                  <strong className="text-blue-900">
                    {selectedUser?.student?.name ||
                      selectedUser?.teacher?.name ||
                      selectedUser?.email}
                  </strong>
                  ? Aksi ini tidak dapat dibatalkan.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    className="btn-secondary flex-1"
                    disabled={isSubmitting}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteUser}
                    disabled={isSubmitting}
                    className="btn-destructive flex-1"
                  >
                    {isSubmitting ? "Menghapus..." : "Hapus"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg max-w-md w-full shadow-blue border border-blue-200">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 text-gradient">
                  Reset Password
                </h2>
                <p className="text-blue-800 mb-4">
                  Reset password untuk{" "}
                  <strong className="text-blue-900">
                    {selectedUser?.student?.name ||
                      selectedUser?.teacher?.name ||
                      selectedUser?.email}
                  </strong>
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-blue-900">
                    Password Baru
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field border-blue-300 focus:border-blue-500"
                    placeholder="Masukkan password baru"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closePasswordModal}
                    className="btn-secondary flex-1"
                    disabled={isSubmitting}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={isSubmitting || !newPassword.trim()}
                    className="btn-primary flex-1"
                  >
                    {isSubmitting ? "Mereset..." : "Reset Password"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
