// src/lib/validations.js

/**
 * Email validation
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Password validation
 */
export const validatePassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Required field validation
 */
export const validateRequired = (value) => {
  return (
    value !== null && value !== undefined && value.toString().trim() !== ""
  );
};

/**
 * NIS (Student ID) validation
 */
export const validateNIS = (nis) => {
  const nisRegex = /^[0-9]{8,12}$/;
  return nisRegex.test(nis);
};

/**
 * Phone number validation
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
  return phoneRegex.test(phone);
};

/**
 * Time format validation (HH:MM)
 */
export const validateTime = (time) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Auth form validations
 */
export const authValidations = {
  login: (data) => {
    const errors = {};

    if (!validateRequired(data.email)) {
      errors.email = "Email wajib diisi";
    } else if (!validateEmail(data.email)) {
      errors.email = "Format email tidak valid";
    }

    if (!validateRequired(data.password)) {
      errors.password = "Password wajib diisi";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  changePassword: (data) => {
    const errors = {};

    if (!validateRequired(data.currentPassword)) {
      errors.currentPassword = "Password saat ini wajib diisi";
    }

    if (!validateRequired(data.newPassword)) {
      errors.newPassword = "Password baru wajib diisi";
    } else if (!validatePassword(data.newPassword)) {
      errors.newPassword = "Password baru minimal 6 karakter";
    }

    if (data.newPassword !== data.confirmPassword) {
      errors.confirmPassword = "Konfirmasi password tidak cocok";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

/**
 * Student form validations
 */
export const studentValidations = {
  create: (data) => {
    const errors = {};

    if (!validateRequired(data.name)) {
      errors.name = "Nama siswa wajib diisi";
    }

    if (!validateRequired(data.email)) {
      errors.email = "Email wajib diisi";
    } else if (!validateEmail(data.email)) {
      errors.email = "Format email tidak valid";
    }

    if (!validateRequired(data.password)) {
      errors.password = "Password wajib diisi";
    } else if (!validatePassword(data.password)) {
      errors.password = "Password minimal 6 karakter";
    }

    if (!validateRequired(data.nis)) {
      errors.nis = "NIS wajib diisi";
    } else if (!validateNIS(data.nis)) {
      errors.nis = "Format NIS tidak valid (8-12 digit)";
    }

    if (!validateRequired(data.gender)) {
      errors.gender = "Jenis kelamin wajib dipilih";
    }

    if (!validateRequired(data.classId)) {
      errors.classId = "Kelas wajib dipilih";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  update: (data) => {
    const errors = {};

    if (!validateRequired(data.name)) {
      errors.name = "Nama siswa wajib diisi";
    }

    if (!validateRequired(data.nis)) {
      errors.nis = "NIS wajib diisi";
    } else if (!validateNIS(data.nis)) {
      errors.nis = "Format NIS tidak valid (8-12 digit)";
    }

    if (!validateRequired(data.gender)) {
      errors.gender = "Jenis kelamin wajib dipilih";
    }

    if (!validateRequired(data.classId)) {
      errors.classId = "Kelas wajib dipilih";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

/**
 * Teacher form validations
 */
export const teacherValidations = {
  create: (data) => {
    const errors = {};

    if (!validateRequired(data.name)) {
      errors.name = "Nama guru wajib diisi";
    }

    if (!validateRequired(data.email)) {
      errors.email = "Email wajib diisi";
    } else if (!validateEmail(data.email)) {
      errors.email = "Format email tidak valid";
    }

    if (!validateRequired(data.password)) {
      errors.password = "Password wajib diisi";
    } else if (!validatePassword(data.password)) {
      errors.password = "Password minimal 6 karakter";
    }

    if (!validateRequired(data.gender)) {
      errors.gender = "Jenis kelamin wajib dipilih";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  update: (data) => {
    const errors = {};

    if (!validateRequired(data.name)) {
      errors.name = "Nama guru wajib diisi";
    }

    if (!validateRequired(data.gender)) {
      errors.gender = "Jenis kelamin wajib dipilih";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

/**
 * Class form validations
 */
export const classValidations = {
  create: (data) => {
    const errors = {};

    if (!validateRequired(data.name)) {
      errors.name = "Nama kelas wajib diisi";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

/**
 * Subject form validations
 */
export const subjectValidations = {
  create: (data) => {
    const errors = {};

    if (!validateRequired(data.name)) {
      errors.name = "Nama mata pelajaran wajib diisi";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

/**
 * Schedule form validations
 */
export const scheduleValidations = {
  create: (data) => {
    const errors = {};

    if (!validateRequired(data.subjectId)) {
      errors.subjectId = "Mata pelajaran wajib dipilih";
    }

    if (!validateRequired(data.classId)) {
      errors.classId = "Kelas wajib dipilih";
    }

    if (!validateRequired(data.teacherId)) {
      errors.teacherId = "Guru wajib dipilih";
    }

    if (!validateRequired(data.day)) {
      errors.day = "Hari wajib dipilih";
    }

    if (!validateRequired(data.startTime)) {
      errors.startTime = "Jam mulai wajib diisi";
    } else if (!validateTime(data.startTime)) {
      errors.startTime = "Format jam mulai tidak valid (HH:MM)";
    }

    if (!validateRequired(data.endTime)) {
      errors.endTime = "Jam selesai wajib diisi";
    } else if (!validateTime(data.endTime)) {
      errors.endTime = "Format jam selesai tidak valid (HH:MM)";
    }

    // Validate time range
    if (
      data.startTime &&
      data.endTime &&
      validateTime(data.startTime) &&
      validateTime(data.endTime)
    ) {
      const start = new Date(`2000-01-01 ${data.startTime}`);
      const end = new Date(`2000-01-01 ${data.endTime}`);

      if (start >= end) {
        errors.endTime = "Jam selesai harus lebih besar dari jam mulai";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

/**
 * Score form validations
 */
export const scoreValidations = {
  create: (data) => {
    const errors = {};

    if (!validateRequired(data.studentId)) {
      errors.studentId = "Siswa wajib dipilih";
    }

    if (!validateRequired(data.subjectId)) {
      errors.subjectId = "Mata pelajaran wajib dipilih";
    }

    if (!validateRequired(data.type)) {
      errors.type = "Jenis nilai wajib dipilih";
    }

    if (!validateRequired(data.value)) {
      errors.value = "Nilai wajib diisi";
    } else {
      const score = parseFloat(data.value);
      if (isNaN(score) || score < 0 || score > 100) {
        errors.value = "Nilai harus berupa angka antara 0-100";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

/**
 * Attendance session validations
 */
export const attendanceSessionValidations = {
  create: (data) => {
    const errors = {};

    if (!validateRequired(data.scheduleId)) {
      errors.scheduleId = "Jadwal wajib dipilih";
    }

    if (!validateRequired(data.date)) {
      errors.date = "Tanggal wajib diisi";
    }

    if (!validateRequired(data.expiresAt)) {
      errors.expiresAt = "Waktu kadaluarsa wajib diisi";
    } else {
      const expireDate = new Date(data.expiresAt);
      const now = new Date();

      if (expireDate <= now) {
        errors.expiresAt = "Waktu kadaluarsa harus di masa depan";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

/**
 * Generic form validation helper
 */
export const validateForm = (data, validationRules) => {
  const errors = {};

  Object.keys(validationRules).forEach((field) => {
    const rules = validationRules[field];
    const value = data[field];

    rules.forEach((rule) => {
      if (rule.required && !validateRequired(value)) {
        errors[field] = rule.message || `${field} wajib diisi`;
        return;
      }

      if (rule.type === "email" && value && !validateEmail(value)) {
        errors[field] = rule.message || "Format email tidak valid";
        return;
      }

      if (rule.type === "password" && value && !validatePassword(value)) {
        errors[field] = rule.message || "Password minimal 6 karakter";
        return;
      }

      if (rule.minLength && value && value.length < rule.minLength) {
        errors[field] = rule.message || `Minimal ${rule.minLength} karakter`;
        return;
      }

      if (rule.maxLength && value && value.length > rule.maxLength) {
        errors[field] = rule.message || `Maksimal ${rule.maxLength} karakter`;
        return;
      }

      if (rule.pattern && value && !rule.pattern.test(value)) {
        errors[field] = rule.message || "Format tidak valid";
        return;
      }

      if (rule.custom && value) {
        const customResult = rule.custom(value, data);
        if (customResult !== true) {
          errors[field] = customResult || "Validasi gagal";
          return;
        }
      }
    });
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
