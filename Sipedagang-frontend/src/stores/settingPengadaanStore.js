import { defineStore } from 'pinia'
import { settingPengadaanService } from '@/services/settingPengadaanService'

export const useSettingPengadaanStore = defineStore('settingPengadaan', {
  state: () => ({
    pengaturanPengadaan: [],
    currentPengaturanPengadaan: null,
    isLoading: false,
    error: null,
    pagination: {
      current_page: 1,
      per_page: 10,
      total: 0,
      last_page: 1,
    },
  }),

  getters: {
    hasData: (state) => state.pengaturanPengadaan.length > 0,
    getCurrentPengaturanPengadaan: (state) => state.currentPengaturanPengadaan,
    getError: (state) => state.error,
  },

  actions: {
    // Clear current pengaturan pengadaan
    clearCurrentPengaturanPengadaan() {
      this.currentPengaturanPengadaan = null
      this.error = null
    },

    // Set loading state
    setLoading(loading) {
      this.isLoading = loading
    },

    // Set error
    setError(error) {
      this.error = error
      this.isLoading = false
    },

    // Fetch all pengaturan pengadaan
    async fetchPengaturanPengadaan(params = {}) {
      this.setLoading(true)
      try {
        const response = await settingPengadaanService.getAll(params)
        
        // Handle different response structures
        if (response.data) {
          this.pengaturanPengadaan = response.data.data || response.data
          
          // Handle pagination
          if (response.data.meta) {
            this.pagination = response.data.meta
          } else if (response.data.current_page) {
            this.pagination = {
              current_page: response.data.current_page,
              per_page: response.data.per_page,
              total: response.data.total,
              last_page: response.data.last_page,
            }
          }
        }
        
        this.error = null
        return response.data
      } catch (error) {
        console.error('Fetch pengaturan pengadaan error:', error)
        this.setError(error.response?.data?.message || 'Gagal memuat data pengaturan pengadaan')
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    // Fetch pengaturan pengadaan by ID
    async fetchPengaturanPengadaanById(id) {
      this.setLoading(true)
      try {
        const response = await settingPengadaanService.getById(id)
        this.currentPengaturanPengadaan = response.data.data || response.data
        this.error = null
        return this.currentPengaturanPengadaan
      } catch (error) {
        console.error('Fetch pengaturan pengadaan by ID error:', error)
        this.setError(error.response?.data?.message || 'Gagal memuat data pengaturan pengadaan')
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    // Create pengaturan pengadaan
    async createPengaturanPengadaan(data) {
      this.setLoading(true)
      try {
        const response = await settingPengadaanService.create(data)
        const newPengaturanPengadaan = response.data.data || response.data
        
        // Add to beginning of array
        if (Array.isArray(this.pengaturanPengadaan)) {
          this.pengaturanPengadaan.unshift(newPengaturanPengadaan)
        }
        
        this.currentPengaturanPengadaan = newPengaturanPengadaan
        this.error = null
        
        return newPengaturanPengadaan
      } catch (error) {
        console.error('Create pengaturan pengadaan error:', error)
        this.setError(error.response?.data?.message || 'Gagal menyimpan pengaturan pengadaan')
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    // Update pengaturan pengadaan
    async updatePengaturanPengadaan(id, data) {
      this.setLoading(true)
      try {
        const response = await settingPengadaanService.update(id, data)
        const updatedPengaturanPengadaan = response.data.data || response.data
        
        // Update in array
        if (Array.isArray(this.pengaturanPengadaan)) {
          const index = this.pengaturanPengadaan.findIndex(item => item.id == id)
          if (index !== -1) {
            this.pengaturanPengadaan[index] = updatedPengaturanPengadaan
          }
        }
        
        this.currentPengaturanPengadaan = updatedPengaturanPengadaan
        this.error = null
        
        return updatedPengaturanPengadaan
      } catch (error) {
        console.error('Update pengaturan pengadaan error:', error)
        this.setError(error.response?.data?.message || 'Gagal memperbarui pengaturan pengadaan')
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    // Delete pengaturan pengadaan
    async deletePengaturanPengadaan(id) {
      this.setLoading(true)
      try {
        await settingPengadaanService.delete(id)
        
        // Remove from array
        if (Array.isArray(this.pengaturanPengadaan)) {
          this.pengaturanPengadaan = this.pengaturanPengadaan.filter(item => item.id != id)
        }
        
        // Clear current if it was the deleted item
        if (this.currentPengaturanPengadaan?.id == id) {
          this.currentPengaturanPengadaan = null
        }
        
        this.error = null
        return true
      } catch (error) {
        console.error('Delete pengaturan pengadaan error:', error)
        this.setError(error.response?.data?.message || 'Gagal menghapus pengaturan pengadaan')
        throw error
      } finally {
        this.setLoading(false)
      }
    },

    // Upload CSV/Excel
    async uploadCSV(formData) {
      this.setLoading(true)
      try {
        const response = await settingPengadaanService.uploadCSV(formData)
        
        // Refresh data after upload
        await this.fetchPengaturanPengadaan()
        
        this.error = null
        return response.data
      } catch (error) {
        console.error('Upload CSV error:', error)
        this.setError(error.response?.data?.message || 'Gagal mengupload file')
        throw error
      } finally {
        this.setLoading(false)
      }
    },
  },
})