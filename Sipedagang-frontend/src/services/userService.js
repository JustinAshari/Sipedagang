import api from '@/services/authService'

// Get current user profile
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/user')
    return response.data
  } catch (error) {
    console.error('getCurrentUser error:', error)
    throw error
  }
}

// Update user profile
export const updateUserProfile = async (data) => {
  try {
    const response = await api.post('/user/update-profile', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    console.error('updateUserProfile error:', error)
    throw error
  }
}
