// src/components/layout/Navbar.js
import React, { useState } from "react";
import { Bell, Search, User, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const Navbar = ({ userRole = "admin", onMenuToggle, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const notifications = [
    {
      id: 1,
      message: "New student registration pending",
      time: "5 min ago",
      unread: true,
    },
    {
      id: 2,
      message: "System maintenance scheduled",
      time: "1 hour ago",
      unread: false,
    },
    {
      id: 3,
      message: "Grade submission deadline tomorrow",
      time: "2 hours ago",
      unread: true,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleLogout = async () => {
    await logout();
    router.push("/auth/admin/login");
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

  return (
    <nav className="glass-effect border-b border-gray-200/30 px-4 py-3 relative z-50">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-blue-50/50 transition-colors lg:hidden text-gray-700"
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-gradient">
              {userRole === "admin" ? "Admin Dashboard" : "Teacher Portal"}
            </h1>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Mobile Search Button */}
          <button className="p-2 rounded-lg hover:bg-blue-50/50 transition-colors md:hidden text-gray-700">
            <Search className="w-5 h-5" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-blue-50/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue">
                <span className="text-xs font-bold text-white">
                  {getUserInitials()}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-gray-600">{getUserEmail()}</p>
              </div>
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 card">
                {/* User Info Section */}
                <div className="p-4 border-b border-gray-200/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue">
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
                      <p className="text-xs text-blue-600 capitalize font-medium mt-1">
                        {user?.role?.toLowerCase() || userRole}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <hr className="my-2 border-gray-200/30" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full p-2 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden mt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search..."
            className="input-field pl-10 w-full"
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
