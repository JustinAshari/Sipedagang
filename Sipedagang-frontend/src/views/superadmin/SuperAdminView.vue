<script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useUserStore } from '@/stores/userStore'
  import { useDashboardStore } from '@/stores/dashboardStore'
  import CategoryPieChart from '@/components/CategoryPieChart.vue'

  const userStore = useUserStore()
  const dashboard = useDashboardStore()

  const userName = computed(
    () => userStore.user?.name || userStore.user?.nama_pengguna || 'Superadmin',
  )

  // Optimized time system with cleanup
  const currentTime = ref(new Date())
  let timeInterval = null

  const timeBasedGreeting = computed(() => {
    const hour = currentTime.value.getHours()
    const clock = currentTime.value
      .toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      .replace(/\./g, ':')

    let greeting = ''
    let icon = ''
    if (hour < 12) {
      greeting = 'Selamat Pagi'
      icon = '🌅'
    } else if (hour < 16) {
      greeting = 'Selamat Siang'
      icon = '☀️'
    } else if (hour < 18) {
      greeting = 'Selamat Sore'
      icon = '🌤️'
    } else {
      greeting = 'Selamat Malam'
      icon = '🌙'
    }

    return { greeting, clock, icon }
  })

  // Enhanced current month with day
  const currentPeriod = computed(() => {
    const now = currentTime.value
    return {
      month: now.toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric',
      }),
      day: now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric' }),
      fullDate: now.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    }
  })

  // Enhanced loading states
  const isLoading = computed(() => dashboard.loading)
  const hasError = computed(() => dashboard.error)

  // Refresh functionality
  const refreshData = async () => {
    await dashboard.fetchDashboardData()
  }

  onMounted(async () => {
    timeInterval = setInterval(() => {
      currentTime.value = new Date()
    }, 1000)

    // ✅ REMOVED: Tidak perlu fetch user data lagi di dashboard
    // SuperAdminLayout sudah handle user data dengan optimal
    console.log('🏗️ Dashboard mounted: Using existing user data from layout')

    // Hanya refresh dashboard data
    await refreshData()
  })

  onUnmounted(() => {
    if (timeInterval) {
      clearInterval(timeInterval)
    }
  })
</script>

<template>
  <section
    class="w-full h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50"
  >
    <!-- ✅ Hero Section with Enhanced Welcome (RESTORED) -->
    <div
      class="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800"
    >
      <!-- Animated Background Pattern -->
      <div class="absolute inset-0 opacity-10">
        <div
          class="absolute top-0 left-0 w-32 h-32 sm:w-48 sm:h-48 lg:w-72 lg:h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-pulse transform -translate-x-16 -translate-y-16 sm:-translate-x-24 sm:-translate-y-24 lg:-translate-x-36 lg:-translate-y-36"
        ></div>
        <div
          class="absolute top-16 right-10 w-24 h-24 sm:w-32 sm:h-32 lg:w-48 lg:h-48 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000 transform translate-x-12 sm:translate-x-16 lg:translate-x-24"
        ></div>
        <div
          class="absolute bottom-0 right-0 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000 transform translate-x-24 translate-y-24 sm:translate-x-32 sm:translate-y-32 lg:translate-x-48 lg:translate-y-48"
        ></div>
      </div>

      <!-- Geometric Decorations -->
      <div class="absolute inset-0 overflow-hidden">
        <div
          class="absolute top-10 left-10 sm:top-20 sm:left-20 w-2 h-2 sm:w-4 sm:h-4 bg-white/20 rounded-full"
        ></div>
        <div
          class="absolute top-20 left-20 sm:top-40 sm:left-40 w-1 h-1 sm:w-2 sm:h-2 bg-white/30 rounded-full"
        ></div>
        <div
          class="absolute top-30 right-30 sm:top-60 sm:right-60 w-2 h-2 sm:w-3 sm:h-3 bg-white/25 rounded-full"
        ></div>
        <div
          class="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 w-3 h-3 sm:w-6 sm:h-6 bg-white/15 rounded-full"
        ></div>
      </div>

      <div
        class="relative px-3 sm:px-4 md:px-8 lg:px-12 py-8 sm:py-12 lg:py-16 xl:py-20"
      >
        <div class="max-w-7xl mx-auto text-center">
          <!-- Welcome Content -->
          <div class="space-y-3 sm:space-y-4">
            <div
              class="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-4 sm:mb-6"
            >
              <div
                class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full mr-2 sm:mr-3 animate-pulse"
              ></div>
              <span class="text-white/90 text-xs sm:text-sm font-medium"
                >Dashboard Active</span
              >
            </div>

            <h1
              class="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight px-2"
            >
              {{ timeBasedGreeting.greeting }}, {{ userName }}!
              <span class="inline-block animate-bounce ml-2">{{
                timeBasedGreeting.icon
              }}</span>
            </h1>

            <p
              class="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 font-light max-w-3xl mx-auto leading-relaxed px-2"
            >
              <span
                class="font-mono font-semibold text-white text-sm sm:text-base md:text-lg lg:text-xl"
                >{{ timeBasedGreeting.clock }}</span
              >
            </p>

            <div
              class="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6 mt-6 sm:mt-8 text-blue-100 px-2"
            >
              <div class="flex items-center space-x-2">
                <svg
                  class="w-4 h-4 sm:w-5 sm:h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-xs sm:text-sm">Sistem Aktif</span>
              </div>
              <div class="flex items-center space-x-2">
                <svg
                  class="w-4 h-4 sm:w-5 sm:h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-xs sm:text-sm">{{
                  new Date().toLocaleDateString('id-ID')
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Dashboard Content -->
    <div class="relative px-3 sm:px-4 md:px-8 lg:px-12 py-6 sm:py-8 lg:py-12">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1
            class="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800 mb-4"
          >
            Ringkasan Dashboard
          </h1>
          <p class="text-lg sm:text-xl text-slate-600 mb-6">
            Overview data utama sistem pengadaan untuk monitoring dan analisis
            performa
          </p>

          <!-- Current Period Display -->
          <div class="flex items-center justify-center space-x-3 sm:space-x-4">
            <div class="flex items-center space-x-2">
              <svg
                class="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span class="text-sm text-gray-600 font-medium">Periode:</span>
            </div>
            <div
              class="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-lg border border-blue-300/20 backdrop-blur-sm"
            >
              {{ currentPeriod.month }}
            </div>
          </div>
        </div>

        <!-- Loading Indicator -->
        <div v-if="isLoading" class="text-center py-8">
          <div class="inline-flex items-center space-x-2">
            <div
              class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"
            ></div>
            <span class="text-gray-600">Memuat data statistik...</span>
          </div>
        </div>

        <!-- Enhanced Stats Grid with Full Circle Pie Charts -->
        <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          <!-- Pengadaan Categories Pie Chart (Filtered by current month) -->
          <CategoryPieChart
            title="Distribusi Jenis Pengadaan"
            :data="dashboard.pengadaanCategories"
            type="pengadaan"
            :loading="dashboard.loading"
          />

          <!-- Admin Status Pie Chart (Total, not filtered) -->
          <CategoryPieChart
            title="Status Admin"
            :data="{
              'Admin Aktif': dashboard.adminStats.active,
              'Admin Nonaktif': dashboard.adminStats.inactive,
            }"
            type="admin"
            :loading="dashboard.loading"
          />
        </div>
        <!-- Period Info -->
        <div v-if="!isLoading" class="mt-12 text-center">
          <p class="text-sm text-gray-500">
            Data pengadaan ditampilkan untuk bulan
            <span class="font-semibold">{{ currentPeriod.month }}</span> • Data
            admin menampilkan total keseluruhan
          </p>
        </div>
        <div class="mt-12 px-2">
          <!-- Summary Cards Section -->
          <div v-if="!isLoading" class="mb-12">
            <div class="max-w-6xl mx-auto">
              <!-- Section Title -->
              <div class="text-center mb-8">
                <h3 class="text-2xl font-bold text-slate-800 mb-2">
                  Ringkasan Statistik
                </h3>
                <p class="text-gray-600">
                  Data terkini sistem pengadaan dan manajemen admin
                </p>
              </div>
              <!-- Cards Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- Pengadaan Card -->
                <div
                  class="group relative bg-gradient-to-br from-blue-50 to-blue-100/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-blue-200/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
                >
                  <!-- Background Pattern -->
                  <div
                    class="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                  >
                    <svg
                      class="w-full h-full"
                      viewBox="0 0 100 100"
                      fill="currentColor"
                    >
                      <pattern
                        id="blue-pattern"
                        patternUnits="userSpaceOnUse"
                        width="20"
                        height="20"
                      >
                        <circle cx="10" cy="10" r="2" fill="currentColor" />
                      </pattern>
                      <rect
                        width="100"
                        height="100"
                        fill="url(#blue-pattern)"
                      />
                    </svg>
                  </div>

                  <!-- Icon -->
                  <div
                    class="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg"
                  >
                    <svg
                      class="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>

                  <!-- Content -->
                  <div class="relative">
                    <div
                      class="text-3xl font-bold text-blue-600 mb-1 group-hover:text-blue-700 transition-colors"
                    >
                      {{ dashboard.stats.totalPengadaan }}
                    </div>
                    <div class="text-sm font-medium text-gray-700">
                      Pengadaan {{ currentPeriod.month }}
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                      Data bulan berjalan
                    </div>
                  </div>

                  <!-- Shine Effect -->
                  <div
                    class="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
                  ></div>
                </div>

                <!-- Total Admin Card -->
                <div
                  class="group relative bg-gradient-to-br from-gray-50 to-gray-100/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
                >
                  <!-- Background Pattern -->
                  <div
                    class="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                  >
                    <svg
                      class="w-full h-full"
                      viewBox="0 0 100 100"
                      fill="currentColor"
                    >
                      <pattern
                        id="gray-pattern"
                        patternUnits="userSpaceOnUse"
                        width="20"
                        height="20"
                      >
                        <rect
                          x="8"
                          y="8"
                          width="4"
                          height="4"
                          fill="currentColor"
                        />
                      </pattern>
                      <rect
                        width="100"
                        height="100"
                        fill="url(#gray-pattern)"
                      />
                    </svg>
                  </div>

                  <!-- Icon -->
                  <div
                    class="relative w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg"
                  >
                    <svg
                      class="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  </div>

                  <!-- Content -->
                  <div class="relative">
                    <div
                      class="text-3xl font-bold text-gray-700 mb-1 group-hover:text-gray-800 transition-colors"
                    >
                      {{ dashboard.stats.totalAdmin }}
                    </div>
                    <div class="text-sm font-medium text-gray-700">
                      Total Admin
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                      Seluruh pengguna admin
                    </div>
                  </div>

                  <!-- Shine Effect -->
                  <div
                    class="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
                  ></div>
                </div>

                <!-- Admin Aktif Card -->
                <div
                  class="group relative bg-gradient-to-br from-green-50 to-green-100/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-green-200/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
                >
                  <!-- Background Pattern -->
                  <div
                    class="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                  >
                    <svg
                      class="w-full h-full"
                      viewBox="0 0 100 100"
                      fill="currentColor"
                    >
                      <pattern
                        id="green-pattern"
                        patternUnits="userSpaceOnUse"
                        width="15"
                        height="15"
                      >
                        <polygon
                          points="7.5,2 12,12 3,12"
                          fill="currentColor"
                          opacity="0.3"
                        />
                      </pattern>
                      <rect
                        width="100"
                        height="100"
                        fill="url(#green-pattern)"
                      />
                    </svg>
                  </div>

                  <!-- Icon -->
                  <div
                    class="relative w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg"
                  >
                    <svg
                      class="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>

                  <!-- Content -->
                  <div class="relative">
                    <div
                      class="text-3xl font-bold text-green-600 mb-1 group-hover:text-green-700 transition-colors"
                    >
                      {{ dashboard.adminStats.active }}
                    </div>
                    <div class="text-sm font-medium text-gray-700">
                      Admin Aktif
                    </div>
                    <div class="text-xs text-gray-500 mt-1">Status aktif</div>
                  </div>

                  <!-- Pulse Indicator -->
                  <div
                    class="absolute top-4 right-4 w-3 h-3 bg-green-400 rounded-full animate-pulse"
                  ></div>

                  <!-- Shine Effect -->
                  <div
                    class="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
                  ></div>
                </div>

                <!-- Admin Nonaktif Card -->
                <div
                  class="group relative bg-gradient-to-br from-red-50 to-red-100/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-red-200/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
                >
                  <!-- Background Pattern -->
                  <div
                    class="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
                  >
                    <svg
                      class="w-full h-full"
                      viewBox="0 0 100 100"
                      fill="currentColor"
                    >
                      <pattern
                        id="red-pattern"
                        patternUnits="userSpaceOnUse"
                        width="18"
                        height="18"
                      >
                        <line
                          x1="4"
                          y1="4"
                          x2="14"
                          y2="14"
                          stroke="currentColor"
                          stroke-width="1"
                          opacity="0.3"
                        />
                        <line
                          x1="14"
                          y1="4"
                          x2="4"
                          y2="14"
                          stroke="currentColor"
                          stroke-width="1"
                          opacity="0.3"
                        />
                      </pattern>
                      <rect width="100" height="100" fill="url(#red-pattern)" />
                    </svg>
                  </div>

                  <!-- Icon -->
                  <div
                    class="relative w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg"
                  >
                    <svg
                      class="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>

                  <!-- Content -->
                  <div class="relative">
                    <div
                      class="text-3xl font-bold text-red-600 mb-1 group-hover:text-red-700 transition-colors"
                    >
                      {{ dashboard.adminStats.inactive }}
                    </div>
                    <div class="text-sm font-medium text-gray-700">
                      Admin Nonaktif
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                      Status nonaktif
                    </div>
                  </div>

                  <!-- Warning Indicator -->
                  <div
                    class="absolute top-4 right-4 w-3 h-3 bg-red-400 rounded-full"
                  ></div>

                  <!-- Shine Effect -->
                  <div
                    class="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Info Section with Summary Cards -->
      <div class="max-w-7xl mx-auto">
        <div class="mt-12 sm:mt-16 px-2">
          <!-- Super Admin Info Card -->
          <div class="text-center">
            <div
              class="bg-white/60 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div class="flex items-center justify-center mb-4">
                <div class="flex -space-x-2">
                  <div
                    class="w-10 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full border-3 border-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-300"
                  >
                    <svg
                      class="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <div
                    class="w-10 h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-full border-3 border-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-300"
                  >
                    <svg
                      class="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <div
                    class="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full border-3 border-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-300"
                  >
                    <svg
                      class="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <h3 class="text-xl font-bold text-gray-800 mb-2">Super Admin</h3>
              <p class="text-gray-600">
                Mengelola sistem pengadaan secara efisien
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="text-center pb-6 text-gray-600 text-[10px] sm:text-sm">
      <p>Copyright @ 2025 Pengadaan Komoditas Kantor Cabang Surakarta</p>
    </div>
  </section>
</template>

<style scoped>
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.8;
    }
  }

  .animation-delay-2000 {
    animation-delay: 2s;
  }

  .animation-delay-4000 {
    animation-delay: 4s;
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Additional responsive utilities */
  @media (max-width: 640px) {
    .max-w-7xl {
      max-width: 100%;
    }
  }

  @media (min-width: 640px) and (max-width: 768px) {
    .grid-cols-1.sm\:grid-cols-2.lg\:grid-cols-4 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
