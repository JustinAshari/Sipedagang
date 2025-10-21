<script setup>
  import { useRouter } from 'vue-router'
  import { computed, ref, onMounted, onUnmounted } from 'vue'
  import PageElement from '@/components/PageElement.vue'

  const props = defineProps({
    tableData: { type: Array, default: () => [] },
    searchQuery: { type: String, default: '' },
    tanggalAwal: { type: String, default: '' },
    tanggalAkhir: { type: String, default: '' },
    currentPage: { type: Number, default: 1 },
    itemsPerPage: { type: Number, default: 10 },
    pageInput: { type: Number, default: 1 },
    filteredData: { type: Array, default: () => [] },
    paginatedData: { type: Array, default: () => [] },
    getTotalPages: { type: Number, default: 1 },
    totalItems: { type: Number, default: 0 },
    isExtraSmallScreen: { type: Boolean, default: false },
    userType: { type: String, default: 'admin' },
  })

  const emit = defineEmits([
    'back',
    'preview',
    'print',
    'edit',
    'delete',
    'update:searchQuery',
    'update:tanggalAwal',
    'update:tanggalAkhir',
    'update:currentPage',
    'update:pageInput',
    'page-input-submit',
  ])

  const router = useRouter()

  // ✅ State untuk dropdown date picker - pisahkan untuk desktop dan mobile
  const showDatePickerDesktop = ref(false)
  const showDatePickerMobile = ref(false)

  // ✅ Refs untuk dropdown
  const datePickerDesktopRef = ref(null)
  const datePickerMobileRef = ref(null)

  // ✅ Data langsung dari props (sudah ter-paginasi dari backend)
  const computedFilteredData = computed(() => props.paginatedData)
  const computedPaginatedData = computed(() => props.paginatedData)
  const computedTotalPages = computed(() => props.getTotalPages)

  // ✅ Computed untuk check filter
  const hasDateFilter = computed(() => {
    return props.tanggalAwal || props.tanggalAkhir
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

  // ✅ Functions untuk clear filters
  const clearDateFilter = () => {
    emit('update:tanggalAwal', '')
    emit('update:tanggalAkhir', '')
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

  // ✅ Dynamic positioning untuk dropdown
  const getDropdownPosition = (ref, isMobile = false) => {
    if (!ref?.value) return 'bottom'

    const rect = ref.value.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const dropdownHeight = isMobile ? 280 : 350 // Reduced mobile dropdown height

    // Check if there's enough space below
    const spaceBelow = viewportHeight - rect.bottom

    // For mobile, prefer bottom positioning unless very little space
    if (isMobile) {
      return spaceBelow < 200 && rect.top > 250 ? 'top' : 'bottom'
    }

    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      return 'top'
    }
    return 'bottom'
  }

  // ✅ Close dropdown saat klik di luar
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

  onMounted(() => {
    document.addEventListener('click', handleClickOutside)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })

  // Helper functions tetap sama...
  const capitalizeText = (text) => {
    if (!text) return ''
    const str = String(text)
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  const titleCaseText = (text) => {
    if (!text) return ''
    const str = String(text)
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getItemValue = (item, field) => {
    let value = ''

    switch (field) {
      case 'jenis_pengadaan':
        value =
          item.jenisPengadaan ||
          item.rawData?.jenis_pengadaan_barang ||
          item.jenis_pengadaan_barang ||
          'N/A'
        return titleCaseText(value)

      case 'no_preorder':
        return (
          item.noProorder ||
          item.rawData?.no_preorder ||
          item.no_preorder ||
          'N/A'
        )

      case 'supplier':
        value =
          item.supplier ||
          item.rawData?.nama_suplier ||
          item.nama_suplier ||
          'N/A'
        return titleCaseText(value)

      case 'perusahaan':
        value =
          item.perusahaan ||
          item.rawData?.nama_perusahaan ||
          item.nama_perusahaan ||
          'N/A'
        return titleCaseText(value)

      case 'kuantum':
        return item.kuantum || item.rawData?.kuantum || 'N/A'

      case 'tanggal':
        return (
          item.tanggal ||
          item.rawData?.tanggal_pengadaan ||
          item.tanggal_pengadaan ||
          'N/A'
        )

      case 'id':
        return item.id || item.rawData?.id

      default:
        return 'N/A'
    }
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

  // Event handlers...
  const goBack = () => {
    emit('back')
  }

  const previewItem = (item) => {
    emit('preview', item)
  }

  const printItem = (item) => {
    emit('print', item)
    window.open(`/surat-preview/${getItemValue(item, 'id')}`, '_blank')
  }

  const editItem = (item) => {
    emit('edit', item)
  }

  const deleteItem = (item) => {
    emit('delete', item)
  }

  const resetFilters = () => {
    emit('update:searchQuery', '')
    emit('update:tanggalAwal', '')
    emit('update:tanggalAkhir', '')
    emit('update:currentPage', 1)
  }

  // ✅ Handler untuk PageElement
  const handlePageChange = (page) => {
    emit('update:currentPage', page)
  }

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A'
    let date
    // Coba parsing berbagai format
    if (dateString.includes('/')) {
      // Format DD/MM/YYYY
      const parts = dateString.split('/')
      if (parts.length === 3) {
        date = new Date(parts[2], parts[1] - 1, parts[0])
      }
    } else if (dateString.includes('-')) {
      // Format YYYY-MM-DD atau DD-MM-YYYY
      const parts = dateString.split('-')
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          date = new Date(parts[0], parts[1] - 1, parts[2])
        } else {
          // DD-MM-YYYY
          date = new Date(parts[2], parts[1] - 1, parts[0])
        }
      } else {
        date = new Date(dateString)
      }
    } else {
      date = new Date(dateString)
    }
    if (!date || isNaN(date.getTime())) return dateString
    const dd = String(date.getDate()).padStart(2, '0')
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const yyyy = date.getFullYear()
    return `${dd}-${mm}-${yyyy}`
  }
</script>

<template>
  <!-- Simple Container -->
  <div class="px-4 max-w-5xl max-h-[36rem] mx-auto">
    <!-- Simple Content Card -->
    <div
      class="bg-white rounded-lg shadow-md border border-gray-200 overflow-visible"
    >
      <!-- Simple Header -->
      <div
        class="bg-blue-600 p-2 sm:p-4 rounded-t-lg relative overflow-visible"
      >
        <!-- Mobile Back Button -->
        <div class="flex sm:hidden mb-2">
          <router-link
            to="/admin/dashboard"
            @click.native="goBack"
            class="inline-flex items-center px-2 py-1 bg-white/20 text-white text-xs font-medium rounded border border-white/30 hover:bg-white/30"
          >
            <svg
              class="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Kembali
          </router-link>

          <div class="items-center pl-4 space-x-1 flex">
            <div class="p-1 bg-white/20 rounded-lg">
              <svg
                class="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <h1 class="text-sm sm:text-lg font-bold text-white leading-tight">
                {{ userType === 'admin' ? 'Lihat Data' : 'Rekap Data' }}
              </h1>
              <p class="text-white/80 text-[11px] sm:text-sm leading-tight">
                Data Pengadaan
              </p>
            </div>
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row justify-between items-start gap-2"
        >
          <!-- Title -->
          <div class="items-center space-x-1 hidden sm:flex">
            <div class="p-1 bg-white/20 rounded-lg">
              <svg
                class="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div>
              <h1 class="text-sm sm:text-lg font-bold text-white leading-tight">
                {{ userType === 'admin' ? 'Lihat Data' : 'Rekap Data' }}
              </h1>
              <p class="text-white/80 text-[11px] sm:text-sm leading-tight">
                Data Pengadaan
              </p>
            </div>
          </div>

          <!-- Search & Filter -->
          <div class="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
            <!-- Active Filters Desktop -->
            <div
              v-if="searchQuery || hasDateFilter"
              class="lg:flex lg:flex-wrap hidden gap-2"
            >
              <span
                v-if="searchQuery"
                class="inline-flex items-center px-3 py-1 bg-white/20 text-white text-xs rounded-full"
              >
                Pencarian: {{ searchQuery }}
                <button
                  @click="$emit('update:searchQuery', '')"
                  class="ml-2 text-white/80 hover:text-white"
                >
                  <svg
                    class="h-3 w-3"
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
              </span>
              <span
                v-if="hasDateFilter"
                class="inline-flex items-center px-3 py-1 bg-white/20 text-white text-xs rounded-full"
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
                <button
                  @click="clearDateFilter"
                  class="ml-2 text-white/80 hover:text-white"
                >
                  <svg
                    class="h-3 w-3"
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
              </span>
              <span
                class="flex items-center px-3 py-1 bg-white/30 text-white text-xs rounded-full font-medium"
              >
                {{ totalItems }} hasil
              </span>
            </div>

            <!-- Search -->
            <div class="relative">
              <input
                type="text"
                :value="searchQuery"
                placeholder="Cari data..."
                class="w-full sm:w-64 pl-9 pr-9 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                @input="$emit('update:searchQuery', $event.target.value)"
              />
              <svg
                class="absolute left-3 top-2.5 h-4 w-4 text-white/60"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <button
                v-if="searchQuery"
                @click="$emit('update:searchQuery', '')"
                class="absolute right-3 top-2.5 text-white/60 hover:text-white"
              >
                <svg
                  class="h-4 w-4"
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

            <!-- ✅ Date Filter Button Desktop -->
            <div class="relative hidden sm:block" ref="datePickerDesktopRef">
              <button
                @click.stop="showDatePickerDesktop = !showDatePickerDesktop"
                class="flex items-center gap-2 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 hover:bg-white/30 min-w-[140px]"
                :class="{
                  'ring-2 ring-white/50': showDatePickerDesktop,
                  'bg-white/30 border-white/50': hasDateFilter,
                }"
              >
                <!-- Calendar Icon -->
                <svg
                  class="w-4 h-4 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>

                <!-- Button Text -->
                <span class="whitespace-nowrap flex-1 text-left min-w-0">
                  <span v-if="hasDateFilter" class="font-medium truncate block">
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
                  <span v-else class="text-white/70 truncate block">
                    Filter Tanggal
                  </span>
                </span>

                <!-- Dropdown Arrow -->
                <svg
                  class="w-3 h-3 text-white/60 transition-transform duration-200 flex-shrink-0"
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
                class="fixed bg-white border border-gray-200 rounded-lg shadow-2xl w-80 p-4"
                :class="{
                  'bottom-full mb-2':
                    getDropdownPosition(datePickerDesktopRef) === 'top',
                  'top-full mt-2':
                    getDropdownPosition(datePickerDesktopRef) === 'bottom',
                }"
                :style="{
                  zIndex: 999999,
                  left: datePickerDesktopRef
                    ? `${datePickerDesktopRef.getBoundingClientRect().right - 320}px`
                    : 'auto',
                  top:
                    getDropdownPosition(datePickerDesktopRef) === 'bottom' &&
                    datePickerDesktopRef
                      ? `${datePickerDesktopRef.getBoundingClientRect().bottom + 8}px`
                      : 'auto',
                  bottom:
                    getDropdownPosition(datePickerDesktopRef) === 'top' &&
                    datePickerDesktopRef
                      ? `${window.innerHeight - datePickerDesktopRef.getBoundingClientRect().top + 8}px`
                      : 'auto',
                }"
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
                        :value="tanggalAwal"
                        @input="
                          $emit('update:tanggalAwal', $event.target.value)
                        "
                        @click.stop
                        class="w-full border border-gray-300 rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                        :value="tanggalAkhir"
                        :min="tanggalAwal"
                        @input="
                          $emit('update:tanggalAkhir', $event.target.value)
                        "
                        @click.stop
                        class="w-full border border-gray-300 rounded-lg h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                      class="flex-1 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 font-medium"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile Date Filter Button -->
        <div class="sm:hidden mt-2">
          <div class="relative" ref="datePickerMobileRef">
            <button
              @click.stop="showDatePickerMobile = !showDatePickerMobile"
              class="flex items-center gap-2 w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 hover:bg-white/30"
              :class="{
                'ring-2 ring-white/50': showDatePickerMobile,
                'bg-white/30 border-white/50': hasDateFilter,
              }"
            >
              <!-- Calendar Icon -->
              <svg
                class="w-4 h-4 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>

              <!-- Button Text -->
              <span class="flex-1 text-left min-w-0">
                <span v-if="hasDateFilter" class="font-medium truncate block">
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
                <span v-else class="text-white/70 truncate block">
                  Filter Tanggal
                </span>
              </span>

              <!-- Dropdown Arrow -->
              <svg
                class="w-3 h-3 text-white/60 transition-transform duration-200 flex-shrink-0"
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

            <!-- ✅ Dropdown Date Picker Mobile -->
            <div
              v-if="showDatePickerMobile"
              @click.stop
              class="fixed bg-white border border-gray-200 rounded-lg shadow-2xl p-4"
              :class="{
                'bottom-4':
                  getDropdownPosition(datePickerMobileRef, true) === 'top',
                'top-16':
                  getDropdownPosition(datePickerMobileRef, true) === 'bottom',
              }"
              :style="{
                zIndex: 999999,
                left: '1rem',
                right: '1rem',
                maxHeight: '70vh',
                overflowY: 'auto',
              }"
            >
              <div class="space-y-3">
                <!-- Header -->
                <div
                  class="flex items-center justify-between pb-2 border-b border-gray-100"
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
                <div class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Awal
                    </label>
                    <input
                      type="date"
                      :value="tanggalAwal"
                      @input="$emit('update:tanggalAwal', $event.target.value)"
                      @click.stop
                      class="w-full border border-gray-300 rounded-lg h-11 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Akhir
                    </label>
                    <input
                      type="date"
                      :value="tanggalAkhir"
                      :min="tanggalAwal"
                      @input="$emit('update:tanggalAkhir', $event.target.value)"
                      @click.stop
                      class="w-full border border-gray-300 rounded-lg h-11 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex gap-3 pt-2 border-t border-gray-100">
                  <button
                    @click.stop="clearDateFilter"
                    class="flex-1 px-4 py-2.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
                  >
                    Reset
                  </button>
                  <button
                    @click.stop="applyDateFilterMobile"
                    class="flex-1 px-4 py-2.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 font-medium"
                  >
                    Terapkan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Active Filters Mobile -->
        <div
          v-if="searchQuery || hasDateFilter"
          class="flex flex-wrap gap-1 mt-2 w-full sm:mt-3 md:gap-2 lg:hidden"
        >
          <span
            v-if="searchQuery"
            class="inline-flex items-center px-2 py-0.5 bg-white/20 text-white text-[10px] rounded-full md:px-3 md:py-1 md:text-xs"
          >
            Pencarian: {{ searchQuery }}
            <button
              @click="$emit('update:searchQuery', '')"
              class="ml-1 text-white/80 hover:text-white md:ml-2"
            >
              <svg
                class="h-3 w-3"
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
          </span>
          <span
            v-if="hasDateFilter"
            class="inline-flex items-center px-2 py-0.5 bg-white/20 text-white text-[10px] rounded-full md:px-3 md:py-1 md:text-xs"
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
            <button
              @click="clearDateFilter"
              class="ml-1 text-white/80 hover:text-white md:ml-2"
            >
              <svg
                class="h-3 w-3"
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
          </span>
          <span
            class="px-2 py-0.5 bg-white/30 text-white text-[10px] rounded-full font-medium md:px-3 md:py-1 md:text-xs"
          >
            {{ totalItems }} hasil
          </span>
        </div>
      </div>

      <!-- Simple Table Container -->
      <div class="overflow-x-auto">
        <!-- Mobile Card View -->
        <div
          class="block md:hidden p-4 space-y-3 relative"
          style="max-height: 28rem; overflow-y: auto"
        >
          <div
            v-for="(item, index) in computedPaginatedData"
            :key="index"
            class="bg-gray-50 rounded-lg p-4 border border-gray-200"
          >
            <!-- Card Header -->
            <div class="flex justify-between items-start mb-3">
              <div>
                <h3 class="font-semibold text-gray-900 text-sm">
                  {{ getItemValue(item, 'jenis_pengadaan') }}
                </h3>
                <p class="text-xs text-gray-500">
                  {{ getItemValue(item, 'no_preorder') }}
                </p>
              </div>
              <div class="flex space-x-1">
                <button
                  @click="printItem(item)"
                  class="p-1.5 bg-purple-100 text-purple-600 rounded hover:bg-purple-200"
                >
                  <svg
                    class="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                </button>
                <button
                  @click="editItem(item)"
                  class="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200"
                >
                  <svg
                    class="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  @click="deleteItem(item)"
                  class="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"
                >
                  <svg
                    class="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Card Content -->
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span class="text-gray-500">Supplier:</span>
                <div class="font-medium text-gray-900">
                  {{ getItemValue(item, 'supplier') }}
                </div>
              </div>
              <div>
                <span class="text-gray-500">Perusahaan:</span>
                <div class="font-medium text-gray-900">
                  {{ getItemValue(item, 'perusahaan') }}
                </div>
              </div>
              <div>
                <span class="text-gray-500">Kuantum:</span>
                <div class="font-medium text-blue-600">
                  {{ formatKuantum(getItemValue(item, 'kuantum')) }}
                </div>
              </div>
              <div>
                <span class="text-gray-500">Tanggal:</span>
                <div class="font-medium text-gray-900">
                  {{ getItemValue(item, 'tanggal') }}
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State Mobile -->
          <div
            v-if="computedPaginatedData.length === 0"
            class="text-center py-8"
          >
            <svg
              class="h-12 w-12 text-gray-300 mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p class="text-gray-500 font-medium">Tidak ada data</p>
            <p class="text-gray-400 text-sm">
              Data yang dicari tidak ditemukan
            </p>
          </div>

          <!-- ✅ PageElement untuk Mobile -->
          <div
            class="bg-white border-t border-gray-200 p-3 w-full sticky -bottom-4 left-0 z-20"
          >
            <div class="flex flex-col items-center gap-3">
              <div class="text-xs text-gray-600">
                Menampilkan {{ (currentPage - 1) * itemsPerPage + 1 }} -
                {{ Math.min(currentPage * itemsPerPage, totalItems) }}
                dari {{ totalItems }} data
              </div>
              <PageElement
                :currentPage="currentPage"
                :totalPages="computedTotalPages"
                @change="handlePageChange"
              />
            </div>
          </div>
        </div>

        <!-- Desktop Table View -->
        <div class="hidden md:block relative">
          <div style="max-height: 420px; overflow-y: auto">
            <table class="w-full table-fixed">
              <thead
                class="bg-gray-50 border-b border-gray-200 sticky top-0 z-10"
              >
                <tr>
                  <th
                    class="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase w-[20%]"
                  >
                    No. Preorder
                  </th>
                  <th
                    class="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase w-[14%]"
                  >
                    Perusahaan
                  </th>
                  <th
                    class="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase w-[20%]"
                  >
                    Supplier
                  </th>
                  <th
                    class="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase w-[12%]"
                  >
                    Jenis Pengadaan
                  </th>
                  <th
                    class="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase w-[13%]"
                  >
                    Kuantum
                  </th>
                  <th
                    class="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase w-[12%]"
                  >
                    Tanggal
                  </th>
                  <th
                    class="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase w-[10%]"
                  >
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr
                  v-for="(item, index) in computedPaginatedData"
                  :key="index"
                  class="hover:bg-gray-50 text-center"
                >
                  <td class="px-2 py-2">
                    <div
                      class="text-sm text-gray-900 truncate"
                      :title="getItemValue(item, 'no_preorder')"
                    >
                      {{ getItemValue(item, 'no_preorder') }}
                    </div>
                  </td>
                  <td class="px-2 py-2">
                    <div
                      class="text-sm text-gray-900 truncate"
                      :title="getItemValue(item, 'perusahaan')"
                    >
                      {{ getItemValue(item, 'perusahaan') }}
                    </div>
                  </td>
                  <td class="px-2 py-2">
                    <div
                      class="text-sm text-gray-900 truncate"
                      :title="getItemValue(item, 'supplier')"
                    >
                      {{ getItemValue(item, 'supplier') }}
                    </div>
                  </td>
                  <td class="px-2 py-2">
                    <div
                      class="text-sm font-medium text-gray-900 truncate"
                      :title="getItemValue(item, 'jenis_pengadaan')"
                    >
                      {{ getItemValue(item, 'jenis_pengadaan') }}
                    </div>
                  </td>
                  <td class="px-2 py-2">
                    <span
                      class="inline-flex px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                    >
                      {{ formatKuantum(getItemValue(item, 'kuantum')) }}
                    </span>
                  </td>
                  <td class="px-2 py-2">
                    <div class="text-sm text-gray-900">
                      {{ formatDate(getItemValue(item, 'tanggal')) }}
                    </div>
                  </td>
                  <td class="px-2 py-2">
                    <div class="flex justify-center space-x-1">
                      <button
                        @click="printItem(item)"
                        class="p-1 text-purple-600 bg-purple-100 rounded hover:bg-purple-200"
                        title="Print"
                      >
                        <svg
                          class="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                          />
                        </svg>
                      </button>
                      <button
                        @click="editItem(item)"
                        class="p-1 text-green-600 bg-green-100 rounded hover:bg-green-200"
                        title="Edit"
                      >
                        <svg
                          class="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        @click="deleteItem(item)"
                        class="p-1 text-red-600 bg-red-100 rounded hover:bg-red-200"
                        title="Delete"
                      >
                        <svg
                          class="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div
              v-if="computedPaginatedData.length === 0"
              class="text-center py-12"
            >
              <svg
                class="h-16 w-16 text-gray-300 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p class="text-gray-500 text-lg font-medium">Tidak ada data</p>
              <p class="text-gray-400">Data yang dicari tidak ditemukan</p>
            </div>
          </div>
          <div
            class="bg-gray-50 border-t border-gray-200 p-4 w-full sticky bottom-0 left-0 z-20"
            style="box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.03)"
          >
            <div
              class="flex flex-col sm:flex-row justify-between items-center gap-4"
            >
              <!-- Pagination Info -->
              <div class="text-sm text-gray-600">
                Menampilkan {{ (currentPage - 1) * itemsPerPage + 1 }} -
                {{ Math.min(currentPage * itemsPerPage, totalItems) }}
                dari {{ totalItems }} data
              </div>
              <!-- ✅ PageElement Component -->
              <PageElement
                :currentPage="currentPage"
                :totalPages="computedTotalPages"
                @change="handlePageChange"
              />
              <!-- Back Button (Desktop only) -->
              <div class="hidden sm:block">
                <router-link
                  to="/admin/dashboard"
                  @click.native="goBack"
                  class="inline-flex items-center px-3 py-1.5 bg-white text-gray-700 text-sm font-medium rounded border border-gray-300 hover:bg-gray-50"
                >
                  <svg
                    class="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Kembali
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ✅ Backdrop untuk dropdown -->
  <div
    v-if="showDatePickerDesktop || showDatePickerMobile"
    class="fixed inset-0 bg-black/20"
    style="z-index: 999998"
    @click="((showDatePickerDesktop = false), (showDatePickerMobile = false))"
  ></div>
</template>

<style scoped>
  /* Simple scrollbar */
  .overflow-x-auto::-webkit-scrollbar {
    height: 4px;
  }

  .overflow-x-auto::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 2px;
  }

  .overflow-x-auto::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 2px;
  }

  .overflow-x-auto::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }

  /* Focus styles */
  .focus\:ring-white\/50:focus {
    --tw-ring-color: rgba(255, 255, 255, 0.5);
  }

  /* ✅ Ensure dropdown appears above everything */
  .relative {
    z-index: auto;
  }

  /* ✅ Fix for mobile dropdown positioning */
  @media (max-width: 640px) {
    .fixed.inset-x-4 {
      left: 1rem !important;
      right: 1rem !important;
      max-width: calc(100vw - 2rem) !important;
    }

    /* Ensure dropdown inputs are touch-friendly */
    input[type='date'] {
      min-height: 44px;
    }
  }

  /* ✅ Fix for very small screens */
  @media (max-width: 375px) {
    .fixed {
      left: 0.5rem !important;
      right: 0.5rem !important;
      max-width: calc(100vw - 1rem) !important;
    }
  }
</style>
