import api from '@/services/authService'

export const fetchAdminList = async (search = '', status = '') => {
  const params = {}
  if (search && search.trim()) {
    params.search = search.trim()
  }
  if (status && status.trim()) {
    params.status = status
  }

  try {
    const response = await api.get('/admin/list', { params })
    return response.data
  } catch (error) {
    console.error('Service: API error:', error)
    throw error
  }
}

export const fetchAdminById = async (id) => {
  try {
    // ✅ PERBAIKAN: Ambil dari list untuk mendapatkan status
    const listData = await fetchAdminList()
    const adminData = listData.find((admin) => String(admin.id) === String(id))

    if (!adminData) {
      throw new Error('Admin not found')
    }

    console.log('fetchAdminById - found admin with status:', adminData.status)
    return adminData
  } catch (error) {
    console.error('fetchAdminById error:', error)
    throw error
  }
}

export const createAdmin = async (data) => {
  const response = await api.post('/admin', data, {
    headers:
      data instanceof FormData
        ? {
            'Content-Type': 'multipart/form-data',
          }
        : {
            'Content-Type': 'application/json',
          },
  })
  return response.data
}

export const updateAdmin = async (id, data) => {
  console.log('Updating admin with ID:', id, 'Data:', data)

  try {
    if (data instanceof FormData) {
      data.append('_method', 'PUT')
      const response = await api.post(`/admin/list/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } else {
      const response = await api.put(`/admin/list/${id}`, data, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      return response.data
    }
  } catch (error) {
    console.error('updateAdmin error:', error)
    throw error
  }
}

// ✅ PERBAIKAN: Debug dan handle ID mapping
export const setAdminInactive = async (id) => {
  try {
    console.log('=== setAdminInactive Debug ===')
    console.log('Input ID:', id)

    // Debug: ambil data admin untuk melihat struktur
    const adminData = await fetchAdminById(id)
    console.log('Admin data:', adminData)

    // Coba berbagai kemungkinan ID
    const possibleIds = [
      id, // ID asli
      adminData.id, // ID dari data admin
      adminData.user_id, // Jika ada user_id terpisah
      adminData.admin_id, // Jika ada admin_id terpisah
    ].filter(Boolean) // Remove null/undefined

    console.log('Possible IDs to try:', possibleIds)

    // Coba setiap ID
    for (const tryId of possibleIds) {
      try {
        console.log(`Trying setAdminInactive with ID: ${tryId}`)

        const response = await api.post(`/user/update-status/${tryId}`, {
          status: 'inactive',
        })

        console.log('✅ Success with ID:', tryId, 'Response:', response.data)
        return response.data
      } catch (error) {
        console.log(
          `❌ Failed with ID: ${tryId}`,
          error.response?.status,
          error.response?.data,
        )
        continue
      }
    }

    throw new Error('All ID attempts failed for setAdminInactive')
  } catch (error) {
    console.error('setAdminInactive error:', error)
    throw error
  }
}

export const setAdminActive = async (id) => {
  try {
    console.log('=== setAdminActive Debug ===')
    console.log('Input ID:', id)

    // Debug: ambil data admin untuk melihat struktur
    const adminData = await fetchAdminById(id)
    console.log('Admin data:', adminData)

    // Coba berbagai kemungkinan ID
    const possibleIds = [
      id, // ID asli
      adminData.id, // ID dari data admin
      adminData.user_id, // Jika ada user_id terpisah
      adminData.admin_id, // Jika ada admin_id terpisah
    ].filter(Boolean)

    console.log('Possible IDs to try:', possibleIds)

    // Coba setiap ID
    for (const tryId of possibleIds) {
      try {
        console.log(`Trying setAdminActive with ID: ${tryId}`)

        const response = await api.post(`/user/update-status/${tryId}`, {
          status: 'active',
        })

        console.log('✅ Success with ID:', tryId, 'Response:', response.data)
        return response.data
      } catch (error) {
        console.log(
          `❌ Failed with ID: ${tryId}`,
          error.response?.status,
          error.response?.data,
        )
        continue
      }
    }

    throw new Error('All ID attempts failed for setAdminActive')
  } catch (error) {
    console.error('setAdminActive error:', error)
    throw error
  }
}

// Tambahkan fungsi untuk mendapatkan statistik admin
export const fetchAdminStats = async () => {
  try {
    const response = await fetchAdminList()
    return {
      total: response.length || 0,
      active: response.filter((admin) => admin.status === 'active').length || 0,
      inactive:
        response.filter((admin) => admin.status === 'inactive').length || 0,
    }
  } catch (error) {
    console.error('fetchAdminStats error:', error)
    throw error
  }
}
