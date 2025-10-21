"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTeacherComplete, useApi } from "@/hooks/useApi"; // useApi diimpor dari sini
import { subjectAPI, teacherSubjectAPI } from "@/lib/api"; // teacherSubjectAPI juga diimpor

import Link from "next/link";
import {
  RefreshCw,
  AlertCircle,
  Users,
  BookOpen,
  ChevronRight,
  School,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ManageScoresPage() {
  const { user } = useAuth();
  const teacherId = user?.profileData?.id;

  const {
    schedule: teacherSchedule,
    scheduleLoading,
    scheduleError,
    refetchSchedule,
    getClassStudents,
    classStudentsLoading,
    classStudentsError,
    getClassScores,
    scoresError, // Pastikan scoresError diambil dari useTeacherComplete
  } = useTeacherComplete(teacherId);

  // Mengambil mata pelajaran yang diajar oleh guru ini
  const {
    data: assignedSubjectsData,
    loading: assignedSubjectsLoading,
    error: assignedSubjectsError,
    refetch: refetchAssignedSubjects, // Menambahkan refetch untuk mata pelajaran yang diampu
  } = useApi(
    teacherId ? () => teacherSubjectAPI.getTeacherSubjects(teacherId) : null,
    {
      immediate: !!teacherId, // Hanya jalankan jika teacherId tersedia
      showToast: false,
    }
  );

  const assignedSubjects = useMemo(
    () => assignedSubjectsData?.subjects || [],
    [assignedSubjectsData]
  );

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [studentsWithScores, setStudentsWithScores] = useState([]);

  // Mendapatkan daftar kelas unik dari jadwal guru
  const teacherClasses = useMemo(() => {
    if (!teacherSchedule) return [];
    const classesMap = new Map();
    Object.values(teacherSchedule).forEach((daySchedules) => {
      daySchedules.forEach((scheduleItem) => {
        classesMap.set(scheduleItem.class.id, scheduleItem.class);
      });
    });
    return Array.from(classesMap.values());
  }, [teacherSchedule]);

  // Helper function to calculate average score
  const calculateAverageScore = (scores) => {
    if (!scores || typeof scores !== "object") {
      return "N/A";
    }

    let allScores = [];

    // Iterasi melalui semua kategori nilai (TUGAS, UTS, UAS, dll)
    Object.keys(scores).forEach((category) => {
      const categoryScores = scores[category];
      if (Array.isArray(categoryScores)) {
        categoryScores.forEach((scoreItem) => {
          // Coba berbagai kemungkinan nama properti untuk nilai
          const scoreValue =
            scoreItem.value || scoreItem.score || scoreItem.nilai || 0;
          if (
            scoreValue !== null &&
            scoreValue !== undefined &&
            !isNaN(scoreValue)
          ) {
            allScores.push(parseFloat(scoreValue));
          }
        });
      }
    });

    if (allScores.length === 0) {
      return "N/A";
    }

    const sum = allScores.reduce((total, score) => total + score, 0);
    return (sum / allScores.length).toFixed(2);
  };

  // Mengambil data siswa dan nilai berdasarkan kelas dan mata pelajaran yang dipilih
  useEffect(() => {
    const fetchClassAndSubjectData = async () => {
      if (selectedClassId && selectedSubjectId && teacherId) {
        try {
          const studentsResponse = await getClassStudents(selectedClassId);
          const students = studentsResponse?.students || [];

          // Mengambil nilai untuk semua siswa di kelas yang dipilih,
          // difilter berdasarkan mata pelajaran yang dipilih
          const scoresResponse = await getClassScores(selectedClassId, {
            subjectId: selectedSubjectId,
          });

          // Berdasarkan struktur API response yang Anda tunjukkan
          const studentScores = scoresResponse?.studentScores || [];

          const studentsWithMappedScores = students.map((student) => {
            // Cari data score untuk siswa ini
            const studentScoreData = studentScores.find(
              (scoreData) => scoreData.student.id === student.id
            );

            let allScores = [];
            let averageScore = "N/A";

            if (studentScoreData && studentScoreData.scores) {
              const scores = studentScoreData.scores;

              // Kumpulkan semua nilai dari berbagai kategori (TUGAS, UTS, UAS)
              if (scores.TUGAS && Array.isArray(scores.TUGAS)) {
                allScores = allScores.concat(
                  scores.TUGAS.map((score) => score.value || score.score || 0)
                );
              }

              if (scores.UTS && Array.isArray(scores.UTS)) {
                allScores = allScores.concat(
                  scores.UTS.map((score) => score.value || score.score || 0)
                );
              }

              if (scores.UAS && Array.isArray(scores.UAS)) {
                allScores = allScores.concat(
                  scores.UAS.map((score) => score.value || score.score || 0)
                );
              }

              // Hitung rata-rata jika ada nilai
              if (allScores.length > 0) {
                const validScores = allScores.filter(
                  (score) =>
                    score !== null && score !== undefined && !isNaN(score)
                );

                if (validScores.length > 0) {
                  const sum = validScores.reduce(
                    (total, score) => total + parseFloat(score),
                    0
                  );
                  averageScore = (sum / validScores.length).toFixed(2);
                }
              }
            }

            return {
              ...student,
              scores: studentScoreData?.scores || {},
              allScores: allScores,
              averageScore: averageScore,
              totalAssignments: allScores.length,
            };
          });

          setStudentsWithScores(studentsWithMappedScores);
        } catch (err) {
          console.error("Error fetching class and subject data:", err);
          toast.error(
            err.message || "Gagal memuat data siswa dan nilai di kelas ini."
          );
          setStudentsWithScores([]);
        }
      } else {
        setStudentsWithScores([]);
      }
    };

    fetchClassAndSubjectData();
  }, [
    selectedClassId,
    selectedSubjectId,
    teacherId,
    getClassStudents,
    getClassScores,
  ]);

  // Mengatur kelas dan mata pelajaran awal saat komponen dimuat atau data tersedia
  useEffect(() => {
    if (teacherClasses.length > 0 && !selectedClassId) {
      setSelectedClassId(teacherClasses[0].id);
    }
    // Gunakan assignedSubjects di sini
    if (assignedSubjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(assignedSubjects[0].id);
    }
  }, [teacherClasses, selectedClassId, assignedSubjects, selectedSubjectId]);

  // Menggabungkan status loading
  const overallLoading =
    scheduleLoading || assignedSubjectsLoading || classStudentsLoading; // Mengganti allSubjectsLoading dengan assignedSubjectsLoading

  // Menggabungkan status error
  const overallError =
    scheduleError || assignedSubjectsError || classStudentsError || scoresError; // Mengganti allSubjectsError dengan assignedSubjectsError

  if (overallLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Memuat data...</span>
        </div>
      </div>
    );
  }

  if (overallError) {
    return (
      <div className="space-y-6">
        <div className="card p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Gagal Memuat Data
          </h3>
          <p className="text-gray-600 mb-4">{overallError}</p>
          <button onClick={refetchSchedule} className="btn-primary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const ScoreBreakdown = ({ scores }) => {
    if (!scores || Object.keys(scores).length === 0) {
      return <span className="text-gray-400">Belum ada nilai</span>;
    }

    return (
      <div className="text-xs space-y-1">
        {Object.entries(scores).map(([category, categoryScores]) => {
          if (!Array.isArray(categoryScores) || categoryScores.length === 0) {
            return null;
          }

          const validScores = categoryScores
            .map((item) => item.value || item.score || item.nilai)
            .filter(
              (score) => score !== null && score !== undefined && !isNaN(score)
            );

          if (validScores.length === 0) return null;

          const categoryAvg = (
            validScores.reduce((sum, score) => sum + parseFloat(score), 0) /
            validScores.length
          ).toFixed(1);

          return (
            <div key={category} className="flex justify-between">
              <span className="text-gray-600">{category}:</span>
              <span className="font-medium">
                {categoryAvg} ({validScores.length})
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Manajemen Nilai Siswa
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola dan lihat nilai siswa di kelas Anda.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-secondary" onClick={refetchSchedule}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Selector Kelas & Mata Pelajaran */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <School className="w-5 h-5 text-gray-600" />
            <label
              htmlFor="select-class"
              className="font-semibold text-gray-800"
            >
              Pilih Kelas:
            </label>
            <select
              id="select-class"
              className="form-select flex-1"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              {teacherClasses.length === 0 ? (
                <option value="">Tidak ada kelas yang diajar</option>
              ) : (
                <>
                  <option value="">Pilih Kelas</option>
                  {teacherClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-gray-600" />
            <label
              htmlFor="select-subject"
              className="font-semibold text-gray-800"
            >
              Pilih Mata Pelajaran:
            </label>
            <select
              id="select-subject"
              className="form-select flex-1"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              disabled={!selectedClassId || assignedSubjects.length === 0} // Menggunakan assignedSubjects
            >
              {assignedSubjects.length === 0 ? ( // Menggunakan assignedSubjects
                <option value="">Tidak ada mata pelajaran yang diampu</option>
              ) : (
                <>
                  <option value="">Pilih Mata Pelajaran</option>
                  {assignedSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
        </div>
        {teacherClasses.length === 0 && (
          <p className="text-sm text-gray-500 mt-2">
            Anda belum ditugaskan ke kelas manapun.
          </p>
        )}
        {selectedClassId &&
          assignedSubjects.length === 0 && ( // Menggunakan assignedSubjects
            <p className="text-sm text-gray-500 mt-2">
              Tidak ada mata pelajaran yang diampu untuk guru ini.
            </p>
          )}
      </div>

      {/* Daftar Siswa */}
      {selectedClassId && selectedSubjectId ? (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Daftar Siswa di Kelas{" "}
            {teacherClasses.find((c) => c.id === selectedClassId)?.name || ""}{" "}
            untuk Mata Pelajaran{" "}
            {assignedSubjects.find((s) => s.id === selectedSubjectId)?.name ||
              ""}{" "}
            {/* Menggunakan assignedSubjects */}
          </h2>

          {studentsWithScores.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">
                Tidak ada siswa atau nilai di kelas ini untuk mata pelajaran
                ini.
              </p>
              <p className="text-sm">
                Pastikan kelas memiliki siswa dan nilai yang sesuai sudah
                diinput.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Nama Siswa
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Rata-rata Nilai Subjek
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {studentsWithScores.map((student) => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col space-y-2">
                          <div className="text-lg font-semibold text-gray-900">
                            {student.averageScore}
                          </div>
                          <ScoreBreakdown scores={student.scores} />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/teacher/scores/manage/${student.id}`}
                          className="text-green-600 hover:text-green-900 flex items-center justify-end"
                        >
                          Lihat Detail <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-6 text-center text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>
            Silakan pilih kelas dan mata pelajaran untuk melihat nilai siswa.
          </p>
        </div>
      )}
    </div>
  );
}
