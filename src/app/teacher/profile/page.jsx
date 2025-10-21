// src/app/teacher/profile/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Calendar,
  Edit3,
  Save,
  X,
  Camera,
  Shield, // Shield is kept for role display
} from "lucide-react";
import { useApi, useFormSubmit } from "@/hooks/useApi";
import { authAPI } from "@/lib/api";
import toast from "react-hot-toast";

export default function TeacherProfile() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  // Form state for profile editing - only include fields that exist in API
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
  });

  // Fetch user profile data
  const {
    data: userProfile,
    loading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useApi(authAPI.profile, {
    immediate: true,
    showToast: false,
  });

  // Form submission for profile update
  const { submit: submitProfileUpdate, loading: updateLoading } = useFormSubmit(
    async (data) => {
      // This would be the actual API call to update profile
      // For now, we'll simulate it
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: {
              ...userProfile,
              user: {
                ...userProfile.user,
                profileData: { ...userProfile.user.profileData, ...data },
              },
            },
          });
        }, 1000);
      });
    },
    {
      successMessage: "Profil berhasil diperbarui!",
      onSuccess: (result) => {
        setIsEditing(false);
        refetchProfile();
      },
    }
  );

  // Initialize form data when profile loads
  useEffect(() => {
    if (userProfile?.user?.profileData) {
      setFormData({
        name: userProfile.user.profileData.name || "",
        gender: userProfile.user.profileData.gender || "",
      });
    }
  }, [userProfile]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    await submitProfileUpdate(formData);
  };

  // Handle profile image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (profileLoading) {
    return (
      <div className="gradient-bg min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-blue-700 font-medium">Memuat profil...</span>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="gradient-bg min-h-screen flex items-center justify-center">
        <div className="card p-8 text-center max-w-md mx-4">
          <div className="text-red-500 mb-4">
            <X className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Gagal Memuat Profil
          </h3>
          <p className="text-gray-600 mb-4">{profileError}</p>
          <button onClick={refetchProfile} className="btn-primary">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // Fix data access based on API structure
  const user = userProfile?.user || {};
  const profile = user.profileData || {};

  return (
    <div className="gradient-bg min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profil Guru</h1>
          <p className="text-gray-600">
            Kelola informasi profil dan pengaturan akun Anda
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <div className="card p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 overflow-hidden">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      profile.name?.charAt(0)?.toUpperCase() || "G"
                    )}
                  </div>
                  <label
                    htmlFor="profile-image"
                    className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <Camera className="h-4 w-4 text-gray-600" />
                  </label>
                  <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <h3 className="font-semibold text-gray-900">
                  {profile.name || "Nama Belum Diisi"}
                </h3>
                <p className="text-sm text-gray-600">{user.email}</p>
                <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium mt-2">
                  <Shield className="h-3 w-3" />
                  {user.role || "TEACHER"}
                </div>
              </div>

              <nav className="space-y-2">
                <button
                  // onClick={() => setActiveTab("profile")} // No longer needed to change tab
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors bg-blue-50 text-blue-700 font-medium`} // Always active style
                >
                  <User className="h-4 w-4" />
                  Informasi Profil
                </button>
                {/* Removed Security and Stats buttons */}
              </nav>
            </div>
          </div>

          {/* Main Content - Only Profile Section */}
          <div className="lg:col-span-9">
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <div>
                  <h2 className="card-title">Informasi Profil</h2>
                  <p className="card-description">
                    Kelola informasi pribadi Anda
                  </p>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isEditing
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  {isEditing ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Edit3 className="h-4 w-4" />
                  )}
                  {isEditing ? "Batal" : "Edit Profil"}
                </button>
              </div>

              <div className="card-content">
                {isEditing ? (
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nama Lengkap
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="input-field"
                          placeholder="Masukkan nama lengkap"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Jenis Kelamin
                        </label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                          className="input-field"
                        >
                          <option value="">Pilih jenis kelamin</option>
                          <option value="LAKI_LAKI">Laki-laki</option>
                          <option value="PEREMPUAN">Perempuan</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={updateLoading}
                        className="btn-primary"
                      >
                        {updateLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Simpan Perubahan
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="btn-secondary"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <User className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm text-gray-600">Nama Lengkap</p>
                          <p className="font-medium text-gray-900">
                            {profile.name || "Belum diisi"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <Mail className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium text-gray-900">
                            {user.email || "Belum diisi"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <User className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm text-gray-600">Jenis Kelamin</p>
                          <p className="font-medium text-gray-900">
                            {profile.gender === "LAKI_LAKI"
                              ? "Laki-laki"
                              : profile.gender === "PEREMPUAN"
                              ? "Perempuan"
                              : "Belum diisi"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm text-gray-600">Bergabung</p>
                          <p className="font-medium text-gray-900">
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString(
                                  "id-ID"
                                )
                              : "Tidak diketahui"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-blue-600">Role</p>
                        <p className="font-medium text-blue-900">
                          {user.role || "TEACHER"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                      <User className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm text-green-600">User ID</p>
                        <p className="font-medium text-green-900 text-xs break-all">
                          {user.id || "Tidak diketahui"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
