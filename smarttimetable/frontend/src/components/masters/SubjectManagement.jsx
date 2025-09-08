import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchSubjects, createSubject, updateSubject, deleteSubject } from '../../services/api';

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    hours_week: 3,
    type: 'lecture',
    semester: 1
  });
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    loadSubjects();
  }, [token]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await fetchSubjects(token);
      setSubjects(data);
      setError(null);
    } catch (err) {
      console.error('Error loading subjects:', err);
      setError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      hours_week: 3,
      type: 'lecture',
      semester: 1
    });
    setEditingId(null);
  };

  const openModal = (subject = null) => {
    if (subject) {
      setFormData({
        code: subject.code,
        name: subject.name,
        hours_week: subject.hours_week,
        type: subject.type,
        semester: subject.semester
      });
      setEditingId(subject.id);
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
      [name]: type === 'number' ? parseInt(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateSubject(token, editingId, formData);
      } else {
        await createSubject(token, formData);
      }
      closeModal();
      loadSubjects();
    } catch (err) {
      console.error('Error saving subject:', err);
      setError(err.message || 'Failed to save subject');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSubject(token, id);
      loadSubjects();
      setConfirmDelete(null);
    } catch (err) {
      console.error('Error deleting subject:', err);
      setError(err.message || 'Failed to delete subject');
    }
  };

  if (loading && subjects.length === 0) {
    return <div className="flex justify-center p-8">Loading subjects...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Subject Management</h2>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Subject
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
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hours/Week
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Semester
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subjects.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                  No subjects found. Add your first subject to get started.
                </td>
              </tr>
            ) : (
              subjects.map(subject => (
                <tr key={subject.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {subject.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {subject.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {subject.hours_week}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {subject.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {subject.semester}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openModal(subject)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDelete(subject)}
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

      {/* Add/Edit Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-lg font-medium">{editingId ? 'Edit Subject' : 'Add Subject'}</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="code">
                  Subject Code
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  placeholder="e.g., CS101"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                  Subject Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  placeholder="e.g., Introduction to Programming"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="hours_week">
                  Hours Per Week
                </label>
                <input
                  type="number"
                  id="hours_week"
                  name="hours_week"
                  value={formData.hours_week}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  min="1"
                  max="10"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
                  Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="lecture">Lecture</option>
                  <option value="lab">Lab</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="semester">
                  Semester
                </label>
                <input
                  type="number"
                  id="semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  min="1"
                  max="8"
                />
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
                  Are you sure you want to delete subject "{confirmDelete.code} - {confirmDelete.name}"? This action cannot be undone.
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

export default SubjectManagement;
