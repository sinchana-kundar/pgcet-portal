import apiClient from './client';

export const notificationsApi = {
  /**
   * Retrieve all notifications, ordered newest first
   */
  async getNotifications() {
    const response = await apiClient.get('/api/notifications');
    return response.data;
  },

  /**
   * Retrieve single notification by ID
   * @param {number|string} id
   */
  async getNotificationById(id) {
    const response = await apiClient.get(`/api/notifications/${id}`);
    return response.data;
  },

  /**
   * Create a new notification (Admin only)
   * @param {FormData|object} payload
   */
  async createNotification(payload) {
    const isFormData = payload instanceof FormData;
    const response = await apiClient.post('/api/notifications', payload, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  /**
   * Update an existing notification (Admin only)
   * @param {number|string} id
   * @param {FormData|object} payload
   */
  async updateNotification(id, payload) {
    const isFormData = payload instanceof FormData;
    const response = await apiClient.put(`/api/notifications/${id}`, payload, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return response.data;
  },

  /**
   * Delete a notification (Admin only)
   * @param {number|string} id
   */
  async deleteNotification(id) {
    const response = await apiClient.delete(`/api/notifications/${id}`);
    return response.data;
  },
};

export default notificationsApi;

