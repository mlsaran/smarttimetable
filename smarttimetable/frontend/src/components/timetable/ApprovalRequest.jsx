import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { approveTimetable } from '../../services/api';
import TimetableViewer from './TimetableViewer';

const ApprovalRequest = ({ timetable, onApproved, onRejected }) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleApproval = async (approved) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      await approveTimetable(token, timetable.id, approved, comment);
      
      if (approved) {
        if (onApproved) onApproved();
        else navigate('/approved', { 
          state: { message: 'Timetable approved successfully', type: 'success' } 
        });
      } else {
        if (onRejected) onRejected();
        else navigate('/approval', { 
          state: { message: 'Timetable rejected', type: 'info' } 
        });
      }
    } catch (err) {
      console.error('Error processing approval:', err);
      setError(err.message || 'An error occurred while processing the approval');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!timetable) {
    return <div>No timetable data to approve.</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <span className="text-yellow-600 mr-2">
            <span className="material-icons">pending_actions</span>
          </span>
          Approval Request: Timetable #{timetable.id}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Requested on {new Date(timetable.created_at).toLocaleString()}
        </p>
      </div>
      
      <div className="mb-6">
        <TimetableViewer variant={timetable} />
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
          Comments (optional)
        </label>
        <textarea
          id="comment"
          rows="3"
          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="Add any comments about your decision..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => handleApproval(false)}
          disabled={isSubmitting}
          className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
        >
          Reject
        </button>
        <button
          onClick={() => handleApproval(true)}
          disabled={isSubmitting}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Processing...' : 'Approve'}
        </button>
      </div>
    </div>
  );
};

export default ApprovalRequest;
