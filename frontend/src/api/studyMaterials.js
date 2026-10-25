import apiClient from './client';

export const studyMaterialsApi = {
  /**
   * Retrieve study materials with optional filtering by subject and topic
   * @param {{ subject?: string, topic?: string }} params
   */
  async getStudyMaterials(params = {}) {
    const cleanParams = {};
    if (params.subject && params.subject.trim()) {
      cleanParams.subject = params.subject.trim();
    }
    if (params.topic && params.topic.trim()) {
      cleanParams.topic = params.topic.trim();
    }
    const response = await apiClient.get('/api/study-materials', {
      params: cleanParams,
    });
    return response.data;
  },

  /**
   * Upload or register study material (Admin only)
   * @param {FormData|object} payload
   * @param {Function} [onUploadProgress]
   */
  async createStudyMaterial(payload, onUploadProgress) {
    const isFormData = payload instanceof FormData;
    const response = await apiClient.post('/api/study-materials', payload, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
      onUploadProgress,
    });
    return response.data;
  },

  /**
   * Delete study material by ID (Admin only)
   * @param {number|string} id
   */
  async deleteStudyMaterial(id) {
    const response = await apiClient.delete(`/api/study-materials/${id}`);
    return response.data;
  },
};

export default studyMaterialsApi;

