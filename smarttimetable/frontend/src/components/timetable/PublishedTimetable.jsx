import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPublicTimetable, exportTimetablePdf, exportTimetableCsv } from '../../services/api';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import QRCode from 'qrcode.react';

const PublishedTimetable = () => {
  const [timetable, setTimetable] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState('by-batch');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const { publicUrl } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const loadTimetable = async () => {
      if (!publicUrl) {
        setError('Invalid public URL');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const data = await fetchPublicTimetable(publicUrl);
        setTimetable(data);
        generateEvents(data);
      } catch (err) {
        console.error('Error loading timetable:', err);
        setError('The requested timetable could not be found or has been unpublished.');
      } finally {
        setLoading(false);
      }
    };

    loadTimetable();
  }, [publicUrl]);
  
  // Function to generate FullCalendar events from timetable data
  const generateEvents = (timetableData) => {
    if (!timetableData || !timetableData.periods) {
      setEvents([]);
      return;
    }

    // Group periods by batch for filtering
    const batchGroups = {};
    const roomGroups = {};
    const facultyGroups = {};

    timetableData.periods.forEach(period => {
      // Add to batch groups
      if (!batchGroups[period.batch.name]) {
        batchGroups[period.batch.name] = [];
      }
      batchGroups[period.batch.name].push(period);

      // Add to room groups
      if (!roomGroups[period.room.name]) {
        roomGroups[period.room.name] = [];
      }
      roomGroups[period.room.name].push(period);

      // Add to faculty groups
      if (!facultyGroups[period.faculty.name]) {
        facultyGroups[period.faculty.name] = [];
      }
      facultyGroups[period.faculty.name].push(period);
    });

    // Set available entities for filtering
    const entities = {
      'by-batch': Object.keys(batchGroups),
      'by-room': Object.keys(roomGroups),
      'by-faculty': Object.keys(facultyGroups)
    };

    // If no entity is selected, default to first batch
    if (!selectedEntity && entities['by-batch'].length > 0) {
      setSelectedEntity(entities['by-batch'][0]);
    }

    // Filter periods based on view type and selected entity
    let filteredPeriods = [];
    if (viewType === 'by-batch' && selectedEntity) {
      filteredPeriods = batchGroups[selectedEntity] || [];
    } else if (viewType === 'by-room' && selectedEntity) {
      filteredPeriods = roomGroups[selectedEntity] || [];
    } else if (viewType === 'by-faculty' && selectedEntity) {
      filteredPeriods = facultyGroups[selectedEntity] || [];
    } else {
      // Default: show all periods
      filteredPeriods = timetableData.periods;
    }

    // Map periods to FullCalendar events
    const calendarEvents = filteredPeriods.map(period => {
      // Map day number to day of week (0 = Sunday in FullCalendar)
      const dayMap = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const day = dayMap[period.day] || 'mon';

      // Map period number to time
      const startHour = 8 + (period.period_no - 1);
      const endHour = startHour + 1;
      
      const startTime = `${String(startHour).padStart(2, '0')}:00:00`;
      const endTime = `${String(endHour).padStart(2, '0')}:00:00`;

      return {
        id: period.id,
        title: `${period.subject.code} - ${period.faculty.name}`,
        daysOfWeek: [dayMap.indexOf(day)],
        startTime,
        endTime,
        extendedProps: {
          batch: period.batch.name,
          subject: period.subject.name,
          faculty: period.faculty.name,
          room: period.room.name,
        },
        backgroundColor: getColorForBatch(period.batch.name)
      };
    });

    setEvents(calendarEvents);
  };

  // Helper to generate consistent colors for batches
  const getColorForBatch = (batchName) => {
    const colors = [
      '#4285F4', '#EA4335', '#FBBC05', '#34A853',
      '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
      '#9b59b6', '#1abc9c', '#d35400', '#c0392b',
    ];
    
    const hash = batchName.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + acc;
    }, 0);
    
    return colors[hash % colors.length];
  };

  // Function to handle PDF export
  const handleExportPdf = async () => {
    try {
      // For public timetable, no token is needed
      const response = await exportTimetablePdf(null, timetable.id);
      const byteCharacters = atob(response.content);
      const byteArrays = [];

      for (let i = 0; i < byteCharacters.length; i++) {
        byteArrays.push(byteCharacters.charCodeAt(i));
      }

      const blob = new Blob([new Uint8Array(byteArrays)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = response.filename || 'timetable.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      setError('Failed to export PDF');
    }
  };

  // Function to handle CSV export
  const handleExportCsv = async () => {
    try {
      // For public timetable, no token is needed
      const response = await exportTimetableCsv(null, timetable.id);
      const byteCharacters = atob(response.content);
      const byteArrays = [];

      for (let i = 0; i < byteCharacters.length; i++) {
        byteArrays.push(byteCharacters.charCodeAt(i));
      }

      const blob = new Blob([new Uint8Array(byteArrays)], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = response.filename || 'timetable.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Failed to export CSV');
    }
  };
  
  // Change view type and reset selected entity
  const handleViewTypeChange = (type) => {
    setViewType(type);
    setSelectedEntity(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">
            <span className="material-icons" style={{ fontSize: '48px' }}>error_outline</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Timetable Unavailable</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!timetable) {
    return <div className="text-center p-8">No timetable data available.</div>;
  }

  // Get available entities based on view type
  const getEntities = () => {
    if (!timetable || !timetable.periods) return [];
    
    const entities = new Set();
    timetable.periods.forEach(period => {
      if (viewType === 'by-batch') {
        entities.add(period.batch.name);
      } else if (viewType === 'by-room') {
        entities.add(period.room.name);
      } else if (viewType === 'by-faculty') {
        entities.add(period.faculty.name);
      }
    });
    
    return Array.from(entities).sort();
  };

  const entities = getEntities();
  const shareUrl = window.location.href;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b pb-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Published Timetable</h1>
            <p className="text-sm text-gray-500">Last updated: {new Date(timetable.created_at).toLocaleString()}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleExportPdf}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            >
              <span className="material-icons text-sm mr-1">picture_as_pdf</span> PDF
            </button>
            <button
              onClick={handleExportCsv}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
            >
              <span className="material-icons text-sm mr-1">description</span> CSV
            </button>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex space-x-4 mb-2">
            <button 
              className={`px-3 py-1 rounded ${viewType === 'by-batch' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
              onClick={() => handleViewTypeChange('by-batch')}
            >
              By Batch
            </button>
            <button 
              className={`px-3 py-1 rounded ${viewType === 'by-room' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
              onClick={() => handleViewTypeChange('by-room')}
            >
              By Room
            </button>
            <button 
              className={`px-3 py-1 rounded ${viewType === 'by-faculty' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}
              onClick={() => handleViewTypeChange('by-faculty')}
            >
              By Faculty
            </button>
          </div>
          
          <div className="mb-4">
            <label htmlFor="entity-select" className="block text-sm font-medium text-gray-700">
              {viewType === 'by-batch' ? 'Select Batch:' : 
               viewType === 'by-room' ? 'Select Room:' : 'Select Faculty:'}
            </label>
            <select
              id="entity-select"
              value={selectedEntity || ''}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md"
            >
              <option value="">Select...</option>
              {entities.map((entity) => (
                <option key={entity} value={entity}>{entity}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="timetable-container" style={{ height: '600px' }}>
          <FullCalendar
            plugins={[timeGridPlugin]}
            initialView="timeGridWeek"
            headerToolbar={false}
            allDaySlot={false}
            slotMinTime="08:00:00"
            slotMaxTime="18:00:00"
            events={events}
            weekends={false}
            dayHeaderFormat={{ weekday: 'long' }}
            slotDuration="01:00:00"
            eventContent={(info) => {
              return (
                <div className="p-1 text-xs">
                  <div className="font-bold">{info.event.extendedProps.subject}</div>
                  <div>{info.event.extendedProps.faculty}</div>
                  <div>{info.event.extendedProps.room}</div>
                </div>
              );
            }}
          />
        </div>
        
        <div className="mt-8 border-t pt-6 flex justify-between items-center">
          <div className="share-section">
            <h3 className="text-lg font-medium mb-2">Share This Timetable</h3>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="pr-10 block w-64 border-gray-300 rounded-md shadow-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    alert("URL copied to clipboard!");
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  <span className="material-icons">content_copy</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="qr-code">
            <QRCode value={shareUrl} size={100} level="H" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublishedTimetable;
