import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
const authRequest = (token) => {
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

// Room API
export const fetchRooms = async (token) => {
  const response = await api.get('/rooms/', authRequest(token));
  return response.data;
};

export const createRoom = async (token, roomData) => {
  const response = await api.post('/rooms/', roomData, authRequest(token));
  return response.data;
};

export const updateRoom = async (token, id, roomData) => {
  const response = await api.put(`/rooms/${id}`, roomData, authRequest(token));
  return response.data;
};

export const deleteRoom = async (token, id) => {
  const response = await api.delete(`/rooms/${id}`, authRequest(token));
  return response.data;
};

// Faculty API
export const fetchFaculty = async (token) => {
  const response = await api.get('/faculty/', authRequest(token));
  return response.data;
};

export const createFaculty = async (token, facultyData) => {
  const response = await api.post('/faculty/', facultyData, authRequest(token));
  return response.data;
};

export const updateFaculty = async (token, id, facultyData) => {
  const response = await api.put(`/faculty/${id}`, facultyData, authRequest(token));
  return response.data;
};

export const deleteFaculty = async (token, id) => {
  const response = await api.delete(`/faculty/${id}`, authRequest(token));
  return response.data;
};

// Batches API
export const fetchBatches = async (token) => {
  const response = await api.get('/batches/', authRequest(token));
  return response.data;
};

export const createBatch = async (token, batchData) => {
  const response = await api.post('/batches/', batchData, authRequest(token));
  return response.data;
};

export const updateBatch = async (token, id, batchData) => {
  const response = await api.put(`/batches/${id}`, batchData, authRequest(token));
  return response.data;
};

export const deleteBatch = async (token, id) => {
  const response = await api.delete(`/batches/${id}`, authRequest(token));
  return response.data;
};

// Subjects API
export const fetchSubjects = async (token) => {
  const response = await api.get('/subjects/', authRequest(token));
  return response.data;
};

export const createSubject = async (token, subjectData) => {
  const response = await api.post('/subjects/', subjectData, authRequest(token));
  return response.data;
};

export const updateSubject = async (token, id, subjectData) => {
  const response = await api.put(`/subjects/${id}`, subjectData, authRequest(token));
  return response.data;
};

export const deleteSubject = async (token, id) => {
  const response = await api.delete(`/subjects/${id}`, authRequest(token));
  return response.data;
};

// Fixed Slots API
export const fetchFixedSlots = async (token) => {
  const response = await api.get('/fixed-slots/', authRequest(token));
  return response.data;
};

export const createFixedSlot = async (token, slotData) => {
  const response = await api.post('/fixed-slots/', slotData, authRequest(token));
  return response.data;
};

export const updateFixedSlot = async (token, id, slotData) => {
  const response = await api.put(`/fixed-slots/${id}`, slotData, authRequest(token));
  return response.data;
};

export const deleteFixedSlot = async (token, id) => {
  const response = await api.delete(`/fixed-slots/${id}`, authRequest(token));
  return response.data;
};

// Timetable API
export const generateTimetable = async (token, numVariants = 3) => {
  const response = await api.post('/timetables/generate/', { num_variants: numVariants }, authRequest(token));
  return response.data;
};

export const fetchTimetables = async (token, status = null) => {
  const params = status ? { status } : {};
  const response = await api.get('/timetables/', { 
    ...authRequest(token),
    params
  });
  return response.data;
};

export const fetchTimetable = async (token, id) => {
  const response = await api.get(`/timetables/${id}/`, authRequest(token));
  return response.data;
};

export const sendTimetableForApproval = async (token, id) => {
  const response = await api.post(`/timetables/${id}/send-for-approval/`, {}, authRequest(token));
  return response.data;
};

export const approveTimetable = async (token, id, approved, comment) => {
  const response = await api.post(`/timetables/${id}/approve/`, {
    approved,
    comment
  }, authRequest(token));
  return response.data;
};

export const exportTimetablePdf = async (token, id) => {
  const response = await api.get(`/timetables/${id}/pdf/`, authRequest(token));
  return response.data;
};

export const exportTimetableCsv = async (token, id) => {
  const response = await api.get(`/timetables/${id}/csv/`, authRequest(token));
  return response.data;
};

export const fetchPublicTimetable = async (publicUrl) => {
  const response = await api.get(`/timetables/public/${publicUrl}/`);
  return response.data;
};

// Error handler middleware
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = 
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'Unknown error occurred';
      
    const enhancedError = new Error(message);
    enhancedError.statusCode = error.response?.status;
    enhancedError.originalError = error;
    
    return Promise.reject(enhancedError);
  }
);

export default api;
