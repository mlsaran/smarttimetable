import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { generateTimetable, sendTimetableForApproval } from '../../services/api';
import TimetableViewer from './TimetableViewer';

const TimetableGenerator = () => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [activeVariant, setActiveVariant] = useState(0);
  const [numVariants, setNumVariants] = useState(3);
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuggestions(null);
      
      const response = await generateTimetable(token, numVariants);
      
      // Check if we got an error with suggestions
      if (response.error && response.suggestions) {
        setSuggestions(response);
        setVariants([]);
      } else {
        setVariants(response);
        setActiveVariant(0);
      }
    } catch (err) {
      console.error('Error generating timetable:', err);
      setError('Failed to generate timetable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendForApproval = async (timetableId) => {
    try {
      const response = await sendTimetableForApproval(token, timetableId);
      navigate('/dashboard', { 
        state: { 
          message: `Timetable #${timetableId} sent for approval successfully!`,
          type: 'success'
        } 
      });
    } catch (err) {
      console.error('Error sending for approval:', err);
      setError('Failed to send timetable for approval');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Generate Timetable</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Number of Variants:
            <select
              value={numVariants}
              onChange={(e) => setNumVariants(parseInt(e.target.value))}
              className="mt-1 block w-24 pl-3 pr-10 py-2 text-base border-gray-300 rounded-md"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </label>
          
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Generating...' : 'Generate Timetable'}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4">
            {error}
          </div>
        )}
        
        {suggestions && (
          <div className="bg-yellow-100 p-4 rounded mb-4">
            <h3 className="font-semibold text-yellow-800 mb-2">
              {suggestions.error}
            </h3>
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-2">Suggestions to resolve constraints:</p>
              <ul className="list-disc pl-5">
                {suggestions.suggestions.map((suggestion, index) => (
                  <li key={index} className="mb-1">
                    <strong>{suggestion.type}:</strong> {suggestion.message}
                    <p className="italic text-xs">{suggestion.solution}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {variants.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {variants.map((variant, index) => (
                <button
                  key={variant.id}
                  onClick={() => setActiveVariant(index)}
                  className={`py-4 px-6 text-sm font-medium ${
                    index === activeVariant
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Variant {index + 1}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="p-4">
            <TimetableViewer 
              variant={variants[activeVariant]} 
              onApprovalRequest={handleSendForApproval} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableGenerator;
