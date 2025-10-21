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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Class Management</h1>
          <p className="text-gray-600 mt-1">
            Manage school classes and their information
          </p>
        </div>
        <div className="flex items-center space-x-3">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold text-gray-900">
                {pagination.total || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <School className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Active Classes
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {classes.filter((c) => c._count?.students > 0).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Students
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {classes.reduce((sum, c) => sum + (c._count?.students || 0), 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <GraduationCap className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Scheduled Classes
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {classes.filter((c) => c._count?.schedules > 0).length}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search classes by name..."
                className="input pl-10 w-full"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              className="input"
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
      <div className="card overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading classes...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-12 text-red-600">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span>Error loading classes: {error}</span>
          </div>
        )}

        {!loading && !error && classes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <School className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No classes found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? "No classes match your search criteria"
                : "Get started by creating your first class"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Class
              </button>
            )}
          </div>
        )}

        {!loading && !error && classes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedules
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classes.map((classItem) => (
                  <tr key={classItem.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <School className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
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
                        <Users className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {classItem._count?.students || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {classItem._count?.schedules || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          (classItem._count?.students || 0) > 0
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
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
                          className="text-blue-600 hover:text-blue-700"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(classItem)}
                          className="text-green-600 hover:text-green-700"
                          title="Edit Class"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(classItem)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete Class"
                        >
                          <Trash2 className="w-4 h-4" />
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
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => changePage(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Create New Class
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name *
                </label>
                <input
                  type="text"
                  className="input w-full"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Edit Class
            </h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name *
                </label>
                <input
                  type="text"
                  className="input w-full"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-red-100 rounded-full mr-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Delete Class
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete class "{selectedClass.name}"? This
              action cannot be undone.
            </p>
            {(selectedClass._count?.students > 0 ||
              selectedClass._count?.schedules > 0) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Warning:</strong> This class has{" "}
                  {selectedClass._count?.students || 0} students and{" "}
                  {selectedClass._count?.schedules || 0} schedules. Please
                  remove them first before deleting the class.
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
                className="btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Class
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Details Modal */}
      {showDetailsModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Class Details: {selectedClass.name}
              </h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedClass(null);
                  setClassDetails(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            {classDetails ? (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Students</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {classDetails.students?.length || 0}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>

                  <div className="card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Schedules</p>
                        <p className="text-2xl font-bold text-green-600">
                          {Object.keys(classDetails.schedule || {}).length}
                        </p>
                      </div>
                      <Calendar className="w-8 h-8 text-green-600" />
                    </div>
                  </div>

                  <div className="card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="text-sm font-medium text-green-600">
                          {(classDetails.students?.length || 0) > 0
                            ? "Active"
                            : "Inactive"}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Students List */}
                {classDetails.students && classDetails.students.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Students
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {classDetails.students.slice(0, 6).map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="p-2 bg-purple-100 rounded-full mr-3">
                            <GraduationCap className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {student.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              NIS: {student.nis}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {classDetails.students.length > 6 && (
                      <p className="text-sm text-gray-600 mt-2">
                        And {classDetails.students.length - 6} more students...
                      </p>
                    )}
                  </div>
                )}

                {/* Schedule */}
                {classDetails.schedule &&
                  Object.keys(classDetails.schedule).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Weekly Schedule
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(classDetails.schedule).map(
                          ([day, schedules]) => (
                            <div
                              key={day}
                              className="border border-gray-200 rounded-lg p-4"
                            >
                              <h4 className="font-medium text-gray-900 mb-2 capitalize">
                                {day}
                              </h4>
                              <div className="space-y-2">
                                {schedules.map((schedule, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                  >
                                    <div className="flex items-center">
                                      <BookOpen className="w-4 h-4 text-blue-600 mr-2" />
                                      <span className="text-sm font-medium">
                                        {schedule.subject?.name || "N/A"}
                                      </span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                      <Clock className="w-4 h-4 mr-1" />
                                      {schedule.startTime} - {schedule.endTime}
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
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">
                  Loading class details...
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
