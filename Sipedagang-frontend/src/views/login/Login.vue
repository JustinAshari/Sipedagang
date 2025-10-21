<script setup>
  import GuestLayout from '@/layouts/GuestLayout.vue'
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/authStore'
  import { useUserStore } from '@/stores/userStore'

  const router = useRouter()
  const auth = useAuthStore()
  const userStore = useUserStore()
  const nama_pengguna = ref('')
  const password = ref('')
  const rememberMe = ref(false) // ✅ Tambah remember me state
  const isLoading = ref(false)
  const errorMessage = ref('')
  const showPassword = ref(false)

  const validateInput = () => {
    const errors = []

    if (!nama_pengguna.value.trim()) {
      errors.push('Nama pengguna harus diisi')
    } else if (nama_pengguna.value.trim().length < 3) {
      errors.push('Nama pengguna minimal 3 karakter')
    }

    if (!password.value) {
      errors.push('Kata sandi harus diisi')
    } else if (password.value.length < 6) {
      errors.push('Kata sandi minimal 6 karakter')
    }

    return errors
  }

  const handleLogin = async () => {
    // Clear previous errors
    errorMessage.value = ''

    // Validate input
    const validationErrors = validateInput()
    if (validationErrors.length > 0) {
      errorMessage.value = validationErrors[0]
      return
    }

    isLoading.value = true

    try {
      // ✅ Pass remember me value to login
      await auth.login(
        nama_pengguna.value.trim(),
        password.value,
        rememberMe.value,
      )
      // Setelah login, fetch user baru
      await userStore.fetchCurrentUser()

      // Redirect based on role
      const role = auth.user?.role
      if (role === 'admin') {
        router.push('/admin/dashboard')
      } else if (role === 'superadmin') {
        router.push('/superadmin/dashboard')
      } else {
        errorMessage.value = 'Role tidak dikenal'
      }
    } catch (error) {
      errorMessage.value = auth.error || 'Login gagal, silakan coba lagi'
    } finally {
      isLoading.value = false
    }
  }

  const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value
  }

  // Check if already authenticated
  onMounted(() => {
    // ✅ Initialize auth state
    auth.initializeAuth()

    if (auth.isAuthenticated) {
      const role = auth.userRole
      if (role === 'admin') {
        router.push('/admin/dashboard')
      } else if (role === 'superadmin') {
        router.push('/superadmin/dashboard')
      }
    }
  })
</script>

<template>
  <GuestLayout>
    <div class="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
      <!-- Login Card -->
      <div class="bg-white rounded-lg w-full max-w-xs sm:max-w-sm md:max-w-md shadow-xl p-4 sm:p-6 md:p-8">
        <!-- Logo and Title -->
        <div class="text-center mb-6 sm:mb-8 font-poppins">
          <h1
            class="text-2xl sm:text-3xl font-bold flex justify-center items-center text-shadow-lg"
          >
            <div class="text-[#F0AB26]">Si</div>
            <div class="text-[#176BC7]">PEDAGANG</div>
          </h1>
          <div class="text-gray-600 mt-2 text-xs sm:text-sm">
            Silahkan login terlebih dahulu
          </div>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="space-y-3 sm:space-y-4">
          <!-- Error message if any -->
          <div
            v-if="errorMessage"
            class="text-center bg-red-100 text-red-700 p-2 sm:p-3 rounded text-xs sm:text-sm"
          >
            {{ errorMessage }}
          </div>

          <!-- Username field -->
          <div>
            <label
              for="nama_pengguna"
              class="font-poppins block text-xs sm:text-sm text-gray-700 mb-1"
              >Nama Pengguna</label
            >
            <input
              id="nama_pengguna"
              type="text"
              v-model="nama_pengguna"
              class="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>

          <!-- Password field with toggle visibility -->
          <div>
            <label
              for="password"
              class="font-poppins block text-xs sm:text-sm text-gray-700 mb-1"
              >Kata Sandi</label
            >
            <div class="relative">
              <input
                id="password"
                :type="showPassword ? 'text' : 'password'"
                v-model="password"
                class="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 pr-10 text-sm sm:text-base"
              />
              <button
                type="button"
                @click="togglePasswordVisibility"
                class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none p-1"
              >
                <!-- Eye icon when password is hidden -->
                <svg
                  v-if="!showPassword"
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
                <!-- Crossed eye icon when password is visible -->
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

          <!-- ✅ Remember Me Checkbox -->
          <div class="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              v-model="rememberMe"
              class="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label for="remember-me" class="ml-2 block text-xs sm:text-sm text-gray-700">
              Ingat saya
            </label>
          </div>

          <!-- Login button -->
          <div class="pt-2">
            <button
              type="submit"
              class="w-full bg-[#176BC7] text-white py-2 sm:py-2.5 rounded-full font-semibold font-poppins hover:bg-[#0099FF] transition-colors duration-200 ease-in-out cursor-pointer disabled:opacity-50 text-sm sm:text-base"
              :disabled="isLoading"
            >
              <div v-if="isLoading">Loading...</div>
              <div v-else>Login</div>
            </button>
          </div>

          <!-- Forgot password link -->
          <div class="text-center pt-2">
            <router-link
              to="/resetpassword"
              class="text-xs sm:text-sm text-blue-600 hover:underline"
            >
              Lupa kata sandi?
            </router-link>
          </div>
        </form>
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

  input[type='password']::-webkit-credentials-auto-fill-button {
    display: none;
  }

  .cropper-container {
    background: linear-gradient(145deg, #f8f9fa, #e9ecef);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #dee2e6;
  }

  /* Additional responsive styles */
  @media (max-width: 640px) {
    .min-h-screen {
      min-height: 100vh;
      min-height: 100dvh; /* Dynamic viewport height for mobile browsers */
    }
  }

  /* Ensure proper touch targets on mobile */
  @media (max-width: 640px) {
    button {
      min-height: 44px; /* iOS recommended touch target size */
    }
    
    input[type="checkbox"] {
      min-width: 16px;
      min-height: 16px;
    }
  }

  /* Prevent zoom on input focus on iOS */
  @media screen and (max-width: 640px) {
    input[type="text"],
    input[type="password"] {
      font-size: 16px; /* Prevents zoom on iOS */
    }
  }
</style>
