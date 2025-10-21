<script setup>
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
  import { useRouter } from 'vue-router'
  import MainElement from '@/components/MainElement.vue'
  import PengadaanIconElement from '@/components/PengadaanIconElement.vue'
  import { useSettingPengadaanStore } from '@/stores/settingPengadaanStore'
  import Swal from 'sweetalert2'

  const router = useRouter()
  const settingPengadaanStore = useSettingPengadaanStore()

  // State
  const showMenu = ref(false)

  // Computed
  const data = computed(() => settingPengadaanStore.pengaturanPengadaan || [])
  const isLoading = computed(() => settingPengadaanStore.isLoading)
  const hasError = computed(() => settingPengadaanStore.error !== null)
  const error = computed(() => settingPengadaanStore.error)

  // Methods
  const fetchData = async () => {
    try {
      await settingPengadaanStore.fetchPengaturanPengadaan()
    } catch (error) {
      console.error('Error fetching pengaturan pengadaan:', error)
      Swal.fire({
        title: 'Error!',
        text: 'Gagal memuat data pengaturan pengadaan',
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'OK',
      })
    }
  }

  const handleEdit = (pengadaan) => {
    router.push(`/superadmin/settingpengadaan-edit/${pengadaan.id}`)
  }

  const handleDelete = async (pengadaan) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      html: `Data pengaturan pengadaan <strong>${pengadaan.jenis_pengadaan_barang}</strong> akan dihapus permanent!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
      reverseButtons: true,
    })

    if (result.isConfirmed) {
      try {
        await settingPengadaanStore.deletePengaturanPengadaan(pengadaan.id)

        Swal.fire({
          title: 'Berhasil!',
          text: 'Data pengaturan pengadaan berhasil dihapus',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true,
        })

        // Refresh data
        await fetchData()
      } catch (error) {
        console.error('Error deleting pengaturan pengadaan:', error)
        Swal.fire({
          title: 'Error!',
          text: error.message || 'Gagal menghapus data pengaturan pengadaan',
          icon: 'error',
          confirmButtonColor: '#d33',
          confirmButtonText: 'OK',
        })
      }
    }
  }

  const toTitleCase = (str) => {
    if (!str) return '-'
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Format currency
  const formatCurrency = (value) => {
    if (!value) return 'Rp 0'
    const numericValue = parseFloat(value)
    return `Rp ${numericValue.toLocaleString('id-ID')}`
  }

  // Navigate to input form
  function handleInputPengadaan() {
    router.push('/superadmin/settingpengadaan')
  }

  // Menu handlers
  const handleInputAndClose = () => {
    handleInputPengadaan()
    showMenu.value = false
  }

  // Click outside handler
  const dropdownDesktopRef = ref(null)
  const dropdownMobileRef = ref(null)

  const handleClickOutside = (event) => {
    if (!showMenu.value) return

    const clickedInsideDesktop = dropdownDesktopRef.value?.contains(
      event.target,
    )
    const clickedInsideMobile = dropdownMobileRef.value?.contains(event.target)

    if (!clickedInsideDesktop && !clickedInsideMobile) {
      showMenu.value = false
    }
  }

  // Lifecycle
  onMounted(() => {
    document.addEventListener('click', handleClickOutside)
    fetchData()
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
  })
</script>

<template>
  <MainElement>
    <section
      class="flex flex-col justify-between min-h-full px-2 sm:px-4 lg:px-4 pb-6 sm:pb-4"
    >
      <div>
        <!-- Header Section -->
        <section
          class="flex flex-col gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8"
        >
          <!-- Title dan Action Menu untuk desktop -->
          <div
            class="hidden lg:grid lg:grid-cols-2 lg:items-center lg:justify-between"
          >
            <!-- Title -->
            <div class="flex items-center gap-4">
              <div
                class="font-semibold text-base sm:text-lg lg:text-xl text-[#0099FF] underline underline-offset-4 lg:underline-offset-8"
              >
                Daftar Pengaturan Pengadaan
              </div>
            </div>

            <!-- Action Menu untuk desktop -->
            <div class="flex justify-end items-center">
              <div ref="dropdownDesktopRef" class="relative flex-shrink-0">
                <button
                  @click="showMenu = !showMenu"
                  class="inline-flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <svg
                    class="w-4 h-4 text-gray-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                    ></path>
                  </svg>
                  <span class="text-sm font-medium text-gray-700">Aksi</span>
                  <svg
                    class="w-3 h-3 ml-1 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </button>

                <!-- Dropdown Menu -->
                <div
                  v-show="showMenu"
                  class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 transform transition-all duration-200 origin-top-right"
                  :class="
                    showMenu ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                  "
                >
                  <div class="py-2">
                    <!-- Input Setting Pengadaan -->
                    <button
                      @click="handleInputAndClose"
                      :disabled="isLoading"
                      class="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div class="w-4 h-4 mr-3">
                        <PengadaanIconElement
                          color="none"
                          stroke="#0099FF"
                          class="-ml-0.5 -mt-[2.8px]"
                        />
                      </div>
                      Input Setting Pengadaan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Layout untuk mobile/tablet -->
          <div class="lg:hidden">
            <!-- Title dan Action Menu untuk mobile -->
            <div class="flex items-center justify-between mb-3">
              <div
                class="font-semibold text-base sm:text-lg text-[#0099FF] underline underline-offset-4"
              >
                Daftar Pengaturan Pengadaan
              </div>

              <!-- Action Menu untuk mobile -->
              <div ref="dropdownMobileRef" class="relative flex-shrink-0">
                <button
                  @click="showMenu = !showMenu"
                  class="inline-flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <svg
                    class="w-4 h-4 text-gray-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                    ></path>
                  </svg>
                  <span class="text-sm font-medium text-gray-700">Aksi</span>
                  <svg
                    class="w-3 h-3 ml-1 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </button>

                <!-- Dropdown Menu untuk mobile -->
                <div
                  v-show="showMenu"
                  class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-20 transform transition-all duration-200 origin-top-right"
                  :class="
                    showMenu ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                  "
                >
                  <div class="py-2">
                    <!-- Input Setting Pengadaan -->
                    <button
                      @click="handleInputAndClose"
                      :disabled="isLoading"
                      class="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div class="w-4 h-4 mr-3">
                        <PengadaanIconElement
                          color="none"
                          stroke="#0099FF"
                          class="-ml-0.5 -mt-[2.8px]"
                        />
                      </div>
                      Input Setting Pengadaan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Table Container -->
        <section
          class="relative text-xs sm:text-sm overflow-hidden rounded-lg shadow-sm border border-gray-200"
        >
          <!-- Mobile Card View -->
          <div class="block lg:hidden">
            <!-- Loading State -->
            <div
              v-if="isLoading"
              class="flex justify-center items-center h-64 bg-white"
            >
              <div class="text-center">
                <div
                  class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500 mx-auto mb-2"
                ></div>
                <div class="text-gray-500 text-xs sm:text-sm">
                  Memuat data...
                </div>
              </div>
            </div>

            <!-- Error State -->
            <div
              v-else-if="hasError"
              class="flex justify-center items-center h-64 bg-white"
            >
              <div class="text-red-500 text-center p-4">
                <div class="text-red-400 mb-2">
                  <svg
                    class="w-8 h-8 sm:w-10 sm:h-10 mx-auto"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <p class="text-sm mb-3">{{ error }}</p>
                <button
                  @click="fetchData()"
                  class="px-4 py-2 bg-[#0099ff] text-white rounded-lg hover:bg-blue-600 text-xs sm:text-sm transition-colors duration-200"
                >
                  Coba Lagi
                </button>
              </div>
            </div>

            <!-- Data Cards -->
            <div v-else class="bg-gray-50">
              <template v-if="data.length === 0">
                <div class="py-16 text-center text-gray-400 bg-white">
                  <div class="text-gray-300 mb-3">
                    <svg
                      class="w-12 h-12 sm:w-16 sm:h-16 mx-auto"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <p class="text-sm sm:text-base">
                    Tidak ada data pengaturan pengadaan
                  </p>
                  <p class="text-xs text-gray-300 mt-1">
                    Belum ada data pengaturan pengadaan yang tersedia
                  </p>
                </div>
              </template>
              <template v-else>
                <div
                  class="space-y-2 sm:space-y-3 p-3 sm:p-4 max-h-[calc(100vh-250px)] sm:max-h-[calc(100vh-260px)] lg:max-h-[calc(100vh-100px)] overflow-y-auto"
                >
                  <div
                    v-for="(pengadaan, index) in data"
                    :key="pengadaan.id || index"
                    class="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
                  >
                    <!-- Header with actions -->
                    <div class="flex justify-between items-start mb-3">
                      <div class="flex-1 min-w-0">
                        <h4
                          class="font-medium text-sm sm:text-base text-gray-900 mb-1"
                        >
                          {{ toTitleCase(pengadaan.jenis_pengadaan_barang) }}
                        </h4>
                        <p class="text-xs sm:text-sm text-gray-600">
                          {{ formatCurrency(pengadaan.harga_per_satuan) }} per
                          {{ pengadaan.satuan }}
                        </p>
                      </div>
                      <!-- Action buttons -->
                      <div class="flex flex-col space-y-1 sm:space-y-1.5 ml-2">
                        <!-- Edit Button -->
                        <button
                          @click="handleEdit(pengadaan)"
                          class="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-150 min-w-[70px]"
                        >
                          <svg
                            class="w-3 h-3 mr-1"
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
                          Edit
                        </button>
                        <!-- Delete Button -->
                        <button
                          @click="handleDelete(pengadaan)"
                          class="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all duration-150 min-w-[70px]"
                        >
                          <svg
                            class="w-3 h-3 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            ></path>
                          </svg>
                          Hapus
                        </button>
                      </div>
                    </div>

                    <!-- Content Grid -->
                    <div
                      class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm"
                    >
                      <div class="space-y-1">
                        <span class="text-gray-500 font-medium">Satuan:</span>
                        <p class="font-medium text-gray-900">
                          <span
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {{ pengadaan.satuan || '-' }}
                          </span>
                        </p>
                      </div>
                      <div class="space-y-1">
                        <span class="text-gray-500 font-medium">PPN:</span>
                        <p class="font-medium text-gray-900">
                          {{ pengadaan.ppn }}%
                        </p>
                      </div>
                      <div class="space-y-1">
                        <span class="text-gray-500 font-medium">PPh:</span>
                        <p class="font-medium text-gray-900">
                          {{ pengadaan.pph }}%
                        </p>
                      </div>
                      <div class="space-y-1">
                        <span class="text-gray-500 font-medium">Harga:</span>
                        <p class="font-medium text-gray-900 text-xs font-mono">
                          {{ formatCurrency(pengadaan.harga_per_satuan) }}
                        </p>
                      </div>
                    </div>

                    <!-- Footer -->
                    <div
                      class="flex justify-end items-center mt-3 pt-3 border-t border-gray-100"
                    >
                      <div class="flex items-center space-x-2">
                        <span
                          class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full"
                        >
                          {{ index + 1 }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Desktop Table View -->
          <div class="hidden lg:block">
            <div class="overflow-x-auto">
              <!-- Loading State -->
              <div
                v-if="isLoading"
                class="flex justify-center items-center h-64"
              >
                <div class="text-center">
                  <div
                    class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"
                  ></div>
                  <div class="text-gray-500">Memuat data...</div>
                </div>
              </div>

              <!-- Error State -->
              <div
                v-else-if="hasError"
                class="flex justify-center items-center h-64"
              >
                <div class="text-red-500 text-center">
                  <div class="text-red-400 mb-3">
                    <svg
                      class="w-12 h-12 mx-auto"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <p class="mb-4">{{ error }}</p>
                  <button
                    @click="fetchData()"
                    class="px-6 py-2 bg-[#0099ff] text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                  >
                    Coba Lagi
                  </button>
                </div>
              </div>

              <!-- Data Table -->
              <div v-else class="overflow-y-auto max-h-[calc(100vh-255px)]">
                <table class="w-full">
                  <thead class="sticky top-0 z-10">
                    <tr
                      class="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 text-xs border-b border-gray-200"
                    >
                      <th
                        class="px-4 py-3 rounded-tl-xl text-center font-semibold w-16"
                      >
                        No
                      </th>
                      <th class="px-3 py-3 text-left font-semibold w-40">
                        Jenis Pengadaan Barang
                      </th>
                      <th class="px-3 py-3 text-center font-semibold w-24">
                        Satuan
                      </th>
                      <th class="px-3 py-3 font-semibold w-36 text-center">
                        Harga Per Satuan
                      </th>
                      <th class="px-3 py-3 font-semibold w-20 text-center">
                        PPN (%)
                      </th>
                      <th class="px-3 py-3 font-semibold w-20 text-center">
                        PPh (%)
                      </th>
                      <th
                        class="px-3 py-3 rounded-tr-xl font-semibold w-32 text-center"
                      >
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-if="data.length === 0">
                      <tr>
                        <td
                          colspan="7"
                          class="py-16 text-center text-gray-400 bg-gray-50"
                        >
                          <div class="text-gray-300 mb-3">
                            <svg
                              class="w-16 h-16 mx-auto"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z"
                                clip-rule="evenodd"
                              />
                            </svg>
                          </div>
                          <p class="text-base">
                            Tidak ada data pengaturan pengadaan
                          </p>
                          <p class="text-sm text-gray-300 mt-2">
                            Belum ada data pengaturan pengadaan yang tersedia
                          </p>
                        </td>
                      </tr>
                    </template>
                    <template v-else>
                      <tr
                        v-for="(pengadaan, index) in data"
                        :key="pengadaan.id || index"
                        :class="[
                          index % 2 === 0
                            ? 'bg-white hover:bg-gray-50'
                            : 'bg-gray-50/50 hover:bg-gray-100/50',
                          'border-b border-[#E4E7EC] cursor-pointer transition-all duration-200 ease-in-out',
                        ]"
                      >
                        <!-- No -->
                        <td class="px-4 py-3 text-center w-16">
                          <div
                            class="text-xs font-semibold text-gray-700 bg-blue-50 rounded-full w-8 h-8 flex items-center justify-center mx-auto"
                          >
                            {{ index + 1 }}
                          </div>
                        </td>

                        <!-- Jenis Pengadaan Barang -->
                        <td class="px-3 py-3 text-left w-40">
                          <div
                            class="text-xs font-medium text-gray-900"
                            :title="
                              toTitleCase(pengadaan.jenis_pengadaan_barang)
                            "
                          >
                            {{ toTitleCase(pengadaan.jenis_pengadaan_barang) }}
                          </div>
                        </td>

                        <!-- Satuan -->
                        <td class="px-3 py-3 text-center w-24">
                          <span
                            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {{ pengadaan.satuan || '-' }}
                          </span>
                        </td>

                        <!-- Harga Per Satuan -->
                        <td class="px-3 py-3 text-center w-36">
                          <div
                            class="text-sm font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded"
                            :title="formatCurrency(pengadaan.harga_per_satuan)"
                          >
                            {{ formatCurrency(pengadaan.harga_per_satuan) }}
                          </div>
                        </td>

                        <!-- PPN -->
                        <td class="px-3 py-3 text-center w-20">
                          <div class="text-xs text-gray-700">
                            {{ pengadaan.ppn }}%
                          </div>
                        </td>

                        <!-- PPh -->
                        <td class="px-3 py-3 text-center w-20">
                          <div class="text-xs text-gray-700">
                            {{ pengadaan.pph }}%
                          </div>
                        </td>

                        <!-- Aksi -->
                        <td class="px-3 py-3 w-32">
                          <div
                            class="flex space-x-1.5 justify-center items-center"
                          >
                            <!-- Edit Button -->
                            <button
                              @click="handleEdit(pengadaan)"
                              class="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-150"
                              title="Edit data pengaturan pengadaan"
                            >
                              <svg
                                class="w-3 h-3 mr-1"
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
                              Edit
                            </button>

                            <!-- Delete Button -->
                            <button
                              @click="handleDelete(pengadaan)"
                              class="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all duration-150"
                              title="Hapus data pengaturan pengadaan"
                            >
                              <svg
                                class="w-3 h-3 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                ></path>
                              </svg>
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <!-- Data count info -->
        <div
          v-if="data.length > 0"
          class="mt-4 text-center text-gray-500 text-xs"
        >
          <span> Total {{ data.length }} data pengaturan pengadaan </span>
        </div>
      </div>
    </section>
  </MainElement>
</template>
