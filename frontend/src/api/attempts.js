import apiClient from './client';

export const attemptsApi = {
  /**
   * Submit answers for an active attempt
   * @param {number|string} attemptId
   * @param {Array<{ question_id: number, selected_option: string|null }>} answers
   */
  async submitAttempt(attemptId, answers) {
    const payload = {
      answers: answers.map((ans) => ({
        question_id: ans.question_id,
        selected_option: ans.selected_option ? ans.selected_option.toUpperCase() : null,
      })),
    };
    const response = await apiClient.post(`/api/attempts/${attemptId}/submit`, payload);
    return response.data;
  },

  /**
   * Retrieve attempt history for the logged-in student
   */
  async getMyAttempts() {
    const response = await apiClient.get('/api/attempts/me');
    return response.data;
  },

  /**
   * Retrieve scored result and detailed question review for a completed attempt
   * @param {number|string} attemptId
   */
  async getAttemptDetail(attemptId) {
    const response = await apiClient.get(`/api/attempts/${attemptId}`);
    return response.data;
  },

  /**
   * Retrieve total count of mock test attempts across portal (Admin only)
   * @returns {Promise<{ total: number }>}
   */
  async getAttemptsCount() {
    const response = await apiClient.get('/api/admin/attempts/count');
    return response.data;
  },
};

export default attemptsApi;

