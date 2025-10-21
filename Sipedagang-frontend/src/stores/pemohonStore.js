import { defineStore } from 'pinia'
import {
  createPemohon,
  getAllPemohon,
  getPemohonById,
  updatePemohon,
  deletePemohon,
  uploadPemohonCSV,
} from '@/services/pemohonService'

export const usePemohonStore = defineStore('pemohon', {
  state: () => ({
    pemohonList: [],
    currentPemohon: null,
    loading: false,
    error: null,
    successMessage: null,
    uploadProgress: 0,
    pagination: {
      current_page: 1,
      per_page: 10,
      total: 0,
      last_page: 1,
      from: 0,
      to: 0,
    },
  }),

  getters: {
    isLoading: (state) => state.loading,
    hasError: (state) => !!state.error,
    hasSuccess: (state) => !!state.successMessage,
    getPemohonById: (state) => (id) =>
      state.pemohonList.find((pemohon) => pemohon.id === id),
  },

  actions: {
    // Clear messages
    clearMessages() {
      this.error = null
      this.successMessage = null
    },

    // Create new pemohon
    async createPemohon(data) {
      this.loading = true
      this.clearMessages()

      try {
        const response = await createPemohon(data)

        if (response.data) {
          this.successMessage =
            response.data.message || 'Data pemohon berhasil disimpan'

          // Add to list if exists
          if (response.data.data) {
            this.pemohonList.unshift(response.data.data)
          }

          return response.data
        }

        throw new Error('Invalid response format')
      } catch (err) {
        if (err.response?.status === 422) {
          this.error = 'Data yang dikirim tidak valid'
        } else if (err.response?.status === 409) {
          this.error = 'Data pemohon sudah ada'
        } else if (err.response?.status === 403) {
          this.error = 'Anda tidak memiliki izin untuk menambah data pemohon'
        } else if (!navigator.onLine) {
          this.error = 'Tidak ada koneksi internet'
        } else {
          this.error = err.response?.data?.message || 'Terjadi kesalahan server'
        }

        console.error('Create pemohon error:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    // Get all pemohon with fixed pagination handling
    async fetchPemohon(params = {}) {
      this.loading = true
      this.clearMessages()

      try {
        const response = await getAllPemohon(params)

        if (response.data) {
          // ✅ PERBAIKAN: Ambil data dari response.data langsung (bukan dari meta)
          this.pemohonList = response.data.data || []

          // ✅ PERBAIKAN: Update pagination dari response level root
          this.pagination = {
            current_page: response.data.current_page || 1,
            per_page: response.data.per_page || 10,
            total: response.data.total || 0,
            last_page: response.data.last_page || 1,
            from: response.data.from || 0,
            to: response.data.to || 0,
          }

          console.log('✅ Updated pagination:', this.pagination) // Debug log

          return response.data
        }

        throw new Error('Invalid response format')
      } catch (err) {
        this.error = err.response?.data?.message || 'Gagal memuat data pemohon'
        console.error('Fetch pemohon error:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    // ✅ ENHANCED: Get pemohon by ID with better error handling and logging
    async fetchPemohonById(id) {
      this.loading = true
      this.clearMessages()

      try {
        console.log('Fetching pemohon by ID:', id)
        const response = await getPemohonById(id)

        console.log('API Response:', response) // Debug full response
        console.log('Response data:', response.data) // Debug response.data

        // ✅ More flexible response handling
        if (response.data) {
          // Try multiple possible response structures
          let pemohonData = null

          if (response.data.data) {
            // Standard Laravel API response: { success: true, data: {...}, message: "..." }
            pemohonData = response.data.data
            console.log('Using response.data.data structure')
          } else if (response.data.pemohon) {
            // Alternative structure: { pemohon: {...} }
            pemohonData = response.data.pemohon
            console.log('Using response.data.pemohon structure')
          } else if (response.data.id) {
            // Direct data structure: { id: 1, nama_suplier: "...", ... }
            pemohonData = response.data
            console.log('Using direct response.data structure')
          } else {
            console.warn('Unexpected response structure:', response.data)
            // ✅ Try to find any object with an id property
            if (typeof response.data === 'object') {
              const keys = Object.keys(response.data)
              for (const key of keys) {
                if (
                  response.data[key] &&
                  typeof response.data[key] === 'object' &&
                  response.data[key].id
                ) {
                  pemohonData = response.data[key]
                  console.log(`Using response.data.${key} structure`)
                  break
                }
              }
            }
          }

          if (pemohonData && (pemohonData.id || pemohonData.nama_suplier)) {
            this.currentPemohon = pemohonData
            console.log('Current pemohon set:', this.currentPemohon)
            return pemohonData
          } else {
            console.error('No valid pemohon data found in response')
            console.error(
              'Response structure:',
              JSON.stringify(response.data, null, 2),
            )
            console.error('Extracted pemohonData:', pemohonData)

            // ✅ Better error message for debugging
            const errorDetails = {
              hasResponse: !!response,
              hasResponseData: !!response.data,
              responseDataType: typeof response.data,
              responseDataKeys: response.data ? Object.keys(response.data) : [],
              pemohonDataFound: !!pemohonData,
              pemohonDataType: typeof pemohonData,
              pemohonDataKeys: pemohonData ? Object.keys(pemohonData) : [],
            }
            console.error('Debug details:', errorDetails)

            throw new Error(
              `Data pemohon tidak valid atau kosong. Debug: ${JSON.stringify(errorDetails)}`,
            )
          }
        }

        console.error('Invalid response structure:', response)
        throw new Error('Response tidak valid dari server')
      } catch (err) {
        console.error('Fetch pemohon by ID error:', err)
        console.error('Error details:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        })

        if (err.response?.status === 404) {
          this.error = 'Data pemohon tidak ditemukan'
        } else if (err.response?.status === 403) {
          this.error =
            'Anda tidak memiliki izin untuk mengakses data pemohon ini'
        } else if (err.response?.status === 500) {
          this.error = 'Terjadi kesalahan server saat mengambil data'
        } else if (!navigator.onLine) {
          this.error = 'Tidak ada koneksi internet'
        } else {
          this.error =
            err.response?.data?.message ||
            err.message ||
            'Gagal memuat data pemohon'
        }

        // Clear current pemohon on error
        this.currentPemohon = null
        throw err
      } finally {
        this.loading = false
      }
    },

    // ✅ ENHANCED: Update pemohon with better state management
    async updatePemohon(id, data) {
      this.loading = true
      this.clearMessages()

      try {
        console.log('Updating pemohon ID:', id, 'with data:', data)
        const response = await updatePemohon(id, data)

        if (response.data) {
          this.successMessage =
            response.data.message || 'Data pemohon berhasil diperbarui'

          // Update in list
          const index = this.pemohonList.findIndex((item) => item.id == id)
          if (index !== -1 && response.data.data) {
            this.pemohonList[index] = response.data.data
          }

          // Update current pemohon
          if (response.data.data) {
            this.currentPemohon = response.data.data
          }

          console.log('Pemohon updated successfully')
          return response.data
        }

        throw new Error('Invalid response format')
      } catch (err) {
        console.error('Update pemohon error:', err)

        if (err.response?.status === 422) {
          this.error = 'Data yang dikirim tidak valid'

          // Handle validation errors detail
          if (err.response.data?.errors) {
            const errors = err.response.data.errors
            const errorMessages = Object.entries(errors)
              .map(([field, messages]) => {
                const fieldName = field
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase())
                return `${fieldName}: ${
                  Array.isArray(messages) ? messages.join(', ') : messages
                }`
              })
              .join('\n')
            this.error = `Validasi gagal:\n${errorMessages}`
          }
        } else if (err.response?.status === 404) {
          this.error = 'Data pemohon tidak ditemukan'
        } else if (err.response?.status === 403) {
          this.error = 'Anda tidak memiliki izin untuk mengubah data pemohon'
        } else {
          this.error = err.response?.data?.message || 'Terjadi kesalahan server'
        }

        throw err
      } finally {
        this.loading = false
      }
    },

    // Delete pemohon with pagination adjustment
    async deletePemohon(id) {
      this.loading = true
      this.clearMessages()

      try {
        const response = await deletePemohon(id)

        this.successMessage =
          response.data?.message || 'Data pemohon berhasil dihapus'

        // Remove from list
        this.pemohonList = this.pemohonList.filter((item) => item.id !== id)

        // Clear current if deleted
        if (this.currentPemohon?.id === id) {
          this.currentPemohon = null
        }

        // ✅ PERBAIKAN: Adjust pagination after delete
        const remainingItems = this.pagination.total - 1
        const maxPage =
          Math.ceil(remainingItems / this.pagination.per_page) || 1

        // If current page exceeds max page, go to last page
        if (this.pagination.current_page > maxPage) {
          // Fetch data for the adjusted page
          await this.fetchPemohon({
            page: maxPage,
            per_page: this.pagination.per_page,
          })
        } else {
          // Just update the total count
          this.pagination.total = remainingItems
        }

        return response.data
      } catch (err) {
        if (err.response?.status === 404) {
          this.error = 'Data pemohon tidak ditemukan'
        } else if (err.response?.status === 403) {
          this.error = 'Anda tidak memiliki izin untuk menghapus data pemohon'
        } else {
          this.error = err.response?.data?.message || 'Terjadi kesalahan server'
        }

        console.error('Delete pemohon error:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    // Upload CSV
    async uploadCSV(formData) {
      this.loading = true
      this.clearMessages()
      this.uploadProgress = 0

      try {
        const response = await uploadPemohonCSV(formData)

        if (response.data) {
          this.successMessage =
            response.data.message || 'File CSV berhasil diupload dan diimpor'

          // Handle response data
          if (response.data.data) {
            // If the response contains imported data summary
            const summary = response.data.data
            if (summary.imported_count !== undefined) {
              this.successMessage += ` (${summary.imported_count} data berhasil diimpor)`
            }
            if (summary.failed_count && summary.failed_count > 0) {
              this.successMessage += `, ${summary.failed_count} data gagal diimpor`
            }
          }

          // Refresh list after upload to show new data
          try {
            await this.fetchPemohon()
          } catch (fetchError) {
            console.warn('Failed to refresh data after upload:', fetchError)
            // Don't throw error here, upload was successful
          }

          return response.data
        }

        throw new Error('Invalid response format')
      } catch (err) {
        console.error('Upload CSV error:', err)

        // Handle specific error cases
        if (err.response?.status === 400) {
          this.error =
            err.response.data?.message || 'Format file CSV tidak valid'
        } else if (err.response?.status === 422) {
          // Validation errors
          if (err.response.data?.errors) {
            const errors = err.response.data.errors
            const errorMessages = Object.entries(errors)
              .map(([field, messages]) => {
                return `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
              })
              .join('\n')
            this.error = `Validasi gagal:\n${errorMessages}`
          } else {
            this.error =
              err.response.data?.message || 'Data dalam file CSV tidak valid'
          }
        } else if (err.response?.status === 413) {
          this.error = 'Ukuran file terlalu besar'
        } else if (err.response?.status === 415) {
          this.error = 'Format file tidak didukung. Gunakan file .csv'
        } else if (err.response?.status === 500) {
          this.error = 'Terjadi kesalahan server saat memproses file'
        } else if (!navigator.onLine) {
          this.error = 'Tidak ada koneksi internet'
        } else {
          this.error =
            err.response?.data?.message || 'Gagal mengupload file CSV'
        }

        throw err
      } finally {
        this.loading = false
        this.uploadProgress = 0
      }
    },

    // Clear current pemohon
    clearCurrentPemohon() {
      this.currentPemohon = null
    },

    // Reset store
    resetStore() {
      this.pemohonList = []
      this.currentPemohon = null
      this.loading = false
      this.error = null
      this.successMessage = null
      this.pagination = {
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1,
        from: 0,
        to: 0,
      }
    },
  },
})
