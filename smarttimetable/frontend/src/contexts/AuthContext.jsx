import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiLogin, apiVerifyOTP, apiGetCurrentUser } from '../services/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const navigate = useNavigate();

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const userData = await apiGetCurrentUser(token);
          setUser(userData);
        } catch (error) {
          console.error('Authentication error:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const loginRequest = async (email) => {
    const response = await apiLogin(email);
    return response;
  };

  const verifyOTP = async (email, otp) => {
    const response = await apiVerifyOTP(email, otp);
    if (response?.access_token) {
      localStorage.setItem('token', response.access_token);
      setToken(response.access_token);
      
      // Fetch user data
      const userData = await apiGetCurrentUser(response.access_token);
      setUser(userData);
      
      // Redirect based on role
      if (userData.role === 'scheduler') {
        navigate('/dashboard');
      } else if (userData.role === 'approver') {
        navigate('/approval');
      } else {
        navigate('/view');
      }
    }
    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading,
        loginRequest,
        verifyOTP,
        logout,
        token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
