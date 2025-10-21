// src/app/page.jsx
import Image from "next/image";
import {
  GraduationCap,
  Users,
  Calendar,
  BarChart3,
  ArrowRight,
  Shield,
  Clock,
  CheckCircle2,
  QrCode,
  BookOpen,
  TrendingUp,
  Star,
  Play,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen gradient-bg overflow-hidden">
      {/* Navigation */}
      <nav className="glass-effect sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Image
                  src={"/logo.png"}
                  alt="SMAN 1 PABEDILAN Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover drop-shadow-lg"
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <span className="text-xl font-bold text-gray-900 drop-shadow-sm">
                SMAN 1 PABEDILAN
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-400/10 to-blue-300/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left space-y-8 animate-fade-in-up">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium border border-blue-200">
                  <Star className="w-4 h-4 fill-current" />
                  Platform Absensi Terdepan
                </div>

                <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                  <span className="block text-gray-900 mb-2">Revolusi</span>
                  <span className="block text-gradient bg-gradient-to-r from-blue-600 via-blue-500 to-blue-800 bg-clip-text text-transparent drop-shadow-lg">
                    Absensi
                  </span>
                  <span className="block text-gray-700 text-4xl md:text-5xl mt-2">
                    untuk Sekolah Modern
                  </span>
                </h1>

                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                  Transformasi lengkap sistem kehadiran dengan teknologi
                  <span className="font-semibold text-blue-600">
                    {" "}
                    QR Code pintar
                  </span>
                  , analitik mendalam, dan manajemen sekolah yang
                  <span className="font-semibold text-blue-500">
                    {" "}
                    terintegrasi penuh
                  </span>
                  .
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/auth/admin/login"
                  className="btn-primary text-lg px-8 py-4 shadow-2xl hover:shadow-blue transform hover:scale-105 transition-all duration-300 group"
                >
                  <Shield className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                  Portal Admin
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </Link>
                <Link
                  href="/auth/teacher/login"
                  className="btn-secondary text-lg px-8 py-4 group border-2 border-blue-200 hover:border-blue-400"
                >
                  <Users className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  Portal Guru
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">500+</div>
                  <div className="text-sm text-gray-600">Sekolah</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500">50K+</div>
                  <div className="text-sm text-gray-600">Siswa Aktif</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">99.9%</div>
                  <div className="text-sm text-gray-600">Akurasi</div>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative lg:block hidden">
              <div className="relative z-10 transform rotate-3 hover:rotate-0 transition-transform duration-700">
                <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
                  {/* Mock Dashboard */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Dashboard Hari Ini
                      </h3>
                      <div className="flex items-center gap-2 text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm">Live</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-blue-600">
                              847
                            </div>
                            <div className="text-xs text-blue-600/70">
                              Hadir
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">
                              98%
                            </div>
                            <div className="text-xs text-green-600/70">
                              Kehadiran
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mock QR Scanner */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-dashed border-blue-300">
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
                          <QrCode className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-sm font-medium text-gray-700">
                          Scan QR untuk Absen
                        </div>
                        <div className="text-xs text-gray-500">
                          Tap untuk mulai scan
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-yellow-400 rounded-lg rotate-12 animate-bounce shadow-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-green-500 rounded-full animate-pulse shadow-lg flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full text-blue-700 text-sm font-medium border border-blue-200 mb-6">
              <Star className="w-4 h-4" />
              Fitur Unggulan
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Solusi Lengkap untuk
              <span className="block text-gradient bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                Administrasi Sekolah
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Platform terintegrasi yang menggabungkan teknologi modern dengan
              kebutuhan pendidikan masa kini
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Enhanced Feature Cards */}
            {[
              {
                icon: Clock,
                title: "Absensi Real-time",
                description:
                  "Sistem absensi dengan QR Code yang memungkinkan siswa melakukan check-in secara real-time dengan notifikasi otomatis",
                color: "blue",
                gradient: "from-blue-500 to-blue-600",
              },
              {
                icon: BarChart3,
                title: "Dashboard Analytics",
                description:
                  "Analisis mendalam tentang kehadiran siswa dengan grafik interaktif, laporan detail, dan prediksi tren",
                color: "green",
                gradient: "from-green-500 to-green-600",
              },
              {
                icon: Calendar,
                title: "Jadwal Terintegrasi",
                description:
                  "Manajemen jadwal pelajaran yang terintegrasi penuh dengan sistem absensi dan penilaian otomatis",
                color: "blue",
                gradient: "from-blue-400 to-blue-500",
              },
              {
                icon: Users,
                title: "Multi-Role Access",
                description:
                  "Sistem akses berlapis untuk Admin, dan Guru   dengan dashboard khusus dan permission yang disesuaikan",
                color: "indigo",
                gradient: "from-blue-500 to-indigo-600",
              },
              {
                icon: CheckCircle2,
                title: "Sistem Penilaian",
                description:
                  "Manajemen nilai UTS, UAS, dan tugas dengan kategori fleksibel, bobot otomatis, dan laporan komprehensif",
                color: "orange",
                gradient: "from-orange-500 to-orange-600",
              },
              {
                icon: Shield,
                title: "Keamanan Terjamin",
                description:
                  "Sistem autentikasi berlapis dengan enkripsi end-to-end, audit trail, dan backup otomatis untuk keamanan data",
                color: "red",
                gradient: "from-red-500 to-red-600",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={`group card glass-effect hover:shadow-xl transition-all duration-500 transform hover:-translate-y-6 hover:rotate-1 animate-fade-in-up`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="card-header relative overflow-hidden">
                  <div
                    className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 mb-6 shadow-lg`}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="card-title text-xl mb-3 group-hover:text-blue-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="card-description leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="glass-effect border-t border-white/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <Image
                src={"/logo.png"}
                alt="SMAN 1 PABEDILAN Logo"
                width={40}
                height={40}
                className="h-8 w-8 rounded-full object-cover drop-shadow-lg"
              />{" "}
              <div>
                <span className="text-xl font-bold text-gray-900">
                  SMAN 1 PABEDILAN
                </span>
                <p className="text-sm text-gray-600">
                  Sistem Absensi Sekolah Modern
                </p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="text-sm text-gray-600 mb-2">
                © 2024 SMAN 1 PABEDILAN. All rights reserved.
              </div>
              <div className="text-xs text-gray-500">
                Transforming Education with Technology
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
