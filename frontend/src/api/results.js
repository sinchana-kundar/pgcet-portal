import apiClient from './client';

export const resultsApi = {
  /**
   * Public results and rank lookup
   * @param {{ regNumber: string, dob: string }} params - dob formatted as YYYY-MM-DD
   */
  async lookupResult({ regNumber, dob }) {
    const response = await apiClient.get('/api/results/lookup', {
      params: {
        reg_number: regNumber.trim().toUpperCase(),
        dob: dob.trim(),
      },
    });
    return response.data;
  },

  /**
   * Paginated list of candidate results (Admin only)
   * @param {{ page?: number, limit?: number, category?: string, search?: string }} params
   */
  async getAdminResults(params = {}) {
    const cleanParams = {};
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    if (params.category && params.category.trim()) cleanParams.category = params.category.trim();
    if (params.search && params.search.trim()) cleanParams.search = params.search.trim();

    const response = await apiClient.get('/api/admin/results', {
      params: cleanParams,
    });
    return response.data;
  },

  /**
   * Add a single candidate result record (Admin only)
   * @param {{ reg_number: string, dob: string, rank: number, marks: number, category: string }} payload
   */
  async createResult(payload) {
    const response = await apiClient.post('/api/admin/results', payload);
    return response.data;
  },

  /**
   * Bulk import results from CSV (Admin only)
   * @param {File} file
   * @param {Function} [onUploadProgress]
   */
  async importResultsCsv(file, onUploadProgress) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/api/admin/results/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  /**
   * Delete a result record by ID (Admin only)
   * @param {number|string} id
   */
  async deleteResult(id) {
    const response = await apiClient.delete(`/api/admin/results/${id}`);
    return response.data;
  },
};

export default resultsApi;

