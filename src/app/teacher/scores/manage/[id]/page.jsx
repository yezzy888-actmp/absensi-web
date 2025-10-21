"use client";

import { useState, useEffect, useCallback, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTeacherScores, useApi } from "@/hooks/useApi";
import { teacherAPI } from "@/lib/api";
import toast from "react-hot-toast";
import {
  RefreshCw,
  AlertCircle,
  BookOpen,
  Edit,
  PlusCircle,
} from "lucide-react";

import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function StudentScoreDetailsPage({ params }) {
  // ✅ ALL HOOKS MUST BE CALLED FIRST - NO CONDITIONS BEFORE THESE
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();

  // State declarations - always called
  const [studentScores, setStudentScores] = useState(null);
  const [isAddScoreModalOpen, setIsAddScoreModalOpen] = useState(false);
  const [isEditScoreModalOpen, setIsEditScoreModalOpen] = useState(false);
  const [scoreFormData, setScoreFormData] = useState({
    type: "TUGAS",
    subjectId: "",
    value: "",
    description: "",
  });
  const [editingScoreId, setEditingScoreId] = useState(null);

  // Extract values after hooks
  const { id: studentId } = resolvedParams;
  const teacherId = user?.profileData?.id;

  const {
    getStudentScores,
    addAssignmentScore,
    addMidtermScore,
    addFinalScore,
    updateScore,
    loading: scoresActionLoading,
    error: scoresActionError,
  } = useTeacherScores(teacherId);
  const {
    data: allSubjectsData,
    loading: subjectsLoading,
    error: subjectsError,
  } = useApi(teacherId ? () => teacherAPI.getSubjects(teacherId) : null, {
    immediate: !!teacherId,
    showToast: false,
  });

  // Memos and callbacks - always called
  const scoreTypes = useMemo(
    () => [
      { value: "TUGAS", label: "Tugas" },
      { value: "UTS", label: "UTS" },
      { value: "UAS", label: "UAS" },
    ],
    []
  );

  const allSubjects = useMemo(
    () => allSubjectsData?.subjects || [],
    [allSubjectsData]
  );

  const fetchStudentScores = useCallback(async () => {
    if (!teacherId || !studentId) {
      console.log(
        "Skipping fetchStudentScores: teacherId or studentId missing"
      );
      return;
    }

    try {
      const response = await getStudentScores(studentId);
      setStudentScores(response?.scores || []);
    } catch (err) {
      console.error("Error fetching student scores:", err);
      toast.error(err?.message || "Gagal memuat nilai siswa.");
      setStudentScores([]);
    }
  }, [teacherId, studentId, getStudentScores]);

  const studentName = useMemo(() => {
    return studentScores && studentScores.length > 0
      ? studentScores[0].student?.name || "Siswa"
      : "Siswa";
  }, [studentScores]);

  const groupedScores = useMemo(() => {
    if (!studentScores || !Array.isArray(studentScores)) {
      return {};
    }
    return studentScores.reduce((acc, score) => {
      const subjectName = score.subject?.name || "N/A";
      if (!acc[subjectName]) {
        acc[subjectName] = [];
      }
      acc[subjectName].push(score);
      return acc;
    }, {});
  }, [studentScores]);

  // useEffect - always called
  useEffect(() => {
    let isMounted = true;

    const loadScores = async () => {
      if (isMounted && teacherId && studentId) {
        await fetchStudentScores();
      }
    };

    loadScores();

    return () => {
      isMounted = false;
    };
  }, [fetchStudentScores, teacherId, studentId]);

  // ✅ NOW SAFE TO DO CONDITIONAL RETURNS - ALL HOOKS HAVE BEEN CALLED

  // Handle case where teacherId is not available
  if (!teacherId) {
    return (
      <div className="space-y-6">
        <div className="card p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Akses Ditolak
          </h3>
          <p className="text-gray-600 mb-4">
            Anda harus login sebagai guru untuk melihat detail nilai siswa.
          </p>
        </div>
      </div>
    );
  }

  // Handle loading state
  if (subjectsLoading || (scoresActionLoading && !studentScores)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Memuat nilai siswa...</span>
        </div>
      </div>
    );
  }

  // Handle error state
  if (subjectsError || scoresActionError) {
    return (
      <div className="space-y-6">
        <div className="card p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Gagal Memuat Data
          </h3>
          <p className="text-gray-600 mb-4">
            {subjectsError || scoresActionError}
          </p>
          <Button onClick={fetchStudentScores} variant="primary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  // Event handlers
  const handleAddScore = async (e) => {
    e.preventDefault();

    if (!scoreFormData.subjectId || !scoreFormData.value) {
      toast.error("Subjek dan Nilai harus diisi.");
      return;
    }

    try {
      const scoreValue = parseFloat(scoreFormData.value);
      if (isNaN(scoreValue)) {
        toast.error("Nilai harus berupa angka.");
        return;
      }

      const commonArgs = [
        studentId,
        scoreFormData.subjectId,
        scoreValue,
        scoreFormData.description,
      ];

      let result;
      switch (scoreFormData.type) {
        case "TUGAS":
          result = await addAssignmentScore(...commonArgs);
          break;
        case "UTS":
          result = await addMidtermScore(...commonArgs);
          break;
        case "UAS":
          result = await addFinalScore(...commonArgs);
          break;
        default:
          toast.error("Tipe nilai tidak valid.");
          return;
      }

      if (result) {
        toast.success("Nilai berhasil ditambahkan!");
        setIsAddScoreModalOpen(false);
        setScoreFormData({
          type: "TUGAS",
          subjectId: "",
          value: "",
          description: "",
        });
        await fetchStudentScores();
      }
    } catch (err) {
      console.error("Failed to add score:", err);
      toast.error("Gagal menambahkan nilai.");
    }
  };

  const handleEditScore = async (e) => {
    e.preventDefault();

    if (!editingScoreId || !scoreFormData.subjectId || !scoreFormData.value) {
      toast.error("Subjek dan Nilai harus diisi.");
      return;
    }

    try {
      const scoreValue = parseFloat(scoreFormData.value);
      if (isNaN(scoreValue)) {
        toast.error("Nilai harus berupa angka.");
        return;
      }

      const result = await updateScore(editingScoreId, {
        type: scoreFormData.type,
        subjectId: scoreFormData.subjectId,
        value: scoreValue,
        description: scoreFormData.description,
      });

      if (result) {
        toast.success("Nilai berhasil diperbarui!");
        setIsEditScoreModalOpen(false);
        setScoreFormData({
          type: "TUGAS",
          subjectId: "",
          value: "",
          description: "",
        });
        setEditingScoreId(null);
        await fetchStudentScores();
      }
    } catch (err) {
      console.error("Failed to update score:", err);
      toast.error("Gagal memperbarui nilai.");
    }
  };

  const openEditModal = (score) => {
    setEditingScoreId(score.id);
    setScoreFormData({
      type: score.type,
      subjectId: score.subject?.id || "",
      value: score.value.toString(),
      description: score.description || "",
    });
    setIsEditScoreModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddScoreModalOpen(false);
    setScoreFormData({
      type: "TUGAS",
      subjectId: "",
      value: "",
      description: "",
    });
  };

  const closeEditModal = () => {
    setIsEditScoreModalOpen(false);
    setScoreFormData({
      type: "TUGAS",
      subjectId: "",
      value: "",
      description: "",
    });
    setEditingScoreId(null);
  };

  // Main render
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Detail Nilai: {studentName}
          </h1>
          <p className="text-gray-600 mt-1">
            Lihat dan kelola nilai untuk {studentName}.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="secondary" onClick={fetchStudentScores}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Nilai
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsAddScoreModalOpen(true)}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Tambah Nilai Baru
          </Button>
        </div>
      </div>

      {/* Score List */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Nilai Tersedia
        </h2>

        {!studentScores || studentScores.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">Tidak ada nilai untuk siswa ini.</p>
            <p className="text-sm">Anda dapat menambah nilai baru di atas.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedScores).map(([subjectName, scores]) => (
              <div
                key={subjectName}
                className="border rounded-lg shadow-sm p-4"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                  {subjectName}
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Tipe
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Nilai
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Deskripsi
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {scores.map((score) => (
                        <tr key={score.id}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {scoreTypes.find((t) => t.value === score.type)
                              ?.label || score.type}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {score.value}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {score.description || "-"}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => openEditModal(score)}
                              className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end"
                            >
                              <Edit className="w-4 h-4 mr-1" /> Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Score Modal */}
      <Modal
        isOpen={isAddScoreModalOpen}
        onClose={closeAddModal}
        title="Tambah Nilai Baru"
      >
        <form onSubmit={handleAddScore} className="space-y-4">
          <div>
            <label htmlFor="score-type" className="form-label">
              Tipe Nilai :
            </label>
            <select
              id="score-type"
              className="form-select"
              value={scoreFormData.type}
              onChange={(e) =>
                setScoreFormData({ ...scoreFormData, type: e.target.value })
              }
            >
              {scoreTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            id="score-subject"
            label="Mata Pelajaran"
            type="select"
            value={scoreFormData.subjectId}
            onChange={(e) =>
              setScoreFormData({
                ...scoreFormData,
                subjectId: e.target.value,
              })
            }
            required
          >
            <option value="">Pilih Mata Pelajaran</option>
            {allSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </Input>

          <Input
            id="score-value"
            label="Nilai"
            type="number"
            min="0"
            max="100"
            step="0.01"
            placeholder="Contoh: 85.5"
            value={scoreFormData.value}
            onChange={(e) =>
              setScoreFormData({ ...scoreFormData, value: e.target.value })
            }
            required
          />

          <div>
            <label htmlFor="score-description" className="form-label">
              Deskripsi (Opsional)
            </label>
            <textarea
              id="score-description"
              className="form-textarea"
              rows="3"
              placeholder="Catatan tambahan tentang nilai ini..."
              value={scoreFormData.description}
              onChange={(e) =>
                setScoreFormData({
                  ...scoreFormData,
                  description: e.target.value,
                })
              }
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={closeAddModal}>
              Batal
            </Button>
            <Button type="submit" loading={scoresActionLoading}>
              Tambah Nilai
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Score Modal */}
      <Modal
        isOpen={isEditScoreModalOpen}
        onClose={closeEditModal}
        title="Edit Nilai"
      >
        <form onSubmit={handleEditScore} className="space-y-4">
          <div>
            <label htmlFor="edit-score-type" className="form-label">
              Tipe Nilai
            </label>
            <select
              id="edit-score-type"
              className="form-select"
              value={scoreFormData.type}
              onChange={(e) =>
                setScoreFormData({ ...scoreFormData, type: e.target.value })
              }
              disabled
            >
              {scoreTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            id="edit-score-subject"
            label="Mata Pelajaran"
            type="select"
            value={scoreFormData.subjectId}
            onChange={(e) =>
              setScoreFormData({
                ...scoreFormData,
                subjectId: e.target.value,
              })
            }
            required
            disabled
          >
            <option value="">Pilih Mata Pelajaran</option>
            {allSubjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </Input>

          <Input
            id="edit-score-value"
            label="Nilai"
            type="number"
            min="0"
            max="100"
            step="0.01"
            placeholder="Contoh: 85.5"
            value={scoreFormData.value}
            onChange={(e) =>
              setScoreFormData({ ...scoreFormData, value: e.target.value })
            }
            required
          />

          <div>
            <label htmlFor="edit-score-description" className="form-label">
              Deskripsi (Opsional)
            </label>
            <textarea
              id="edit-score-description"
              className="form-textarea"
              rows="3"
              placeholder="Catatan tambahan tentang nilai ini..."
              value={scoreFormData.description}
              onChange={(e) =>
                setScoreFormData({
                  ...scoreFormData,
                  description: e.target.value,
                })
              }
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="secondary" onClick={closeEditModal}>
              Batal
            </Button>
            <Button type="submit" loading={scoresActionLoading}>
              Perbarui Nilai
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
