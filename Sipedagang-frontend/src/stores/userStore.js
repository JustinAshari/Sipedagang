import { defineStore } from 'pinia'
import { getCurrentUser, updateUserProfile } from '@/services/userService'

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null,
    loading: false,
    error: null,
  }),

  getters: {
    isLoading: (state) => state.loading,
    hasError: (state) => !!state.error,
    user: (state) => state.currentUser,
  },

  actions: {
    async fetchCurrentUser() {
      this.loading = true
      this.error = null
      try {
        const userData = await getCurrentUser()
        this.currentUser = userData
        console.log('✅ UserStore: User data fetched:', userData.name)
        return userData
      } catch (error) {
        console.error('❌ UserStore: Error fetching current user:', error)
        this.error = error
        this.currentUser = null
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateProfile(profileData) {
      this.loading = true
      this.error = null
      try {
        const updatedUser = await updateUserProfile(profileData)

        // ✅ SIMPLIFIED: Update current user data langsung
        if (updatedUser) {
          this.currentUser = updatedUser
          console.log('✅ UserStore: Profile updated:', updatedUser.name)
        }

        return updatedUser
      } catch (error) {
        console.error('❌ UserStore: Error updating profile:', error)
        this.error = error
        throw error
      } finally {
        this.loading = false
      }
    },

    clearUser() {
      this.currentUser = null
      this.error = null
    },

    clearError() {
      this.error = null
    },
  },
})
