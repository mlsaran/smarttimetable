import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  fetchFixedSlots, 
  createFixedSlot, 
  updateFixedSlot, 
  deleteFixedSlot, 
  fetchRooms,
  fetchBatches
} from '../../services/api';

const FixedSlotManagement = () => {
  const [fixedSlots, setFixedSlots] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    day: 0,
    period: 1,
    room_id: null,
    batch_id: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const { token } = useAuth();

  // Day names for display
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    loadFixedSlots();
    loadRooms();
    loadBatches();
  }, [token]);

  const loadFixedSlots = async () => {
    try {
      setLoading(true);
      const data = await fetchFixedSlots(token);
      setFixedSlots(data);
      setError(null);
    } catch (err) {
      console.error('Error loading fixed slots:', err);
      setError('Failed to load fixed slots');
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    try {
      const data = await fetchRooms(token);
      setRooms(data);
    } catch (err) {
      console.error('Error loading rooms:', err);
    }
  };

  const loadBatches = async () => {
    try {
      const data = await fetchBatches(token);
      setBatches(data);
    } catch (err) {
      console.error('Error loading batches:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      day: 0,
      period: 1,
      room_id: null,
      batch_id: ''
    });
    setEditingId(null);
  };

  const openModal = (slot = null) => {
    if (slot) {
      setFormData({
        day: slot.day,
        period: slot.period,
        room_id: slot.room_id || null,
        batch_id: slot.batch_id
      });
      setEditingId(slot.id);
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
    
    // Handle select for room_id that might be null
    if (name === 'room_id' && value === '') {
      setFormData({
        ...formData,
        room_id: null
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'number' ? parseInt(value) : value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate batch_id is selected
    if (!formData.batch_id) {
      setError('Please select a batch');
      return;
    }
    
    try {
      // Create payload, ensuring batch_id is a number
      const payload = {
        ...formData,
        batch_id: parseInt(formData.batch_id)
      };
      
      // If room_id is set, ensure it's a number
      if (payload.room_id) {
        payload.room_id = parseInt(payload.room_id);
      }
      
      if (editingId) {
        await updateFixedSlot(token, editingId, payload);
      } else {
        await createFixedSlot(token, payload);
      }
      closeModal();
      loadFixedSlots();
    } catch (err) {
      console.error('Error saving fixed slot:', err);
      setError(err.message || 'Failed to save fixed slot');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteFixedSlot(token, id);
      loadFixedSlots();
      setConfirmDelete(null);
    } catch (err) {
      console.error('Error deleting fixed slot:', err);
      setError(err.message || 'Failed to delete fixed slot');
    }
  };

  // Find room and batch objects by ID for display
  const getRoomById = (id) => rooms.find(room => room.id === id);
  const getBatchById = (id) => batches.find(batch => batch.id === id);

  if (loading && fixedSlots.length === 0) {
    return <div className="flex justify-center p-8">Loading fixed slots...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Fixed Slot Management</h2>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Fixed Slot
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
                Day
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Period
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Batch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Room
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fixedSlots.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                  No fixed slots found. Add your first fixed slot to get started.
                </td>
              </tr>
            ) : (
              fixedSlots.map(slot => {
                const batch = getBatchById(slot.batch_id);
                const room = slot.room_id ? getRoomById(slot.room_id) : null;
                
                return (
                  <tr key={slot.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {dayNames[slot.day] || `Day ${slot.day}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Period {slot.period}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {batch ? batch.name : `Batch #${slot.batch_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {room ? room.name : 'Not assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openModal(slot)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(slot)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Fixed Slot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-lg font-medium">{editingId ? 'Edit Fixed Slot' : 'Add Fixed Slot'}</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="day">
                  Day
                </label>
                <select
                  id="day"
                  name="day"
                  value={formData.day}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  {dayNames.map((day, index) => (
                    <option key={index} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="period">
                  Period
                </label>
                <select
                  id="period"
                  name="period"
                  value={formData.period}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(period => (
                    <option key={period} value={period}>
                      Period {period}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="batch_id">
                  Batch
                </label>
                <select
                  id="batch_id"
                  name="batch_id"
                  value={formData.batch_id}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                >
                  <option value="">Select a batch</option>
                  {batches.map(batch => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name} ({batch.programme})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="room_id">
                  Room (Optional)
                </label>
                <select
                  id="room_id"
                  name="room_id"
                  value={formData.room_id || ''}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">No room assigned</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>
                      {room.name} ({room.type}, capacity: {room.capacity})
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
                  Are you sure you want to delete this fixed slot? This action cannot be undone.
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

export default FixedSlotManagement;
