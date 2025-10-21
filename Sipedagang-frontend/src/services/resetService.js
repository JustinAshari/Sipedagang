import api from '@/services/authService'

export const resetPasswordRequest = (namapengguna) => {
  return api.post('/reset/request', {
    nama_pengguna: namapengguna,
  })
}

export const verifyResetToken = (token) => {
  return api.post('/reset/verify', {
    token: token,
  })
}

export const resetPassword = (token, password, passwordConfirmation, namapengguna) => {
  return api.post('/reset/password', {
    nama_pengguna: namapengguna,
    password: password,
    password_confirmation: passwordConfirmation,
  })
}

// Admin functions
export const getResetRequests = () => {
  return api.get('/reset/list') // Updated route
}

export const approveResetRequest = (id) => {
  return api.post(`/reset/approve/${id}`)
}

export const declineResetRequest = (id) => {
  return api.post(`/reset/decline/${id}`)
}
