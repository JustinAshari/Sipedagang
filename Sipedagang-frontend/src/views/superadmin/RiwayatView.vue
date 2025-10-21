<script setup>
  import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
  import MainElement from '@/components/MainElement.vue'
  import RiwayatElement from '@/components/RiwayatElement.vue'
  import PageElement from '@/components/PageElement.vue'
  import { usePengadaanStore } from '@/stores/pengadaanStore'
  import Swal from 'sweetalert2'

  const pengadaanStore = usePengadaanStore()

  const data = computed(() => pengadaanStore.pengadaanList)
  const currentPage = computed(() => pengadaanStore.pagination.currentPage)
  const totalPages = computed(() => pengadaanStore.pagination.lastPage)

  const searchText = ref('')
  const tanggalAwal = ref('')
  const tanggalAkhir = ref('')
  const itemsPerPage = ref(10)

  // ✅ State untuk dropdown date picker - pisahkan untuk desktop dan mobile
  const showDatePickerDesktop = ref(false)
  const showDatePickerMobile = ref(false)

  // ✅ Functions untuk clear filters
  const clearDateFilter = () => {
    tanggalAwal.value = ''
    tanggalAkhir.value = ''
    showDatePickerDesktop.value = false
    showDatePickerMobile.value = false
  }

  const clearAllFilters = () => {
    searchText.value = ''
    tanggalAwal.value = ''
    tanggalAkhir.value = ''
    showDatePickerDesktop.value = false
    showDatePickerMobile.value = false
  }

  // ✅ Apply date filter dan tutup dropdown
  const applyDateFilterDesktop = () => {
    showDatePickerDesktop.value = false
  }

  const applyDateFilterMobile = () => {
    showDatePickerMobile.value = false
  }

  // ✅ Computed untuk check filter
  const hasDateFilter = computed(() => {
    return tanggalAwal.value || tanggalAkhir.value
  })

  const hasActiveFilters = computed(() => {
    return searchText.value || tanggalAwal.value || tanggalAkhir.value
  })

  // ✅ Format tanggal untuk display
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // ✅ Close dropdown saat klik di luar - pisahkan untuk desktop dan mobile
  const datePickerDesktopRef = ref(null)
  const datePickerMobileRef = ref(null)

  const handleClickOutside = (event) => {
    // Check desktop dropdown
    if (
      datePickerDesktopRef.value &&
      !datePickerDesktopRef.value.contains(event.target)
    ) {
      showDatePickerDesktop.value = false
    }
    // Check mobile dropdown
    if (
      datePickerMobileRef.value &&
      !datePickerMobileRef.value.contains(event.target)
    ) {
      showDatePickerMobile.value = false
    }
  }

  async function fetchData(page = 1) {
    try {
      await pengadaanStore.fetchPengadaan(
        page,
        itemsPerPage.value,
        searchText.value,
        tanggalAwal.value,
        tanggalAkhir.value,
      )
    } catch (error) {
      console.error('Fetch error:', error)
    }
  }

  onMounted(() => {
    document.addEventListener('click', handleClickOutside)
    fetchData()
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })

  function handlePageChange(page) {
    fetchData(page)
  }

  let searchTimeout = null
  watch([searchText, tanggalAwal, tanggalAkhir], () => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    searchTimeout = setTimeout(() => {
      fetchData(1)
    }, 500)
  })

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: 'Data yang dihapus tidak dapat dikembalikan!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
    })

    if (result.isConfirmed) {
      try {
        await pengadaanStore.deletePengadaan(item.id)

        Swal.fire({
          title: 'Berhasil!',
          text: 'Data berhasil dihapus',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true,
        })
      } catch (error) {
        Swal.fire({
          title: 'Error!',
          text: error.message || 'Terjadi kesalahan saat menghapus data',
          icon: 'error',
          confirmButtonColor: '#d33',
        })
      }
    }
  }

  const refreshData = () => {
    pengadaanStore.refreshCurrentData()
  }

  const openPrintPreview = (itemId) => {
    window.open(`/surat-preview/${itemId}`, '_blank')
  }

  const formatKuantum = (value) => {
    if (!value || value === 'N/A') {
      return value // Jika tidak ada nilai atau 'N/A', kembalikan apa adanya
    }

    const stringValue = String(value)
    const parts = stringValue.split(' ') // Memisahkan angka dan satuan, misal: "600000 LITER" -> ["600000", "LITER"]

    const numberPart = parts[0]
    const unitPart = parts.slice(1).join(' ') // Cek apakah bagian pertama adalah angka

    if (isNaN(numberPart)) {
      return value // Jika bukan angka, kembalikan nilai asli
    } // Format bagian angka dengan titik pemisah ribuan

    const formattedNumber = numberPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.') // Gabungkan kembali dengan satuannya (jika ada)

    return unitPart ? `${formattedNumber} ${unitPart}` : formattedNumber
  }
</script>

<template>
  <MainElement>
    <section
      class="flex flex-col justify-between min-h-full px-2 sm:px-4 lg:px-4 pb-6 sm:pb-4"
    >
      <div>
        <!-- ✅ PERBAIKAN: Header dengan layout responsive seperti LihatDataPemohonView -->
        <section
          class="flex flex-col gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8"
        >
          <!-- Title dan Search untuk desktop -->
          <div
            class="hidden lg:grid lg:grid-cols-2 lg:items-center lg:justify-between"
          >
            <!-- Title -->
            <div
              class="font-semibold text-base sm:text-lg lg:text-xl text-[#0099FF] underline underline-offset-4 lg:underline-offset-8"
            >
              Riwayat Pengadaan
            </div>

            <!-- Search dan Filter untuk desktop -->
            <div class="flex justify-end items-center gap-2 sm:gap-3 lg:gap-4">
              <!-- Search result info compact di sebelah kiri search (desktop) -->
              <div v-if="searchText">
                <span
                  class="inline-flex items-center px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-md"
                >
                  <svg
                    class="w-3 h-3 mr-1 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    ></path>
                  </svg>
                  <span class="truncate max-w-[120px]">
                    "{{ searchText }}"
                  </span>
                  <span
                    v-if="pengadaanStore.pagination?.total !== undefined"
                    class="ml-1 text-gray-600 flex-shrink-0"
                  >
                    ({{ pengadaanStore.pagination.total }})
                  </span>
                  <button
                    @click="searchText = ''"
                    class="ml-1.5 text-blue-600 hover:text-blue-800 flex-shrink-0"
                    title="Hapus pencarian"
                  >
                    <svg
                      class="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </span>
              </div>

              <!-- Container untuk Search Input dan Filter (desktop) -->
              <div class="flex items-center gap-2 sm:gap-3">
                <!-- Search input (desktop) -->
                <div class="relative min-w-[280px]">
                  <input
                    type="text"
                    placeholder="Cari data pengadaan..."
                    v-model="searchText"
                    class="border border-[#D9D9D9] rounded-lg h-10 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0099ff] focus:border-[#0099ff] transition-all duration-200 w-full"
                  />
                  <!-- Clear search button -->
                  <button
                    v-if="searchText"
                    @click="searchText = ''"
                    class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                  <!-- Search icon -->
                  <div
                    v-else
                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      ></path>
                    </svg>
                  </div>
                </div>

                <!-- ✅ Date Filter Button (desktop) - PERBAIKAN -->
                <div class="relative flex-shrink-0" ref="datePickerDesktopRef">
                  <button
                    @click.stop="showDatePickerDesktop = !showDatePickerDesktop"
                    class="flex items-center gap-2 border border-[#D9D9D9] rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0099ff] focus:border-[#0099ff] transition-all duration-200 bg-white hover:bg-gray-50 min-w-[140px]"
                    :class="{
                      'ring-2 ring-[#0099ff] border-[#0099ff]':
                        showDatePickerDesktop,
                      'bg-blue-50 border-blue-300 text-blue-700': hasDateFilter,
                    }"
                  >
                    <!-- Calendar Icon -->
                    <svg
                      class="w-4 h-4 flex-shrink-0"
                      :class="hasDateFilter ? 'text-blue-600' : 'text-gray-500'"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clip-rule="evenodd"
                      />
                    </svg>

                    <!-- Button Text -->
                    <span class="whitespace-nowrap flex-1 text-left min-w-0">
                      <span
                        v-if="hasDateFilter"
                        class="font-medium truncate block"
                      >
                        <span v-if="tanggalAwal && tanggalAkhir">
                          {{ formatDateDisplay(tanggalAwal) }} -
                          {{ formatDateDisplay(tanggalAkhir) }}
                        </span>
                        <span v-else-if="tanggalAwal">
                          Dari {{ formatDateDisplay(tanggalAwal) }}
                        </span>
                        <span v-else-if="tanggalAkhir">
                          Sampai {{ formatDateDisplay(tanggalAkhir) }}
                        </span>
                      </span>
                      <span v-else class="text-gray-600 truncate block">
                        Filter Tanggal
                      </span>
                    </span>

                    <!-- Dropdown Arrow -->
                    <svg
                      class="w-3 h-3 text-gray-400 transition-transform duration-200 flex-shrink-0"
                      :class="{ 'rotate-180': showDatePickerDesktop }"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>

                  <!-- ✅ Dropdown Date Picker Desktop -->
                  <div
                    v-if="showDatePickerDesktop"
                    @click.stop
                    class="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-80 p-4"
                  >
                    <div class="space-y-4">
                      <!-- Header -->
                      <div
                        class="flex items-center justify-between pb-3 border-b border-gray-100"
                      >
                        <h4 class="text-sm font-semibold text-gray-700">
                          Pilih Rentang Tanggal
                        </h4>
                        <button
                          @click.stop="showDatePickerDesktop = false"
                          class="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <svg
                            class="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clip-rule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>

                      <!-- Date Inputs -->
                      <div class="space-y-4">
                        <div>
                          <label
                            class="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Tanggal Awal
                          </label>
                          <input
                            type="date"
                            v-model="tanggalAwal"
                            @click.stop
                            class="w-full border border-gray-300 rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0099ff] focus:border-[#0099ff] transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label
                            class="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Tanggal Akhir
                          </label>
                          <input
                            type="date"
                            v-model="tanggalAkhir"
                            :min="tanggalAwal"
                            @click.stop
                            class="w-full border border-gray-300 rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0099ff] focus:border-[#0099ff] transition-all duration-200"
                          />
                        </div>
                      </div>

                      <!-- Action Buttons -->
                      <div class="flex gap-3 pt-3 border-t border-gray-100">
                        <button
                          @click.stop="clearDateFilter"
                          class="flex-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
                        >
                          Reset
                        </button>
                        <button
                          @click.stop="applyDateFilterDesktop"
                          class="flex-1 px-4 py-2 text-sm text-white bg-[#0099ff] hover:bg-blue-600 rounded-lg transition-colors duration-200 font-medium"
                        >
                          Terapkan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- ✅ Reset Button - Hanya muncul jika ada filter tanggal -->
                <button
                  v-if="hasDateFilter"
                  @click="clearDateFilter"
                  class="px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200 whitespace-nowrap flex items-center gap-1 flex-shrink-0 lg:hidden"
                  title="Reset filter tanggal"
                >
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  Reset
                </button>
              </div>
            </div>
          </div>

          <!-- ✅ Layout untuk mobile/tablet -->
          <div class="lg:hidden">
            <!-- Title untuk mobile -->
            <div class="flex items-center justify-between mb-3">
              <div
                class="font-semibold text-base sm:text-lg text-[#0099FF] underline underline-offset-4"
              >
                Riwayat Pengadaan
              </div>
            </div>

            <!-- ✅ Search dan Filter untuk mobile -->
            <div class="space-y-2">
              <!-- Search input w-full untuk mobile -->
              <div class="relative w-full">
                <input
                  type="text"
                  placeholder="Cari data pengadaan..."
                  v-model="searchText"
                  class="border border-[#D9D9D9] rounded-lg h-9 sm:h-10 px-3 sm:px-4 pr-10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0099ff] focus:border-[#0099ff] transition-all duration-200 w-full"
                />
                <!-- Clear search button -->
                <button
                  v-if="searchText"
                  @click="searchText = ''"
                  class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
                <!-- Search icon -->
                <div
                  v-else
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                >
                  <svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    ></path>
                  </svg>
                </div>
              </div>

              <!-- Container untuk Date Filter dan Reset Button -->
              <div class="flex gap-2">
                <!-- ✅ Date Filter Button untuk mobile - PERBAIKAN -->
                <div class="relative flex-1" ref="datePickerMobileRef">
                  <button
                    @click.stop="showDatePickerMobile = !showDatePickerMobile"
                    class="flex items-center gap-2 border border-[#D9D9D9] rounded-lg h-9 sm:h-10 px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0099ff] focus:border-[#0099ff] transition-all duration-200 bg-white hover:bg-gray-50 w-full"
                    :class="{
                      'ring-2 ring-[#0099ff] border-[#0099ff]':
                        showDatePickerMobile,
                      'bg-blue-50 border-blue-300 text-blue-700': hasDateFilter,
                    }"
                  >
                    <!-- Calendar Icon -->
                    <svg
                      class="w-4 h-4 flex-shrink-0"
                      :class="hasDateFilter ? 'text-blue-600' : 'text-gray-500'"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clip-rule="evenodd"
                      />
                    </svg>

                    <!-- Button Text -->
                    <span class="whitespace-nowrap flex-1 text-left min-w-0">
                      <span
                        v-if="hasDateFilter"
                        class="font-medium truncate block"
                      >
                        <span
                          v-if="tanggalAwal && tanggalAkhir"
                          class="hidden sm:inline"
                        >
                          {{ formatDateDisplay(tanggalAwal) }} -
                          {{ formatDateDisplay(tanggalAkhir) }}
                        </span>
                        <span
                          v-if="tanggalAwal && tanggalAkhir"
                          class="sm:hidden"
                        >
                          Filter Aktif
                        </span>
                        <span v-else-if="tanggalAwal">
                          Dari {{ formatDateDisplay(tanggalAwal) }}
                        </span>
                        <span v-else-if="tanggalAkhir">
                          Sampai {{ formatDateDisplay(tanggalAkhir) }}
                        </span>
                      </span>
                      <span v-else class="text-gray-600 truncate block">
                        <span class="hidden sm:inline">Filter Tanggal</span>
                        <span class="sm:hidden">Tanggal</span>
                      </span>
                    </span>

                    <!-- Dropdown Arrow -->
                    <svg
                      class="w-3 h-3 text-gray-400 transition-transform duration-200 flex-shrink-0"
                      :class="{ 'rotate-180': showDatePickerMobile }"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>

                  <!-- ✅ Dropdown Date Picker untuk mobile -->
                  <div
                    v-if="showDatePickerMobile"
                    @click.stop
                    class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4"
                  >
                    <div class="space-y-4">
                      <!-- Header -->
                      <div
                        class="flex items-center justify-between pb-3 border-b border-gray-100"
                      >
                        <h4 class="text-sm font-semibold text-gray-700">
                          Pilih Rentang Tanggal
                        </h4>
                        <button
                          @click.stop="showDatePickerMobile = false"
                          class="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <svg
                            class="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clip-rule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>

                      <!-- Date Inputs -->
                      <div class="space-y-4">
                        <div>
                          <label
                            class="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Tanggal Awal
                          </label>
                          <input
                            type="date"
                            v-model="tanggalAwal"
                            @click.stop
                            class="w-full border border-gray-300 rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0099ff] focus:border-[#0099ff] transition-all duration-200"
                          />
                        </div>
                        <div>
                          <label
                            class="block text-sm font-medium text-gray-700 mb-2"
                          >
                            Tanggal Akhir
                          </label>
                          <input
                            type="date"
                            v-model="tanggalAkhir"
                            :min="tanggalAwal"
                            @click.stop
                            class="w-full border border-gray-300 rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0099ff] focus:border-[#0099ff] transition-all duration-200"
                          />
                        </div>
                      </div>

                      <!-- Action Buttons -->
                      <div class="flex gap-3 pt-3 border-t border-gray-100">
                        <button
                          @click.stop="clearDateFilter"
                          class="flex-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
                        >
                          Reset
                        </button>
                        <button
                          @click.stop="applyDateFilterMobile"
                          class="flex-1 px-4 py-2 text-sm text-white bg-[#0099ff] hover:bg-blue-600 rounded-lg transition-colors duration-200 font-medium"
                        >
                          Terapkan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- ✅ Reset Button - Hanya muncul jika ada filter tanggal -->
                <button
                  v-if="hasDateFilter"
                  @click="clearDateFilter"
                  class="px-3 py-2 text-xs sm:text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200 whitespace-nowrap flex items-center gap-1 flex-shrink-0"
                  title="Reset filter tanggal"
                >
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span class="hidden sm:inline">Reset</span>
                </button>
              </div>

              <!-- Search result info di bawah search input untuk mobile -->
              <div v-if="searchText">
                <span
                  class="inline-flex items-center px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-md"
                >
                  <svg
                    class="w-3 h-3 mr-1 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    ></path>
                  </svg>
                  <span class="truncate max-w-[150px] sm:max-w-[200px]">
                    "{{ searchText }}"
                  </span>
                  <span
                    v-if="pengadaanStore.pagination?.total !== undefined"
                    class="ml-1 text-gray-600 flex-shrink-0"
                  >
                    ({{ pengadaanStore.pagination.total }})
                  </span>
                  <button
                    @click="searchText = ''"
                    class="ml-1.5 text-blue-600 hover:text-blue-800 flex-shrink-0"
                    title="Hapus pencarian"
                  >
                    <svg
                      class="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Table Container -->
        <section
          class="relative text-xs sm:text-sm overflow-hidden rounded-lg shadow-sm border border-gray-200 lg:mt-6"
        >
          <!-- Mobile Card View -->
          <div class="block lg:hidden">
            <!-- Loading state -->
            <div
              v-if="pengadaanStore.isLoading"
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
            <!-- Error state -->
            <div
              v-else-if="pengadaanStore.hasError"
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
                <p class="text-sm mb-3">{{ pengadaanStore.error }}</p>
                <button
                  @click="fetchData(currentPage)"
                  class="px-4 py-2 bg-[#0099ff] text-white rounded-lg hover:bg-blue-600 text-xs sm:text-sm transition-colors duration-200"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
            <!-- Data -->
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
                  <p class="text-sm sm:text-base">Tidak ada data yang sesuai</p>
                  <p class="text-xs text-gray-300 mt-1">
                    Coba ubah kata kunci pencarian
                  </p>
                </div>
              </template>
              <template v-else>
                <div
                  class="space-y-2 sm:space-y-3 p-3 sm:p-4 max-h-[calc(100vh-400px)] sm:max-h-[calc(100vh-380px)] overflow-y-auto"
                >
                  <div
                    v-for="(item, index) in data"
                    :key="item.id || index"
                    class="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
                  >
                    <!-- Card content -->
                    <div class="flex justify-between items-start mb-3">
                      <div class="flex-1 min-w-0">
                        <h4
                          class="font-medium text-sm sm:text-base text-gray-900 mb-1 truncate"
                        >
                          {{ item.jenis_pengadaan_barang || '-' }}
                        </h4>
                        <p class="text-xs sm:text-sm text-gray-600 font-mono">
                          No: {{ item.no_preorder || '-' }}
                        </p>
                      </div>
                      <div class="flex space-x-1 sm:space-x-2 ml-2">
                        <button
                          @click="openPrintPreview(item.id)"
                          class="cursor-pointer text-[#2B79EF] hover:text-white transition-all duration-200 p-1.5 rounded-full hover:bg-[#2B79EF] group"
                          title="Cetak Dokumen"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="white"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            width="18"
                            height="18"
                            class="group-hover:fill-white transition-all"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M6.75 3.75A2.25 2.25 0 0 0 4.5 6v3.75m15 0V6a2.25 2.25 0 0 0-2.25-2.25h-9m11.25 6V18a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 18V9.75m15 0H4.5m3 6h9m-6 3h3"
                            />
                          </svg>
                        </button>
                        <RouterLink :to="`/superadmin/riwayat-edit/${item.id}`">
                          <button
                            class="cursor-pointer text-[#9BA1AA] hover:text-white transition-all duration-200 p-1.5 rounded-full hover:bg-[#6B7280] group"
                            title="Edit Data"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="white"
                              viewBox="0 0 24 24"
                              stroke-width="1.5"
                              stroke="currentColor"
                              width="18"
                              height="18"
                              class="group-hover:fill-white transition-all"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M16.862 3.487a2.25 2.25 0 1 1 3.182 3.182L7.5 19.212l-4 1 1-4 13.362-13.725z"
                              />
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M19.5 6.75l-1.086-1.086a2.25 2.25 0 0 0-3.182 0l-9.193 9.193a.75.75 0 0 0-.22.53v2.25a.75.75 0 0 0 .75.75h2.25a.75.75 0 0 0 .53-.22l9.193-9.193a2.25 2.25 0 0 0 0-3.182z"
                              />
                            </svg>
                          </button>
                        </RouterLink>
                        <button
                          @click="handleDelete(item)"
                          class="cursor-pointer text-[#F44336] hover:text-white transition-all duration-200 p-1.5 rounded-full hover:bg-[#F44336] group"
                          title="Hapus Data"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="white"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            width="18"
                            height="18"
                            class="group-hover:fill-white transition-all"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M6 7.5V19.5A2.25 2.25 0 0 0 8.25 21.75h7.5A2.25 2.25 0 0 0 18 19.5V7.5m-9 0V6.75A2.25 2.25 0 0 1 11.25 4.5h1.5A2.25 2.25 0 0 1 15 6.75V7.5m-9 0h12"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <!-- Content Grid -->
                    <div
                      class="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm"
                    >
                      <div class="space-y-1">
                        <span class="text-gray-500 font-medium">Supplier:</span>
                        <p class="font-medium text-gray-900 truncate">
                          {{ item.nama_suplier || '-' }}
                        </p>
                      </div>
                      <div class="space-y-1">
                        <span class="text-gray-500 font-medium"
                          >Perusahaan:</span
                        >
                        <p class="font-medium text-gray-900 truncate">
                          {{ item.nama_perusahaan || '-' }}
                        </p>
                      </div>
                      <div class="space-y-1">
                        <span class="text-gray-500 font-medium">Admin:</span>
                        <p class="font-medium text-gray-900 truncate">
                          {{ item.user?.name || 'Unknown' }}
                        </p>
                      </div>
                      <div class="space-y-1">
                        <span class="text-gray-500 font-medium">Kuantum:</span>
                        <p class="font-medium text-gray-900">
                          {{ formatKuantum(item.kuantum || '-') }}
                        </p>
                      </div>

                      <!-- IN Data Dropdown -->
                      <div class="col-span-full mt-2">
                        <div class="space-y-2">
                          <button
                            @click="toggleInData(item.id)"
                            class="flex items-center justify-between w-full px-3 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                          >
                            <span class="font-medium text-gray-700">Detail IN Data</span>
                            <svg
                              class="w-4 h-4 text-gray-500 transition-transform duration-200"
                              :class="{ 'rotate-180': openInData === item.id }"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </button>
                          
                          <!-- IN Data Content -->
                          <div v-if="openInData === item.id" class="bg-white rounded-lg border border-gray-200 p-3">
                            <div v-if="item.in_data && JSON.parse(item.in_data).length > 0">
                              <div class="space-y-2">
                                <div v-for="(inItem, inIndex) in JSON.parse(item.in_data)" :key="inIndex" class="py-2 border-b border-gray-100 last:border-0">
                                  <div class="grid grid-cols-2 gap-2">
                                    <div>
                                      <span class="text-gray-500">Tanggal:</span>
                                      <span class="font-medium ml-1">{{ formatDate(inItem.tanggal) }}</span>
                                    </div>
                                    <div>
                                      <span class="text-gray-500">DO Number:</span>
                                      <span class="font-medium ml-1">{{ inItem.no_do || '-' }}</span>
                                    </div>
                                    <div>
                                      <span class="text-gray-500">Kuantum:</span>
                                      <span class="font-medium ml-1">{{ inItem.kuantum || '-' }}</span>
                                    </div>
                                    <div>
                                      <span class="text-gray-500">Keterangan:</span>
                                      <span class="font-medium ml-1">{{ inItem.keterangan || '-' }}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div v-else class="text-center text-gray-500 py-2">
                              Tidak ada data IN
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Footer -->
                    <div
                      class="flex justify-between items-center mt-3 pt-3 border-t border-gray-100"
                    >
                      <div class="text-xs sm:text-sm text-gray-500">
                        {{
                          new Date(
                            item.tanggal_pengadaan || item.tanggal,
                          ).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          }) || '-'
                        }}
                      </div>
                      <div class="flex items-center space-x-2">
                        <span
                          class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full"
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
            <div class="">
              <div
                v-if="pengadaanStore.isLoading"
                class="flex justify-center items-center h-64"
              >
                <div class="text-center">
                  <div
                    class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"
                  ></div>
                  <div class="text-gray-500">Memuat data...</div>
                </div>
              </div>
              <div
                v-else-if="pengadaanStore.hasError"
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
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <p class="mb-4">{{ pengadaanStore.error }}</p>
                  <button
                    @click="fetchData(currentPage)"
                    class="px-6 py-2 bg-[#0099ff] text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                  >
                    Coba Lagi
                  </button>
                </div>
              </div>
              <div v-else class="overflow-y-auto max-h-[calc(100vh-300px)]">
                <table class="w-full table-fixed">
                  <thead class="sticky top-0 z-10">
                    <tr
                      class="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 text-sm text-center border-b border-gray-200"
                    >
                      <th
                        class="px-2 lg:px-3 py-4 rounded-tl-xl text-center font-semibold w-[18%]"
                      >
                        No Preorder
                      </th>
                      <th class="px-1 lg:px-2 py-4 font-semibold w-[15%]">
                        Perusahaan
                      </th>
                      <th class="px-1 lg:px-2 py-4 font-semibold w-[15%]">
                        Supplier
                      </th>
                      <th class="px-1 lg:px-2 py-4 font-semibold w-[10%]">
                        Admin
                      </th>
                      <th class="px-1 lg:px-2 py-4 font-semibold w-[10%]">
                        Jenis Pengadaan
                      </th>
                      <th class="px-1 lg:px-2 py-4 font-semibold w-[10%]">
                        Kuantum
                      </th>
                      <th class="px-1 lg:px-2 py-4 font-semibold w-[10%]">
                        Tanggal
                      </th>
                      <th
                        class="px-1 lg:px-2 py-4 rounded-tr-xl font-semibold w-[13%]"
                      >
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-if="data.length === 0">
                      <tr>
                        <td
                          colspan="8"
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
                          <p class="text-base">Tidak ada data yang sesuai</p>
                          <p class="text-sm text-gray-300 mt-2">
                            Coba ubah kata kunci pencarian atau filter
                          </p>
                        </td>
                      </tr>
                    </template>
                    <template v-else>
                      <RiwayatElement
                        v-for="(item, index) in data"
                        :key="item.id || index"
                        :item="item"
                        :class="[
                          index % 2 === 0
                            ? 'bg-white hover:bg-gray-50'
                            : 'bg-gray-50/50 hover:bg-gray-100/50',
                          'text-center transition-colors duration-150',
                        ]"
                      />
                    </template>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Pagination -->
      <div>
        <PageElement
          :current-page="currentPage"
          :total-pages="totalPages"
          @change="handlePageChange"
        />
      </div>
    </section>
  </MainElement>
</template>
