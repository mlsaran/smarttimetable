import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTimetable } from '../contexts/TimetableContext';
import ApprovalRequest from '../components/timetable/ApprovalRequest';
import TimetableViewer from '../components/timetable/TimetableViewer';

const Approval = ({ showApproved = false }) => {
  const { 
    loading, 
    error, 
    getPendingTimetables,
    getApprovedTimetables,
    loadTimetable,
    processTimetableApproval,
    refresh
  } = useTimetable();
  const [timetables, setTimetables] = useState([]);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [activeTab, setActiveTab] = useState(showApproved ? 'approved' : 'pending');
  const location = useLocation();
  const navigate = useNavigate();

  // Notification from location state
  const notification = location.state?.message ? {
    message: location.state.message,
    type: location.state.type || 'info'
  } : null;

  // Clear location state after showing notification
  useEffect(() => {
    if (location.state?.message) {
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  // Load timetables on mount and when activeTab changes
  useEffect(() => {
    refresh();
    setSelectedTimetable(null);
  }, [refresh, activeTab]);

  // Update timetables list based on activeTab
  useEffect(() => {
    if (activeTab === 'pending') {
      setTimetables(getPendingTimetables());
    } else {
      setTimetables(getApprovedTimetables());
    }
  }, [getPendingTimetables, getApprovedTimetables, activeTab]);

  const handleTimetableSelect = async (timetableId) => {
    const timetable = await loadTimetable(timetableId);
    setSelectedTimetable(timetable);
  };

  const handleApprovalComplete = () => {
    setSelectedTimetable(null);
    refresh();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {activeTab === 'pending' ? 'Pending Approvals' : 'Approved Timetables'}
      </h1>
      
      {notification && (
        <div className={`
          mb-6 p-4 rounded-md
          ${notification.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 
            notification.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 
            'bg-blue-50 text-blue-800 border-blue-200'}
        `}>
          {notification.message}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 mb-6 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'pending'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'approved'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Approved
            </button>
          </nav>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">
                {activeTab === 'pending' ? 'Pending Requests' : 'Approved Timetables'}
              </h3>
            </div>
            
            <div className="divide-y divide-gray-200 max-h-[calc(100vh-320px)] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Loading timetables...
                </div>
              ) : timetables.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {activeTab === 'pending' 
                    ? 'No pending approval requests.' 
                    : 'No approved timetables yet.'}
                </div>
              ) : (
                timetables.map(timetable => (
                  <div 
                    key={timetable.id}
                    onClick={() => handleTimetableSelect(timetable.id)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedTimetable?.id === timetable.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Timetable #{timetable.id}</h4>
                        <p className="text-sm text-gray-500">
                          Created: {formatDate(timetable.created_at)}
                        </p>
                        <p className="text-xs text-gray-500">
                          By: {timetable.creator?.email || 'Unknown'}
                        </p>
                      </div>
                      <div>
                        {activeTab === 'approved' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Approved
                          </span>
                        )}
                        {activeTab === 'pending' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          {selectedTimetable ? (
            activeTab === 'pending' ? (
              <ApprovalRequest 
                timetable={selectedTimetable} 
                onApproved={handleApprovalComplete}
                onRejected={handleApprovalComplete}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="border-b pb-4 mb-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">
                      Timetable #{selectedTimetable.id}
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Approved
                      </span>
                    </h2>
                    <div className="text-sm text-gray-500">
                      Approved on: {formatDate(selectedTimetable.approved_at)}
                    </div>
                  </div>
                  {selectedTimetable.comment && (
                    <div className="mt-2 text-sm italic text-gray-600">
                      "{selectedTimetable.comment}"
                    </div>
                  )}
                </div>
                <TimetableViewer variant={selectedTimetable} />
              </div>
            )
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center h-64">
              <p className="text-gray-500">
                {activeTab === 'pending' 
                  ? 'Select a pending request from the list to review.' 
                  : 'Select an approved timetable from the list to view details.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Approval;
