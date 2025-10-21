<script setup>
  import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import PageElement from '@/components/PageElement.vue'
  import PemohonIconElement from '@/components/PemohonIconElement.vue'
  import { usePemohonStore } from '@/stores/pemohonStore'
  import Swal from 'sweetalert2'
  import * as XLSX from 'xlsx' // Import XLSX library

  const router = useRouter()
  const pemohonStore = usePemohonStore()

  // State
  const searchText = ref('')
  const itemsPerPage = ref(10)
  const isUploadingCSV = ref(false)
  const showMenu = ref(false)

  // Computed
  const data = computed(() => pemohonStore.pemohonList || [])
  const currentPage = computed(() => pemohonStore.pagination?.current_page || 1)
  const totalPages = computed(() => pemohonStore.pagination?.last_page || 1)
  const isLoading = computed(() => pemohonStore.isLoading)
  const hasError = computed(() => pemohonStore.hasError)
  const error = computed(() => pemohonStore.error)

  // ✅ PERBAIKAN: Untuk server-side search, tampilkan data apa adanya dari API
  const filteredPemohon = computed(() => {
    // Karena search dilakukan di server, tampilkan data yang dikembalikan API
    return data.value
  })

  // Methods
  const fetchData = async (page = 1, search = '') => {
    try {
      const params = {
        page: page,
        per_page: itemsPerPage.value,
      }

      // ✅ PERBAIKAN: Hanya tambahkan search parameter jika ada nilai search
      if (search || searchText.value) {
        params.search = search || searchText.value
      }

      await pemohonStore.fetchPemohon(params)
    } catch (error) {
      console.error('Error fetching pemohon:', error)
      Swal.fire({
        title: 'Error!',
        text: 'Gagal memuat data pemohon',
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'OK',
      })
    }
  }

  const handleEdit = (pemohon) => {
    router.push(`/admin/datapemohon-edit/${pemohon.id}`)
  }

  const handleDelete = async (pemohon) => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      html: `Data pemohon <strong>${pemohon.nama_suplier}</strong> dari <strong>${pemohon.nama_perusahaan}</strong> akan dihapus permanent!`,
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
        await pemohonStore.deletePemohon(pemohon.id)

        Swal.fire({
          title: 'Berhasil!',
          text: 'Data pemohon berhasil dihapus',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true,
        })

        // ✅ PERBAIKAN: Refresh data dengan search term yang sama
        await fetchData(currentPage.value, searchText.value)
      } catch (error) {
        console.error('Error deleting pemohon:', error)
        Swal.fire({
          title: 'Error!',
          text: error.message || 'Gagal menghapus data pemohon',
          icon: 'error',
          confirmButtonColor: '#d33',
          confirmButtonText: 'OK',
        })
      }
    }
  }

  const handlePageChange = (page) => {
    // ✅ PERBAIKAN: Pertahankan search term saat ganti halaman
    fetchData(page, searchText.value)
  }

  const toTitleCase = (str) => {
    if (!str) return '-'
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // ✅ PERBAIKAN: Watch untuk search dengan debounce - server-side search
  let searchTimeout = null
  watch([searchText], () => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    searchTimeout = setTimeout(() => {
      // Reset ke halaman 1 saat search dan kirim search term ke API
      fetchData(1, searchText.value)
    }, 500)
  })

  // Clear search
  const clearSearch = () => {
    searchText.value = ''
    fetchData(1, '') // Load data tanpa filter
  }

  // ✅ BARU: Excel preview function dari DataPemohon
  async function showExcelPreview(file) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          // Read Excel file
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })

          // Get first worksheet
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]

          // Convert to JSON (first 6 rows including header)
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            range: 0,
            blankrows: false,
          })

          // Take only first 6 rows for preview
          const previewData = jsonData.slice(0, 6)

          // Compact table creation
          const createCompactTableHTML = (data) => {
            if (!data || data.length === 0) {
              return `
                <div class="flex items-center justify-center py-6 text-gray-500">
                  <svg class="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <span>File kosong atau tidak dapat dibaca</span>
                </div>
              `
            }

            let html = `
              <div class="overflow-hidden rounded-lg border border-gray-200">
                <table class="min-w-full text-sm">
            `

            data.forEach((row, rowIndex) => {
              if (Array.isArray(row)) {
                if (rowIndex === 0) {
                  // Compact header row
                  html += '<thead class="bg-gray-50">'
                  html += '<tr>'
                  row.forEach((cell, cellIndex) => {
                    const cellValue =
                      cell !== null && cell !== undefined ? String(cell) : ''
                    html += `
                      <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200 last:border-r-0">
                        ${cellValue}
                      </th>
                    `
                  })
                  html +=
                    '</tr></thead><tbody class="bg-white divide-y divide-gray-200">'
                } else {
                  // Compact data rows
                  const rowClass =
                    rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  html += `<tr class="${rowClass}">`
                  row.forEach((cell, cellIndex) => {
                    const cellValue =
                      cell !== null && cell !== undefined ? String(cell) : ''
                    html += `
                      <td class="px-3 py-2 text-xs text-gray-900 border-r border-gray-100 last:border-r-0">
                        <span class="truncate block max-w-24" title="${cellValue}">${cellValue}</span>
                      </td>
                    `
                  })
                  html += '</tr>'
                }
              }
            })

            html += '</tbody></table></div>'
            return html
          }

          // Format file size
          const formatFileSize = (bytes) => {
            if (bytes === 0) return '0 Bytes'
            const k = 1024
            const sizes = ['Bytes', 'KB', 'MB', 'GB']
            const i = Math.floor(Math.log(bytes) / Math.log(k))
            return (
              parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
            )
          }

          const fileSize = formatFileSize(file.size)

          // Compact preview dialog
          Swal.fire({
            title: 'Preview File Excel',
            html: `
              <div class="text-left space-y-4">
                <!-- Compact File Info -->
                <div class="grid grid-cols-4 gap-3 mb-4">
                  <div class="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                    <svg class="w-6 h-6 text-blue-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    <p class="text-xs font-medium text-blue-900">File</p>
                    <p class="text-xs text-blue-700 truncate" title="${file.name}">${file.name}</p>
                  </div>

                  <div class="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                    <svg class="w-6 h-6 text-green-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4v2"></path>
                    </svg>
                    <p class="text-xs font-medium text-green-900">Ukuran</p>
                    <p class="text-xs text-green-700">${fileSize}</p>
                  </div>

                  <div class="bg-purple-50 rounded-lg p-3 text-center border border-purple-200">
                    <svg class="w-6 h-6 text-purple-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2"></path>
                    </svg>
                    <p class="text-xs font-medium text-purple-900">Sheet</p>
                    <p class="text-xs text-purple-700">${firstSheetName}</p>
                  </div>

                  <div class="bg-orange-50 rounded-lg p-3 text-center border border-orange-200">
                    <svg class="w-6 h-6 text-orange-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    <p class="text-xs font-medium text-orange-900">Baris</p>
                    <p class="text-xs text-orange-700">${jsonData.length}</p>
                  </div>
                </div>

                <!-- Compact Preview Section -->
                <div>
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="text-sm font-semibold text-gray-800 flex items-center">
                      <svg class="w-4 h-4 mr-1 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                      Preview (${Math.min(jsonData.length, 6)} dari ${jsonData.length} baris)
                    </h4>
                  </div>

                  <div class="max-h-64 overflow-auto">
                    ${createCompactTableHTML(previewData)}
                  </div>

                  ${
                    jsonData.length > 6
                      ? `
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-3">
                      <p class="text-xs text-blue-800 flex items-center">
                        <svg class="w-4 h-4 text-blue-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span class="font-medium">+${jsonData.length - 6} baris lainnya akan diproses</span>
                      </p>
                    </div>
                  `
                      : ''
                  }
                </div>
              </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Upload',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#10B981',
            cancelButtonColor: '#6B7280',
            width: '700px',
            customClass: {
              popup: 'rounded-xl',
              confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
              cancelButton: 'rounded-lg font-medium px-4 py-2 text-sm',
            },
          }).then((result) => {
            resolve(result.isConfirmed)
          })
        } catch (error) {
          console.error('Error reading Excel file:', error)
          Swal.fire({
            title: 'Error!',
            html: `
              <div class="text-center">
                <div class="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-3">
                  <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                </div>
                <p class="text-gray-600 mb-3">File Excel tidak dapat dibaca. Pastikan format file benar.</p>
                <div class="bg-red-50 border border-red-200 rounded-lg p-2">
                  <p class="text-xs text-red-700">Format: .xlsx, .xls</p>
                </div>
              </div>
            `,
            confirmButtonColor: '#EF4444',
            confirmButtonText: 'OK',
            width: '400px',
            customClass: {
              popup: 'rounded-xl',
              confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
            },
          })
          resolve(false)
        }
      }

      reader.onerror = () => {
        Swal.fire({
          title: 'Gagal Membaca File',
          text: 'Terjadi kesalahan saat membaca file.',
          icon: 'error',
          confirmButtonColor: '#EF4444',
          width: '400px',
          customClass: {
            popup: 'rounded-xl',
            confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
          },
        })
        resolve(false)
      }

      reader.readAsArrayBuffer(file)
    })
  }

  // ✅ BARU: Upload Excel function dari DataPemohon
  async function handleUploadCSV() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls'
    input.style.display = 'none'

    input.onchange = async (event) => {
      const file = event.target.files[0]
      if (!file) return

      // Validate file type
      const fileName = file.name.toLowerCase()
      const isValidExcel =
        fileName.endsWith('.xlsx') || fileName.endsWith('.xls')

      if (!isValidExcel) {
        Swal.fire({
          title: 'File Tidak Valid!',
          text: 'Silakan pilih file dengan format .xlsx atau .xls',
          icon: 'warning',
          confirmButtonColor: '#d33',
        })
        return
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        Swal.fire({
          title: 'File Terlalu Besar!',
          text: 'Ukuran file maksimal 10MB',
          icon: 'warning',
          confirmButtonColor: '#d33',
        })
        return
      }

      // Show Excel preview and get confirmation
      const shouldUpload = await showExcelPreview(file)
      if (!shouldUpload) return

      try {
        isUploadingCSV.value = true

        // Show loading
        Swal.fire({
          title: 'Mengupload File Excel...',
          text: 'Mohon tunggu, file sedang diproses',
          icon: 'info',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading()
          },
        })

        const formData = new FormData()
        formData.append('file', file)

        // Use store method to upload
        await pemohonStore.uploadCSV(formData)

        Swal.fire({
          title: 'Berhasil!',
          text: `File Excel "${file.name}" berhasil diupload dan diimpor`,
          icon: 'success',
          timer: 3000,
          showConfirmButton: true,
          confirmButtonText: 'OK',
          timerProgressBar: true,
        })

        // Refresh data setelah upload berhasil
        await fetchData(1, searchText.value)
      } catch (error) {
        console.error('Upload Excel error:', error)

        let errorTitle = 'Upload Gagal!'
        let errorMsg = 'Terjadi kesalahan saat mengupload file Excel'

        if (error.response) {
          const status = error.response.status
          const responseData = error.response.data

          switch (status) {
            case 400:
              errorTitle = 'File Tidak Valid!'
              errorMsg =
                responseData.message || 'Format file Excel tidak sesuai'
              break
            case 422:
              errorTitle = 'Validasi Gagal!'
              if (responseData.errors) {
                const errorDetails = Object.entries(responseData.errors)
                  .map(([field, messages]) => {
                    return `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
                  })
                  .join('\n')
                errorMsg = errorDetails
              } else {
                errorMsg =
                  responseData.message || 'Data dalam file Excel tidak valid'
              }
              break
            case 413:
              errorTitle = 'File Terlalu Besar!'
              errorMsg = 'Ukuran file melebihi batas maksimal (10MB)'
              break
            case 415:
              errorTitle = 'Format File Tidak Didukung!'
              errorMsg = 'Silakan upload file dengan format .xlsx atau .xls'
              break
            case 500:
              errorTitle = 'Kesalahan Server!'
              errorMsg = 'Terjadi kesalahan pada server saat memproses file'
              break
            default:
              errorMsg =
                responseData.message || `Terjadi kesalahan (Kode: ${status})`
          }
        } else if (error.request) {
          errorTitle = 'Koneksi Gagal!'
          errorMsg =
            'Tidak dapat terhubung ke server. Periksa koneksi internet Anda'
        } else if (error.message) {
          errorMsg = error.message
        }

        Swal.fire({
          title: errorTitle,
          text: errorMsg,
          icon: 'error',
          confirmButtonColor: '#d33',
          customClass: {
            content: 'text-left whitespace-pre-line',
          },
        })
      } finally {
        isUploadingCSV.value = false
        if (document.body.contains(input)) {
          document.body.removeChild(input)
        }
      }
    }

    document.body.appendChild(input)
    input.click()
  }

  // ✅ BARU: Navigate to input form
  function handleInputPemohon() {
    router.push('/admin/datapemohon')
  }

  // ✅ BARU: Navigate back function
  function handleDashboard() {
    router.push('/admin/dashboard')
  }

  // ✅ BARU: Menu handlers
  const handleUploadAndClose = () => {
    handleUploadCSV()
    showMenu.value = false
  }

  const handleInputAndClose = () => {
    handleInputPemohon()
    showMenu.value = false
  }

  const handleDashboardAndClose = () => {
    handleDashboard()
    showMenu.value = false
  }

  // ✅ SIMPLIFIED: Use single ref for the currently active dropdown
  const dropdownRef = ref(null)

  // ✅ SIMPLIFIED: Much simpler click outside logic
  const handleClickOutside = (event) => {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
      showMenu.value = false
    }
  }

  // Lifecycle
  onMounted(() => {
    // Add event listener for click outside
    document.addEventListener('click', handleClickOutside)
    fetchData()
  })

  onBeforeUnmount(() => {
    // Remove event listener
    document.removeEventListener('click', handleClickOutside)
  })
</script>

<template>
  <!-- ✅ Container mengikuti pola DataPemohon dengan margin top yang diperkecil -->
  <div class="px-4 max-w-7xl mx-auto -mt-4">
    <!-- Main Content Card -->
    <div
      class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
    >
      <!-- ✅ Header Section dengan styling yang konsisten dan lebih compact -->
      <div class="bg-blue-600 p-2 sm:p-4">
        <!-- ✅ Mobile Header - Layout terpisah seperti design -->
        <div class="sm:hidden">
          <!-- Mobile Title Section - Reduced spacing -->
          <div class="flex items-center mb-2">
            <button
              @click="handleDashboard"
              class="inline-flex items-center px-2 py-1 bg-white/20 text-white text-xs font-medium rounded border border-white/30 hover:bg-white/30 transition-colors duration-200"
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
            </button>

            <div class="flex items-center ml-3 space-x-1">
              <div class="p-1 bg-white/20 rounded-lg">
                <PemohonIconElement
                  color="white"
                  stroke="white"
                  class="h-4 w-4"
                />
              </div>
              <div>
                <h1 class="text-sm font-bold text-white leading-tight">
                  Daftar Data Pemohon
                </h1>
                <p class="text-white/80 text-[11px] leading-tight">
                  Data Pemohon
                </p>
              </div>
            </div>
          </div>

          <!-- Mobile Search dan Aksi dalam satu baris -->
          <div class="flex gap-2 mb-2">
            <!-- Mobile Search Box - Flex-1 -->
            <div class="relative flex-1">
              <input
                type="text"
                placeholder="Cari supplier, perusahaan, bank..."
                v-model="searchText"
                class="border border-white/30 bg-white/20 backdrop-blur-sm rounded-lg h-9 px-3 pr-9 text-sm placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white focus:bg-white/30 transition-all duration-200 w-full"
              />
              <!-- Clear search button -->
              <button
                v-if="searchText"
                @click="clearSearch"
                class="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors duration-200"
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
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70"
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

            <!-- Mobile Action Menu - Fixed width -->
            <div ref="dropdownRef" class="relative">
              <button
                @click="showMenu = !showMenu"
                class="flex items-center justify-center gap-1 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 hover:bg-white/30 min-w-[90px]"
              >
                <svg
                  class="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>

                <span class="font-medium truncate"> Aksi </span>

                <svg
                  class="w-3 h-3 text-white/60 transition-transform duration-200 flex-shrink-0"
                  :class="{ 'rotate-180': showMenu }"
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

              <!-- Mobile Dropdown Menu -->
              <div
                v-if="showMenu"
                @click.stop
                class="absolute top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-[99999] p-2"
                style="z-index: 99999 !important"
              >
                <div class="space-y-1">
                  <!-- Dashboard -->
                  <button
                    @click="handleDashboardAndClose"
                    :disabled="isLoading || isUploadingCSV"
                    class="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-600 flex items-center transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                  >
                    <svg
                      class="w-4 h-4 mr-3 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163z"
                      />
                    </svg>
                    Dashboard
                  </button>

                  <!-- Upload Excel -->
                  <button
                    @click="handleUploadAndClose"
                    :disabled="isLoading || isUploadingCSV"
                    class="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 flex items-center transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                  >
                    <svg
                      v-if="isUploadingCSV"
                      class="animate-spin w-4 h-4 mr-3 text-green-500"
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
                      />
                    </svg>
                    <svg
                      v-else
                      class="w-4 h-4 mr-3 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    Upload File Excel
                  </button>

                  <!-- Input Data Pemohon -->
                  <button
                    @click="handleInputAndClose"
                    :disabled="isLoading || isUploadingCSV"
                    class="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                  >
                    <div class="w-4 h-4 mr-3">
                      <PemohonIconElement
                        color="none"
                        stroke="#0099FF"
                        class="-ml-0.5 -mt-[2.8px]"
                      />
                    </div>
                    Input Data Pemohon
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ✅ Desktop Header dengan search result di sebelah kiri -->
        <div
          class="hidden sm:flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3"
        >
          <!-- Title -->
          <div class="flex items-center space-x-1">
            <div class="p-1 bg-white/20 rounded-lg">
              <PemohonIconElement
                color="white"
                stroke="white"
                class="h-4 w-4"
              />
            </div>
            <div>
              <h1 class="text-sm lg:text-lg font-bold text-white leading-tight">
                Daftar Data Pemohon
              </h1>
              <p class="text-white/80 text-[11px] sm:text-sm leading-tight">
                Data Pemohon
              </p>
            </div>
          </div>

          <!-- Search Box & Action Menu Desktop -->
          <div class="flex items-center gap-3 w-full lg:w-auto">
            <!-- Search Result Pills di sebelah kiri search box (sampai md) -->
            <div
              v-if="searchText"
              class="hidden md:flex items-center gap-2 flex-shrink-0"
            >
              <!-- Search Term Pill -->
              <span
                class="inline-flex items-center px-3 py-1 bg-white/20 text-white text-xs rounded-full border border-white/30"
              >
                Pencarian: {{ searchText }}
                <button
                  @click="clearSearch"
                  class="ml-2 text-white/80 hover:text-white transition-colors duration-200"
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

              <!-- Result Count Pill -->
              <span
                v-if="pemohonStore.pagination?.total !== undefined"
                class="flex items-center px-3 py-1 bg-white/30 text-white text-xs rounded-full font-medium border border-white/40"
              >
                {{ pemohonStore.pagination.total }} hasil
              </span>
            </div>

            <!-- Search Box di Header -->
            <div class="flex-1 lg:w-80">
              <div class="relative">
                <input
                  type="text"
                  placeholder="Cari supplier, perusahaan, bank..."
                  v-model="searchText"
                  class="border border-white/30 bg-white/20 backdrop-blur-sm rounded-lg h-10 px-4 pr-10 text-sm placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white focus:bg-white/30 transition-all duration-200 w-full"
                />
                <!-- Clear search button -->
                <button
                  v-if="searchText"
                  @click="clearSearch"
                  class="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors duration-200"
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
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70"
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
            </div>

            <!-- Action Menu Desktop -->
            <div ref="dropdownRef" class="relative flex-shrink-0">
              <button
                @click.stop="showMenu = !showMenu"
                class="inline-flex items-center px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200"
              >
                <svg
                  class="w-4 h-4 text-white mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>
                <span class="text-sm font-medium">Aksi</span>
                <svg
                  class="w-3 h-3 ml-2 text-white/60 transition-transform duration-200"
                  :class="{ 'rotate-180': showMenu }"
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

              <!-- Dropdown Menu Desktop -->
              <div
                v-show="showMenu"
                class="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-[99999] transform transition-all duration-200 origin-top-right"
                :class="
                  showMenu ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                "
                style="z-index: 99999 !important"
              >
                <div class="py-2">
                  <!-- Dashboard -->
                  <button
                    @click="handleDashboardAndClose"
                    :disabled="isLoading || isUploadingCSV"
                    class="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-600 flex items-center transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      class="w-4 h-4 mr-3 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163z"
                      />
                    </svg>
                    Dashboard
                  </button>

                  <!-- Upload Excel -->
                  <button
                    @click="handleUploadAndClose"
                    :disabled="isLoading || isUploadingCSV"
                    class="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 flex items-center transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      v-if="isUploadingCSV"
                      class="animate-spin w-4 h-4 mr-3 text-green-500"
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
                    <svg
                      v-else
                      class="w-4 h-4 mr-3 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    Upload File Excel
                  </button>

                  <!-- Input Data Pemohon -->
                  <button
                    @click="handleInputAndClose"
                    :disabled="isLoading || isUploadingCSV"
                    class="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div class="w-4 h-4 mr-3">
                      <PemohonIconElement
                        color="none"
                        stroke="#0099FF"
                        class="-ml-0.5 -mt-[2.8px]"
                      />
                    </div>
                    Input Data Pemohon
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ✅ Active Filters Mobile (Lebih compact) -->
        <div
          v-if="searchText"
          class="flex flex-wrap gap-1 mt-1 w-full md:hidden"
        >
          <span
            class="inline-flex items-center px-2 py-0.5 bg-white/20 text-white text-[10px] rounded-full border border-white/30"
          >
            Pencarian: {{ searchText }}
            <button
              @click="clearSearch"
              class="ml-1 text-white/80 hover:text-white"
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
            v-if="pemohonStore.pagination?.total !== undefined"
            class="px-2 py-0.5 bg-white/30 text-white text-[10px] rounded-full font-medium border border-white/40"
          >
            {{ pemohonStore.pagination.total }} hasil
          </span>
        </div>
      </div>

      <!-- ✅ Content Section - Reduced padding -->
      <div class="p-3 sm:p-6">
        <!-- Table Container -->
        <div
          class="relative text-xs sm:text-sm overflow-hidden rounded-lg shadow-sm border border-gray-200"
        >
          <!-- Mobile Card View -->
          <div class="block lg:hidden">
            <!-- Loading State -->
            <div
              v-if="isLoading"
              class="flex justify-center items-center h-48 bg-white"
            >
              <div class="text-center">
                <div
                  class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500 mx-auto mb-2"
                ></div>
                <div class="text-gray-500 text-xs sm:text-sm">
                  {{ searchText ? 'Mencari data...' : 'Memuat data...' }}
                </div>
              </div>
            </div>

            <!-- Error State -->
            <div
              v-else-if="hasError"
              class="flex justify-center items-center h-48 bg-white"
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
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 00-1-1z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <p class="text-sm mb-3">{{ error }}</p>
                <button
                  @click="fetchData(currentPage, searchText)"
                  class="px-4 py-2 bg-[#0099ff] text-white rounded-lg hover:bg-blue-600 text-xs sm:text-sm transition-colors duration-200"
                >
                  Coba Lagi
                </button>
              </div>
            </div>

            <!-- Data Cards - More compact -->
            <div v-else class="bg-gray-50">
              <template v-if="filteredPemohon.length === 0">
                <div class="py-12 text-center text-gray-400 bg-white">
                  <div class="text-gray-300 mb-3">
                    <svg
                      class="w-10 h-10 sm:w-12 sm:h-12 mx-auto"
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
                    {{
                      searchText
                        ? 'Tidak ada data yang sesuai dengan pencarian'
                        : 'Tidak ada data pemohon'
                    }}
                  </p>
                  <p class="text-xs text-gray-300 mt-1">
                    {{
                      searchText
                        ? 'Coba kata kunci lain atau hapus filter'
                        : 'Belum ada data pemohon yang tersedia'
                    }}
                  </p>
                </div>
              </template>
              <template v-else>
                <div
                  class="space-y-2 p-2 max-h-[calc(100vh-380px)] overflow-y-auto"
                >
                  <div
                    v-for="(pemohon, index) in filteredPemohon"
                    :key="pemohon.id || index"
                    class="bg-white rounded-lg p-2.5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
                  >
                    <!-- Header with actions - More compact -->
                    <div class="flex justify-between items-start mb-2">
                      <div class="flex-1 min-w-0">
                        <h4
                          class="font-medium text-sm text-gray-900 mb-0.5 truncate"
                        >
                          {{ toTitleCase(pemohon.nama_suplier) }}
                        </h4>
                        <p class="text-xs text-gray-600">
                          {{ toTitleCase(pemohon.nama_perusahaan) }}
                        </p>
                      </div>
                      <!-- Action buttons - Smaller -->
                      <div class="flex flex-col space-y-1 ml-2">
                        <!-- Edit Button -->
                        <button
                          @click="handleEdit(pemohon)"
                          class="inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-150 min-w-[60px]"
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
                          @click="handleDelete(pemohon)"
                          class="inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all duration-150 min-w-[60px]"
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

                    <!-- Content Grid - More compact -->
                    <div
                      class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs"
                    >
                      <div class="space-y-0.5">
                        <span class="text-gray-500 font-medium"
                          >Jenis Bank:</span
                        >
                        <p class="font-medium text-gray-900">
                          <span
                            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {{ pemohon.jenis_bank || '-' }}
                          </span>
                        </p>
                      </div>
                      <div class="space-y-0.5">
                        <span class="text-gray-500 font-medium"
                          >No. Rekening:</span
                        >
                        <p class="font-medium text-gray-900 font-mono text-xs">
                          {{ pemohon.no_rekening || '-' }}
                        </p>
                      </div>
                      <div class="space-y-0.5 sm:col-span-2">
                        <span class="text-gray-500 font-medium"
                          >Atas Nama:</span
                        >
                        <p class="font-medium text-gray-900 truncate">
                          {{ toTitleCase(pemohon.atasnama_rekening) }}
                        </p>
                      </div>
                    </div>

                    <!-- Footer - More compact -->
                    <div
                      class="flex justify-end items-center mt-2 pt-2 border-t border-gray-100"
                    >
                      <div class="flex items-center space-x-2">
                        <span
                          class="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full"
                        >
                          {{ (currentPage - 1) * itemsPerPage + index + 1 }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- Desktop Table View - Unchanged since it works well -->
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
                  <div class="text-gray-500">
                    {{ searchText ? 'Mencari data...' : 'Memuat data...' }}
                  </div>
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
                    @click="fetchData(currentPage, searchText)"
                    class="px-6 py-2 bg-[#0099ff] text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                  >
                    Coba Lagi
                  </button>
                </div>
              </div>

              <!-- Data Table -->
              <div
                v-else
                class="overflow-y-auto max-h-[calc(100vh-400px)] [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-scrollbar:{display:none}]"
              >
                <table class="w-full">
                  <thead class="sticky top-0 z-10">
                    <tr
                      class="bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 text-xs border-b border-gray-200"
                    >
                      <th
                        class="px-3 py-2 rounded-tl-xl text-center font-semibold w-16"
                      >
                        No
                      </th>
                      <th class="px-2 py-2 text-left font-semibold w-36">
                        Nama Supplier
                      </th>
                      <th class="px-2 py-2 text-left font-semibold w-36">
                        Nama Perusahaan
                      </th>
                      <th class="px-2 py-2 font-semibold w-24 text-center">
                        Jenis Bank
                      </th>
                      <th class="px-2 py-2 font-semibold w-40 text-center">
                        No. Rekening
                      </th>
                      <th class="px-2 py-2 font-semibold w-36 text-center">
                        Atas Nama Rekening
                      </th>
                      <th
                        class="px-2 py-2 rounded-tr-xl font-semibold w-32 text-center"
                      >
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-if="filteredPemohon.length === 0">
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
                            {{
                              searchText
                                ? 'Tidak ada data yang sesuai dengan pencarian'
                                : 'Tidak ada data pemohon'
                            }}
                          </p>
                          <p class="text-sm text-gray-300 mt-2">
                            {{
                              searchText
                                ? 'Coba kata kunci lain atau hapus filter'
                                : 'Belum ada data pemohon yang tersedia'
                            }}
                          </p>
                        </td>
                      </tr>
                    </template>
                    <template v-else>
                      <tr
                        v-for="(pemohon, index) in filteredPemohon"
                        :key="pemohon.id || index"
                        :class="[
                          index % 2 === 0
                            ? 'bg-white hover:bg-gray-50'
                            : 'bg-gray-50/50 hover:bg-gray-100/50',
                          'border-b border-[#E4E7EC] cursor-pointer transition-all duration-200 ease-in-out',
                        ]"
                      >
                        <!-- No -->
                        <td class="px-3 py-2 text-center w-16">
                          <div
                            class="text-xs font-semibold text-gray-700 bg-blue-50 rounded-full w-8 h-8 flex items-center justify-center mx-auto"
                          >
                            {{ (currentPage - 1) * itemsPerPage + index + 1 }}
                          </div>
                        </td>

                        <!-- Nama Supplier -->
                        <td class="px-2 py-2 text-left w-36">
                          <div
                            class="text-xs font-medium text-gray-900 truncate"
                            :title="toTitleCase(pemohon.nama_suplier)"
                          >
                            {{ toTitleCase(pemohon.nama_suplier) }}
                          </div>
                        </td>

                        <!-- Nama Perusahaan -->
                        <td class="px-2 py-2 text-left w-36">
                          <div
                            class="text-xs text-gray-700 truncate"
                            :title="toTitleCase(pemohon.nama_perusahaan)"
                          >
                            {{ toTitleCase(pemohon.nama_perusahaan) }}
                          </div>
                        </td>

                        <!-- Jenis Bank -->
                        <td class="px-2 py-2 text-center w-24">
                          <span
                            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {{ pemohon.jenis_bank || '-' }}
                          </span>
                        </td>

                        <!-- No. Rekening -->
                        <td class="px-2 py-2 text-center w-40">
                          <div
                            class="text-sm font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded"
                            :title="pemohon.no_rekening"
                          >
                            {{ pemohon.no_rekening || '-' }}
                          </div>
                        </td>

                        <!-- Atas Nama Rekening -->
                        <td class="px-2 py-2 text-center w-36">
                          <div
                            class="text-xs text-gray-700 truncate"
                            :title="toTitleCase(pemohon.atasnama_rekening)"
                          >
                            {{ toTitleCase(pemohon.atasnama_rekening) }}
                          </div>
                        </td>

                        <!-- Aksi -->
                        <td class="px-2 py-2 w-32">
                          <div
                            class="flex space-x-1.5 justify-center items-center"
                          >
                            <!-- Edit Button -->
                            <button
                              @click="handleEdit(pemohon)"
                              class="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-150"
                              title="Edit data pemohon"
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
                              @click="handleDelete(pemohon)"
                              class="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all duration-150"
                              title="Hapus data pemohon"
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

          <!-- ✅ Pagination - Reduced spacing -->
          <div class="mt-2 space-y-2 bottom-0 py-3 sm:py-5 lg:py-0 xl:py-2">
            <PageElement
              v-if="totalPages > 1"
              :current-page="currentPage"
              :total-pages="totalPages"
              @change="handlePageChange"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
