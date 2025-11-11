<script setup>
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
  import { useRouter, onBeforeRouteLeave } from 'vue-router'
  import MainElement from '@/components/MainElement.vue'
  import FormElement from '@/components/FormElement.vue'
  import Swal from 'sweetalert2'

  const formRef = ref(null)
  const formRefs = ref([])
  const forms = ref([{}]) // array to render multiple FormElement instances
  const isSubmitting = ref(false)
  const hasUnsavedChanges = ref(false)
  const maxForms = 7 // batas maksimal pengadaan per PO

  const pengadaanStore = computed(() => formRefs.value && formRefs.value[0] ? formRefs.value[0].pengadaanStore : null)

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
  const handleFormChanged = () => {
    // any child form has changes -> set hasUnsavedChanges
    const any = formRefs.value.some((f) => f && f.hasChanges && f.hasChanges.value)
    hasUnsavedChanges.value = any
  }

  onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })

  async function handleSubmit() {
    if (!formRefs.value || formRefs.value.length === 0) return

    // run pre-submit checks (validation + multi-PO confirmation)
    const pre = await preSubmitChecks()
    if (!pre.ok) return

    isSubmitting.value = true

    try {
      // Submit each form sequentially. Stop on first failure.
      for (let i = 0; i < formRefs.value.length; i++) {
        const f = formRefs.value[i]
        if (!f || !f.submitForm) continue
        await f.submitForm()
      }

      hasUnsavedChanges.value = false

      // Auto-clear all forms after successful submit
      await Promise.all(
        formRefs.value.map((f) => (f && f.clearForm ? f.clearForm() : Promise.resolve()))
      )

      // Reset to single blank form
      forms.value = [{}]
      formRefs.value = []

      Swal.fire({
        title: 'Berhasil!',
        text: 'Semua data pengadaan berhasil disimpan',
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
    const result = await Swal.fire({
      title: 'Konfirmasi Clear Form',
      text: 'Yakin ingin menghapus semua data yang sudah diisi? Ini akan mengosongkan semua lembar input pengadaan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, Hapus Semua',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-xl',
        confirmButton: 'rounded-lg font-medium px-4 py-2 text-sm',
        cancelButton: 'rounded-lg font-medium px-4 py-2 text-sm',
      },
    })

    if (result.isConfirmed) {
      // Clear all child forms if possible
      await Promise.all(
        formRefs.value.map((f) => (f && f.clearForm ? f.clearForm() : Promise.resolve()))
      )
      // reset to single blank form
      forms.value = [{}]
      formRefs.value = []
      hasUnsavedChanges.value = false

      Swal.fire({
        title: 'Berhasil!',
        text: 'Semua lembar form berhasil dibersihkan',
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

  const handleAddPengadaan = () => {
    if (forms.value.length >= maxForms) {
      Swal.fire({
        title: 'Batas Terlampaui',
        text: `Maksimal ${maxForms} pengadaan per PO`,
        icon: 'warning',
        timer: 1800,
        showConfirmButton: false,
      })
      return
    }

    forms.value.push({})
    // wait next tick so ref mapping can update
    setTimeout(() => {
      handleFormChanged()
    }, 50)
  }

  const removeForm = (index) => {
    if (forms.value.length === 1) {
      // clear single form instead
      if (formRefs.value[0] && formRefs.value[0].clearForm) {
        formRefs.value[0].clearForm()
      }
      return
    }
    forms.value.splice(index, 1)
    formRefs.value.splice(index, 1)
    // re-evaluate changes
    setTimeout(() => handleFormChanged(), 50)
  }

  const moveFormUp = (index) => {
    if (index <= 0) return
    const a = forms.value[index - 1]
    forms.value[index - 1] = forms.value[index]
    forms.value[index] = a
    const r = formRefs.value[index - 1]
    formRefs.value[index - 1] = formRefs.value[index]
    formRefs.value[index] = r
    setTimeout(() => handleFormChanged(), 50)
  }

  const moveFormDown = (index) => {
    if (index >= forms.value.length - 1) return
    const a = forms.value[index + 1]
    forms.value[index + 1] = forms.value[index]
    forms.value[index] = a
    const r = formRefs.value[index + 1]
    formRefs.value[index + 1] = formRefs.value[index]
    formRefs.value[index] = r
    setTimeout(() => handleFormChanged(), 50)
  }

  // Pre-submit validation and confirmation when multiple PO numbers detected
  const preSubmitChecks = async () => {
    const poList = []
    for (let i = 0; i < formRefs.value.length; i++) {
      const f = formRefs.value[i]
      if (!f) continue
      const validation = f.validateForm()
      if (!validation.isValid) {
        await Swal.fire({
          title: 'Validasi Gagal',
          text: `Lembar ${i + 1}: ${validation.errors.join(', ')}`,
          icon: 'error',
        })
        return { ok: false }
      }
      const data = f.getFormData()
      poList.push((data.no_preorder || '').trim())
    }

    const uniquePOs = Array.from(new Set(poList.filter((p) => p && p.length > 0)))
    if (uniquePOs.length > 1) {
      const res = await Swal.fire({
        title: 'Beberapa Nomor PO Terdeteksi',
        html: `Terdeteksi <strong>${uniquePOs.length}</strong> nomor PO berbeda. Sistem akan menyimpan masing-masing lembar ke PO yang sesuai.<br/><br/>Lanjutkan menyimpan?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Lanjutkan',
        cancelButtonText: 'Batal',
        reverseButtons: true,
      })
      if (!res.isConfirmed) return { ok: false }
    }

    return { ok: true }
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

  <!-- FORM: render one or more FormElement instances -->
  <div class="flex flex-col gap-4">
          <template v-for="(f, idx) in forms" :key="`form-${idx}`">
            <div class="border rounded-lg p-3 bg-white">
              <div class="flex items-center justify-between mb-2">
                <div class="font-medium">Lembar {{ idx + 1 }}</div>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="text-sm text-gray-600 hover:text-gray-800 px-2"
                    :title="'Pindah ke atas'"
                    @click="moveFormUp(idx)"
                    :disabled="idx === 0"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    class="text-sm text-gray-600 hover:text-gray-800 px-2"
                    :title="'Pindah ke bawah'"
                    @click="moveFormDown(idx)"
                    :disabled="idx === forms.length - 1"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    class="text-sm text-red-600 hover:text-red-800 px-2"
                    :title="'Hapus lembar ini'"
                    @click="() => { if (confirm('Hapus lembar ini?')) removeForm(idx) }"
                  >
                    Hapus
                  </button>
                </div>
              </div>

              <FormElement
                :isEditMode="false"
                :ref="(el) => (formRefs[idx] = el)"
                @form-changed="handleFormChanged"
              />
            </div>
          </template>
          <div class="text-sm text-gray-500">{{ forms.length }} lembar pengadaan</div>
        </div>

  <!-- small spacer to guarantee gap when scrolling -->
  <div class="w-full h-6"></div>

  <!-- BUTTONS: Clear on left, Tambah Pengadaan + Simpan on right -->
  <div class="flex items-center justify-between mt-8 sm:mt-10 w-full px-3 sm:px-4 gap-4 pb-5">
          <!-- Left: Clear -->
          <button
            type="button"
            class="bg-[#F44336] text-white rounded-lg h-10 sm:h-11 px-4 sm:px-6 md:px-8 font-medium text-sm sm:text-base cursor-pointer hover:scale-95 disabled:bg-red-300 disabled:cursor-not-allowed disabled:hover:scale-100 focus:ring-2 focus:ring-[#F44336] focus:ring-offset-2 transition-all duration-200 ease-in-out"
            @click="handleClear"
          >
            Clear
          </button>

          <!-- Right group -->
            <div class="flex items-center gap-3">
            <button
              type="button"
              :disabled="forms.length >= maxForms"
              :class="[forms.length >= maxForms ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white border border-[#0099FF] text-[#0099FF]'] + ' rounded-lg h-10 sm:h-11 px-4 sm:px-6 md:px-8 font-medium text-sm sm:text-base hover:scale-95 focus:ring-2 focus:ring-[#0099FF] focus:ring-offset-2 transition-all duration-200 ease-in-out'"
              @click="handleAddPengadaan"
            >
              Tambah Pengadaan
            </button>

            <button
              type="button"
              :disabled="isSubmitting || pengadaanStore?.isLoading"
              class="bg-[#0099FF] text-white rounded-lg h-10 sm:h-11 px-6 sm:px-8 md:px-12 lg:px-20 font-medium sm:font-semibold text-sm sm:text-base cursor-pointer hover:scale-95 disabled:bg-blue-300 disabled:cursor-not-allowed disabled:hover:scale-100 focus:ring-2 focus:ring-offset-2 focus:ring-[#0099FF] transition-all duration-200 ease-in-out flex items-center justify-center gap-2"
              @click="handleSubmit"
            >
              <svg
                v-if="isSubmitting || pengadaanStore?.isLoading"
                class="animate-spin h-3 w-3 sm:h-4 sm:w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
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
              <span>Simpan</span>
            </button>
          </div>
        </div>
      </section>
    </MainElement>
</template>
