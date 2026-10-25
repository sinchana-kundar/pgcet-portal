import apiClient from './client';

export const mockTestsApi = {
  /**
   * Retrieve all available mock tests
   */
  async getMockTests() {
    const response = await apiClient.get('/api/mock-tests');
    return response.data;
  },

  /**
   * Retrieve single mock test details including redacted questions for student test-taking
   * @param {number|string} id
   */
  async getMockTestById(id) {
    const response = await apiClient.get(`/api/mock-tests/${id}`);
    return response.data;
  },

  /**
   * Start a new timed mock test attempt
   * @param {number|string} id - mock test id
   * @returns {Promise<{ attempt_id: number, mock_test_id: number, mock_test_title: string, duration_minutes: number, total_questions: number, started_at: string }>}
   */
  async startAttempt(id) {
    const response = await apiClient.post(`/api/mock-tests/${id}/attempt`);
    return response.data;
  },

  /**
   * Create a new mock test and attach question IDs from the question bank (Admin only)
   * @param {{ title: string, subject: string, duration_minutes: number, question_ids: number[] }} payload
   */
  async createMockTest(payload) {
    const response = await apiClient.post('/api/admin/mock-tests', payload);
    return response.data;
  },
};

export default mockTestsApi;

