<script setup>
  import { ref, watch } from 'vue'
  import StaffResetCardElement from '@/components/StaffResetCardElement.vue'
  import { useResetPasswordStore } from '@/stores/resetStore'

  const props = defineProps({
    show: {
      type: Boolean,
      required: true,
    },
    isInline: {
      type: Boolean,
      default: false,
    },
  })
  const emit = defineEmits(['close'])

  const resetStore = useResetPasswordStore()
  const isRefreshing = ref(false)

  const fetchList = async () => {
    isRefreshing.value = true
    try {
      await resetStore.fetchResetRequests()
    } finally {
      isRefreshing.value = false
    }
  }

  const handleRefresh = async () => {
    await fetchList()
  }

  const handleClose = () => {
    emit('close')
  }

  // Watch untuk fetch data ketika popup dibuka
  watch(
    () => props.show,
    (newValue) => {
      if (newValue) {
        fetchList()
      }
    },
    { immediate: true },
  )
</script>

<template>
  <!-- Mode Inline (digunakan di dalam popup parent) -->
  <div v-if="isInline" class="flex-1 flex flex-col min-h-0">
    <!-- Error State -->
    <div
      v-if="resetStore.adminError && !isRefreshing"
      class="flex-1 flex items-center justify-center p-4 sm:p-6"
    >
      <div class="text-center max-w-md">
        <div
          class="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mb-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 sm:h-8 sm:w-8 text-red-500"
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
        </div>
        <p class="text-red-600 font-medium mb-2 text-sm sm:text-base">
          Gagal memuat data
        </p>
        <p class="text-gray-600 text-xs sm:text-sm mb-4">
          {{ resetStore.adminError }}
        </p>
        <button
          @click="handleRefresh"
          class="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          Coba Lagi
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="
        resetStore.resetRequests.length === 0 &&
        !resetStore.adminLoading &&
        !isRefreshing
      "
      class="flex-1 flex items-center justify-center p-4 sm:p-6"
    >
      <div class="text-center max-w-md">
        <div
          class="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 sm:h-8 sm:w-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p class="text-gray-500 font-medium mb-2 text-sm sm:text-base">
          Tidak ada permintaan
        </p>
        <p class="text-gray-400 text-xs sm:text-sm">
          Belum ada permintaan reset password
        </p>
      </div>
    </div>

    <!-- Data List with Loading Overlay -->
    <div v-else class="flex-1 overflow-hidden flex flex-col relative">
      <!-- Loading Overlay -->
      <div
        v-if="resetStore.adminLoading || isRefreshing"
        class="absolute inset-0 bg-white bg-opacity-80 z-10 flex items-center justify-center"
      >
        <div class="flex flex-col items-center gap-3">
          <div class="relative">
            <div
              class="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"
            ></div>
          </div>
          <p class="text-blue-600 font-medium">
            {{ isRefreshing ? 'Memperbarui data...' : 'Memuat data...' }}
          </p>
        </div>
      </div>
      <div
        class="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 transition-opacity duration-300"
        :class="{ 'opacity-40': resetStore.adminLoading || isRefreshing }"
      >
        <!-- Actual Data -->
        <div class="space-y-4">
          <StaffResetCardElement
            v-for="person in resetStore.resetRequests"
            :key="person.id"
            :person="person"
            @refresh="fetchList"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- Mode Full Screen (mode original) -->
  <section
    v-else-if="show"
    class="fixed inset-0 flex justify-center items-center z-50 p-4 sm:p-6 md:p-8"
  >
    <div class="w-full h-full bg-black opacity-10 absolute"></div>
    <div
      @click="handleClose"
      class="absolute inset-0 flex justify-center items-center p-4 sm:p-6 md:p-8"
    >
      <div
        @click.stop
        class="relative bg-white rounded-lg shadow-xl w-full max-w-[95vw] sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl h-full max-h-[90vh] sm:max-h-[85vh] md:max-h-[80vh] flex flex-col"
      >
        <!-- Header -->
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 md:px-8 py-4 sm:py-6 border-b border-gray-200 gap-3 sm:gap-4"
        >
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h2 class="text-lg sm:text-xl font-semibold text-[#0099FF]">
              Request Password Reset
            </h2>
            <div class="hidden sm:block h-6 w-px bg-gray-300"></div>
            <span class="text-sm text-gray-600">
              {{ resetStore.resetRequests.length }} permintaan
            </span>
          </div>

          <div class="flex items-center gap-3 flex-shrink-0">
            <!-- Refresh Button -->
            <button
              @click="handleRefresh"
              :disabled="isRefreshing || resetStore.adminLoading"
              class="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              title="Refresh Data"
            >
              <svg
                :class="{
                  'animate-spin': isRefreshing || resetStore.adminLoading,
                }"
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span class="hidden sm:inline font-medium">Refresh</span>
            </button>

            <!-- Close Button -->
            <button
              @click="handleClose"
              class="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="Tutup"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 flex flex-col min-h-0">
          <!-- Error State -->
          <div
            v-if="resetStore.adminError && !isRefreshing"
            class="flex-1 flex items-center justify-center p-4 sm:p-6"
          >
            <div class="text-center max-w-md">
              <div
                class="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mb-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 sm:h-8 sm:w-8 text-red-500"
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
              </div>
              <p class="text-red-600 font-medium mb-2 text-sm sm:text-base">
                Gagal memuat data
              </p>
              <p class="text-gray-600 text-xs sm:text-sm mb-4">
                {{ resetStore.adminError }}
              </p>
              <button
                @click="handleRefresh"
                class="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Coba Lagi
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-else-if="
              resetStore.resetRequests.length === 0 &&
              !resetStore.adminLoading &&
              !isRefreshing
            "
            class="flex-1 flex items-center justify-center p-4 sm:p-6"
          >
            <div class="text-center max-w-md">
              <div
                class="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-6 w-6 sm:h-8 sm:w-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p class="text-gray-500 font-medium mb-2 text-sm sm:text-base">
                Tidak ada permintaan
              </p>
              <p class="text-gray-400 text-xs sm:text-sm">
                Belum ada permintaan reset password
              </p>
            </div>
          </div>

          <!-- Data List with Loading Overlay -->
          <div v-else class="flex-1 overflow-hidden flex flex-col relative">
            <!-- Loading Overlay -->
            <div
              v-if="resetStore.adminLoading || isRefreshing"
              class="absolute inset-0 bg-white bg-opacity-80 z-10 flex items-center justify-center"
            >
              <div class="flex flex-col items-center gap-3">
                <div class="relative">
                  <div
                    class="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"
                  ></div>
                </div>
                <p class="text-blue-600 font-medium">
                  {{ isRefreshing ? 'Memperbarui data...' : 'Memuat data...' }}
                </p>
              </div>
            </div>
            <div
              class="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-4 transition-opacity duration-300"
              :class="{ 'opacity-40': resetStore.adminLoading || isRefreshing }"
            >
              <!-- Skeleton Loading untuk initial load -->
              <div
                v-if="
                  resetStore.adminLoading &&
                  resetStore.resetRequests.length === 0
                "
                class="space-y-4"
              >
                <div v-for="n in 3" :key="n" class="animate-pulse">
                  <div
                    class="flex bg-gray-50 border border-gray-200 rounded-xl p-6"
                  >
                    <div class="flex items-center gap-6 w-full">
                      <!-- Avatar skeleton -->
                      <div
                        class="w-20 h-20 bg-gray-300 rounded-full flex-shrink-0"
                      ></div>

                      <!-- Content skeleton -->
                      <div class="flex-1 space-y-3">
                        <div class="h-4 bg-gray-300 rounded w-1/3"></div>
                        <div class="h-3 bg-gray-300 rounded w-1/4"></div>
                        <div class="flex gap-3">
                          <div class="h-3 bg-gray-300 rounded w-24"></div>
                          <div class="h-6 bg-gray-300 rounded-full w-20"></div>
                        </div>
                      </div>

                      <!-- Buttons skeleton -->
                      <div class="flex gap-3">
                        <div class="w-12 h-12 bg-gray-300 rounded-full"></div>
                        <div class="w-12 h-12 bg-gray-300 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Actual Data -->
              <div v-else class="space-y-4">
                <StaffResetCardElement
                  v-for="person in resetStore.resetRequests"
                  :key="person.id"
                  :person="person"
                  @refresh="fetchList"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
  @keyframes shimmer {
    0% {
      background-position: -468px 0;
    }
    100% {
      background-position: 468px 0;
    }
  }

  .animate-pulse {
    animation: shimmer 2s infinite linear;
    background: linear-gradient(
      to right,
      #f6f7f8 0%,
      #eee 20%,
      #f6f7f8 40%,
      #f6f7f8 100%
    );
    background-size: 800px 104px;
  }
</style>
