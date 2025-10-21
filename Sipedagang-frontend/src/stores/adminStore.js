import { defineStore } from 'pinia'
import { fetchAdminList } from '@/services/adminService'

export const useAdminStore = defineStore('admin', {
  state: () => ({
    admins: [],
    loading: false,
    error: null,
  }),
  actions: {
    async getAdmins(search = '', status = '') {
      console.log(
        'Store: getAdmins called with search:',
        search,
        'status:',
        status,
      )
      this.loading = true
      this.error = null
      try {
        const result = await fetchAdminList(search, status)
        console.log('Store: API response:', result)
        this.admins = result || []
      } catch (e) {
        console.error('Store: Error fetching admins:', e)
        this.error = e
        this.admins = []
      } finally {
        this.loading = false
      }
    },

    async refreshAdmins() {
      await this.getAdmins('', '')
    },
  },
})
