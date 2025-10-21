// src/app/layout.jsx
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/hooks/useAuth";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "School Attendance Admin",
  description: "Sistem Administrasi Absensi Sekolah untuk Admin dan Guru",
  keywords: "absensi, sekolah, admin, guru, siswa, attendance",
};
export default function RootLayout({ children }) {
  return (
    <html lang="id" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <AuthProvider>
          <div className="min-h-full">{children}</div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#363636",
                color: "#fff",
              },
              success: {
                duration: 3000,
                theme: {
                  primary: "#10b981",
                  secondary: "#ffffff",
                },
              },
              error: {
                duration: 5000,
                theme: {
                  primary: "#ef4444",
                  secondary: "#ffffff",
                },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
