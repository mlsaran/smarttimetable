/**
 * Helper functions for SmartTimetable application
 */

import { COLORS, DAY_NAMES, PERIOD_TIMES } from './constants';

/**
 * Format a date for display
 * @param {string|Date} dateInput - Date to format
 * @param {boolean} includeTime - Whether to include time in the output
 * @returns {string} Formatted date string
 */
export const formatDate = (dateInput, includeTime = true) => {
  if (!dateInput) return 'N/A';
  
  const date = new Date(dateInput);
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return date.toLocaleString(undefined, options);
};

/**
 * Get a color for a batch based on its name (consistent hashing)
 * @param {string} batchName - The name of the batch
 * @returns {string} A hex color code
 */
export const getColorForBatch = (batchName) => {
  if (!batchName) return COLORS.PRIMARY;
  
  // Simple hash function
  const hash = batchName.split('').reduce(
    (acc, char) => char.charCodeAt(0) + acc, 0
  );
  
  // Get a color from the palette
  return COLORS.BATCH_COLORS[hash % COLORS.BATCH_COLORS.length];
};

/**
 * Convert day number to day name
 * @param {number} dayNumber - Day number (0-5 for Monday-Saturday)
 * @returns {string} Day name
 */
export const getDayName = (dayNumber) => {
  return DAY_NAMES[dayNumber] || `Day ${dayNumber}`;
};

/**
 * Get formatted time for a period
 * @param {number} periodNumber - Period number (1-8)
 * @param {boolean} returnRange - Whether to return the full range or just start time
 * @returns {string} Formatted time (e.g., "08:00" or "08:00-09:00")
 */
export const getPeriodTime = (periodNumber, returnRange = false) => {
  const period = PERIOD_TIMES.find(p => p.period === periodNumber);
  if (!period) return `Period ${periodNumber}`;
  
  return returnRange ? `${period.start}-${period.end}` : period.start;
};

/**
 * Generate a calendar event object for FullCalendar from period data
 * @param {Object} period - Period data from API
 * @returns {Object} Event object for FullCalendar
 */
export const periodToCalendarEvent = (period) => {
  if (!period) return null;
  
  // Map day number to day of week (0 = Sunday in FullCalendar)
  const dayMap = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const day = dayMap[period.day] || 'mon';

  // Map period number to time
  const periodTime = PERIOD_TIMES.find(p => p.period === period.period_no) || { start: '08:00', end: '09:00' };
  
  return {
    id: period.id,
    title: `${period.subject.code} - ${period.faculty.name}`,
    daysOfWeek: [dayMap.indexOf(day)],
    startTime: periodTime.start + ':00',
    endTime: periodTime.end + ':00',
    extendedProps: {
      batch: period.batch.name,
      subject: period.subject.name,
      faculty: period.faculty.name,
      room: period.room.name,
    },
    backgroundColor: getColorForBatch(period.batch.name)
  };
};

/**
 * Create a downloadable file from base64 data
 * @param {string} base64Data - Base64 encoded file data
 * @param {string} filename - Name for the downloaded file
 * @param {string} mimeType - MIME type of the file
 * @returns {boolean} Success status
 */
export const downloadBase64File = (base64Data, filename, mimeType) => {
  try {
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArrays.push(byteCharacters.charCodeAt(i));
    }
    
    const blob = new Blob([new Uint8Array(byteArrays)], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (err) {
    console.error('Error downloading file:', err);
    return false;
  }
};

/**
 * Check if a value is empty (null, undefined, empty string or empty array)
 * @param {*} value - Value to check
 * @returns {boolean} True if empty, false otherwise
 */
export const isEmpty = (value) => {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  );
};

/**
 * Truncate a string to a maximum length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string with ellipsis if needed
 */
export const truncate = (str, maxLength = 30) => {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};

/**
 * Deep copy an object
 * @param {Object} obj - Object to copy
 * @returns {Object} Deep copy of the object
 */
export const deepCopy = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Group an array of objects by a specific key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} Grouped object
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

/**
 * Calculate the difference between two dates in days
 * @param {Date|string} date1 - First date
 * @param {Date|string} date2 - Second date
 * @returns {number} Difference in days
 */
export const daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if a timetable is editable based on status
 * @param {Object} timetable - Timetable object
 * @returns {boolean} True if editable, false otherwise
 */
export const isTimetableEditable = (timetable) => {
  return timetable && timetable.status === 'draft';
};

/**
 * Create a shareable URL for a public timetable
 * @param {string} publicUrl - Public URL path for the timetable
 * @returns {string} Full shareable URL
 */
export const createShareableUrl = (publicUrl) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/public/${publicUrl}`;
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

/**
 * Convert first letter of each word to uppercase
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const toTitleCase = (str) => {
  if (!str) return '';
  return str.replace(
    /\w\S*/g,
    txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Extract error message from API error response
 * @param {Error} error - Error object
 * @returns {string} Error message
 */
export const getErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';
  
  if (error.message) return error.message;
  
  if (error.response) {
    const { data } = error.response;
    if (data.detail) return data.detail;
    if (data.message) return data.message;
    if (typeof data === 'string') return data;
  }
  
  return 'An error occurred while communicating with the server';
};

export default {
  formatDate,
  getColorForBatch,
  getDayName,
  getPeriodTime,
  periodToCalendarEvent,
  downloadBase64File,
  isEmpty,
  truncate,
  deepCopy,
  groupBy,
  daysBetween,
  isTimetableEditable,
  createShareableUrl,
  isValidEmail,
  toTitleCase,
  getErrorMessage
};
