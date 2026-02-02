// src/services/authService.js
import API from '../apis/apiClient';

class AuthService {
  async signUp(userData) {
    try {
      const response = await API.post('/api/register/account', userData);
      return {
        success: true,
        data: response.data,
        token: response.data.token,
        user: response.data.user,
      };
    } catch (error) {
      console.error('SignUp error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed',
      };
    }
  }

  async login(credentials) {
    try {
      const response = await API.post('/api/login', credentials);
      return {
        success: true,
        data: response.data,
        token: response.data.token,
        user: response.data.user,
      };
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  }

  async verifyPhone(phone) {
    // TODO: Implement phone verification OTP
    return { success: true, message: 'OTP sent' };
  }

  async resetPassword(phone, newPassword) {
    // TODO: Implement password reset
    return { success: true, message: 'Password reset successful' };
  }
}

export default new AuthService();