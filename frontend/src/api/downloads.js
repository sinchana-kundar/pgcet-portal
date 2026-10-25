import apiClient from './client';

export const downloadsApi = {
  /**
   * Retrieve downloads with optional filtering by category
   * @param {{ category?: string }} params
   */
  async getDownloads(params = {}) {
    const cleanParams = {};
    if (params.category && params.category.trim()) {
      cleanParams.category = params.category.trim();
    }
    const response = await apiClient.get('/api/downloads', {
      params: cleanParams,
    });
    return response.data;
  },

  /**
   * Upload or register download resource (Admin only)
   * @param {FormData|object} payload
   * @param {Function} [onUploadProgress]
   */
  async createDownload(payload, onUploadProgress) {
    const isFormData = payload instanceof FormData;
    const response = await apiClient.post('/api/downloads', payload, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
      onUploadProgress,
    });
    return response.data;
  },

  /**
   * Delete download resource by ID (Admin only)
   * @param {number|string} id
   */
  async deleteDownload(id) {
    const response = await apiClient.delete(`/api/downloads/${id}`);
    return response.data;
  },
};

export default downloadsApi;

