import api from '@/services/authService'

export const createPemohon = (data) => {
  return api.post('/pemohon', data)
}

export const getAllPemohon = (params = {}) => {
  return api.get('/pemohon', { params })
}

export const getPemohonById = (id) => {
  console.log('Calling API getPemohonById with ID:', id)
  return api
    .get(`/pemohon/${id}`)
    .then((response) => {
      console.log('API Response for getPemohonById:', response)
      return response
    })
    .catch((error) => {
      console.error('API Error for getPemohonById:', error)
      console.error('Error response:', error.response)
      throw error
    })
}

export const updatePemohon = (id, data) => {
  // ✅ FIX: Use POST with _method=PUT for Laravel compatibility
  const formData = new FormData()

  // Add _method field for Laravel method spoofing
  formData.append('_method', 'PUT')

  // Add all data fields to FormData
  Object.keys(data).forEach((key) => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key])
    }
  })

  return api.post(`/pemohon/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const deletePemohon = (id) => {
  return api.delete(`/pemohon/${id}`)
}

// Updated upload CSV endpoint
export const uploadPemohonCSV = (formData) => {
  return api.post('/data-pemohon/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export default api
