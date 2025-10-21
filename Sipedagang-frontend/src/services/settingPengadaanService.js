import api from '@/services/authService'

export const settingPengadaanService = {
  // Get all pengaturan pengadaan
  getAll(params = {}) {
    return api.get('/pengaturan-pengadaan', { params })
  },

  // Get pengaturan pengadaan by ID
  getById(id) {
    return api.get(`/pengaturan-pengadaan/${id}`)
  },

  // Create new pengaturan pengadaan
  create(data) {
    return api.post('/pengaturan-pengadaan', data)
  },

  // Update pengaturan pengadaan - Changed to use POST with _method: PUT
  update(id, data) {
    // Add _method: PUT to the data for Laravel method spoofing
    const updateData = {
      ...data,
      _method: 'PUT',
    }
    return api.post(`/pengaturan-pengadaan/${id}`, updateData)
  },

  // Delete pengaturan pengadaan - Changed to use POST with _method: DELETE
  delete(id) {
    return api.post(`/pengaturan-pengadaan/${id}`, {
      _method: 'DELETE'
    })
  },

  // Upload CSV/Excel (if needed)
  uploadCSV(formData) {
    return api.post('/pengaturan-pengadaan/upload-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}
