import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTimetable } from '../contexts/TimetableContext';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = ({ readOnly = false, showAll = false }) => {
  const { 
    timetables, 
    loading, 
    error, 
    getApprovedTimetables,
    getDraftTimetables,
    refresh
  } = useTimetable();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  // Get notification message from location state if any
  const notification = location.state?.message ? {
    message: location.state.message,
    type: location.state.type || 'info'
  } : null;

  // Clear location state after showing notification
  useEffect(() => {
    if (location.state?.message) {
      // Clear the state so notification doesn't persist on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  // Refresh timetables when component mounts
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Filter timetables based on status
  const filteredTimetables = () => {
    // In read-only mode, show only approved timetables
    if (readOnly) {
      return getApprovedTimetables();
    }
    
    // Otherwise, filter based on selection
    switch (filter) {
      case 'draft':
        return getDraftTimetables();
      case 'pending':
        return timetables.filter(t => t.status === 'pending');
      case 'approved':
        return getApprovedTimetables();
      default:
        return timetables;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {readOnly ? 'View Timetables' : showAll ? 'All Timetables' : 'Dashboard'}
        </h1>
        
        {!readOnly && user?.role === 'scheduler' && (
          <Link
            to="/generator"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Generate New Timetable
          </Link>
        )}
      </div>
      
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
      
      {!readOnly && !showAll && (
        <div className="stats bg-white p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="stat">
            <div className="stat-title text-gray-500">Total Timetables</div>
            <div className="stat-value text-3xl">{timetables.length}</div>
          </div>
          <div className="stat">
            <div className="stat-title text-gray-500">Approved</div>
            <div className="stat-value text-3xl text-green-600">{getApprovedTimetables().length}</div>
          </div>
          <div className="stat">
            <div className="stat-title text-gray-500">Pending Approval</div>
            <div className="stat-value text-3xl text-yellow-600">
              {timetables.filter(t => t.status === 'pending').length}
            </div>
          </div>
        </div>
      )}
      
      {!readOnly && (
        <div className="filter-options mb-6">
          <div className="flex space-x-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('draft')}
              className={`px-3 py-1 rounded ${filter === 'draft' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Drafts
            </button>
            <button 
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Pending
            </button>
            <button 
              onClick={() => setFilter('approved')}
              className={`px-3 py-1 rounded ${filter === 'approved' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Approved
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              {!readOnly && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Version
              </th>
              {user?.role === 'approver' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requester
                </th>
              )}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={readOnly ? 4 : 5} className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading timetables...
                </td>
              </tr>
            ) : filteredTimetables().length === 0 ? (
              <tr>
                <td colSpan={readOnly ? 4 : 5} className="px-6 py-4 text-center text-sm text-gray-500">
                  {readOnly 
                    ? "No published timetables available." 
                    : "No timetables found matching the selected filter."}
                </td>
              </tr>
            ) : (
              filteredTimetables().map(timetable => (
                <tr key={timetable.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {timetable.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(timetable.created_at)}
                  </td>
                  {!readOnly && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(timetable.status)}`}>
                        {timetable.status.charAt(0).toUpperCase() + timetable.status.slice(1)}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {timetable.version}
                  </td>
                  {user?.role === 'approver' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {timetable.creator?.email || 'Unknown'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/timetable/${timetable.id}`}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      View
                    </Link>
                    
                    {!readOnly && user?.role === 'scheduler' && timetable.status === 'draft' && (
                      <Link
                        to={`/timetable/${timetable.id}`}
                        state={{ action: 'approve-request' }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Send for Approval
                      </Link>
                    )}
                    
                    {user?.role === 'approver' && timetable.status === 'pending' && (
                      <Link
                        to={`/timetable/${timetable.id}`}
                        state={{ action: 'review' }}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        Review
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
