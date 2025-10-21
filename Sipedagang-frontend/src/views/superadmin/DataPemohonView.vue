<script setup>
  import {
    ref,
    computed,
    onMounted,
    onBeforeUnmount,
    watch,
    nextTick,
  } from 'vue'
  import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
  import MainElement from '@/components/MainElement.vue'
  import FormPemohon from '@/components/PemohonElement.vue'
  import ButtonElement from '@/components/ButtonElement.vue'
  import PemohonIconElement from '@/components/PemohonIconElement.vue'
  import Swal from 'sweetalert2'
  import * as XLSX from 'xlsx'

  const formRef = ref(null)
  const isSubmitting = ref(false)
  const isUploadingCSV = ref(false)
  const router = useRouter()
  const route = useRoute()
  const hasUnsavedChanges = ref(false)
  const showMenu = ref(false)
  const isDataLoaded = ref(false)

  // ✅ ADD: Flag to prevent route guard conflicts
  const isManualNavigation = ref(false)

  // Edit mode detection
  const isEditMode = computed(() => !!route.params.id)
  const pemohonId = computed(() => route.params.id)
  const pemohonStore = computed(() => formRef.value?.pemohonStore)

  // Load data if in edit mode
  onMounted(async () => {
    window.addEventListener('beforeunload', handleBeforeUnload)

    if (isEditMode.value && pemohonId.value) {
      try {
        await loadPemohonData(pemohonId.value)
      } catch (error) {
        console.error('Failed to load pemohon data:', error)
        Swal.fire({
          title: 'Error!',
          text: 'Gagal memuat data pemohon',
          icon: 'error',
          confirmButtonColor: '#d33',
          customClass: {
            popup: 'rounded-xl',
            confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
          },
        }).then(() => {
          router.push('/superadmin/datapemohon-list/')
        })
      }
    } else {
      // ✅ For add mode, ensure clean state
      isDataLoaded.value = true
      hasUnsavedChanges.value = false

      // ✅ Clear any existing data in form and store
      if (formRef.value && formRef.value.clearForm) {
        formRef.value.clearForm()
      }

      if (pemohonStore.value && pemohonStore.value.clearCurrentPemohon) {
        pemohonStore.value.clearCurrentPemohon()
      }
    }
  })

  // Load pemohon data for editing
  async function loadPemohonData(id) {
    if (!pemohonStore.value) return

    try {
      await pemohonStore.value.fetchPemohonById(id)

      // Populate form with loaded data
      if (
        formRef.value &&
        formRef.value.populateForm &&
        pemohonStore.value.currentPemohon
      ) {
        // ✅ Tunggu sampai component ready
        await nextTick()
        formRef.value.populateForm(pemohonStore.value.currentPemohon)
        hasUnsavedChanges.value = false // ✅ Reset changes after loading
        isDataLoaded.value = true // ✅ Mark data as loaded
      }
    } catch (error) {
      console.error('Error loading pemohon data:', error)
      throw error
    }
  }

  // Confirm leave function
  const confirmLeave = async () => {
    if (!hasUnsavedChanges.value) return true

    const result = await Swal.fire({
      title: 'Perubahan Belum Disimpan!',
      html: isEditMode.value
        ? 'Anda memiliki perubahan yang belum disimpan pada data pemohon ini.<br/><strong>Yakin ingin meninggalkan halaman tanpa menyimpan?</strong>'
        : 'Anda memiliki data yang belum disimpan.<br/><strong>Yakin ingin meninggalkan halaman tanpa menyimpan?</strong>',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, Tinggalkan',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-xl',
        confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
        cancelButton: 'rounded-lg font-medium px-4 py-2 text-sm',
      },
    })

    return result.isConfirmed
  }

  // Route leave handling
  onBeforeRouteLeave(async (to, from) => {
    console.log('onBeforeRouteLeave triggered', {
      to: to.path,
      from: from.path,
      isDataLoaded: isDataLoaded.value,
      hasUnsavedChanges: hasUnsavedChanges.value,
      isManualNavigation: isManualNavigation.value,
    })

    // ✅ Skip route guard if this is manual navigation
    if (isManualNavigation.value) {
      console.log('Manual navigation detected, skipping route guard')
      isManualNavigation.value = false // Reset flag
      return true
    }

    // Only check for unsaved changes if data has been loaded
    if (!isDataLoaded.value) {
      console.log('Data not loaded yet, allowing navigation')
      return true
    }

    const canLeave = await confirmLeave()
    console.log('Can leave result:', canLeave)

    if (!canLeave) {
      console.log('User chose to stay, blocking navigation')
      return false
    }

    console.log('User confirmed to leave, allowing navigation')
    return true
  })

  // Before unload handling
  const handleBeforeUnload = (event) => {
    // Only prevent unload if data is loaded and there are changes
    if (isDataLoaded.value && hasUnsavedChanges.value) {
      event.preventDefault()
      const message = isEditMode.value
        ? 'Anda memiliki perubahan yang belum disimpan pada data pemohon ini. Yakin ingin meninggalkan halaman?'
        : 'Anda memiliki data yang belum disimpan. Yakin ingin meninggalkan halaman?'
      event.returnValue = message
      return message
    }
  }

  // Form change handling
  const handleFormChanged = (hasChanges) => {
    // Only track changes if data has been loaded
    if (isDataLoaded.value) {
      hasUnsavedChanges.value = hasChanges
      console.log('Form changed:', hasChanges, 'Edit mode:', isEditMode.value)
    }
  }

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })

  // Clear function
  async function handleClear() {
    // ✅ Di mode edit, selalu tampilkan konfirmasi meskipun tidak ada perubahan
    // karena clear akan mengembalikan ke data original
    if (isEditMode.value) {
      const result = await Swal.fire({
        title: 'Konfirmasi Reset Data',
        html: hasUnsavedChanges.value
          ? 'Yakin ingin menghapus semua perubahan dan mengembalikan data ke kondisi awal?'
          : 'Yakin ingin mereset form dan memuat ulang data original?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Reset',
        cancelButtonText: 'Batal',
        reverseButtons: true,
        customClass: {
          popup: 'rounded-xl',
          confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
          cancelButton: 'rounded-lg font-medium px-4 py-2 text-sm',
        },
      })

      if (result.isConfirmed) {
        if (formRef.value && formRef.value.clearForm) {
          formRef.value.clearForm()
          hasUnsavedChanges.value = false

          // Reload the original data
          try {
            await loadPemohonData(pemohonId.value)

            // ✅ Show success message for edit mode reset
            Swal.fire({
              title: 'Berhasil!',
              text: 'Data berhasil direset ke kondisi awal',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
              timerProgressBar: true,
              customClass: {
                popup: 'rounded-xl',
              },
            })
          } catch (error) {
            console.error('Error reloading data after clear:', error)
            Swal.fire({
              title: 'Error!',
              text: 'Gagal memuat ulang data original',
              icon: 'error',
              confirmButtonColor: '#d33',
              customClass: {
                popup: 'rounded-xl',
                confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
              },
            })
          }
        }
      }
    } else {
      // ✅ Mode add - hanya konfirmasi jika ada perubahan
      if (!hasUnsavedChanges.value) {
        if (formRef.value && formRef.value.clearForm) {
          formRef.value.clearForm()
        }
        return
      }

      const result = await Swal.fire({
        title: 'Konfirmasi Clear Form',
        text: 'Yakin ingin menghapus semua data yang sudah diisi?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal',
        reverseButtons: true,
        customClass: {
          popup: 'rounded-xl',
          confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
          cancelButton: 'rounded-lg font-medium px-4 py-2 text-sm',
        },
      })

      if (result.isConfirmed) {
        if (formRef.value && formRef.value.clearForm) {
          formRef.value.clearForm()
          hasUnsavedChanges.value = false

          // ✅ Show success message for add mode clear
          Swal.fire({
            title: 'Berhasil!',
            text: 'Form berhasil dibersihkan',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            timerProgressBar: true,
            customClass: {
              popup: 'rounded-xl',
            },
          })
        }
      }
    }
  }

  // Submit function
  async function handleSubmit() {
    if (!formRef.value) return

    isSubmitting.value = true

    try {
      if (isEditMode.value) {
        // Update existing pemohon
        await formRef.value.updateForm(pemohonId.value)
      } else {
        // Create new pemohon
        await formRef.value.submitForm()
      }

      hasUnsavedChanges.value = false

      // ✅ Untuk mode add, langsung clear form tanpa menunggu timer
      if (!isEditMode.value) {
        // Clear form immediately
        if (formRef.value && formRef.value.clearForm) {
          await formRef.value.clearForm()
          hasUnsavedChanges.value = false
        }

        // Show success message
        Swal.fire({
          title: 'Berhasil!',
          text: 'Data pemohon berhasil disimpan. Form siap untuk input data baru.',
          icon: 'success',
          timer: 3000, // Lebih lama untuk dibaca
          showConfirmButton: true,
          confirmButtonText: 'OK',
          timerProgressBar: true,
          customClass: {
            popup: 'rounded-xl',
            confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
          },
        })
      } else {
        // Mode edit - redirect ke list
        Swal.fire({
          title: 'Berhasil!',
          text: 'Data pemohon berhasil diperbarui',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true,
          customClass: {
            popup: 'rounded-xl',
          },
        }).then(() => {
          isManualNavigation.value = true
          router.push('/superadmin/datapemohon-list/')
        })
      }
    } catch (error) {
      let errorTitle = 'Error!'
      let errorMsg = isEditMode.value
        ? 'Terjadi kesalahan saat memperbarui data'
        : 'Terjadi kesalahan saat menyimpan data'
      let errorIcon = 'error'

      if (error.response) {
        const status = error.response.status
        const responseData = error.response.data

        switch (status) {
          case 422:
            errorTitle = 'Validasi Gagal!'
            if (responseData.errors) {
              const errorDetails = Object.entries(responseData.errors)
                .map(([field, messages]) => {
                  const fieldName = field
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase())
                  return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
                })
                .join('\n')
              errorMsg = errorDetails
            } else if (responseData.message) {
              errorMsg = responseData.message
            }
            break

          case 409:
            errorTitle = 'Data Duplikat!'
            errorMsg =
              responseData.message ||
              'Data yang Anda masukkan sudah ada dalam sistem'
            errorIcon = 'warning'
            break

          case 404:
            errorTitle = 'Data Tidak Ditemukan!'
            errorMsg =
              responseData.message || 'Data yang diminta tidak ditemukan'
            errorIcon = 'info'
            break

          case 403:
            errorTitle = 'Akses Ditolak!'
            errorMsg = 'Anda tidak memiliki izin untuk melakukan aksi ini'
            errorIcon = 'warning'
            break

          case 500:
          case 502:
          case 503:
          case 504:
            errorTitle = 'Kesalahan Server!'
            errorMsg = 'Terjadi kesalahan pada server. Silakan coba lagi nanti'
            break

          default:
            errorMsg =
              responseData.message || `Terjadi kesalahan (Kode: ${status})`
        }
      } else if (error.request) {
        errorTitle = 'Koneksi Gagal!'
        errorMsg =
          'Tidak dapat terhubung ke server. Periksa koneksi internet Anda'
        errorIcon = 'warning'
      } else if (error.message) {
        errorMsg = error.message
      }

      Swal.fire({
        title: errorTitle,
        text: errorMsg,
        icon: errorIcon,
        confirmButtonColor: '#d33',
        customClass: {
          content: 'text-left',
          popup: 'rounded-xl',
          confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
        },
      })
    } finally {
      isSubmitting.value = false
    }
  }

  // Delete function
  async function handleDelete() {
    if (!isEditMode.value || !pemohonId.value) return

    const result = await Swal.fire({
      title: 'Konfirmasi Hapus',
      text: 'Yakin ingin menghapus data pemohon ini? Tindakan ini tidak dapat dibatalkan!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-xl',
        confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
        cancelButton: 'rounded-lg font-medium px-4 py-2 text-sm',
      },
    })

    if (!result.isConfirmed) return

    try {
      isSubmitting.value = true

      if (pemohonStore.value) {
        await pemohonStore.value.deletePemohon(pemohonId.value)
      }

      hasUnsavedChanges.value = false

      Swal.fire({
        title: 'Berhasil!',
        text: 'Data pemohon berhasil dihapus',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
        customClass: {
          popup: 'rounded-xl',
        },
      }).then(() => {
        isManualNavigation.value = true // Set flag before navigation
        router.push('/superadmin/datapemohon-list/')
      })
    } catch (error) {
      console.error('Delete error:', error)

      let errorMsg = 'Terjadi kesalahan saat menghapus data'

      if (error.response?.status === 404) {
        errorMsg = 'Data pemohon tidak ditemukan'
      } else if (error.response?.status === 403) {
        errorMsg = 'Anda tidak memiliki izin untuk menghapus data ini'
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message
      }

      Swal.fire({
        title: 'Error!',
        text: errorMsg,
        icon: 'error',
        confirmButtonColor: '#d33',
        customClass: {
          popup: 'rounded-xl',
          confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
        },
      })
    } finally {
      isSubmitting.value = false
    }
  }

  // Input pemohon function
  async function handleInputPemohon() {
    console.log('handleInputPemohon called', {
      hasUnsavedChanges: hasUnsavedChanges.value,
    })

    if (hasUnsavedChanges.value) {
      const result = await Swal.fire({
        title: 'Perubahan Belum Disimpan!',
        text: 'Anda memiliki perubahan yang belum disimpan. Yakin ingin pindah ke halaman input data baru?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Pindah',
        cancelButtonText: 'Batal',
        reverseButtons: true,
        customClass: {
          popup: 'rounded-xl',
          confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
          cancelButton: 'rounded-lg font-medium px-4 py-2 text-sm',
        },
      })

      if (!result.isConfirmed) {
        console.log('User chose to cancel, keeping current data')
        return // ✅ Early return - don't proceed
      }

      console.log('User confirmed, proceeding with navigation')
    }

    // ✅ Set manual navigation flag BEFORE any clearing or navigation
    isManualNavigation.value = true

    // ✅ Clear form data only after confirmation (or if no changes)
    console.log('Clearing data before navigation')

    if (formRef.value && formRef.value.clearForm) {
      formRef.value.clearForm()
    }

    if (pemohonStore.value && pemohonStore.value.clearCurrentPemohon) {
      pemohonStore.value.clearCurrentPemohon()
    }

    hasUnsavedChanges.value = false

    // ✅ Navigate with flag set
    console.log('Navigating to input page')
    router.push('/superadmin/datapemohon')
  }

  // ADDING MISSING FUNCTION: List pemohon navigation
  // ✅ FIXED: List pemohon navigation - tidak clear data jika user batal
  async function handleListPemohon() {
    console.log('handleListPemohon called', {
      hasUnsavedChanges: hasUnsavedChanges.value,
    })

    try {
      if (hasUnsavedChanges.value) {
        const result = await Swal.fire({
          title: 'Perubahan Belum Disimpan!',
          text: 'Anda memiliki perubahan yang belum disimpan. Yakin ingin pindah ke daftar pemohon?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Ya, Pindah',
          cancelButtonText: 'Batal',
          reverseButtons: true,
          customClass: {
            popup: 'rounded-xl',
            confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
            cancelButton: 'rounded-lg font-medium px-4 py-2 text-sm',
          },
        })

        if (!result.isConfirmed) {
          console.log('User chose to cancel navigation to list')
          return // ✅ Early return - don't proceed
        }

        console.log('User confirmed, proceeding with list navigation')
      }

      // ✅ Set manual navigation flag BEFORE navigation
      isManualNavigation.value = true
      hasUnsavedChanges.value = false

      console.log('Navigating to list page')
      await router.push('/superadmin/datapemohon-list/')
    } catch (error) {
      console.error('Navigation error:', error)
      isManualNavigation.value = false // Reset flag on error

      Swal.fire({
        title: 'Error Navigasi!',
        text: 'Terjadi kesalahan saat membuka halaman daftar pemohon',
        icon: 'error',
        confirmButtonColor: '#d33',
        customClass: {
          popup: 'rounded-xl',
          confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
        },
      })
    }
  }

  // Excel functions
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
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
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

  // Updated handleUploadCSV function with preview
  async function handleUploadCSV() {
    // Disable upload in edit mode
    if (isEditMode.value) {
      Swal.fire({
        title: 'Tidak Dapat Upload!',
        text: 'Upload Excel tidak tersedia dalam mode edit. Kembali ke form tambah data untuk menggunakan fitur ini.',
        icon: 'info',
        confirmButtonColor: '#0099FF',
        customClass: {
          popup: 'rounded-xl',
          confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
        },
      })
      return
    }

    // ✅ Check for unsaved changes before upload
    if (hasUnsavedChanges.value) {
      const result = await Swal.fire({
        title: 'Perubahan Belum Disimpan!',
        text: 'Anda memiliki data yang belum disimpan. Upload Excel akan mengganti/menambah data. Yakin ingin melanjutkan?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Lanjutkan',
        cancelButtonText: 'Batal',
        reverseButtons: true,
        customClass: {
          popup: 'rounded-xl',
          confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
          cancelButton: 'rounded-lg font-medium px-4 py-2 text-sm',
        },
      })

      if (!result.isConfirmed) return
    }

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
          customClass: {
            popup: 'rounded-xl',
            confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
          },
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
          customClass: {
            popup: 'rounded-xl',
            confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
          },
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
          customClass: {
            popup: 'rounded-xl',
          },
        })

        const formData = new FormData()
        formData.append('file', file)

        // Use store method to upload
        await pemohonStore.value.uploadCSV(formData)

        // ✅ Clear unsaved changes after successful upload
        hasUnsavedChanges.value = false

        Swal.fire({
          title: 'Berhasil!',
          text: `File Excel "${file.name}" berhasil diupload dan diimpor`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: true,
          confirmButtonText: 'OK',
          timerProgressBar: true,
          customClass: {
            popup: 'rounded-xl',
            confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
          },
        })
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
            popup: 'rounded-xl',
            confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
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

  // Menu handlers
  const handleUploadAndClose = () => {
    handleUploadCSV()
    showMenu.value = false
  }

  const handleListAndClose = () => {
    handleListPemohon()
    showMenu.value = false
  }

  const handleInputAndClose = () => {
    handleInputPemohon()
    showMenu.value = false
  }

  // Add click outside handler
  const dropdownRef = ref(null)

  // Close dropdown when clicking outside
  const handleClickOutside = (event) => {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
      showMenu.value = false
    }
  }

  onMounted(async () => {
    // Add event listener for click outside
    document.addEventListener('click', handleClickOutside)

    if (isEditMode.value && pemohonId.value) {
      try {
        await loadPemohonData(pemohonId.value)
      } catch (error) {
        console.error('Failed to load pemohon data:', error)
        Swal.fire({
          title: 'Error!',
          text: 'Gagal memuat data pemohon',
          icon: 'error',
          confirmButtonColor: '#d33',
          customClass: {
            popup: 'rounded-xl',
            confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
          },
        }).then(() => {
          router.push('/superadmin/datapemohon-list/')
        })
      }
    } else {
      // ✅ For add mode, ensure clean state
      isDataLoaded.value = true
      hasUnsavedChanges.value = false

      // ✅ Clear any existing data in form and store
      if (formRef.value && formRef.value.clearForm) {
        formRef.value.clearForm()
      }

      if (pemohonStore.value && pemohonStore.value.clearCurrentPemohon) {
        pemohonStore.value.clearCurrentPemohon()
      }
    }
  })

  onBeforeUnmount(() => {
    // Remove event listener
    document.removeEventListener('click', handleClickOutside)

    window.removeEventListener('beforeunload', handleBeforeUnload)
  })
</script>

<template>
  <MainElement>
    <section class="flex flex-col justify-between h-full px-2 sm:px-4">
      <!-- HEADER WITH ACTION MENU -->
      <div class="flex justify-between items-center mb-6">
        <!-- TITLE -->
        <div
          class="font-semibold text-lg text-[#0099FF] underline underline-offset-8"
        >
          {{ isEditMode ? 'Edit Data Pemohon' : 'Form Data Pemohon' }}
        </div>

        <!-- ACTION MENU -->
        <div ref="dropdownRef" class="relative">
          <button
            @click="showMenu = !showMenu"
            class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          >
            <svg
              class="w-5 h-5 text-gray-600 mr-2"
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
              class="w-4 h-4 ml-2 text-gray-500"
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

          <!-- DROPDOWN MENU -->
          <div
            v-show="showMenu"
            class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-20 transform transition-all duration-200 origin-top-right"
            :class="showMenu ? 'scale-100 opacity-100' : 'scale-95 opacity-0'"
          >
            <div class="py-2">
              <!-- Upload Excel - Show only in add mode -->
              <button
                v-if="!isEditMode"
                @click="handleUploadAndClose"
                :disabled="
                  isSubmitting || pemohonStore?.isLoading || isUploadingCSV
                "
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
                  ></path>
                </svg>
                Upload File Excel
              </button>

              <!-- Upload disabled message in edit mode -->
              <div
                v-if="isEditMode"
                class="w-full px-4 py-3 text-left text-sm text-gray-400 flex items-center cursor-not-allowed"
              >
                <svg
                  class="w-4 h-4 mr-3 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                  ></path>
                </svg>
                Upload Excel (Tidak tersedia dalam mode edit)
              </div>

              <!-- Input Data Pemohon - Show only in edit mode -->
              <button
                v-if="isEditMode"
                @click="handleInputAndClose"
                :disabled="
                  isSubmitting || pemohonStore?.isLoading || isUploadingCSV
                "
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

              <!-- List Pemohon -->
              <button
                @click="handleListAndClose"
                :disabled="
                  isSubmitting || pemohonStore?.isLoading || isUploadingCSV
                "
                class="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  class="w-4 h-4 mr-3 text-orange-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  ></path>
                </svg>
                Lihat Daftar Pemohon
              </button>
            </div>
          </div>
        </div>
      </div>

      <FormPemohon ref="formRef" @form-changed="handleFormChanged" />

      <!-- Main Action Buttons -->
      <ButtonElement
        left-label="Clear"
        :right-label="isEditMode ? 'Update' : 'Simpan'"
        :show-delete="isEditMode"
        delete-label="Hapus"
        :right-loading="isSubmitting || pemohonStore?.isLoading"
        :left-disabled="
          isSubmitting || pemohonStore?.isLoading || isUploadingCSV
        "
        @on-click-left="handleClear"
        @on-click-right="handleSubmit"
        @on-click-delete="handleDelete"
      />
    </section>
  </MainElement>
</template>
