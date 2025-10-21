// utils/enum.js

// Role Enum Utils
export const Role = {
  STUDENT: "STUDENT",
  TEACHER: "TEACHER",
  ADMIN: "ADMIN",
};

export const RoleUtils = {
  // Get all role values
  getAll: () => Object.values(Role),

  // Get role display name (Indonesian)
  getDisplayName: (role) => {
    const roleNames = {
      [Role.STUDENT]: "Siswa",
      [Role.TEACHER]: "Guru",
      [Role.ADMIN]: "Admin",
    };
    return roleNames[role] || role;
  },

  // Get role color for UI
  getColor: (role) => {
    const colors = {
      [Role.STUDENT]: "bg-blue-100 text-blue-800",
      [Role.TEACHER]: "bg-green-100 text-green-800",
      [Role.ADMIN]: "bg-purple-100 text-purple-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  },

  // Check if role is valid
  isValid: (role) => Object.values(Role).includes(role),

  // Get role options for select input
  getOptions: () =>
    Object.values(Role).map((role) => ({
      value: role,
      label: RoleUtils.getDisplayName(role),
    })),
};

// AttendanceStatus Enum Utils
export const AttendanceStatus = {
  HADIR: "HADIR",
  IZIN: "IZIN",
  SAKIT: "SAKIT",
  ALPHA: "ALPHA",
};

export const AttendanceStatusUtils = {
  // Get all attendance status values
  getAll: () => Object.values(AttendanceStatus),

  // Get status display name (Indonesian)
  getDisplayName: (status) => {
    const statusNames = {
      [AttendanceStatus.HADIR]: "Hadir",
      [AttendanceStatus.IZIN]: "Izin",
      [AttendanceStatus.SAKIT]: "Sakit",
      [AttendanceStatus.ALPHA]: "Alpha",
    };
    return statusNames[status] || status;
  },

  // Get status color for UI
  getColor: (status) => {
    const colors = {
      [AttendanceStatus.HADIR]: "bg-green-100 text-green-800",
      [AttendanceStatus.IZIN]: "bg-yellow-100 text-yellow-800",
      [AttendanceStatus.SAKIT]: "bg-blue-100 text-blue-800",
      [AttendanceStatus.ALPHA]: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  },

  // Get status icon
  getIcon: (status) => {
    const icons = {
      [AttendanceStatus.HADIR]: "✓",
      [AttendanceStatus.IZIN]: "⚠",
      [AttendanceStatus.SAKIT]: "🏥",
      [AttendanceStatus.ALPHA]: "✗",
    };
    return icons[status] || "?";
  },

  // Check if status is valid
  isValid: (status) => Object.values(AttendanceStatus).includes(status),

  // Get status options for select input
  getOptions: () =>
    Object.values(AttendanceStatus).map((status) => ({
      value: status,
      label: AttendanceStatusUtils.getDisplayName(status),
      icon: AttendanceStatusUtils.getIcon(status),
    })),

  // Check if status counts as present (for statistics)
  isPresent: (status) => status === AttendanceStatus.HADIR,

  // Check if status is excused absence
  isExcused: (status) =>
    [AttendanceStatus.IZIN, AttendanceStatus.SAKIT].includes(status),

  // Check if status is unexcused absence
  isUnexcused: (status) => status === AttendanceStatus.ALPHA,
};

// ScoreType Enum Utils
export const ScoreType = {
  UTS: "UTS",
  UAS: "UAS",
  TUGAS: "TUGAS",
};

export const ScoreTypeUtils = {
  // Get all score type values
  getAll: () => Object.values(ScoreType),

  // Get score type display name (Indonesian)
  getDisplayName: (type) => {
    const typeNames = {
      [ScoreType.UTS]: "Ujian Tengah Semester",
      [ScoreType.UAS]: "Ujian Akhir Semester",
      [ScoreType.TUGAS]: "Tugas",
    };
    return typeNames[type] || type;
  },

  // Get short display name
  getShortName: (type) => {
    const shortNames = {
      [ScoreType.UTS]: "UTS",
      [ScoreType.UAS]: "UAS",
      [ScoreType.TUGAS]: "Tugas",
    };
    return shortNames[type] || type;
  },

  // Get score type color for UI
  getColor: (type) => {
    const colors = {
      [ScoreType.UTS]: "bg-orange-100 text-orange-800",
      [ScoreType.UAS]: "bg-red-100 text-red-800",
      [ScoreType.TUGAS]: "bg-blue-100 text-blue-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  },

  // Get score type weight (for calculating final grade)
  getWeight: (type) => {
    const weights = {
      [ScoreType.UTS]: 0.3,
      [ScoreType.UAS]: 0.4,
      [ScoreType.TUGAS]: 0.3,
    };
    return weights[type] || 0;
  },

  // Check if score type is valid
  isValid: (type) => Object.values(ScoreType).includes(type),

  // Get score type options for select input
  getOptions: () =>
    Object.values(ScoreType).map((type) => ({
      value: type,
      label: ScoreTypeUtils.getDisplayName(type),
      shortLabel: ScoreTypeUtils.getShortName(type),
      weight: ScoreTypeUtils.getWeight(type),
    })),
};

// Weekday Enum Utils
export const Weekday = {
  SENIN: "SENIN",
  SELASA: "SELASA",
  RABU: "RABU",
  KAMIS: "KAMIS",
  JUMAT: "JUMAT",
  SABTU: "SABTU",
};

export const WeekdayUtils = {
  // Get all weekday values
  getAll: () => Object.values(Weekday),

  // Get weekday display name (Indonesian)
  getDisplayName: (day) => {
    const dayNames = {
      [Weekday.SENIN]: "Senin",
      [Weekday.SELASA]: "Selasa",
      [Weekday.RABU]: "Rabu",
      [Weekday.KAMIS]: "Kamis",
      [Weekday.JUMAT]: "Jumat",
      [Weekday.SABTU]: "Sabtu",
    };
    return dayNames[day] || day;
  },

  // Get weekday short name
  getShortName: (day) => {
    const shortNames = {
      [Weekday.SENIN]: "Sen",
      [Weekday.SELASA]: "Sel",
      [Weekday.RABU]: "Rab",
      [Weekday.KAMIS]: "Kam",
      [Weekday.JUMAT]: "Jum",
      [Weekday.SABTU]: "Sab",
    };
    return shortNames[day] || day;
  },

  // Get weekday number (0 = Sunday, 1 = Monday, etc.)
  getDayNumber: (day) => {
    const dayNumbers = {
      [Weekday.SENIN]: 1,
      [Weekday.SELASA]: 2,
      [Weekday.RABU]: 3,
      [Weekday.KAMIS]: 4,
      [Weekday.JUMAT]: 5,
      [Weekday.SABTU]: 6,
    };
    return dayNumbers[day];
  },

  // Get weekday from JavaScript Date object
  fromDate: (date) => {
    const jsDay = date.getDay();
    const dayMap = {
      1: Weekday.SENIN,
      2: Weekday.SELASA,
      3: Weekday.RABU,
      4: Weekday.KAMIS,
      5: Weekday.JUMAT,
      6: Weekday.SABTU,
    };
    return dayMap[jsDay];
  },

  // Get today's weekday
  getToday: () => {
    const today = new Date();
    return WeekdayUtils.fromDate(today);
  },

  // Check if weekday is valid
  isValid: (day) => Object.values(Weekday).includes(day),

  // Get weekday options for select input
  getOptions: () =>
    Object.values(Weekday).map((day) => ({
      value: day,
      label: WeekdayUtils.getDisplayName(day),
      shortLabel: WeekdayUtils.getShortName(day),
      dayNumber: WeekdayUtils.getDayNumber(day),
    })),

  // Get ordered weekdays (Monday first)
  getOrderedDays: () => [
    Weekday.SENIN,
    Weekday.SELASA,
    Weekday.RABU,
    Weekday.KAMIS,
    Weekday.JUMAT,
    Weekday.SABTU,
  ],
};

// Gender Enum Utils
export const Gender = {
  LAKI_LAKI: "LAKI_LAKI",
  PEREMPUAN: "PEREMPUAN",
};

export const GenderUtils = {
  // Get all gender values
  getAll: () => Object.values(Gender),

  // Get gender display name (Indonesian)
  getDisplayName: (gender) => {
    const genderNames = {
      [Gender.LAKI_LAKI]: "Laki-laki",
      [Gender.PEREMPUAN]: "Perempuan",
    };
    return genderNames[gender] || gender;
  },

  // Get gender short name
  getShortName: (gender) => {
    const shortNames = {
      [Gender.LAKI_LAKI]: "L",
      [Gender.PEREMPUAN]: "P",
    };
    return shortNames[gender] || gender;
  },

  // Get gender color for UI
  getColor: (gender) => {
    const colors = {
      [Gender.LAKI_LAKI]: "bg-blue-100 text-blue-800",
      [Gender.PEREMPUAN]: "bg-pink-100 text-pink-800",
    };
    return colors[gender] || "bg-gray-100 text-gray-800";
  },

  // Get gender icon
  getIcon: (gender) => {
    const icons = {
      [Gender.LAKI_LAKI]: "♂",
      [Gender.PEREMPUAN]: "♀",
    };
    return icons[gender] || "?";
  },

  // Check if gender is valid
  isValid: (gender) => Object.values(Gender).includes(gender),

  // Get gender options for select input
  getOptions: () =>
    Object.values(Gender).map((gender) => ({
      value: gender,
      label: GenderUtils.getDisplayName(gender),
      shortLabel: GenderUtils.getShortName(gender),
      icon: GenderUtils.getIcon(gender),
    })),
};

// Utility functions for working with multiple enums
export const EnumUtils = {
  // Validate if a value belongs to a specific enum
  validateEnum: (value, enumObject) => {
    return Object.values(enumObject).includes(value);
  },

  // Get enum key from value
  getEnumKey: (value, enumObject) => {
    return Object.keys(enumObject).find((key) => enumObject[key] === value);
  },

  // Convert enum to array of options
  enumToOptions: (enumObject, utilsObject) => {
    return Object.values(enumObject).map((value) => ({
      value,
      label: utilsObject?.getDisplayName?.(value) || value,
    }));
  },
};

// Export all for easy importing
export default {
  Role,
  RoleUtils,
  AttendanceStatus,
  AttendanceStatusUtils,
  ScoreType,
  ScoreTypeUtils,
  Weekday,
  WeekdayUtils,
  Gender,
  GenderUtils,
  EnumUtils,
};
