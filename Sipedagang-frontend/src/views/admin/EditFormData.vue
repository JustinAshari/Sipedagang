<script setup>
  import {
    ref,
    computed,
    onMounted,
    onBeforeUnmount,
    watch,
  } from 'vue'
  import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router'
  import FormElement from '@/components/FormElement.vue'
  import ButtonElement from '@/components/ButtonElement.vue'
  import { usePengadaanStore } from '@/stores/pengadaanStore'
  import Swal from 'sweetalert2'

  const formRef = ref(null)
  const isSubmitting = ref(false)
  const isLoading = ref(true)
  const router = useRouter()
  const route = useRoute()
  const pengadaanStore = usePengadaanStore()

  // State untuk tracking perubahan
  const hasUnsavedChanges = ref(false)
  const currentData = ref(null)
  const bypassConfirmation = ref(false)

  const editId = computed(() => route.params.id)

  // Handler untuk form changes dari FormElement
  const handleFormChanged = (hasChanges) => {
    hasUnsavedChanges.value = hasChanges
  }

  // Fungsi konfirmasi sebelum meninggalkan halaman
  const confirmLeave = async () => {
    if (!hasUnsavedChanges.value) return true

    const result = await Swal.fire({
      title: 'Perubahan Belum Disimpan!',
      text: 'Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman ini?',
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

  // Guard untuk navigasi Vue Router
  onBeforeRouteLeave(async (to, from) => {
    if (bypassConfirmation.value) {
      bypassConfirmation.value = false
      return true
    }

    const canLeave = await confirmLeave()
    if (!canLeave) {
      return false
    }
    return true
  })

  // Guard untuk browser navigation
  const handleBeforeUnload = (event) => {
    if (hasUnsavedChanges.value) {
      event.preventDefault()
      event.returnValue =
        'Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman?'
      return event.returnValue
    }
  }

  onMounted(async () => {
    window.addEventListener('beforeunload', handleBeforeUnload)

    try {
      isLoading.value = true
      console.log('Loading data for edit, ID:', editId.value)

      if (!pengadaanStore.fetchPengadaanById) {
        throw new Error('Method fetchPengadaanById tidak ditemukan')
      }

      // Fetch data by ID
      const data = await pengadaanStore.fetchPengadaanById(editId.value)

      if (!data) {
        throw new Error('Data tidak ditemukan')
      }

      currentData.value = data
      console.log('Data loaded successfully:', data)
    } catch (error) {
      console.error('Error loading data for edit:', error)
      Swal.fire({
        title: 'Gagal Memuat Data!',
        text: 'Tidak dapat memuat data pengadaan untuk diedit. Silakan coba lagi atau hubungi administrator.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Kembali ke Daftar',
        customClass: {
          popup: 'rounded-xl',
          confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
        },
      }).then(() => {
        router.push('/admin/lihatdata')
      })
    } finally {
      isLoading.value = false
    }
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })

  // Watch untuk populate form setelah data dan form ready
  watch(
    [isLoading, formRef, currentData],
    ([loading, form, data]) => {
      if (!loading && form && data) {
        try {
          console.log('Attempting to populate form with data:', data)

          if (form.populateForm && typeof form.populateForm === 'function') {
            form.populateForm(data)
            console.log('Form populated successfully')
          } else {
            console.error('populateForm method not available on form ref')
          }
        } catch (error) {
          console.error('Error populating form:', error)
          Swal.fire({
            title: 'Gagal Memuat Data ke Form!',
            text: `Terjadi kesalahan saat memuat data ke formulir: ${error.message}`,
            icon: 'error',
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Tutup',
            customClass: {
              popup: 'rounded-xl',
              confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
            },
          })
        }
      }
    },
    { immediate: true }
  )

  async function handleClear() {
    if (!hasUnsavedChanges.value) {
      // Jika tidak ada perubahan, langsung clear
      if (formRef.value && formRef.value.clearForm) {
        formRef.value.clearForm()
      }
      return
    }

    // Jika ada perubahan, minta konfirmasi
    const result = await Swal.fire({
      title: 'Konfirmasi Bersihkan Form',
      text: 'Semua data yang sudah Anda isi akan dihapus. Yakin ingin melanjutkan?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, Bersihkan',
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
        // Reset unsaved changes setelah clear
        hasUnsavedChanges.value = false
      }
    }
  }

  async function handleSubmit() {
    if (!formRef.value) {
      console.error('Form ref not available')
      return
    }

    // ✅ FRONTEND VALIDATION FIRST
    const validationResult = validateForm()
    if (!validationResult.isValid) {
      // Show validation errors without submitting
      Swal.fire({
        title: 'Mohon Perbaiki Data Berikut:',
        text: validationResult.errorMessage,
        icon: 'warning',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Tutup',
        width: '500px',
        customClass: {
          popup: 'rounded-xl',
          confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
        },
      })
      return
    }

    try {
      isSubmitting.value = true

      // ✅ FIXED: Check if FormElement has required methods
      if (typeof formRef.value.updateForm !== 'function') {
        console.error('updateForm method not available on FormElement')
        throw new Error('FormElement tidak memiliki method updateForm')
      }

      console.log('Calling updateForm with ID:', editId.value)

      // ✅ FIXED: Call updateForm with just the ID
      await formRef.value.updateForm(editId.value)

      // Reset unsaved changes setelah berhasil update
      hasUnsavedChanges.value = false
      bypassConfirmation.value = true

      // Success message
      await Swal.fire({
        title: 'Berhasil!',
        text: 'Data berhasil diperbarui',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
        customClass: {
          popup: 'rounded-xl',
        },
      })

      // Redirect ke halaman lihat data setelah sukses
      router.push('/admin/lihatdata')

    } catch (error) {
      console.error('Update error:', error)
      console.error('Error response:', error.response)

      let errorTitle = 'Gagal Memperbarui!'
      let errorMessage = 'Terjadi kesalahan saat memperbarui data'
      let isValidationError = false

      // ✅ CONSISTENT ERROR HANDLING dengan RiwayatEditView
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors
        if (validationErrors) {
          errorTitle = 'Mohon Perbaiki Data Berikut:'
          isValidationError = true
          
          // ✅ Format validation errors simple dan clean
          const errorList = Object.entries(validationErrors)
            .map(([field, messages]) => {
              const msgArray = Array.isArray(messages) ? messages : [messages]
              
              // ✅ Convert field names to Indonesian
              const fieldNames = {
                'nama_supplier': 'Nama Supplier',
                'nama_suplier': 'Nama Supplier',
                'nama_perusahaan': 'Nama Perusahaan',
                'jenis_bank': 'Jenis Bank',
                'nomor_rekening': 'Nomor Rekening',
                'no_rekening': 'Nomor Rekening',
                'atasnama_rekening': 'Atas Nama Rekening',
                'kuantum': 'Kuantum',
                'no_po': 'Nomor PO',
                'nomorPO': 'Nomor PO',
                'tanggal_pengadaan': 'Tanggal Pengadaan',
                'jenis_pengadaan': 'Jenis Pengadaan',
                'jumlah_spp': 'Jumlah SPP',
                'satuan_kuantum': 'Satuan Kuantum',
                'satuan_jumlah_pembayaran': 'Satuan Jumlah Pembayaran',
                'satuan_jumlah_spp': 'Satuan Jumlah SPP'
              }
              
              const displayField = fieldNames[field] || field
                .replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase())
              
              return `${displayField}: ${msgArray.join(', ')}`
            })
            .join(', ')
          
          errorMessage = `Validasi gagal: ${errorList}`
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message
        }
      } else if (error.response?.status === 400) {
        errorMessage = `Bad Request: ${error.response.data.message || 'Request tidak valid'}`
      } else if (error.message) {
        errorMessage = error.message
      }

      // ✅ CONSISTENT SweetAlert styling sederhana
      Swal.fire({
        title: errorTitle,
        text: errorMessage,
        icon: isValidationError ? 'warning' : 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Tutup',
        width: isValidationError ? '500px' : '400px',
        customClass: {
          popup: 'rounded-xl',
          confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
        },
      })
    } finally {
      isSubmitting.value = false
    }
  }

  // ✅ FIXED: Frontend Validation Function
  const validateForm = () => {
    if (!formRef.value) {
      return { isValid: false, errorMessage: 'Form tidak tersedia' }
    }

    // ✅ Skip frontend validation untuk edit mode jika data sudah ter-populate
    // Biarkan backend yang handle validasi untuk memastikan konsistensi
    if (currentData.value) {
      console.log('Edit mode: Skipping frontend validation, letting backend handle it')
      return { isValid: true, errorMessage: '' }
    }

    const errors = []

    // Get form data untuk validasi (hanya untuk create mode)
    const formData = formRef.value.getFormData ? formRef.value.getFormData() : {}
    
    // ✅ Validasi required fields
    const requiredFields = [
      { key: 'nama_supplier', label: 'Nama Supplier' },
      { key: 'nama_perusahaan', label: 'Nama Perusahaan' },
      { key: 'jenis_bank', label: 'Jenis Bank' },
      { key: 'nomor_rekening', label: 'Nomor Rekening' },
      { key: 'atasnama_rekening', label: 'Atas Nama Rekening' },
      { key: 'kuantum', label: 'Kuantum' },
      { key: 'no_po', label: 'Nomor PO' },
      { key: 'tanggal_pengadaan', label: 'Tanggal Pengadaan' },
      { key: 'jenis_pengadaan', label: 'Jenis Pengadaan' }
    ]

    requiredFields.forEach(field => {
      const value = formData[field.key]
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`${field.label} harus diisi`)
      }
    })

    // ✅ Validasi khusus jenis bank (minimal 3 karakter)
    if (formData.jenis_bank && formData.jenis_bank.length < 3) {
      errors.push(`Jenis Bank pilih nama bank yang valid dari daftar atau isi minimal 3 karakter`)
    }

    // ✅ Validasi khusus kuantum (harus angka)
    if (formData.kuantum) {
      const kuantumNumber = parseFloat(formData.kuantum)
      if (isNaN(kuantumNumber) || kuantumNumber <= 0) {
        errors.push(`Kuantum harus diisi dengan format yang benar (angka lebih dari 0)`)
      }
    }

    // ✅ Validasi email jika ada
    if (formData.email && formData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        errors.push(`Email harus berupa alamat email yang valid`)
      }
    }

    // ✅ Validasi nomor telepon jika ada
    if (formData.no_telepon && formData.no_telepon.trim() !== '') {
      const phoneRegex = /^[0-9+\-\s()]+$/
      if (!phoneRegex.test(formData.no_telepon) || formData.no_telepon.length < 10) {
        errors.push(`Nomor Telepon harus berupa nomor telepon yang valid (minimal 10 digit)`)
      }
    }

    const errorMessage = errors.length > 0 ? `Validasi gagal: ${errors.join(', ')}` : ''

    return {
      isValid: errors.length === 0,
      errorMessage: errorMessage
    }
  }

</script>

<template>
  <transition name="page" appear>
    <!-- Container mengikuti pola LihatDataComponent -->
    <div class="px-4 max-w-5xl mx-auto pt-1 sm:pt-2">
      <!-- Main Content Card -->
      <div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <!-- Main Form -->
        <template v-if="!isLoading">
          <!-- Header Section dengan styling yang konsisten -->
          <div class="bg-blue-600 p-1.5 sm:p-3">
            <!-- Mobile Header -->
            <div class="flex sm:hidden mb-1.5">
              <div class="items-center space-x-1 flex">
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 class="text-sm sm:text-lg font-bold text-white leading-tight relative">
                    Edit Data Pengadaan
                  </h1>
                  <p class="text-white/80 text-[11px] sm:text-sm leading-tight">
                    Data Pengadaan
                  </p>
                </div>
              </div>
            </div>

            <!-- Desktop Header -->
            <div class="flex flex-col sm:flex-row justify-between items-start gap-2">
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 class="text-sm sm:text-lg font-bold text-white leading-tight relative">
                    Edit Data Pengadaan
                  </h1>
                  <p class="text-white/80 text-[11px] sm:text-sm leading-tight">
                    Data Pengadaan
                  </p>
                </div>
              </div>

              <!-- Navigation Buttons Desktop -->
              <div class="hidden sm:flex gap-2">
                <router-link
                  to="/admin/dashboard"
                  class="inline-flex items-center px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                  </svg>
                  <span class="font-medium">Dashboard</span>
                </router-link>
                <router-link
                  to="/admin/lihatdata"
                  class="inline-flex items-center px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white text-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <span class="font-medium">Lihat Data</span>
                </router-link>
              </div>
            </div>

            <!-- Mobile Navigation Buttons -->
            <div class="sm:hidden flex gap-2 mt-3">
              <router-link
                to="/admin/dashboard"
                class="flex-1 bg-white/20 hover:bg-white/30 text-white rounded-md px-3 py-2 flex items-center justify-center space-x-2 transition-colors text-sm border border-white/30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                </svg>
                <span>Dashboard</span>
              </router-link>
              <router-link
                to="/admin/lihatdata"
                class="flex-1 bg-white/20 hover:bg-white/30 text-white rounded-md px-3 py-2 flex items-center justify-center space-x-2 transition-colors text-sm border border-white/30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span>Lihat Data</span>
              </router-link>
            </div>
          </div>

          <!-- Scrollable Form Content -->
          <div class="max-h-[25rem] sm:max-h-[25rem] overflow-y-auto">
            <div class="px-4">
              <FormElement
                ref="formRef"
                :isEditMode="true"
                @form-changed="handleFormChanged"
              />
            </div>
          </div>

          <!-- Footer Buttons -->
          <div class="border-t border-gray-200 bg-gray-50 px-3 py-2">
            <ButtonElement
              @onClickLeft="handleClear"
              @onClickRight="handleSubmit"
              :rightLoading="isSubmitting"
              rightLabel="Update"
              leftLabel="Clear"
            />
          </div>
        </template>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease-in-out;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

