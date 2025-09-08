import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimetable } from '../contexts/TimetableContext';
import TimetableViewer from '../components/timetable/TimetableViewer';

const Generator = () => {
  const { 
    variants, 
    loading, 
    error, 
    generateTimetableVariants, 
    requestApproval,
    clearVariants
  } = useTimetable();
  const [numVariants, setNumVariants] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [activeVariant, setActiveVariant] = useState(0);
  const [constraints, setConstraints] = useState(null);
  const navigate = useNavigate();

  // Clear variants when component unmounts
  useEffect(() => {
    return () => {
      clearVariants();
    };
  }, [clearVariants]);

  const handleGenerate = async () => {
    setGenerating(true);
    setConstraints(null);
    
    const result = await generateTimetableVariants(numVariants);
    
    if (result && result.error && result.suggestions) {
      setConstraints(result);
    }
    
    setGenerating(false);
  };

  const handleSendForApproval = async (timetableId) => {
    try {
      await requestApproval(timetableId);
      navigate('/dashboard', { 
        state: { 
          message: `Timetable #${timetableId} sent for approval successfully!`,
          type: 'success'
        } 
      });
    } catch (err) {
      console.error('Error sending for approval:', err);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Timetable Generator</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div>
            <label htmlFor="numVariants" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Variants
            </label>
            <select
              id="numVariants"
              value={numVariants}
              onChange={(e) => setNumVariants(parseInt(e.target.value))}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>
          
          <div className="flex-grow"></div>
          
          <button
            onClick={handleGenerate}
            disabled={generating || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
          >
            {generating || loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate Timetable'
            )}
          </button>
        </div>
        
        {error && !constraints && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-4">
            {error}
          </div>
        )}
        
        {constraints && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-4">
            <h3 className="font-semibold text-yellow-800 mb-2">
              {constraints.error}
            </h3>
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-2">Suggestions to resolve constraints:</p>
              <ul className="list-disc pl-5 space-y-2">
                {constraints.suggestions.map((suggestion, index) => (
                  <li key={index}>
                    <strong className="capitalize">{suggestion.type.replace('_', ' ')}:</strong> {suggestion.message}
                    <p className="italic text-xs mt-1">{suggestion.solution}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {variants && variants.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {variants.map((variant, index) => (
                <button
                  key={variant.id}
                  onClick={() => setActiveVariant(index)}
                  className={`py-4 px-6 text-sm font-medium ${
                    index === activeVariant
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
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

export default Generator;
