import apiClient from './client';

export const practiceApi = {
  /**
   * Retrieve practice questions for a specific subject and topic
   * @param {{ subject: string, topic: string }} params
   */
  async getPracticeQuestions({ subject, topic }) {
    const response = await apiClient.get('/api/practice', {
      params: {
        subject: subject.trim(),
        topic: topic.trim(),
      },
    });
    return response.data;
  },

  /**
   * Instantly check an answer for a practice question
   * @param {{ questionId: number, selectedOption: string }} params
   * @returns {Promise<{ question_id: number, selected_option: string, correct_option: string, is_correct: bool, explanation: string|null }>}
   */
  async checkAnswer({ questionId, selectedOption }) {
    const response = await apiClient.post('/api/practice/check', {
      question_id: questionId,
      selected_option: selectedOption.trim().toUpperCase(),
    });
    return response.data;
  },
};

export default practiceApi;
