<script setup>
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
  import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
  import MainElement from '@/components/MainElement.vue'
  import FormPengadaan from '@/components/PengadaanElement.vue'
  import ButtonElement from '@/components/ButtonElement.vue'
  import PengadaanIconElement from '@/components/PengadaanIconElement.vue'
  import Swal from 'sweetalert2'

  const formRef = ref(null)
  const isSubmitting = ref(false)
  const router = useRouter()
  const route = useRoute()
  const hasUnsavedChanges = ref(false)
  const showMenu = ref(false)
  const isDataLoaded = ref(false)

  // ✅ ADD: Flag to prevent route guard conflicts
  const isManualNavigation = ref(false)

  // Edit mode detection
  const isEditMode = computed(() => !!route.params.id)
  const pengadaanId = computed(() => route.params.id)
  const settingPengadaanStore = computed(
    () => formRef.value?.settingPengadaanStore,
  )

  // ✅ FIXED: Added event listener setup
  onMounted(async () => {
    console.log('SettingPengadaanView mounted')
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('click', handleClickOutside)

    if (isEditMode.value && pengadaanId.value) {
      try {
        console.log('Loading data for edit mode, ID:', pengadaanId.value)
        await loadPengadaanData(pengadaanId.value)
      } catch (error) {
        console.error('Failed to load pengaturan pengadaan data:', error)
        Swal.fire({
          title: 'Error!',
          text: 'Gagal memuat data pengaturan pengadaan',
          icon: 'error',
          confirmButtonColor: '#d33',
          customClass: {
            popup: 'rounded-xl',
            confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
          },
        }).then(() => {
          router.push('/superadmin/settingpengadaan-list/')
        })
      }
    } else {
      console.log('Add mode - setting initial state')
      // ✅ For add mode, ensure clean state
      isDataLoaded.value = true
      hasUnsavedChanges.value = false

      // ✅ Clear any existing data in form and store
      if (formRef.value && formRef.value.clearForm) {
        formRef.value.clearForm()
      }

      if (
        settingPengadaanStore.value &&
        settingPengadaanStore.value.clearCurrentPengaturanPengadaan
      ) {
        settingPengadaanStore.value.clearCurrentPengaturanPengadaan()
      }
    }
  })

  // Load pengaturan pengadaan data for editing
  async function loadPengadaanData(id) {
    console.log('loadPengadaanData called with ID:', id)

    if (!settingPengadaanStore.value) {
      console.warn('settingPengadaanStore not available yet')
      return
    }

    try {
      console.log('Fetching pengaturan pengadaan by ID:', id)
      await settingPengadaanStore.value.fetchPengaturanPengadaanById(id)

      // Populate form with loaded data
      if (
        formRef.value &&
        formRef.value.populateForm &&
        settingPengadaanStore.value.currentPengaturanPengadaan
      ) {
        console.log(
          'Populating form with data:',
          settingPengadaanStore.value.currentPengaturanPengadaan,
        )
        formRef.value.populateForm(
          settingPengadaanStore.value.currentPengaturanPengadaan,
        )
        hasUnsavedChanges.value = false // ✅ Reset changes after loading
        isDataLoaded.value = true // ✅ Mark data as loaded
      }
    } catch (error) {
      console.error('Error loading pengaturan pengadaan data:', error)
      throw error
    }
  }

  // Confirm leave function
  const confirmLeave = async () => {
    if (!hasUnsavedChanges.value) return true

    const result = await Swal.fire({
      title: 'Perubahan Belum Disimpan!',
      html: isEditMode.value
        ? 'Anda memiliki perubahan yang belum disimpan pada data pengaturan pengadaan ini.<br/><strong>Yakin ingin meninggalkan halaman tanpa menyimpan?</strong>'
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
        ? 'Anda memiliki perubahan yang belum disimpan pada data pengaturan pengadaan ini. Yakin ingin meninggalkan halaman?'
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

  // Clear function
  async function handleClear() {
    // ✅ Di mode edit, selalu tampilkan konfirmasi meskipun tidak ada perubahan
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
            await loadPengadaanData(pengadaanId.value)

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
        // Update existing pengaturan pengadaan
        await formRef.value.updateForm(pengadaanId.value)
      } else {
        // Create new pengaturan pengadaan
        await formRef.value.submitForm()
      }

      hasUnsavedChanges.value = false

      Swal.fire({
        title: 'Berhasil!',
        text: isEditMode.value
          ? 'Data pengaturan pengadaan berhasil diperbarui'
          : 'Data pengaturan pengadaan berhasil disimpan',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
        customClass: {
          popup: 'rounded-xl',
        },
      }).then(() => {
        if (isEditMode.value) {
          isManualNavigation.value = true // Set flag before navigation
          router.push('/superadmin/settingpengadaan-list/')
        } else {
          // ✅ In add mode, reset form after successful save
          if (formRef.value && formRef.value.clearForm) {
            formRef.value.clearForm()
            hasUnsavedChanges.value = false
          }
        }
      })
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
    if (!isEditMode.value || !pengadaanId.value) return

    const result = await Swal.fire({
      title: 'Konfirmasi Hapus',
      text: 'Yakin ingin menghapus data pengaturan pengadaan ini? Tindakan ini tidak dapat dibatalkan!',
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

      if (settingPengadaanStore.value) {
        await settingPengadaanStore.value.deletePengaturanPengadaan(
          pengadaanId.value,
        )
      }

      hasUnsavedChanges.value = false

      Swal.fire({
        title: 'Berhasil!',
        text: 'Data pengaturan pengadaan berhasil dihapus',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
        customClass: {
          popup: 'rounded-xl',
        },
      }).then(() => {
        isManualNavigation.value = true // Set flag before navigation
        router.push('/superadmin/settingpengadaan-list/')
      })
    } catch (error) {
      console.error('Delete error:', error)

      let errorMsg = 'Terjadi kesalahan saat menghapus data'

      if (error.response?.status === 404) {
        errorMsg = 'Data pengaturan pengadaan tidak ditemukan'
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

  // Input pengaturan pengadaan function
  async function handleInputPengadaan() {
    console.log('handleInputPengadaan called', {
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

    if (
      settingPengadaanStore.value &&
      settingPengadaanStore.value.clearCurrentPengaturanPengadaan
    ) {
      settingPengadaanStore.value.clearCurrentPengaturanPengadaan()
    }

    hasUnsavedChanges.value = false

    // ✅ Navigate with flag set
    console.log('Navigating to input page')
    router.push('/superadmin/settingpengadaan')
  }

  // List pengaturan pengadaan navigation
  async function handleListPengadaan() {
    console.log('handleListPengadaan called', {
      hasUnsavedChanges: hasUnsavedChanges.value,
    })

    try {
      if (hasUnsavedChanges.value) {
        const result = await Swal.fire({
          title: 'Perubahan Belum Disimpan!',
          text: 'Anda memiliki perubahan yang belum disimpan. Yakin ingin pindah ke daftar pengaturan pengadaan?',
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
      await router.push('/superadmin/settingpengadaan-list/')
    } catch (error) {
      console.error('Navigation error:', error)
      isManualNavigation.value = false // Reset flag on error

      Swal.fire({
        title: 'Error Navigasi!',
        text: 'Terjadi kesalahan saat membuka halaman daftar pengaturan pengadaan',
        icon: 'error',
        confirmButtonColor: '#d33',
        customClass: {
          popup: 'rounded-xl',
          confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
        },
      })
    }
  }

  // Menu handlers
  const handleListAndClose = () => {
    handleListPengadaan()
    showMenu.value = false
  }

  const handleInputAndClose = () => {
    handleInputPengadaan()
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
            {{
              isEditMode
                ? 'Edit Pengaturan Pengadaan'
                : 'Form Pengaturan Pengadaan'
            }}
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
                <!-- Input Setting Pengadaan - Show only in edit mode -->
                <button
                  v-if="isEditMode"
                  @click="handleInputAndClose"
                  :disabled="isSubmitting || settingPengadaanStore?.isLoading"
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

                <!-- List Pengaturan Pengadaan -->
                <button
                  @click="handleListAndClose"
                  :disabled="isSubmitting || settingPengadaanStore?.isLoading"
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
                  Lihat Daftar Pengadaan
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- FORM -->
        <FormPengadaan
          ref="formRef"
          :isEditMode="isEditMode"
          @form-changed="handleFormChanged"
        />

        <!-- Main Action Buttons -->
        <ButtonElement
          left-label="Clear"
          :right-label="isEditMode ? 'Update' : 'Simpan'"
          :show-delete="isEditMode"
          delete-label="Hapus"
          :right-loading="isSubmitting || settingPengadaanStore?.isLoading"
          :left-disabled="isSubmitting || settingPengadaanStore?.isLoading"
          @on-click-left="handleClear"
          @on-click-right="handleSubmit"
          @on-click-delete="handleDelete"
        />
      </section>
    </MainElement>
</template>
