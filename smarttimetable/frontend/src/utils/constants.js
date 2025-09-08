/**
 * Application-wide constants for SmartTimetable
 */

// API Endpoints (relative paths)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login/',
    VERIFY_OTP: '/auth/verify-otp/',
    ME: '/auth/me/'
  },
  ROOMS: {
    BASE: '/rooms/',
    DETAIL: (id) => `/rooms/${id}`
  },
  FACULTY: {
    BASE: '/faculty/',
    DETAIL: (id) => `/faculty/${id}`
  },
  BATCHES: {
    BASE: '/batches/',
    DETAIL: (id) => `/batches/${id}`
  },
  SUBJECTS: {
    BASE: '/subjects/',
    DETAIL: (id) => `/subjects/${id}`
  },
  FIXED_SLOTS: {
    BASE: '/fixed-slots/',
    DETAIL: (id) => `/fixed-slots/${id}`
  },
  TIMETABLES: {
    BASE: '/timetables/',
    DETAIL: (id) => `/timetables/${id}/`,
    GENERATE: '/timetables/generate/',
    SEND_FOR_APPROVAL: (id) => `/timetables/${id}/send-for-approval/`,
    APPROVE: (id) => `/timetables/${id}/approve/`,
    EXPORT_PDF: (id) => `/timetables/${id}/pdf/`,
    EXPORT_CSV: (id) => `/timetables/${id}/csv/`,
    PUBLIC: (publicUrl) => `/timetables/public/${publicUrl}/`
  }
};

// User Roles
export const USER_ROLES = {
  SCHEDULER: 'scheduler',
  APPROVER: 'approver',
  READONLY: 'readonly'
};

// Timetable Statuses
export const TIMETABLE_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved'
};

// Room Types
export const ROOM_TYPES = {
  LECTURE: 'lecture',
  LAB: 'lab'
};

// Subject Types
export const SUBJECT_TYPES = {
  LECTURE: 'lecture',
  LAB: 'lab'
};

// Day Names
export const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

// Period Times (for display)
export const PERIOD_TIMES = [
  { period: 1, start: '08:00', end: '09:00' },
  { period: 2, start: '09:00', end: '10:00' },
  { period: 3, start: '10:00', end: '11:00' },
  { period: 4, start: '11:00', end: '12:00' },
  { period: 5, start: '12:00', end: '13:00' },
  { period: 6, start: '13:00', end: '14:00' },
  { period: 7, start: '14:00', end: '15:00' },
  { period: 8, start: '15:00', end: '16:00' }
];

// Color palette for timetable visualization
export const COLORS = {
  PRIMARY: '#4285F4',  // Google Blue
  SECONDARY: '#34A853', // Google Green
  WARNING: '#FBBC05',   // Google Yellow
  DANGER: '#EA4335',    // Google Red
  INFO: '#5f6368',      // Google Gray
  
  // Additional colors for batch visualization
  BATCH_COLORS: [
    '#4285F4', // Blue
    '#EA4335', // Red
    '#FBBC05', // Yellow
    '#34A853', // Green
    '#3498db', // Dodger Blue
    '#e74c3c', // Alizarin
    '#2ecc71', // Emerald
    '#f39c12', // Orange
    '#9b59b6', // Amethyst
    '#1abc9c', // Turquoise
    '#d35400', // Pumpkin
    '#c0392b'  // Pomegranate
  ]
};

// Default pagination settings
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  USER_DATA: 'user_data',
  THEME_PREFERENCE: 'theme_preference',
  LAST_VISITED: 'last_visited'
};

// Form validation constants
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 100,
  MAX_CODE_LENGTH: 10,
  MAX_BATCH_SIZE: 500,
  MIN_PERIODS_PER_SUBJECT: 1,
  MAX_PERIODS_PER_SUBJECT: 10
};

// Export constants as a group for convenience
export default {
  API_ENDPOINTS,
  USER_ROLES,
  TIMETABLE_STATUS,
  ROOM_TYPES,
  SUBJECT_TYPES,
  DAY_NAMES,
  PERIOD_TIMES,
  COLORS,
  PAGINATION,
  STORAGE_KEYS,
  VALIDATION
};
