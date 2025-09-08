import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  fetchFaculty, 
  createFaculty, 
  updateFaculty, 
  deleteFaculty, 
  fetchSubjects 
} from '../../services/api';

const FacultyManagement = () => {
  const [faculty, setFaculty] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    max_day: 6,
    max_week: 25,
    leave_avg: 0.05,
    subject_ids: []
  });
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    loadFaculty();
    loadSubjects();
  }, [token]);

  const loadFaculty = async () => {
    try {
      setLoading(true);
      const data = await fetchFaculty(token);
      setFaculty(data);
      setError(null);
    } catch (err) {
      console.error('Error loading faculty:', err);
      setError('Failed to load faculty');
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const data = await fetchSubjects(token);
      setSubjects(data);
    } catch (err) {
      console.error('Error loading subjects:', err);
      // Not setting error here as it's not critical
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      max_day: 6,
      max_week: 25,
      leave_avg: 0.05,
      subject_ids: []
    });
    setEditingId(null);
  };

  const openModal = (faculty = null) => {
    if (faculty) {
      setFormData({
        name: faculty.name,
        max_day: faculty.max_day,
        max_week: faculty.max_week,
        leave_avg: faculty.leave_avg,
        subject_ids: faculty.subjects ? faculty.subjects.map(s => s.id) : []
      });
      setEditingId(faculty.id);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) : value
    });
  };

  const handleSubjectChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
    setFormData({
      ...formData,
      subject_ids: selectedOptions
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateFaculty(token, editingId, formData);
      } else {
        await createFaculty(token, formData);
      }
      closeModal();
      loadFaculty();
    } catch (err) {
      console.error('Error saving faculty:', err);
      setError(err.message || 'Failed to save faculty');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteFaculty(token, id);
      loadFaculty();
      setConfirmDelete(null);
    } catch (err) {
      console.error('Error deleting faculty:', err);
      setError(err.message || 'Failed to delete faculty');
    }
  };

  if (loading && faculty.length === 0) {
    return <div className="flex justify-center p-8">Loading faculty data...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Faculty Management</h2>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Faculty
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Max Load (Day/Week)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Leave Probability
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subjects
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {faculty.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                  No faculty found. Add your first faculty member to get started.
                </td>
              </tr>
            ) : (
              faculty.map(f => (
                <tr key={f.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {f.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {f.max_day} / {f.max_week}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {f.leave_avg * 100}%
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {f.subjects && f.subjects.length > 0
                      ? f.subjects.map(s => s.code).join(', ')
                      : 'None'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openModal(f)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDelete(f)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Faculty Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-lg font-medium">{editingId ? 'Edit Faculty' : 'Add Faculty'}</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="max_day">
                  Max Periods Per Day
                </label>
                <input
                  type="number"
                  id="max_day"
                  name="max_day"
                  value={formData.max_day}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  min="1"
                  max="8"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="max_week">
                  Max Periods Per Week
                </label>
                <input
                  type="number"
                  id="max_week"
                  name="max_week"
                  value={formData.max_week}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  min="1"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="leave_avg">
                  Leave Probability (0-1)
                </label>
                <input
                  type="number"
                  id="leave_avg"
                  name="leave_avg"
                  value={formData.leave_avg}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  step="0.01"
                  min="0"
                  max="1"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="subject_ids">
                  Subjects (hold Ctrl/Cmd to select multiple)
                </label>
                <select
                  id="subject_ids"
                  name="subject_ids"
                  multiple
                  value={formData.subject_ids}
                  onChange={handleSubjectChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  size="5"
                >
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.code} - {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded mr-2 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Confirm Delete</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{confirmDelete.name}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded mr-2 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(confirmDelete.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyManagement;
