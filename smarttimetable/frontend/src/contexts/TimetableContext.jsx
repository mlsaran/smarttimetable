import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  fetchTimetables, 
  fetchTimetable, 
  generateTimetable,
  sendTimetableForApproval,
  approveTimetable,
  exportTimetablePdf,
  exportTimetableCsv
} from '../services/api';

const TimetableContext = createContext(null);

export const TimetableProvider = ({ children }) => {
  const [timetables, setTimetables] = useState([]);
  const [activeTimetable, setActiveTimetable] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { token, user } = useAuth();

  // Function to load all timetables (optionally filtered by status)
  const loadTimetables = useCallback(async (status = null) => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTimetables(token, status);
      setTimetables(data);
    } catch (err) {
      console.error('Error loading timetables:', err);
      setError('Failed to load timetables');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load a specific timetable by ID
  const loadTimetable = useCallback(async (id) => {
    if (!token || !id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTimetable(token, id);
      setActiveTimetable(data);
      return data;
    } catch (err) {
      console.error(`Error loading timetable #${id}:`, err);
      setError(`Failed to load timetable #${id}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Generate new timetable variants
  const generateTimetableVariants = useCallback(async (numVariants = 3) => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await generateTimetable(token, numVariants);
      
      // Check if we received an error with suggestions
      if (data.error && data.suggestions) {
        setError(data.error);
        return { error: data.error, suggestions: data.suggestions };
      } else {
        setVariants(data);
        return data;
      }
    } catch (err) {
      console.error('Error generating timetable:', err);
      setError('Failed to generate timetable');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Send timetable for approval
  const requestApproval = useCallback(async (timetableId) => {
    if (!token || !timetableId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await sendTimetableForApproval(token, timetableId);
      
      // Refresh the timetables list
      setRefreshTrigger(prev => prev + 1);
      
      return data;
    } catch (err) {
      console.error(`Error sending timetable #${timetableId} for approval:`, err);
      setError(`Failed to send timetable #${timetableId} for approval`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Approve or reject a timetable
  const processTimetableApproval = useCallback(async (timetableId, approved, comment) => {
    if (!token || !timetableId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await approveTimetable(token, timetableId, approved, comment);
      
      // Refresh the timetables list
      setRefreshTrigger(prev => prev + 1);
      
      return data;
    } catch (err) {
      console.error(`Error ${approved ? 'approving' : 'rejecting'} timetable #${timetableId}:`, err);
      setError(`Failed to ${approved ? 'approve' : 'reject'} timetable #${timetableId}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Export timetable as PDF
  const exportPdf = useCallback(async (timetableId) => {
    if (!timetableId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await exportTimetablePdf(token, timetableId);
      return data;
    } catch (err) {
      console.error(`Error exporting timetable #${timetableId} as PDF:`, err);
      setError(`Failed to export timetable #${timetableId} as PDF`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Export timetable as CSV
  const exportCsv = useCallback(async (timetableId) => {
    if (!timetableId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await exportTimetableCsv(token, timetableId);
      return data;
    } catch (err) {
      console.error(`Error exporting timetable #${timetableId} as CSV:`, err);
      setError(`Failed to export timetable #${timetableId} as CSV`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Handle download from base64 data
  const downloadFile = useCallback((base64Data, filename, mimeType) => {
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
      setError('Failed to download file');
      return false;
    }
  }, []);

  // Clear active timetable
  const clearActiveTimetable = useCallback(() => {
    setActiveTimetable(null);
  }, []);

  // Clear generated variants
  const clearVariants = useCallback(() => {
    setVariants([]);
  }, []);

  // Load timetables when token changes or refresh is triggered
  useEffect(() => {
    if (token) {
      loadTimetables();
    }
  }, [token, refreshTrigger, loadTimetables]);

  // Provide filtered timetable lists based on user role and status
  const getPendingTimetables = useCallback(() => {
    return timetables.filter(t => t.status === 'pending');
  }, [timetables]);

  const getApprovedTimetables = useCallback(() => {
    return timetables.filter(t => t.status === 'approved');
  }, [timetables]);

  const getDraftTimetables = useCallback(() => {
    return timetables.filter(t => t.status === 'draft');
  }, [timetables]);

  // Context value
  const contextValue = {
    timetables,
    activeTimetable,
    variants,
    loading,
    error,
    loadTimetables,
    loadTimetable,
    generateTimetableVariants,
    requestApproval,
    processTimetableApproval,
    exportPdf,
    exportCsv,
    downloadFile,
    clearActiveTimetable,
    clearVariants,
    getPendingTimetables,
    getApprovedTimetables,
    getDraftTimetables,
    refresh: () => setRefreshTrigger(prev => prev + 1)
  };

  return (
    <TimetableContext.Provider value={contextValue}>
      {children}
    </TimetableContext.Provider>
  );
};

// Custom hook for using the timetable context
export const useTimetable = () => {
  const context = useContext(TimetableContext);
  
  if (!context) {
    throw new Error('useTimetable must be used within a TimetableProvider');
  }
  
  return context;
};

export default TimetableContext;
