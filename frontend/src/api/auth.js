import apiClient from './client';

export const authApi = {
  /**
   * Register a new student account
   * @param {{ name: string, email: string, password: string, role?: string }} data
   */
  async signup(data) {
    const payload = {
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role || 'student',
    };
    const response = await apiClient.post('/api/auth/signup', payload);
    return response.data;
  },

  /**
   * Login with email and password
   * @param {{ email: string, password: string }} credentials
   */
  async login(credentials) {
    const response = await apiClient.post('/api/auth/login', credentials);
    return response.data; // { access_token, token_type, user }
  },

  /**
   * Get current authenticated user profile
   */
  async getMe() {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },
};

export default authApi;
