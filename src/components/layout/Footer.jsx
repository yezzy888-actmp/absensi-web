// src/components/layout/Footer.js
import React from "react";
import { Heart, ExternalLink, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Footer = ({ userRole = "admin" }) => {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  // Get user email
  const getUserEmail = () => {
    return user?.email || "user@example.com";
  };

  // Get user ID for display
  const getUserId = () => {
    return user?.id || "N/A";
  };

  // Get last login info (if available)
  const getLastLogin = () => {
    if (user?.lastLogin) {
      return new Date(user.lastLogin).toLocaleString();
    }
    return "Just now";
  };

  return (
    <footer className="border-t border-gray-200/30 bg-white/50 backdrop-blur-sm mt-auto">
      <div className="px-6 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          {/* Left Section - Copyright */}
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <span>© {currentYear} SMAN 1 PABEDILAN.</span>
          </div>

          {/* Right Section - Links */}
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-1 text-gray-500">
              <span>v1.1.0</span>
            </div>
          </div>
        </div>

        {/* User Session Info */}
        <div className="mt-3 pt-3 border-t border-gray-200/30">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-3 h-3" />
              </div>
              <span className="hidden sm:inline">•</span>
              <span className="text-gray-600">{getUserEmail()}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>
                User ID: <span className="font-medium">{getUserId()}</span>
              </span>
              <span>
                Last Login:{" "}
                <span className="font-medium">{getLastLogin()}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
