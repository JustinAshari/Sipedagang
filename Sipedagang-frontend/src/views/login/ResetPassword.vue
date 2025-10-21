<script setup>
  import GuestLayout from '@/layouts/GuestLayout.vue'
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useResetPasswordStore } from '@/stores/resetStore'

  const router = useRouter()
  const resetPasswordStore = useResetPasswordStore()

  const username = ref('')

  // Computed properties dari store
  const isLoading = computed(() => resetPasswordStore.isLoading)
  const errorMessage = computed(() => resetPasswordStore.error)
  const successMessage = computed(() => resetPasswordStore.successMessage)
  const requestSent = computed(() => resetPasswordStore.isRequestSent)
  const hasError = computed(() => resetPasswordStore.hasError)

  const handleSubmit = async () => {
    if (!username.value.trim()) {
      resetPasswordStore.error = 'Nama pengguna harus diisi'
      resetPasswordStore.requestSent = true
      return
    }

    resetPasswordStore.clearMessages()

    const result = await resetPasswordStore.requestReset(username.value.trim())

    if (result.success) {
      setTimeout(() => {
        router.push('/resetpassword-accepted')
      }, 3000)
    }
  }

  const handleUsernameInput = () => {
    if (resetPasswordStore.hasError) {
      resetPasswordStore.clearMessages()
    }
  }

  const goToLogin = () => {
    resetPasswordStore.resetState()
    router.push('/')
  }

  const tryAgain = () => {
    resetPasswordStore.resetState()
  }
</script>

<template>
  <GuestLayout>
    <div class="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
      <!-- Reset Password Card -->
      <div class="bg-white rounded-lg w-full max-w-xs sm:max-w-sm md:max-w-md shadow-lg p-4 sm:p-6 md:p-8">
        <div class="text-center mb-6 sm:mb-8 font-poppins">
          <h1
            class="text-2xl sm:text-3xl font-bold flex justify-center items-center text-shadow-lg"
          >
            <div class="text-[#F0AB26]">Si</div>
            <div class="text-[#176BC7]">PEDAGANG</div>
          </h1>
          <div class="text-gray-600 mt-2 text-xs sm:text-sm px-2">
            Masukkan nama pengguna anda, kami akan memverifikasi akun anda
          </div>
        </div>

        <!-- Request Form -->
        <form
          v-if="!requestSent"
          @submit.prevent="handleSubmit"
          class="space-y-3 sm:space-y-4"
        >
          <!-- Username field -->
          <div>
            <label
              for="username"
              class="font-poppins block text-xs sm:text-sm text-gray-700 mb-1"
              >Nama Pengguna</label
            >
            <input
              id="username"
              type="text"
              v-model="username"
              @input="handleUsernameInput"
              class="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm sm:text-base"
              :disabled="isLoading"
              placeholder="Masukkan nama pengguna"
            />
          </div>

          <!-- Submit button -->
          <div class="pt-2">
            <button
              type="submit"
              class="w-full bg-[#176BC7] text-white py-2 sm:py-2.5 rounded-full font-medium font-poppins hover:bg-[#0099FF] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              :disabled="isLoading"
            >
              <div v-if="isLoading" class="flex items-center justify-center">
                <svg
                  class="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Memproses...
              </div>
              <div v-else>Kirim Tautan Reset</div>
            </button>
          </div>

          <!-- Help text -->
          <div class="font-poppins text-center text-gray-500 text-xs sm:text-sm pt-2">
            Tidak bisa mengakses? hubungi SuperAdmin
          </div>
        </form>

        <!-- Success or Error message after request sent -->
        <div v-else class="space-y-4 sm:space-y-6 text-center">
          <!-- Success State -->
          <div
            v-if="!hasError"
            class="p-3 sm:p-4 bg-green-50 text-green-700 rounded-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-green-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 class="font-medium mb-1 text-sm sm:text-base">Verifikasi Pengguna Berhasil!</h3>
            <p class="text-xs sm:text-sm">
              {{
                successMessage ||
                'Nama pengguna telah dikonfirmasi. Anda akan dialihkan ke halaman reset kata sandi.'
              }}
            </p>
            <div class="mt-2 text-sm">
              <div
                class="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500"
              ></div>
              <div
                class="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500 mx-1"
              ></div>
              <div
                class="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500"
              ></div>
            </div>
          </div>

          <!-- Error State -->
          <div v-else class="p-3 sm:p-4 bg-red-50 text-red-700 rounded-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-red-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h3 class="font-medium mb-1 text-sm sm:text-base">Verifikasi Pengguna Gagal!</h3>
            <p class="text-xs sm:text-sm">
              {{
                errorMessage ||
                'Terjadi kesalahan saat memverifikasi nama pengguna.'
              }}
            </p>

            <!-- Try Again Button -->
            <div class="mt-3 sm:mt-4">
              <button
                @click="tryAgain"
                class="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-poppins text-xs sm:text-sm"
              >
                Coba Lagi
              </button>
            </div>
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
    input[type="text"] {
      font-size: 16px; /* Prevents zoom on iOS */
    }
  }

  /* Loading spinner animation */
  .animate-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
