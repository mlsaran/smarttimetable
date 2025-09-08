import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import OTPVerification from './OTPVerification';

const Login = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [error, setError] = useState(null);
  const { loginRequest } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!email) {
      setError('Email is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await loginRequest(email);
      setShowOTP(true);
    } catch (err) {
      setError(err.message || 'Failed to send login request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Smart Timetable
        </h2>
        
        {!showOTP ? (
          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
            <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                    Email address
                  </label>
                  <div className="mt-2">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
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

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-indigo-300"
                  >
                    {isSubmitting ? 'Sending...' : 'Get OTP'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <OTPVerification email={email} onBack={() => setShowOTP(false)} />
        )}
      </div>
    </div>
  );
};

export default Login;
