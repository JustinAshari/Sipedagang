import axios from 'axios'
import { config } from '@/config/env'

const api = axios.create({
  baseURL: `${config.apiBaseUrl}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

api.interceptors.request.use(
  (config) => {
    // ✅ Cek token dari sessionStorage dulu, lalu localStorage
    const token = sessionStorage.getItem('token') || localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // ✅ Hapus dari kedua storage
      clearAuthData()

      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

// ✅ Function untuk menyimpan token berdasarkan Remember Me
export const setAuthToken = (token, user, expiresAt, rememberMe = false) => {
  if (rememberMe) {
    // Simpan di localStorage (persistent - tidak hilang saat browser ditutup)
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token_expires_at', expiresAt)
    localStorage.setItem('remember_me', 'true')
    
    // Hapus dari sessionStorage jika ada
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('token_expires_at')
  } else {
    // Simpan di sessionStorage (hilang saat browser ditutup)
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('user', JSON.stringify(user))
    sessionStorage.setItem('token_expires_at', expiresAt)
    
    // Hapus dari localStorage jika ada
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('token_expires_at')
    localStorage.removeItem('remember_me')
  }
}

// ✅ Function untuk mendapatkan token
export const getAuthToken = () => {
  return sessionStorage.getItem('token') || localStorage.getItem('token')
}

// ✅ Function untuk mendapatkan user
export const getAuthUser = () => {
  const userFromSession = sessionStorage.getItem('user')
  const userFromLocal = localStorage.getItem('user')
  
  if (userFromSession) {
    return JSON.parse(userFromSession)
  } else if (userFromLocal) {
    return JSON.parse(userFromLocal)
  }
  return null
}

// ✅ Function untuk mendapatkan expires at
export const getTokenExpiresAt = () => {
  return sessionStorage.getItem('token_expires_at') || localStorage.getItem('token_expires_at')
}

// ✅ Function untuk cek apakah remember me aktif
export const isRememberMeActive = () => {
  return localStorage.getItem('remember_me') === 'true'
}

// ✅ Function untuk clear semua auth data
export const clearAuthData = () => {
  // Clear sessionStorage
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
  sessionStorage.removeItem('token_expires_at')
  
  // Clear localStorage
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('token_expires_at')
  localStorage.removeItem('remember_me')
}

export const loginUser = (credentials) => {
  return api.post('/login', {
    nama_pengguna: credentials.nama_pengguna,
    password: credentials.password,
  })
}

export const logoutUser = () => {
  return api.post('/logout')
}

export const refreshToken = () => {
  return api.post('/refresh')
}

export const getCurrentUser = () => {
  return api.get('/user')
}


export default api
