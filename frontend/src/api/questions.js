import apiClient from './client';

export const questionsApi = {
  /**
   * List questions in the bank for building mock tests (Admin only)
   * @param {{ subject?: string, topic?: string }} params
   */
  async getQuestions(params = {}) {
    const cleanParams = {};
    if (params.subject && params.subject.trim()) {
      cleanParams.subject = params.subject.trim();
    }
    if (params.topic && params.topic.trim()) {
      cleanParams.topic = params.topic.trim();
    }
    const response = await apiClient.get('/api/admin/questions', {
      params: cleanParams,
    });
    return response.data;
  },

  /**
   * Add a new question to the bank (Admin only)
   * @param {{
   *   subject: string,
   *   topic: string,
   *   question_text: string,
   *   option_a: string,
   *   option_b: string,
   *   option_c: string,
   *   option_d: string,
   *   correct_option: string,
   *   explanation?: string,
   *   difficulty?: string
   * }} payload
   */
  async createQuestion(payload) {
    const response = await apiClient.post('/api/admin/questions', payload);
    return response.data;
  },

  /**
   * Update an existing question (Admin only)
   * @param {number|string} id
   * @param {object} payload
   */
  async updateQuestion(id, payload) {
    const response = await apiClient.put(`/api/admin/questions/${id}`, payload);
    return response.data;
  },

  /**
   * Delete a question from the question bank (Admin only)
   * @param {number|string} id
   */
  async deleteQuestion(id) {
    const response = await apiClient.delete(`/api/admin/questions/${id}`);
    return response.data;
  },
};

export default questionsApi;
