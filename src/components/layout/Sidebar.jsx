// src/components/layout/Sidebar.js
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  HelpCircle,
  ChevronDown,
  CalendarCheck,
  ChevronRight,
  UserCheck,
  ClipboardList,
  FileText,
  Award,
  Bell,
  Clock,
  BookMarked,
  Target,
  PieChart,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

const Sidebar = ({ userRole = "admin", isOpen, onClose }) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState({});

  const toggleMenu = (menuKey) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  const adminMenuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin",
      exact: true,
    },
    {
      label: "Kelola Pengguna",
      icon: Users,
      href: "/admin/users",
    },
    {
      label: "Akademik",
      icon: GraduationCap,
      children: [
        { label: "Guru Mapel", href: "/admin/teacher-subject" },
        { label: "Kelas", href: "/admin/classes" },
        { label: "Mapel", href: "/admin/subjects" },
      ],
    },
    {
      label: "Jadwal",
      icon: Calendar,
      href: "/admin/schedule",
    },
  ];

  const teacherMenuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/teacher",
      exact: true,
    },
    {
      label: "Profil & Mata Pelajaran",
      icon: BookMarked,
      children: [
        { label: "Profil Saya", href: "/teacher/profile" },
        { label: "Mata Pelajaran", href: "/teacher/subjects" },
      ],
    },
    {
      label: "Jadwal Mengajar",
      icon: Calendar,
      href: "/teacher/schedule",
    },
    {
      label: "Absensi Siswa",
      icon: UserCheck,
      children: [
        {
          label: "Buat Sesi Absensi",
          href: "/teacher/attendance/create-session",
        },
        { label: "Sesi Aktif", href: "/teacher/attendance/active-sessions" },
        { label: "Kelola Absensi", href: "/teacher/attendance/manage" },
        { label: "Riwayat Absensi", href: "/teacher/attendance/history" },
      ],
    },
    {
      label: "Penilaian",
      icon: Award,
      children: [
        { label: "Input Nilai", href: "/teacher/scores/input" },
        { label: "Kelola Nilai", href: "/teacher/scores/manage" },
      ],
    },
  ];

  const menuItems = userRole === "admin" ? adminMenuItems : teacherMenuItems;

  const isActiveLink = (href, exact = false) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const hasActiveChild = (children) => {
    return children?.some((child) => isActiveLink(child.href));
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return userRole === "admin" ? "A" : "T";

    const names = user.name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  // Get display name
  const getDisplayName = () => {
    return user?.name || (userRole === "admin" ? "Admin User" : "Teacher");
  };

  // Get user email
  const getUserEmail = () => {
    return user?.email || "user@example.com";
  };

  // Get user status
  const getUserStatus = () => {
    return user?.isActive !== false ? "Online" : "Offline";
  };

  // Get user status color
  const getStatusColor = () => {
    return user?.isActive !== false ? "text-green-600" : "text-gray-500";
  };

  const SidebarItem = ({ item, depth = 0 }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[item.label];
    const isActive = item.href
      ? isActiveLink(item.href, item.exact)
      : hasActiveChild(item.children);

    if (hasChildren) {
      return (
        <div className="mb-1">
          <button
            onClick={() => toggleMenu(item.label)}
            className={`flex items-center justify-between w-full px-4 py-3 text-left rounded-lg transition-all duration-200 ${
              isActive || isExpanded
                ? "bg-blue-50/80 text-blue-700 shadow-sm"
                : "text-gray-700 hover:bg-white/50"
            }`}
            style={{ paddingLeft: `${1 + depth * 0.75}rem` }}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {isExpanded && (
            <div className="mt-1 space-y-1">
              {item.children.map((child, index) => (
                <SidebarItem key={index} item={child} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="mb-1">
        <Link
          href={item.href}
          onClick={onClose}
          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
            isActive
              ? "bg-blue-50/80 text-blue-700 shadow-sm border-l-4 border-blue-500"
              : "text-gray-700 hover:bg-white/50"
          }`}
          style={{ paddingLeft: `${1 + depth * 0.75}rem` }}
        >
          {depth === 0 && <item.icon className="w-5 h-5" />}
          {depth > 0 && (
            <div className="w-5 h-5 flex items-center justify-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
          )}
          <span className="font-medium">{item.label}</span>
        </Link>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 glass-effect border-r border-gray-200/30 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:fixed ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-gray-200/30">
            <div className="flex items-center space-x-3">
              <Image
                src={"/logo.png"}
                alt="logo sman 1 pabedilan"
                width={40}
                height={40}
              />
              <div>
                <h2 className="text-lg font-bold text-gradient">
                  SMAN 1 PABEDILAN
                </h2>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role?.toLowerCase() || userRole} Panel
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="space-y-2">
              {menuItems.map((item, index) => (
                <SidebarItem key={index} item={item} />
              ))}
            </div>
          </nav>

          {/* Bottom Section - User Info */}
          <div className="p-4 border-t border-gray-200/30">
            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {getUserInitials()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {getUserEmail()}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        user?.isActive !== false
                          ? "bg-green-500"
                          : "bg-gray-400"
                      }`}
                    ></div>
                    <p className={`text-xs ${getStatusColor()}`}>
                      {getUserStatus()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
