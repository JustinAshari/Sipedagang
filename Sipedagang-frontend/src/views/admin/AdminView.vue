<script setup>
  import { RouterLink } from 'vue-router'
  import { computed } from 'vue'
  import { useAuthStore } from '@/stores/authStore'

  const authStore = useAuthStore()

  const person = computed(() => ({
    nama:
      authStore.user?.name ||
      authStore.user?.nama ||
      authStore.user?.nama_pengguna ||
      'Admin',
  }))
</script>

<template>
  <transition name="page" appear>
    <div class="flex flex-col py-3 px-2 sm:px-4 lg:px-8 overflow-hidden">
      <!-- Content Container -->
      <div class="relative max-w-6xl mx-auto flex flex-col">
        <!-- Welcome Section -->
        <div class="text-center mb-4 flex-shrink-0">
          <h1
            class="text-base sm:text-lg lg:text-2xl font-bold text-gray-800 mb-2 font-inter"
          >
            Halo, Selamat Datang
            <span
              class="block sm:inline text-blue-600 truncate max-w-[180px] sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto cursor-help"
              :title="person.nama"
              >{{ person.nama }}</span
            >
          </h1>
          <p class="text-xs sm:text-sm text-gray-600 max-w-xl mx-auto">
            Kelola data pengadaan dengan mudah
          </p>
        </div>

        <!-- Dashboard Cards Grid -->
        <div class="flex-1 flex justify-center min-h-0 pt-2 sm:pt-4">
          <div
            class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-x-6 w-full max-w-6xl"
          >
            <!-- Form Input Data Card -->
            <RouterLink
              to="/admin/form"
              class="group block transform transition-all duration-300 hover:scale-[1.02]"
            >
              <div
                class="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden border border-gray-100 min-h-[160px] sm:min-h-[200px] xl:min-h-[240px] h-auto"
              >
                <!-- Background Image -->
                <div class="absolute inset-0">
                  <img
                    src="@/assets/images/input-data.png"
                    alt="Form Input Data"
                    class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <!-- Dark overlay -->
                  <div class="absolute inset-0 bg-black/40"></div>
                  <!-- Gradient overlay on hover -->
                  <div
                    class="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  ></div>
                </div>

                <!-- Content Overlay -->
                <div
                  class="relative h-full flex flex-col justify-center items-center text-center p-3 sm:p-4"
                >
                  <!-- Icon -->
                  <div class="mb-2 sm:mb-3">
                    <svg
                      class="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      ></path>
                    </svg>
                  </div>

                  <!-- Text Content -->
                  <div class="space-y-1 sm:space-y-2">
                    <h3
                      class="text-base sm:text-lg md:text-xl font-bold text-white font-inter drop-shadow-lg"
                    >
                      Form Input Data
                    </h3>
                    <p
                      class="text-xs sm:text-sm text-white/90 leading-relaxed max-w-xs drop-shadow"
                    >
                      Input dan kelola data pengadaan baru
                    </p>
                  </div>

                  <!-- Action Button -->
                  <div class="mt-2 sm:mt-3">
                    <div
                      class="inline-flex items-center px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs sm:text-sm font-medium rounded-full group-hover:bg-white/30 transition-colors duration-300 border border-white/30"
                    >
                      Mulai Input
                      <svg
                        class="ml-1.5 w-3 h-3 group-hover:translate-x-1 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 5l7 7-7 7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </RouterLink>
            <!-- Lihat Data Card -->
            <RouterLink
              to="/admin/lihatdata"
              class="group block transform transition-all duration-300 hover:scale-[1.02]"
            >
              <div
                class="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden border border-gray-100 min-h-[160px] sm:min-h-[200px] xl:min-h-[240px] h-auto"
              >
                <!-- Background Image -->
                <div class="absolute inset-0">
                  <img
                    src="@/assets/images/rekap-data.png"
                    alt="Lihat Data"
                    class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <!-- Dark overlay -->
                  <div class="absolute inset-0 bg-black/40"></div>
                  <!-- Gradient overlay on hover -->
                  <div
                    class="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  ></div>
                </div>

                <!-- Content Overlay -->
                <div
                  class="relative h-full flex flex-col justify-center items-center text-center p-3 sm:p-4"
                >
                  <!-- Icon -->
                  <div class="mb-2 sm:mb-3">
                    <svg
                      class="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      ></path>
                    </svg>
                  </div>

                  <!-- Text Content -->
                  <div class="space-y-1 sm:space-y-2">
                    <h3
                      class="text-base sm:text-lg md:text-xl font-bold text-white font-inter drop-shadow-lg"
                    >
                      Lihat Data
                    </h3>
                    <p
                      class="text-xs sm:text-sm text-white/90 leading-relaxed max-w-xs drop-shadow"
                    >
                      Lihat dan kelola data pengadaan
                    </p>
                  </div>

                  <!-- Action Button -->
                  <div class="mt-2 sm:mt-3">
                    <div
                      class="inline-flex items-center px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs sm:text-sm font-medium rounded-full group-hover:bg-white/30 transition-colors duration-300 border border-white/30"
                    >
                      Lihat Data
                      <svg
                        class="ml-1.5 w-3 h-3 group-hover:translate-x-1 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 5l7 7-7 7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </RouterLink>
            <!-- Data Pemohon Card -->
            <RouterLink
              to="/admin/datapemohon"
              class="group block transform transition-all duration-300 hover:scale-[1.02]"
            >
              <div
                class="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden border border-gray-100 min-h-[160px] sm:min-h-[200px] xl:min-h-[240px] h-auto"
              >
                <!-- Background Image -->
                <div class="absolute inset-0">
                  <img
                    src="@/assets/images/data-pemohon.png"
                    alt="Data Pemohon"
                    class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <!-- Dark overlay -->
                  <div class="absolute inset-0 bg-black/40"></div>
                  <!-- Gradient overlay on hover -->
                  <div
                    class="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  ></div>
                </div>

                <!-- Content Overlay -->
                <div
                  class="relative h-full flex flex-col justify-center items-center text-center p-3 sm:p-4"
                >
                  <!-- Icon -->
                  <div class="mb-2 sm:mb-3">
                    <svg
                      class="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      ></path>
                    </svg>
                  </div>

                  <!-- Text Content -->
                  <div class="space-y-1 sm:space-y-2">
                    <h3
                      class="text-base sm:text-lg md:text-xl font-bold text-white font-inter drop-shadow-lg"
                    >
                      Data Pemohon
                    </h3>
                    <p
                      class="text-xs sm:text-sm text-white/90 leading-relaxed max-w-xs drop-shadow"
                    >
                      Kelola data pemohon dan supplier
                    </p>
                  </div>

                  <!-- Action Button -->
                  <div class="mt-2 sm:mt-3">
                    <div
                      class="inline-flex items-center px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs sm:text-sm font-medium rounded-full group-hover:bg-white/30 transition-colors duration-300 border border-white/30"
                    >
                      Kelola Data
                      <svg
                        class="ml-1.5 w-3 h-3 group-hover:translate-x-1 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 5l7 7-7 7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>
