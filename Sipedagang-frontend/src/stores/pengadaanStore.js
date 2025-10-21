import { defineStore } from 'pinia'
import {
  createPengadaan,
  getPengadaan,
  getPengadaanById,
  updatePengadaan,
  deletePengadaan,
} from '@/services/pengadaanService'

export const usePengadaanStore = defineStore('pengadaan', {
  state: () => ({
    pengadaanList: [],
    currentPengadaan: null,
    loading: false,
    error: null,
    success: null,
    lastSearchParams: null, // ✅ Tambah ini
    pagination: {
      currentPage: 1,
      lastPage: 1,
      perPage: 10,
      total: 0,
      from: 0,
      to: 0,
    },
  }),

  getters: {
    isLoading: (state) => state.loading,
    hasError: (state) => !!state.error,
    hasSuccess: (state) => !!state.success,
    totalPages: (state) => state.pagination.lastPage,
    currentPageData: (state) => state.pagination.currentPage,
    totalItems: (state) => state.pagination.total,
  },

  actions: {
    clearMessages() {
      this.error = null
      this.success = null
    },

    handleError(error, defaultMessage = 'Terjadi kesalahan') {
      // Extract detailed error information for debugging
      if (error.response?.status === 422) {
        const errors = error.response.data.errors
        if (errors) {
          // Format validation errors
          const errorMessages = Object.values(errors).flat()
          this.error = errorMessages.join(', ')
        } else {
          this.error = error.response.data.message || 'Validation failed'
        }
      } else {
        this.error =
          error.response?.data?.message || error.message || defaultMessage
      }
    },

    async createPengadaan(formData) {
      this.loading = true
      this.error = null

      try {
        const response = await createPengadaan(formData)
        this.success = 'Data pengadaan berhasil disimpan'

        await this.fetchPengadaan(1, 10)

        return response.data
      } catch (err) {
        this.handleError(err, 'Gagal menyimpan data pengadaan')
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchPengadaan(
      page = 1,
      perPage = 10,
      search = '',
      tanggalAwal = '',
      tanggalAkhir = '',
    ) {
      this.loading = true
      this.error = null

      try {
        // ✅ Simpan parameter pencarian terakhir untuk operasi refresh
        this.lastSearchParams = { search, tanggalAwal, tanggalAkhir }

        const response = await getPengadaan(
          page,
          perPage,
          search,
          tanggalAwal,
          tanggalAkhir,
        )

        this.pengadaanList = response.data.data || []

        // ✅ Update pagination dengan data dari response
        this.pagination = {
          currentPage: response.data.current_page || page,
          lastPage: response.data.last_page || 1,
          perPage: response.data.per_page || perPage,
          total: response.data.total || 0,
          from: response.data.from || 0,
          to: response.data.to || 0,
        }

        // ✅ Validasi ulang jika halaman saat ini melebihi total halaman
        if (
          this.pagination.currentPage > this.pagination.lastPage &&
          this.pagination.lastPage > 0
        ) {
          // Recursive call untuk ke halaman terakhir yang valid
          return await this.fetchPengadaan(
            this.pagination.lastPage,
            perPage,
            search,
            tanggalAwal,
            tanggalAkhir,
          )
        }

        return response.data
      } catch (err) {
        this.handleError(err, 'Gagal mengambil data pengadaan')
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchPengadaanById(id) {
      this.loading = true
      this.error = null

      try {
        const response = await getPengadaanById(id)

        this.currentPengadaan = response.data.data || response.data

        return this.currentPengadaan
      } catch (err) {
        this.handleError(err, 'Gagal mengambil detail pengadaan')
        throw err
      } finally {
        this.loading = false
      }
    },

    async updatePengadaan(id, formData) {
      this.loading = true
      this.error = null

      try {
        const response = await updatePengadaan(id, formData)

        this.success = 'Data pengadaan berhasil diperbarui'

        // ✅ Update dengan parameter yang sudah diubah
        const params = this.lastSearchParams || {
          search: '',
          tanggalAwal: '',
          tanggalAkhir: '',
        }
        await this.fetchPengadaan(
          this.pagination.currentPage,
          this.pagination.perPage,
          params.search,
          params.tanggalAwal,
          params.tanggalAkhir,
        )

        this.currentPengadaan = response.data.data || response.data

        return response.data
      } catch (err) {
        this.handleError(err, 'Gagal memperbarui data pengadaan')
        throw err
      } finally {
        this.loading = false
      }
    },

    async deletePengadaan(id) {
      this.loading = true
      this.error = null

      try {
        const response = await deletePengadaan(id)
        this.success = 'Data pengadaan berhasil dihapus'

        // ✅ Hitung sisa data setelah delete
        const remainingItems = this.pagination.total - 1
        const maxPage = Math.ceil(remainingItems / this.pagination.perPage) || 1

        // ✅ Tentukan halaman yang akan dituju
        let targetPage = this.pagination.currentPage

        // Jika halaman saat ini melebihi halaman maksimum, pindah ke halaman terakhir
        if (targetPage > maxPage) {
          targetPage = maxPage
        }

        // ✅ Update pagination state terlebih dahulu sebelum fetch
        this.pagination.currentPage = targetPage

        // ✅ Fetch data dengan halaman yang sudah disesuaikan
        const currentFilter = {
          page: targetPage,
          perPage: this.pagination.perPage,
          search: this.lastSearchParams?.search || '',
          tanggalAwal: this.lastSearchParams?.tanggalAwal || '',
          tanggalAkhir: this.lastSearchParams?.tanggalAkhir || '',
        }

        await this.fetchPengadaan(
          currentFilter.page,
          currentFilter.perPage,
          currentFilter.search,
          currentFilter.tanggalAwal,
          currentFilter.tanggalAkhir,
        )

        return response.data
      } catch (err) {
        this.handleError(err, 'Gagal menghapus data pengadaan')
        throw err
      } finally {
        this.loading = false
      }
    },

    // ✅ Update method untuk refresh dengan parameter yang baru
    async refreshCurrentData() {
      const params = this.lastSearchParams || {
        search: '',
        tanggalAwal: '',
        tanggalAkhir: '',
      }
      await this.fetchPengadaan(
        this.pagination.currentPage,
        this.pagination.perPage,
        params.search,
        params.tanggalAwal,
        params.tanggalAkhir,
      )
    },
  },
})
