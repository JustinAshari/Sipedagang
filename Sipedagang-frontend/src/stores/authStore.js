import { defineStore } from 'pinia'
import api from '@/services/authService'
import {
  loginUser,
  logoutUser,
  setAuthToken,
  getAuthToken,
  getAuthUser,
  getTokenExpiresAt,
  isRememberMeActive,
  clearAuthData,
} from '@/services/authService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getAuthToken() || null,
    user: getAuthUser() || null, // ✅ TETAP: Untuk backward compatibility
    loading: false,
    error: null,
    rememberMe: isRememberMeActive(),
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.role,
  },

  actions: {
    // ✅ Login dengan opsi Remember Me
    async login(nama_pengguna, password, rememberMe = false) {
      this.loading = true
      this.error = null
      try {
        const response = await loginUser({ nama_pengguna, password })

        if (!response.data?.token || !response.data?.user) {
          throw new Error('Invalid response format')
        }

        // ✅ Simpan token berdasarkan Remember Me
        setAuthToken(
          response.data.token,
          response.data.user,
          response.data.expires_at,
          rememberMe,
        )

        // Update state
        this.token = response.data.token
        this.user = response.data.user
        this.rememberMe = rememberMe
        this.error = null

        return response.data
      } catch (err) {
        this.clearAuth()

        if (err.response?.status === 401) {
          this.error = 'Nama pengguna atau kata sandi salah'
        } else if (err.response?.status === 422) {
          this.error = 'Data yang dikirim tidak valid'
        } else if (err.response?.status === 429) {
          this.error = 'Terlalu banyak percobaan login. Coba lagi nanti'
        } else if (!navigator.onLine) {
          this.error = 'Tidak ada koneksi internet'
        } else {
          this.error = err.response?.data?.message || 'Terjadi kesalahan server'
        }

        console.error('Login error:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        if (this.token) {
          await logoutUser()
        }
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.clearAuth()
      }
    },

    clearAuth() {
      this.token = null
      this.user = null
      this.error = null
      this.rememberMe = false
      clearAuthData()
    },

    checkTokenExpiration() {
      const expiresAt = getTokenExpiresAt()
      if (expiresAt && new Date() > new Date(expiresAt)) {
        this.clearAuth()
        return false
      }
      return true
    },

    // ✅ Initialize auth dari storage yang tersedia
    initializeAuth() {
      const token = getAuthToken()
      const user = getAuthUser()
      const rememberMe = isRememberMeActive()

      if (token && user) {
        if (this.checkTokenExpiration()) {
          this.token = token
          this.user = user
          this.rememberMe = rememberMe
        }
      }
    },
  },
})
