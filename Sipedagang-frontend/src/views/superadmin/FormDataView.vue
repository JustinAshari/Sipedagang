<script setup>
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
  import { useRouter, onBeforeRouteLeave } from 'vue-router'
  import MainElement from '@/components/MainElement.vue'
  import FormElement from '@/components/FormElement.vue'
  import ButtonElement from '@/components/ButtonElement.vue'
  import Swal from 'sweetalert2'

  const formRef = ref(null)
  const isSubmitting = ref(false)
  const hasUnsavedChanges = ref(false)

  const pengadaanStore = computed(() => formRef.value?.pengadaanStore)

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
    })

    return result.isConfirmed
  }

  onBeforeRouteLeave(async (to, from) => {
    const canLeave = await confirmLeave()
    if (!canLeave) {
      return false
    }
  })

  const handleBeforeUnload = (event) => {
    if (hasUnsavedChanges.value) {
      event.preventDefault()
      event.returnValue =
        'Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman?'
      return event.returnValue
    }
  }

  // ✅ Handle event dari FormElement
  const handleFormChanged = (hasChanges) => {
    hasUnsavedChanges.value = hasChanges
  }

  onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })

  async function handleSubmit() {
    if (!formRef.value) return

    isSubmitting.value = true

    try {
      await formRef.value.submitForm()

      hasUnsavedChanges.value = false

      // ✅ Auto-clear form setelah berhasil submit
      if (formRef.value && formRef.value.clearForm) {
        await formRef.value.clearForm()
        hasUnsavedChanges.value = false
      }

      // ✅ Sesuaikan dengan SettingPengadaanView - tanpa .then()
      Swal.fire({
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
    } catch (error) {
      let errorTitle = 'Error!'
      let errorMsg = 'Terjadi kesalahan saat menyimpan data'
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

  // ✅ Clear dengan konfirmasi - sesuaikan dengan SettingPengadaanView
  async function handleClear() {
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
</script>

<template>
    <MainElement>
      <section class="flex flex-col justify-between h-full px-2 sm:px-4">
        <!-- TITLE -->
        <div
          class="text-center font-semibold text-sm sm:text-lg text-[#0099FF] underline sm:underline-offset-8 underline-offset-5 relative pb-2"
        >
          Form Input Data
          <!-- ✅ Dot indikator perubahan -->
          <span
            v-if="hasUnsavedChanges"
            class="absolute -top-1 -right-2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"
            title="Ada perubahan yang belum disimpan"
          ></span>
        </div>

        <!-- FORM -->
        <FormElement ref="formRef" @form-changed="handleFormChanged" />

        <!-- BUTTON -->
        <ButtonElement
          @onClickLeft="handleClear"
          @onClickRight="handleSubmit"
          :rightLoading="isSubmitting || pengadaanStore?.isLoading"
          rightLabel="Simpan"
          leftLabel="Clear"
        />
      </section>
    </MainElement>
</template>
