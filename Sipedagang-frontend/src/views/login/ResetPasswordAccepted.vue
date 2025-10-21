<script setup>
  import GuestLayout from '@/layouts/GuestLayout.vue'
  import { ref, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useResetPasswordStore } from '@/stores/resetStore'

  const router = useRouter()
  const route = useRoute()
  const resetStore = useResetPasswordStore()

  const namapengguna = ref('')
  const newPassword = ref('')
  const confirmPassword = ref('')
  const isLoading = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')
  const showNewPassword = ref(false)
  const showConfirmPassword = ref(false)

  onMounted(() => {
    // Get nama_pengguna from route params, query, or store
    namapengguna.value =
      route.params.namapengguna ||
      route.query.namapengguna ||
      route.query.nama_pengguna ||
      resetStore.requestedUsername ||
      ''

    if (!namapengguna.value) {
      errorMessage.value =
        'Nama pengguna tidak ditemukan. Silakan kembali ke halaman reset password.'
    }
  })

  const handleSubmit = async () => {
    // Clear previous messages
    errorMessage.value = ''
    successMessage.value = ''

    // Validation
    if (!namapengguna.value) {
      errorMessage.value = 'Nama pengguna tidak ditemukan'
      return
    }

    if (!newPassword.value) {
      errorMessage.value = 'Password baru harus diisi'
      return
    }

    if (newPassword.value.length < 6) {
      errorMessage.value = 'Password baru minimal 6 karakter'
      return
    }

    if (!confirmPassword.value) {
      errorMessage.value = 'Konfirmasi password harus diisi'
      return
    }

    if (newPassword.value !== confirmPassword.value) {
      errorMessage.value = 'Password baru dan konfirmasi password tidak sama'
      return
    }

    isLoading.value = true

    try {
      const result = await resetStore.resetPasswordWithUsername(
        namapengguna.value,
        newPassword.value,
        confirmPassword.value,
      )

      if (result.success) {
        successMessage.value = result.message || 'Password berhasil direset'

        // Clear the stored username after successful reset
        resetStore.clearRequestedUsername()

        // Remove automatic redirect - let user manually go to login
      } else {
        errorMessage.value = result.error || 'Gagal mereset password'
      }
    } catch (error) {
      errorMessage.value = 'Terjadi kesalahan, silakan coba lagi'
      console.error('Reset password error:', error)
    } finally {
      isLoading.value = false
    }
  }

  const toggleNewPasswordVisibility = () => {
    showNewPassword.value = !showNewPassword.value
  }

  const toggleConfirmPasswordVisibility = () => {
    showConfirmPassword.value = !showConfirmPassword.value
  }

  const goToLogin = () => {
    router.push('/')
  }
</script>

<template>
  <GuestLayout>
    <div class="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
      <!-- Reset Password Card -->
      <div class="bg-white rounded-lg w-full max-w-xs sm:max-w-sm md:max-w-md shadow-lg p-4 sm:p-6 md:p-8">
        <!-- Logo and Title -->
        <div class="text-center mb-6 sm:mb-8 font-poppins">
          <h1
            class="text-2xl sm:text-3xl font-bold flex justify-center items-center text-shadow-lg"
          >
            <div class="text-[#F0AB26]">Si</div>
            <div class="text-[#176BC7]">PEDAGANG</div>
          </h1>
          <div class="text-gray-600 mt-2 text-xs sm:text-sm px-2">
            Masukkan password baru untuk akun:
            <strong class="break-all">{{ namapengguna }}</strong>
          </div>
        </div>

        <!-- Reset Password Form -->
        <form
          v-if="!successMessage"
          @submit.prevent="handleSubmit"
          class="space-y-3 sm:space-y-4"
        >
          <!-- Error message -->
          <div
            v-if="errorMessage"
            class="text-center bg-red-100 text-red-700 p-2 sm:p-3 rounded text-xs sm:text-sm"
          >
            {{ errorMessage }}
          </div>

          <!-- New Password field -->
          <div>
            <label
              for="newPassword"
              class="font-poppins block text-xs sm:text-sm text-gray-700 mb-1"
              >Password Baru</label
            >
            <div class="relative">
              <input
                id="newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                v-model="newPassword"
                class="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 pr-10 text-sm sm:text-base font-inter"
                placeholder="Masukkan password baru (min. 6 karakter)"
                :disabled="isLoading"
              />
              <button
                type="button"
                @click="toggleNewPasswordVisibility"
                class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none p-1"
                :disabled="isLoading"
              >
                <svg
                  v-if="!showNewPassword"
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 sm:h-5 sm:w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 sm:h-5 sm:w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Confirm Password field -->
          <div>
            <label
              for="confirmPassword"
              class="font-poppins block text-xs sm:text-sm text-gray-700 mb-1"
              >Konfirmasi Password Baru</label
            >
            <div class="relative">
              <input
                id="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                v-model="confirmPassword"
                class="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 pr-10 text-sm sm:text-base"
                placeholder="Masukkan ulang password baru"
                :disabled="isLoading"
              />
              <button
                type="button"
                @click="toggleConfirmPasswordVisibility"
                class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none p-1"
                :disabled="isLoading"
              >
                <svg
                  v-if="!showConfirmPassword"
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 sm:h-5 sm:w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Submit button -->
          <div class="pt-2">
            <button
              type="submit"
              class="w-full bg-[#176BC7] text-white py-2 sm:py-2.5 rounded-full font-medium hover:bg-[#0099FF] transition-colors duration-200 ease-in-out cursor-pointer font-poppins disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              :disabled="isLoading || !namapengguna"
            >
              <div v-if="isLoading">Mereset Password...</div>
              <div v-else>Reset Password</div>
            </button>
          </div>
        </form>

        <!-- Success message -->
        <div v-else class="space-y-4 sm:space-y-6 text-center">
          <div class="p-3 sm:p-4 bg-blue-50 text-blue-700 rounded-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-blue-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 class="font-medium mb-1 text-sm sm:text-base">Password Berhasil Direset!</h3>
            <p class="text-xs sm:text-sm pb-2">
              {{ successMessage }}
            </p>
            <p class="text-xs sm:text-sm text-blue-600">
              Silakan klik tombol di bawah untuk kembali ke halaman login.
            </p>
          </div>
        </div>

        <!-- Return to login -->
        <div class="mt-6 sm:mt-8 pt-3 sm:pt-4 text-center border-t border-gray-200">
          <button
            @click="goToLogin"
            class="text-[#0099FF] hover:underline bg-gray-100 w-full py-2.5 sm:py-3 rounded-md cursor-pointer font-poppins text-sm sm:text-base"
          >
            Kembali ke Halaman Login
          </button>
        </div>
      </div>
    </div>
  </GuestLayout>
</template>

<style scoped>
  input[type='password']::-ms-reveal,
  input[type='password']::-ms-clear {
    display: none;
  }

  input[type='password']::-webkit-textfield-decoration-container,
  input[type='password']::-webkit-reveal {
    display: none;
  }

  /* For newer Edge versions */
  input[type='password']::-webkit-credentials-auto-fill-button {
    display: none;
  }

  .cropper-container {
    background: linear-gradient(145deg, #f8f9fa, #e9ecef);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #dee2e6;
  }

  /* Mobile-specific enhancements */
  @media (max-width: 640px) {
    .min-h-screen {
      min-height: 100vh;
      min-height: 100dvh; /* Dynamic viewport height for mobile browsers */
    }
    
    button {
      min-height: 44px; /* iOS recommended touch target size */
    }
  }

  /* Prevent zoom on input focus on iOS */
  @media screen and (max-width: 640px) {
    input[type="text"],
    input[type="password"] {
      font-size: 16px; /* Prevents zoom on iOS */
    }
  }

  /* Break long usernames on small screens */
  .break-all {
    word-break: break-all;
  }
</style>
