import { useState } from 'react';
import RoomManagement from '../components/masters/RoomManagement';
import FacultyManagement from '../components/masters/FacultyManagement';
import BatchManagement from '../components/masters/BatchManagement';
import SubjectManagement from '../components/masters/SubjectManagement';
import FixedSlotManagement from '../components/masters/FixedSlotManagement';

const Masters = () => {
  const [activeTab, setActiveTab] = useState('rooms');

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Master Data Management</h1>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('rooms')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rooms'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Rooms
            </button>
            <button
              onClick={() => setActiveTab('faculty')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'faculty'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Faculty
            </button>
            <button
              onClick={() => setActiveTab('batches')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'batches'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Batches
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'subjects'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Subjects
            </button>
            <button
              onClick={() => setActiveTab('fixed-slots')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'fixed-slots'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Fixed Slots
            </button>
          </nav>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        {activeTab === 'rooms' && <RoomManagement />}
        {activeTab === 'faculty' && <FacultyManagement />}
        {activeTab === 'batches' && <BatchManagement />}
        {activeTab === 'subjects' && <SubjectManagement />}
        {activeTab === 'fixed-slots' && <FixedSlotManagement />}
      </div>
    </div>
  );
};

export default Masters;
