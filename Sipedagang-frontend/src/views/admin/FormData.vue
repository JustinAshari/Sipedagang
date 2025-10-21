<script setup>
  import {
    ref,
    onMounted,
    onBeforeUnmount,
  } from 'vue'
  import { useRouter, onBeforeRouteLeave } from 'vue-router'
  import FormElement from '@/components/FormElement.vue'
  import ButtonElement from '@/components/ButtonElement.vue'
  import { usePengadaanStore } from '@/stores/pengadaanStore'
  import Swal from 'sweetalert2'

  const formRef = ref(null)
  const isSubmitting = ref(false)
  const router = useRouter()
  const pengadaanStore = usePengadaanStore()

  // ✅ Tambahkan state untuk tracking perubahan
  const hasUnsavedChanges = ref(false)

  // ✅ Handler untuk form changes dari FormElement
  const handleFormChanged = (hasChanges) => {
    hasUnsavedChanges.value = hasChanges
  }

  // ✅ Fungsi konfirmasi sebelum meninggalkan halaman
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

  // ✅ Guard untuk navigasi Vue Router
  onBeforeRouteLeave(async (to, from) => {
    const canLeave = await confirmLeave()
    if (!canLeave) {
      return false // Batalkan navigasi
    }
  })

  // ✅ Guard untuk browser navigation
  const handleBeforeUnload = (event) => {
    if (hasUnsavedChanges.value) {
      event.preventDefault()
      event.returnValue =
        'Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman?'
      return event.returnValue
    }
  }

  onMounted(async () => {
    // Add beforeunload listener
    window.addEventListener('beforeunload', handleBeforeUnload)
  })

  onBeforeUnmount(() => {
    // Remove beforeunload listener
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })

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
        // ✅ Reset unsaved changes setelah clear
        hasUnsavedChanges.value = false

        // ✅ Show success message for clear
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

  async function handleSubmit() {
    if (!formRef.value) return

    isSubmitting.value = true

    try {
      // Create new data using submitForm method
      await formRef.value.submitForm()

      // ✅ Reset unsaved changes setelah berhasil submit
      hasUnsavedChanges.value = false

      await Swal.fire({
        title: 'Berhasil!',
        text: 'Data pengadaan berhasil disimpan',
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
      let errorMsg = 'Terjadi kesalahan saat menyimpan data'

      // Handle validation errors or other errors
      if (error.response && error.response.status === 422) {
        // Ambil pesan error dari backend (array atau string)
        const errors = error.response.data.errors
        if (errors) {
          // Gabungkan semua pesan error menjadi satu string
          errorMsg = Object.values(errors).flat().join(', ')
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message
        } else {
          errorMsg = 'Request failed with status code 422'
        }
      } else if (error.message) {
        errorMsg = error.message
      }

      Swal.fire({
        title: 'Gagal Menyimpan!',
        html: `<div style="text-align:left">${errorMsg}</div>`,
        icon: 'error',
        confirmButtonColor: '#d33',
        confirmButtonText: 'Tutup',
        customClass: {
          popup: 'rounded-xl',
          confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
        },
      })
    } finally {
      isSubmitting.value = false
    }
  }
</script>

<template>
  <transition name="page" appear>
    <!-- Container mengikuti pola LihatDataComponent -->
    <div class="px-4 max-w-5xl mx-auto pt-1 sm:pt-2">
      <!-- Main Content Card -->
      <div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div>
                <h1 class="text-sm sm:text-lg font-bold text-white leading-tight relative">
                  Form Input Data
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div>
                <h1 class="text-sm sm:text-lg font-bold text-white leading-tight relative">
                  Form Input Data
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
          <div class="px-4 ">
            <FormElement
              ref="formRef"
              :isEditMode="false"
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
            rightLabel="Simpan"
            leftLabel="Clear"
          />
        </div>
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

