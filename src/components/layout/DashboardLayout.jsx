// src/components/layout/DashboardLayout.jsx
"use client";

import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

const DashboardLayout = ({ children, userRole = "admin" }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(false); // Close sidebar on desktop
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen gradient-bg flex">
      {/* Sidebar */}
      <Sidebar
        userRole={userRole}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      {/* Main Content Area - akan auto adjust dengan margin left di desktop */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Navbar */}
        <Navbar
          userRole={userRole}
          onMenuToggle={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Main Content - dengan scroll terpisah */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </main>

        {/* Footer */}
        <Footer userRole={userRole} />
      </div>

      {/* Overlay untuk mobile ketika sidebar terbuka */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-blue-900/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default DashboardLayout;
