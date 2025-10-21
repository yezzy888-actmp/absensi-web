// src/app/teacher/scores/input/page.jsx
"use client";

import { useState, useEffect } from "react";
import {
  useTeacherCompleteWithSubjects,
  useTeacherScores,
  useTeacherClassStudents,
} from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { subjectAPI, classAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

export default function ScoreInputPage() {
  const { user, loading: authLoading } = useAuth();
  const [teacherId, setTeacherId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [scoreType, setScoreType] = useState("");
  const [scoreValue, setScoreValue] = useState("");
  const [scoreDescription, setScoreDescription] = useState("");

  useEffect(() => {
    if (user?.id) {
      setTeacherId(user.profileData.id);
    }
  }, [user]);

  const { assignedSubjects, subjectLoading: assignedSubjectsLoading } =
    useTeacherCompleteWithSubjects(teacherId);

  const {
    loading: scoresLoading,
    error: scoresError,
    addAssignmentScore,
    addMidtermScore,
    addFinalScore,
  } = useTeacherScores(teacherId);

  const {
    loading: classStudentsLoading,
    error: classStudentsError,
    getClassStudents,
  } = useTeacherClassStudents(teacherId);

  const [allClasses, setAllClasses] = useState([]);
  const [allClassesLoading, setAllClassesLoading] = useState(false);
  const [allClassesError, setAllClassesError] = useState(null);
  const [studentsInSelectedClass, setStudentsInSelectedClass] = useState([]);

  useEffect(() => {
    const fetchAllClasses = async () => {
      setAllClassesLoading(true);
      try {
        const response = await classAPI.getAllClasses({ limit: 1000 });
        setAllClasses(response.data.classes || []);
      } catch (err) {
        console.error("Error fetching all classes:", err);
        setAllClassesError("Gagal memuat daftar kelas.");
        toast.error("Gagal memuat daftar kelas.");
      } finally {
        setAllClassesLoading(false);
      }
    };
    fetchAllClasses();
  }, []);

  useEffect(() => {
    if (selectedClassId && teacherId) {
      const fetchStudents = async () => {
        try {
          const result = await getClassStudents(selectedClassId);
          setStudentsInSelectedClass(result.students || []);
        } catch (err) {
          console.error("Error fetching students for class:", err);
          setStudentsInSelectedClass([]);
          toast.error("Gagal memuat siswa untuk kelas ini.");
        }
      };
      fetchStudents();
    } else {
      setStudentsInSelectedClass([]);
    }
  }, [selectedClassId, teacherId, getClassStudents]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !teacherId ||
      !selectedStudentId ||
      !selectedSubjectId ||
      !scoreType ||
      !scoreValue
    ) {
      toast.error("Harap isi semua kolom yang diperlukan.");
      return;
    }

    const score = parseFloat(scoreValue);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error("Nilai harus angka antara 0 dan 100.");
      return;
    }

    try {
      let result;
      // Adjust this logic to use the correct API calls for UTS, UAS, TUGAS
      // You might have a generic addScore function that takes scoreType
      // Or specific functions like addUtsScore, addUasScore, addTugasScore
      switch (scoreType) {
        case "UTS":
          result = await addMidtermScore(
            // Assuming addMidtermScore corresponds to UTS
            selectedStudentId,
            selectedSubjectId,
            score,
            scoreDescription
          );
          break;
        case "UAS":
          result = await addFinalScore(
            // Assuming addFinalScore corresponds to UAS
            selectedStudentId,
            selectedSubjectId,
            score,
            scoreDescription
          );
          break;
        case "TUGAS":
          result = await addAssignmentScore(
            // Assuming addAssignmentScore corresponds to TUGAS
            selectedStudentId,
            selectedSubjectId,
            score,
            scoreDescription
          );
          break;
        default:
          toast.error("Jenis nilai tidak valid.");
          return;
      }
      toast.success("Nilai berhasil ditambahkan!");
      setSelectedClassId("");
      setSelectedStudentId("");
      setSelectedSubjectId("");
      setScoreType("");
      setScoreValue("");
      setScoreDescription("");
    } catch (err) {
      console.error("Submission failed:", err);
    }
  };

  const isLoading =
    authLoading ||
    assignedSubjectsLoading ||
    scoresLoading ||
    classStudentsLoading ||
    allClassesLoading;

  const currentError = scoresError || classStudentsError || allClassesError;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="card max-w-2xl mx-auto">
        <div className="card-header">
          <h1 className="card-title text-center">Input Nilai Siswa</h1>
          <p className="card-description text-center">
            Masukkan nilai kuis, tugas, UTS, atau UAS untuk siswa.
          </p>
        </div>
        <div className="card-content">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="teacherId"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                ID Guru
              </label>
              <input
                type="text"
                id="teacherId"
                className="input-field"
                placeholder="Memuat ID Guru..."
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                disabled={true}
              />
              <p className="text-xs text-gray-500 mt-1">
                ID ini diambil secara otomatis dari sesi login Anda.
              </p>
            </div>

            <hr className="section-divider my-6" />

            <div>
              <label
                htmlFor="class"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Pilih Kelas
              </label>
              <select
                id="class"
                className="input-field cursor-pointer"
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedStudentId("");
                }}
                disabled={isLoading || allClasses.length === 0}
              >
                <option value="">
                  {allClassesLoading ? "Memuat kelas..." : "Pilih Kelas"}
                </option>
                {allClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              {allClassesError && (
                <p className="text-red-500 text-sm mt-1">{allClassesError}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="student"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Pilih Siswa
              </label>
              <select
                id="student"
                className="input-field cursor-pointer"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={
                  !selectedClassId ||
                  isLoading ||
                  studentsInSelectedClass.length === 0
                }
              >
                <option value="">
                  {classStudentsLoading
                    ? "Memuat siswa..."
                    : !selectedClassId
                    ? "Pilih kelas terlebih dahulu"
                    : studentsInSelectedClass.length === 0
                    ? "Tidak ada siswa di kelas ini"
                    : "Pilih Siswa"}
                </option>
                {studentsInSelectedClass.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
              {classStudentsError && (
                <p className="text-red-500 text-sm mt-1">
                  {classStudentsError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Mata Pelajaran
              </label>
              <select
                id="subject"
                className="input-field cursor-pointer"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                disabled={isLoading || assignedSubjects.length === 0}
              >
                <option value="">
                  {assignedSubjectsLoading
                    ? "Memuat mata pelajaran..."
                    : "Pilih Mata Pelajaran"}
                </option>
                {assignedSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              {assignedSubjectsLoading && (
                <p className="text-xs text-gray-500 mt-1">
                  Memuat mata pelajaran yang diajarkan oleh guru...
                </p>
              )}
              {teacherId &&
                assignedSubjects.length === 0 &&
                !assignedSubjectsLoading && (
                  <p className="text-sm text-red-500 mt-1">
                    Guru ini belum ditugaskan mata pelajaran.
                  </p>
                )}
            </div>

            <div>
              <label
                htmlFor="scoreType"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Jenis Nilai
              </label>
              <select
                id="scoreType"
                className="input-field cursor-pointer"
                value={scoreType}
                onChange={(e) => setScoreType(e.target.value)}
                disabled={isLoading}
              >
                <option value="">Pilih Jenis Nilai</option>
                <option value="UTS">UTS</option>
                <option value="UAS">UAS</option>
                <option value="TUGAS">TUGAS</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="scoreValue"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nilai
              </label>
              <input
                type="number"
                id="scoreValue"
                className="input-field"
                placeholder="Masukkan nilai (0-100)"
                value={scoreValue}
                onChange={(e) => setScoreValue(e.target.value)}
                min="0"
                max="100"
                step="0.1"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="scoreDescription"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Deskripsi (Opsional)
              </label>
              <textarea
                id="scoreDescription"
                className="input-field min-h-[80px] pt-2"
                placeholder="Misalnya: Kuis Bab 1, Tugas Akhir Semester"
                value={scoreDescription}
                onChange={(e) => setScoreDescription(e.target.value)}
                disabled={isLoading}
              ></textarea>
            </div>

            {currentError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                <strong className="font-bold">Error:</strong>
                <span className="block sm:inline"> {currentError}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                "Input Nilai"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
