import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const OTPVerification = ({ email, onBack }) => {
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { verifyOTP } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!otp) {
      setError('OTP is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await verifyOTP(email, otp);
      // Login successful, AuthContext will handle redirection
    } catch (err) {
      setError(err.message || 'Invalid OTP');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
      <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="otp" className="block text-sm font-medium leading-6 text-gray-900">
              Enter OTP sent to {email}
            </label>
            <div className="mt-2">
              <input
                id="otp"
                name="otp"
                type="text"
                autoComplete="one-time-code"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Enter 6-digit OTP"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Back to email
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-300"
            >
              {isSubmitting ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OTPVerification;
