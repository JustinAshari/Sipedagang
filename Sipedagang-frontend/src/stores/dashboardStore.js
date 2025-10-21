import { defineStore } from 'pinia'
import {
  fetchDashboardStats,
  fetchPengadaanByCategory,
} from '@/services/dashboardService'
import { fetchAdminStats } from '@/services/adminService'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    stats: {
      totalPengadaan: 0,
      totalAdmin: 0,
      activeAdmin: 0,
      inactiveAdmin: 0,
    },
    pengadaanCategories: {},
    adminStats: {
      active: 0,
      inactive: 0,
    },
    loading: false,
    error: null,
  }),

  actions: {
    async fetchDashboardData() {
      this.loading = true
      this.error = null

      try {
        // Fetch pengadaan data dengan filter bulan saat ini
        const currentDate = new Date()
        const currentMonth = currentDate.getMonth() + 1 // 1-12
        const currentYear = currentDate.getFullYear()

        const [pengadaanData, pengadaanCategories, adminStats] =
          await Promise.all([
            fetchDashboardStats(currentMonth, currentYear), // ✅ Filtered by month/year
            fetchPengadaanByCategory(currentMonth, currentYear), // ✅ Filtered by month/year
            fetchAdminStats(), // Admin stats total (tidak difilter per bulan)
          ])

        // Update state
        this.stats = {
          totalPengadaan: pengadaanData.length || 0, // ✅ Will be 0 if no data
          totalAdmin: adminStats.total,
          activeAdmin: adminStats.active,
          inactiveAdmin: adminStats.inactive,
        }

        this.pengadaanCategories = pengadaanCategories // ✅ Will be {} if no data
        this.adminStats = {
          active: adminStats.active,
          inactive: adminStats.inactive,
        }

        console.log('Dashboard stats updated:', this.stats)
        console.log(
          'Pengadaan categories for current month:',
          this.pengadaanCategories,
        )
        console.log('Admin stats (total):', this.adminStats)
      } catch (error) {
        console.error('Dashboard: Error fetching data:', error)
        this.error = error.message || 'Gagal mengambil data dashboard'

        // Set default values on error
        this.stats = {
          totalPengadaan: 0,
          totalAdmin: 0,
          activeAdmin: 0,
          inactiveAdmin: 0,
        }
        this.pengadaanCategories = {}
        this.adminStats = { active: 0, inactive: 0 }
      } finally {
        this.loading = false
      }
    },

    async refreshStats() {
      await this.fetchDashboardData()
    },
  },
})
