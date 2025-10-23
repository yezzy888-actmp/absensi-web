// src/app/admin/classes/page.jsx
"use client";

import { useState, useCallback } from "react";
import { useClassManagement } from "@/hooks/useApi";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit2,
  Trash2,
  Users,
  Calendar,
  Eye,
  Download,
  Upload,
  RefreshCw,
  School,
  BookOpen,
  GraduationCap,
  Clock,
  AlertTriangle,
  CheckCircle,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminClassesPage() {
  const {
    classes,
    pagination,
    loading,
    error,
    changePage,
    changeLimit,
    searchClasses,
    refetch,
    create,
    update,
    remove,
    getById,
    getClassSchedule,
    getClassStudents,
  } = useClassManagement();

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classDetails, setClassDetails] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
  });

  // Handle search
  const handleSearch = useCallback(
    (value) => {
      setSearchTerm(value);
      if (value.trim()) {
        searchClasses(value);
      } else {
        refetch();
      }
    },
    [searchClasses, refetch]
  );

  // Handle create class
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Class name is required");
      return;
    }

    try {
      await create(formData);
      setShowCreateModal(false);
      setFormData({ name: "" });
      toast.success("Class created successfully!");
    } catch (error) {
      console.error("Create class error:", error);
    }
  };

  // Handle edit class
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Class name is required");
      return;
    }

    try {
      await update(selectedClass.id, formData);
      setShowEditModal(false);
      setFormData({ name: "" });
      setSelectedClass(null);
      toast.success("Class updated successfully!");
    } catch (error) {
      console.error("Update class error:", error);
    }
  };

  // Handle delete class
  const handleDelete = async () => {
    try {
      await remove(selectedClass.id);
      setShowDeleteModal(false);
      setSelectedClass(null);
      toast.success("Class deleted successfully!");
    } catch (error) {
      console.error("Delete class error:", error);
    }
  };

  // Handle view details
  const handleViewDetails = async (classItem) => {
    try {
      setSelectedClass(classItem);
      setShowDetailsModal(true);

      // Fetch additional details
      const [classData, scheduleData, studentsData] = await Promise.all([
        getById(classItem.id),
        getClassSchedule(classItem.id).catch(() => null),
        getClassStudents(classItem.id).catch(() => null),
      ]);

      setClassDetails({
        ...classData.class,
        schedule: scheduleData?.schedule || {},
        students: studentsData?.students || [],
      });
    } catch (error) {
      console.error("View details error:", error);
      toast.error("Failed to load class details");
    }
  };

  // Open edit modal
  const openEditModal = (classItem) => {
    setSelectedClass(classItem);
    setFormData({ name: classItem.name });
    setShowEditModal(true);
  };

  // Open delete modal
  const openDeleteModal = (classItem) => {
    setSelectedClass(classItem);
    setShowDeleteModal(true);
  };

  return (
    <div className="min-h-screen gradient-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="animate-fade-in">
            <h1 className="text-4xl font-bold text-gradient mb-2">
              Class Management
            </h1>
            <p className="text-gray-600 text-lg">
              Manage school classes and their information
            </p>
          </div>
          <div className="flex items-center space-x-3 animate-slide-in-right">
            <button
              onClick={refetch}
              className="btn-secondary"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Class
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in-up">
          <div className="card p-6 hover:shadow-blue transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Classes
                </p>
                <p className="text-3xl font-bold text-gradient">
                  {pagination.total || 0}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl shadow-blue">
                <School className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card p-6 hover:shadow-blue transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Active Classes
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {classes.filter((c) => c._count?.students > 0).length}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-200 rounded-2xl shadow-lg">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card p-6 hover:shadow-purple transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Students
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {classes.reduce(
                    (sum, c) => sum + (c._count?.students || 0),
                    0
                  )}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-100 to-indigo-200 rounded-2xl shadow-lg">
                <GraduationCap className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="card p-6 hover:shadow-blue transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Scheduled Classes
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  {classes.filter((c) => c._count?.schedules > 0).length}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-100 to-amber-200 rounded-2xl shadow-lg">
                <Calendar className="w-7 h-7 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card p-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search classes by name..."
                  className="input-field pl-12 w-full text-base"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <select
                className="input-field text-base px-4 cursor-pointer"
                value={pagination.limit}
                onChange={(e) => changeLimit(parseInt(e.target.value))}
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Classes Table */}
        <div className="card overflow-hidden animate-fade-in-up">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
              <span className="ml-4 text-gray-700 font-medium text-lg">
                Loading classes...
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-16 text-red-600">
              <div className="p-4 bg-red-50 rounded-2xl">
                <AlertTriangle className="w-6 h-6 mr-3 inline" />
                <span className="font-medium">
                  Error loading classes: {error}
                </span>
              </div>
            </div>
          )}

          {!loading && !error && classes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl mb-6 shadow-blue">
                <School className="w-16 h-16 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No classes found
              </h3>
              <p className="text-gray-600 mb-6 text-center max-w-md text-lg">
                {searchTerm
                  ? "No classes match your search criteria"
                  : "Get started by creating your first class"}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary text-lg px-8"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add First Class
                </button>
              )}
            </div>
          )}

          {!loading && !error && classes.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-blue-100">
                <thead className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">
                      Class Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">
                      Students
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">
                      Schedules
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/80 backdrop-blur-sm divide-y divide-blue-50">
                  {classes.map((classItem) => (
                    <tr
                      key={classItem.id}
                      className="hover:bg-blue-50/70 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl mr-4 shadow-sm">
                            <School className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-base font-semibold text-gray-900">
                              {classItem.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {classItem.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="w-5 h-5 text-blue-500 mr-2" />
                          <span className="text-base font-medium text-gray-900">
                            {classItem._count?.students || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-5 h-5 text-blue-500 mr-2" />
                          <span className="text-base font-medium text-gray-900">
                            {classItem._count?.schedules || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-4 py-2 text-sm font-semibold rounded-full ${
                            (classItem._count?.students || 0) > 0
                              ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200"
                              : "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200"
                          }`}
                        >
                          {(classItem._count?.students || 0) > 0
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleViewDetails(classItem)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openEditModal(classItem)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors duration-200"
                            title="Edit Class"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(classItem)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
                            title="Delete Class"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && classes.length > 0 && (
            <div className="px-6 py-5 border-t border-blue-100 bg-gradient-to-r from-blue-50/50 to-blue-100/50 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">
                  Showing{" "}
                  <span className="text-blue-600 font-bold">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{" "}
                  to{" "}
                  <span className="text-blue-600 font-bold">
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="text-blue-600 font-bold">
                    {pagination.total}
                  </span>{" "}
                  results
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => changePage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-100 rounded-lg">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => changePage(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create Class Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="glass-effect rounded-2xl p-8 w-full max-w-md shadow-2xl border-2 border-blue-200 animate-fade-in-up">
              <h2 className="text-2xl font-bold text-gradient mb-6">
                Create New Class
              </h2>
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder="Enter class name (e.g., 10A, Mathematics)"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({ name: "" });
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create Class
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Class Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="glass-effect rounded-2xl p-8 w-full max-w-md shadow-2xl border-2 border-blue-200 animate-fade-in-up">
              <h2 className="text-2xl font-bold text-gradient mb-6">
                Edit Class
              </h2>
              <form onSubmit={handleEdit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    className="input-field w-full"
                    placeholder="Enter class name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setFormData({ name: "" });
                      setSelectedClass(null);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Update Class
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedClass && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="glass-effect rounded-2xl p-8 w-full max-w-md shadow-2xl border-2 border-red-200 animate-fade-in-up">
              <div className="flex items-center mb-6">
                <div className="p-4 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl mr-4 shadow-lg">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Delete Class
                </h2>
              </div>
              <p className="text-gray-700 mb-6 text-base leading-relaxed">
                Are you sure you want to delete class{" "}
                <span className="font-bold text-blue-600">
                  "{selectedClass.name}"
                </span>
                ? This action cannot be undone.
              </p>
              {(selectedClass._count?.students > 0 ||
                selectedClass._count?.schedules > 0) && (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-5 mb-6">
                  <p className="text-yellow-900 text-sm font-medium">
                    <strong>⚠️ Warning:</strong> This class has{" "}
                    <span className="font-bold">
                      {selectedClass._count?.students || 0} students
                    </span>{" "}
                    and{" "}
                    <span className="font-bold">
                      {selectedClass._count?.schedules || 0} schedules
                    </span>
                    . Please remove them first before deleting the class.
                  </p>
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedClass(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={
                    selectedClass._count?.students > 0 ||
                    selectedClass._count?.schedules > 0
                  }
                  className="btn-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete Class
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Class Details Modal */}
        {showDetailsModal && selectedClass && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="glass-effect rounded-2xl p-8 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-blue-200 animate-fade-in-up">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gradient">
                  Class Details: {selectedClass.name}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedClass(null);
                    setClassDetails(null);
                  }}
                  className="p-2 hover:bg-blue-100 rounded-xl transition-colors duration-200"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {classDetails ? (
                <div className="space-y-8">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card p-6 hover:shadow-blue transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">
                            Students
                          </p>
                          <p className="text-3xl font-bold text-blue-600">
                            {classDetails.students?.length || 0}
                          </p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl">
                          <Users className="w-8 h-8 text-blue-600" />
                        </div>
                      </div>
                    </div>

                    <div className="card p-6 hover:shadow-blue transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">
                            Schedules
                          </p>
                          <p className="text-3xl font-bold text-green-600">
                            {Object.keys(classDetails.schedule || {}).length}
                          </p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-200 rounded-2xl">
                          <Calendar className="w-8 h-8 text-green-600" />
                        </div>
                      </div>
                    </div>

                    <div className="card p-6 hover:shadow-blue transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">
                            Status
                          </p>
                          <p className="text-lg font-semibold text-green-600">
                            {(classDetails.students?.length || 0) > 0
                              ? "Active"
                              : "Inactive"}
                          </p>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-200 rounded-2xl">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Students List */}
                  {classDetails.students &&
                    classDetails.students.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                          Students
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {classDetails.students.slice(0, 6).map((student) => (
                            <div
                              key={student.id}
                              className="flex items-center p-4 glass-effect rounded-xl hover:shadow-lg transition-all duration-300"
                            >
                              <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-200 rounded-xl mr-4">
                                <GraduationCap className="w-6 h-6 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-base font-semibold text-gray-900">
                                  {student.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  NIS: {student.nis}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {classDetails.students.length > 6 && (
                          <p className="text-sm text-gray-600 mt-4 font-medium">
                            And {classDetails.students.length - 6} more
                            students...
                          </p>
                        )}
                      </div>
                    )}

                  {/* Schedule */}
                  {classDetails.schedule &&
                    Object.keys(classDetails.schedule).length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                          Weekly Schedule
                        </h3>
                        <div className="space-y-4">
                          {Object.entries(classDetails.schedule).map(
                            ([day, schedules]) => (
                              <div
                                key={day}
                                className="border-2 border-blue-200 rounded-xl p-5 glass-effect hover:shadow-blue transition-all duration-300"
                              >
                                <h4 className="font-bold text-lg text-blue-700 mb-3 capitalize">
                                  {day}
                                </h4>
                                <div className="space-y-3">
                                  {schedules.map((schedule, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:shadow-sm transition-all duration-200"
                                    >
                                      <div className="flex items-center">
                                        <div className="p-2 bg-white rounded-lg mr-3 shadow-sm">
                                          <BookOpen className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <span className="text-base font-semibold text-gray-900">
                                          {schedule.subject?.name || "N/A"}
                                        </span>
                                      </div>
                                      <div className="flex items-center text-sm font-medium text-gray-700 bg-white px-4 py-2 rounded-lg shadow-sm">
                                        <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                        {schedule.startTime} -{" "}
                                        {schedule.endTime}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                  <span className="ml-4 text-gray-700 font-medium text-lg">
                    Loading class details...
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
