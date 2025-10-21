// src/lib/utils.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date, options = {}) {
  if (!date) return "-";

  const defaultOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  };

  return new Date(date).toLocaleDateString("id-ID", defaultOptions);
}

export function formatTime(time) {
  if (!time) return "-";

  return new Date(`1970-01-01T${time}`).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(datetime) {
  if (!datetime) return "-";

  return new Date(datetime).toLocaleString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getInitials(name) {
  if (!name) return "";

  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substr(0, maxLength) + "...";
}

export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function getAttendanceStatusColor(status) {
  const colors = {
    HADIR: "bg-green-100 text-green-800 border-green-200",
    IZIN: "bg-yellow-100 text-yellow-800 border-yellow-200",
    SAKIT: "bg-blue-100 text-blue-800 border-blue-200",
    ALPHA: "bg-red-100 text-red-800 border-red-200",
  };
  return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
}

export function getRoleColor(role) {
  const colors = {
    ADMIN: "bg-purple-100 text-purple-800 border-purple-200",
    TEACHER: "bg-blue-100 text-blue-800 border-blue-200",
    STUDENT: "bg-green-100 text-green-800 border-green-200",
  };
  return colors[role] || "bg-gray-100 text-gray-800 border-gray-200";
}

export function getScoreTypeColor(type) {
  const colors = {
    UTS: "bg-orange-100 text-orange-800 border-orange-200",
    UAS: "bg-red-100 text-red-800 border-red-200",
    TUGAS: "bg-indigo-100 text-indigo-800 border-indigo-200",
  };
  return colors[type] || "bg-gray-100 text-gray-800 border-gray-200";
}

export function calculateAttendancePercentage(attended, total) {
  if (total === 0) return 0;
  return Math.round((attended / total) * 100);
}

export function getGradeFromScore(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "E";
}

export function sortByDate(items, dateField = "createdAt", order = "desc") {
  return [...items].sort((a, b) => {
    const dateA = new Date(a[dateField]);
    const dateB = new Date(b[dateField]);

    if (order === "desc") {
      return dateB - dateA;
    }
    return dateA - dateB;
  });
}

export function groupBy(items, key) {
  return items.reduce((groups, item) => {
    const group = item[key];
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {});
}

export function downloadCSV(data, filename = "export.csv") {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((header) => JSON.stringify(row[header] || "")).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateQRData(sessionId, token) {
  return JSON.stringify({
    sessionId,
    token,
    timestamp: Date.now(),
  });
}

export function parseQRData(qrString) {
  try {
    return JSON.parse(qrString);
  } catch (error) {
    return null;
  }
}

export function isTokenExpired(expiresAt) {
  if (!expiresAt) return true;
  return new Date() > new Date(expiresAt);
}

export function getWeekdayName(day) {
  const days = {
    SENIN: "Senin",
    SELASA: "Selasa",
    RABU: "Rabu",
    KAMIS: "Kamis",
    JUMAT: "Jumat",
    SABTU: "Sabtu",
  };
  return days[day] || day;
}

export function getCurrentWeekday() {
  const days = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];
  return days[new Date().getDay()];
}

export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function validateNIS(nis) {
  const nisRegex = /^\d{8,10}$/;
  return nisRegex.test(nis);
}
