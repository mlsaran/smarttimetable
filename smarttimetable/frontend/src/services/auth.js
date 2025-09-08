import api from './api';

export const apiLogin = async (email) => {
  try {
    const response = await api.post('/auth/login/', { email });
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Login request failed');
  }
};

export const apiVerifyOTP = async (email, otp) => {
  try {
    const response = await api.post('/auth/verify-otp/', { email, otp });
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'OTP verification failed');
  }
};

export const apiGetCurrentUser = async (token) => {
  try {
    const response = await api.get('/auth/me/', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to get user information');
  }
};
