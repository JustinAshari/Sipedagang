import { defineStore } from 'pinia'
import {
  resetPasswordRequest,
  verifyResetToken,
  resetPassword,
  getResetRequests,
  approveResetRequest,
  declineResetRequest,
} from '@/services/resetService'

export const useResetPasswordStore = defineStore('resetPassword', {
  state: () => ({
    loading: false,
    error: null,
    successMessage: null,
    requestSent: false,
    verificationToken: null,
    isTokenValid: false,
    requestedUsername: null, // Store the username from reset request
    // Admin state
    resetRequests: [],
    adminLoading: false,
    adminError: null,
  }),

  getters: {
    isLoading: (state) => state.loading,
    hasError: (state) => !!state.error,
    hasSuccess: (state) => !!state.successMessage,
    isRequestSent: (state) => state.requestSent,
    canProceedToReset: (state) => state.isTokenValid && state.verificationToken,
    // Admin getters
    isAdminLoading: (state) => state.adminLoading,
    hasAdminError: (state) => !!state.adminError,
    getPendingRequests: (state) =>
      state.resetRequests.filter((req) => req.status === 'pending'),
  },

  actions: {
    clearMessages() {
      this.error = null
      this.successMessage = null
    },

    clearAdminMessages() {
      this.adminError = null
    },

    setRequestSent(value) {
      this.requestSent = value
    },

    setRequestedUsername(username) {
      this.requestedUsername = username
    },

    clearRequestedUsername() {
      this.requestedUsername = null
    },

    async requestReset(namapengguna) {
      this.loading = true
      this.error = null
      this.successMessage = null

      try {
        const response = await resetPasswordRequest(namapengguna)

        this.successMessage =
          response.data?.message || 'Permintaan reset password berhasil dikirim'
        this.requestSent = true

        // Store the username for later use
        this.requestedUsername = namapengguna

        if (response.data?.token) {
          this.verificationToken = response.data.token
        }

        return { success: true, data: response.data, username: namapengguna }
      } catch (err) {
        this.requestSent = true

        if (err.response?.status === 404) {
          this.error = 'Nama pengguna tidak ditemukan'
        } else if (err.response?.status === 422) {
          this.error = 'Data yang dikirim tidak valid'
        } else if (err.response?.status === 429) {
          this.error = 'Terlalu banyak percobaan. Coba lagi nanti'
        } else if (!navigator.onLine) {
          this.error = 'Tidak ada koneksi internet'
        } else {
          this.error = err.response?.data?.message || 'Terjadi kesalahan server'
        }

        console.error('Reset password request error:', err)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    // Admin actions
    async fetchResetRequests() {
      this.adminLoading = true
      this.adminError = null

      try {
        const response = await getResetRequests()
        let raw = []

        if (response.data?.data) {
          raw = response.data.data
        } else if (Array.isArray(response.data)) {
          raw = response.data
        }

        // Mapping agar konsisten dengan StaffElement
        this.resetRequests = raw.map((item) => ({
          id: item.id,
          nama: item.admin?.name || '',
          nama_pengguna: item.admin?.nama_pengguna || '',
          img: item.admin?.profile_photo || '',
          status: item.status,
          requested_at: item.created_at,
        }))

        return { success: true, data: this.resetRequests }
      } catch (err) {
        this.resetRequests = []

        if (err.response?.status === 401) {
          this.adminError = 'Tidak memiliki akses untuk melihat data ini'
        } else if (err.response?.status === 403) {
          this.adminError = 'Forbidden: Hanya SuperAdmin yang dapat mengakses'
        } else if (err.response?.status === 404) {
          this.adminError = 'Endpoint tidak ditemukan'
        } else if (!navigator.onLine) {
          this.adminError = 'Tidak ada koneksi internet'
        } else {
          this.adminError =
            err.response?.data?.message || 'Gagal memuat data permintaan reset'
        }

        console.error('Fetch reset requests error:', err)
        return { success: false, error: this.adminError }
      } finally {
        this.adminLoading = false
      }
    },

    async approveRequest(requestId) {
      this.adminLoading = true
      this.adminError = null

      try {
        const response = await approveResetRequest(requestId)

        // Update local state
        const requestIndex = this.resetRequests.findIndex(
          (req) => req.id === requestId,
        )
        if (requestIndex !== -1) {
          this.resetRequests[requestIndex].status = 'approved'
          this.resetRequests[requestIndex].approved_at =
            new Date().toISOString()
        }

        return {
          success: true,
          message: response.data?.message || 'Permintaan berhasil disetujui',
        }
      } catch (err) {
        this.adminError =
          err.response?.data?.message || 'Gagal menyetujui permintaan'
        console.error('Approve request error:', err)
        return { success: false, error: this.adminError }
      } finally {
        this.adminLoading = false
      }
    },

    async declineRequest(requestId) {
      this.adminLoading = true
      this.adminError = null

      try {
        const response = await declineResetRequest(requestId)

        // Update local state
        const requestIndex = this.resetRequests.findIndex(
          (req) => req.id === requestId,
        )
        if (requestIndex !== -1) {
          this.resetRequests[requestIndex].status = 'declined'
          this.resetRequests[requestIndex].declined_at =
            new Date().toISOString()
        }

        return {
          success: true,
          message: response.data?.message || 'Permintaan berhasil ditolak',
        }
      } catch (err) {
        this.adminError =
          err.response?.data?.message || 'Gagal menolak permintaan'
        console.error('Decline request error:', err)
        return { success: false, error: this.adminError }
      } finally {
        this.adminLoading = false
      }
    },

    async resetPasswordWithUsername(
      namapengguna,
      password,
      passwordConfirmation,
    ) {
      this.loading = true
      this.error = null
      this.successMessage = null

      try {
        const response = await resetPassword(
          null,
          password,
          passwordConfirmation,
          namapengguna,
        )

        this.successMessage =
          response.data?.message || 'Password berhasil direset'

        return {
          success: true,
          message: this.successMessage,
          data: response.data,
        }
      } catch (err) {
        if (err.response?.status === 404) {
          this.error = 'Nama pengguna tidak ditemukan'
        } else if (err.response?.status === 422) {
          this.error =
            err.response?.data?.message || 'Data yang dikirim tidak valid'
        } else if (err.response?.status === 400) {
          this.error = err.response?.data?.message || 'Permintaan tidak valid'
        } else if (!navigator.onLine) {
          this.error = 'Tidak ada koneksi internet'
        } else {
          this.error = err.response?.data?.message || 'Terjadi kesalahan server'
        }

        console.error('Reset password error:', err)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    resetState() {
      this.loading = false
      this.error = null
      this.successMessage = null
      this.requestSent = false
      this.verificationToken = null
      this.isTokenValid = false
      this.requestedUsername = null
    },

    resetAdminState() {
      this.resetRequests = []
      this.adminLoading = false
      this.adminError = null
    },
  },
})
