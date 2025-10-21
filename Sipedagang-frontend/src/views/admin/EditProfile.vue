<script setup>
  import {
    ref,
    computed,
    onMounted,
    watch,
    onBeforeUnmount,
    getCurrentInstance,
    nextTick,
  } from 'vue'
  import { useRouter, onBeforeRouteLeave } from 'vue-router'
  import { useUserStore } from '@/stores/userStore'
  import { config } from '@/config/env'
  import { Cropper, CircleStencil } from 'vue-advanced-cropper'
  import Swal from 'sweetalert2'
  import ButtonElement from '@/components/ButtonElement.vue'
  import 'vue-advanced-cropper/dist/style.css'

  const router = useRouter()
  const userStore = useUserStore()

  const instance = getCurrentInstance()

  const pageTitle = computed(() => {
    if (namaPengguna.value) {
      return `Edit Profile - ${namaPengguna.value}`
    }
    return 'Edit Profile'
  })

  // Field yang readonly
  const nama = ref('')
  const namaPengguna = ref('')
  const password = ref('')

  // Field yang bisa diedit
  const noTelp = ref('')
  const photoUrl = ref('')
  const photoFile = ref(null)
  const fileInputRef = ref(null)

  const showCropper = ref(false)
  const selectedImageSrc = ref('')
  const cropperRef = ref(null)

  const showDeleteButton = computed(() => false)

  const triggerFileInput = () => {
    if (fileInputRef.value) {
      fileInputRef.value.click()
    }
  }

  const onPhotoChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          title: 'Error!',
          text: 'File harus berupa gambar!',
          icon: 'error',
          confirmButtonColor: '#d33',
        })
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          title: 'Error!',
          text: 'Ukuran file tidak boleh lebih dari 5MB!',
          icon: 'error',
          confirmButtonColor: '#d33',
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        selectedImageSrc.value = e.target.result
        showCropper.value = true
      }
      reader.readAsDataURL(file)
    }
  }

  const saveCroppedImage = () => {
    if (cropperRef.value) {
      const { canvas } = cropperRef.value.getResult()

      canvas.toBlob(
        (blob) => {
          const croppedFile = new File([blob], `profile_${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })

          photoFile.value = croppedFile

          const reader = new FileReader()
          reader.onload = (e) => {
            photoUrl.value = e.target.result
          }
          reader.readAsDataURL(croppedFile)

          showCropper.value = false
          selectedImageSrc.value = ''

          Swal.fire({
            title: 'Berhasil!',
            text: 'Foto berhasil diedit!',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
          })
        },
        'image/jpeg',
        0.9,
      )
    }
  }

  const cancelCrop = () => {
    showCropper.value = false
    selectedImageSrc.value = ''
  }

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return ''
    return config.getStorageUrl(photoPath)
  }

  const bypassConfirmation = ref(false)
  const hasUnsavedChanges = ref(false)
  const initialFormData = ref({})

  const saveInitialData = () => {
    initialFormData.value = {
      noTelp: noTelp.value,
      photoUrl: photoUrl.value,
    }
    hasUnsavedChanges.value = false
  }

  const checkForChanges = () => {
    const currentData = {
      noTelp: noTelp.value,
      photoUrl: photoUrl.value,
    }

    hasUnsavedChanges.value =
      JSON.stringify(currentData) !== JSON.stringify(initialFormData.value)
  }

  watch(
    [noTelp, photoUrl],
    () => {
      checkForChanges()
    },
    { deep: true },
  )

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
    if (bypassConfirmation.value) {
      bypassConfirmation.value = false
      return true
    }

    if (hasUnsavedChanges.value) {
      const canLeave = await confirmLeave()
      if (!canLeave) {
        return false
      }
    }

    return true
  })

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
      // ✅ HAPUS LOADING STATE - langsung ambil data tanpa loading indicator
      const data = await userStore.fetchCurrentUser()

      if (!data) throw new Error('Profile not found')

      // Set data readonly
      nama.value = data.name || data.nama || ''
      namaPengguna.value = data.nama_pengguna || data.username || ''
      password.value = '********' // Password placeholder

      // Set data yang bisa diedit
      noTelp.value = data.phone_number || data.no_telp || ''
      photoUrl.value = data.profile_photo ? getPhotoUrl(data.profile_photo) : ''

      saveInitialData()
    } catch (error) {
      console.error('Error loading profile:', error)
      Swal.fire({
        title: 'Error!',
        text: 'Gagal memuat data profile!',
        icon: 'error',
        confirmButtonColor: '#d33',
      }).then(() => {
        router.push('/admin/dashboard')
      })
    }
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })

  const formatPhoneNumber = (event) => {
    let value = event.target.value

    // Hanya izinkan angka, +, -, spasi, dan kurung
    value = value.replace(/[^0-9+\-\s()]/g, '')

    // Batasi maksimal 15 karakter total (termasuk semua karakter)
    if (value.length > 15) {
      value = value.substring(0, 15)

      // Tampilkan peringatan jika user mencoba input lebih dari 15 karakter
      if (event.target.value.length > 15) {
        // Optional: tampilkan toast notification
        // Bisa juga menggunakan title attribute untuk feedback
        event.target.title = 'Maksimal 15 karakter'
      }
    }

    noTelp.value = value
  }

  const displayPhoneNumber = computed({
    get: () => noTelp.value || '',
    set: (value) => {
      // Pastikan tidak melebihi 15 karakter saat di-set
      const trimmedValue = value.trim()
      if (trimmedValue.length <= 15) {
        noTelp.value = trimmedValue === '' ? '' : trimmedValue
      }
    },
  })

  // Tambahkan computed untuk menghitung sisa karakter
  const remainingChars = computed(() => {
    const currentLength = noTelp.value ? noTelp.value.length : 0
    return 15 - currentLength
  })

  const isPhoneNearLimit = computed(() => {
    return remainingChars.value <= 3 && remainingChars.value > 0
  })

  const isPhoneAtLimit = computed(() => {
    return remainingChars.value === 0
  })

  async function handleRight() {
    try {
      const updateData = new FormData()

      const phoneValue =
        noTelp.value && noTelp.value.trim() !== '' ? noTelp.value.trim() : ''
      updateData.append('phone_number', phoneValue)

      if (photoFile.value) {
        updateData.append('profile_photo', photoFile.value)
      }

      console.log('Sending update data:', {
        phone_number: phoneValue,
        has_photo: !!photoFile.value,
      })

      await userStore.updateProfile(updateData)

      hasUnsavedChanges.value = false
      bypassConfirmation.value = true

      // ✅ Set flag update profile
      sessionStorage.setItem('profileUpdated', 'true')

      // ✅ Redirect langsung (tanpa setTimeout)
      await router.push('/admin/dashboard')
      console.log('✅ Redirected to dashboard with refresh flag')
    } catch (error) {
      console.error('Update profile error:', error)

      // Tampilkan pesan error dari backend
      let errorMessage = 'Gagal mengupdate profile!'

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.errors) {
        // Jika ada validation errors dari Laravel
        const errors = error.response.data.errors
        const errorMessages = Object.values(errors).flat()
        errorMessage = errorMessages.join(', ')
      }

      Swal.fire({
        title: 'Error!',
        text: errorMessage,
        icon: 'error',
        confirmButtonColor: '#d33',
      })
    }
  }

  async function handleLeft() {
    const canLeave = await confirmLeave()

    if (canLeave) {
      bypassConfirmation.value = true
      router.push('/admin/dashboard')
    }
  }
</script>

<template>
  <div class="flex flex-col h-full px-1 sm:px-2">
    <!-- Header section -->
    <section class="flex-shrink-0">
    </section>

    <!-- Form Content dengan Card -->
    <section
      class="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-scrollbar:{display:none}] px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 2xl:px-12"
    >
      <!-- Card Container -->
      <div class="flex justify-center items-start min-h-full py-1 sm:py-2 md:py-3 lg:py-4">
        <div class="w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl">
          <!-- Card -->
          <div class="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <!-- Card Header -->
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
              <h2 class="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-800 flex items-center gap-2">
                <svg class="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
                <span class="hidden sm:inline">Form Edit Profile</span>
                <span class="sm:hidden">Edit Profile</span>
              </h2>
              <p class="text-xs sm:text-sm text-gray-600 mt-1">Update informasi profile Anda</p>
            </div>

            <!-- Card Body -->
            <div class="p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10">
              <form @submit.prevent="handleRight">
                <div class="flex flex-col lg:flex-row xl:flex-row gap-4 sm:gap-6 md:gap-8 lg:gap-10 xl:gap-12 w-full">
                  <!-- FOTO SECTION -->
                  <div class="flex flex-col items-center flex-shrink-0 lg:w-auto w-full order-1 lg:order-1">
                    <div class="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40 2xl:w-44 2xl:h-44">
                      <div class="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full overflow-hidden border-2 sm:border-3 md:border-4 border-white shadow-lg hover:shadow-xl transition-all duration-300">
                        <input
                          ref="fileInputRef"
                          type="file"
                          accept="image/*"
                          class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          @change="onPhotoChange"
                        />
                        <img
                          v-if="photoUrl"
                          :src="photoUrl"
                          alt="Foto Profile"
                          class="object-cover w-full h-full"
                        />
                        <div
                          v-else
                          class="flex items-center justify-center h-full text-gray-400"
                        >
                          <svg
                            class="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 2xl:w-18 2xl:h-18"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                              clip-rule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                      <div
                        @click="triggerFileInput"
                        class="absolute cursor-pointer overflow-visible -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 z-20 bg-blue-600 rounded-full p-1.5 sm:p-2 shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200 hover:scale-110"
                      >
                        <svg class="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </div>
                    <div class="pt-2 sm:pt-3 md:pt-4 w-full text-center text-gray-600 max-w-xs">
                      <div class="text-xs sm:text-sm md:text-base font-semibold text-gray-800">
                        Upload Your Photo
                      </div>
                      <div class="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2 leading-relaxed px-2">
                        Klik untuk upload & edit foto profile
                      </div>
                    </div>
                  </div>

                  <!-- INPUT FIELDS SECTION -->
                  <div class="flex-1 min-w-0 order-2 lg:order-2">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                      <!-- NAMA (READONLY) -->
                      <div class="flex flex-col gap-1.5 sm:gap-2">
                        <label
                          for="nama"
                          class="font-semibold text-xs sm:text-sm md:text-base text-gray-700 flex items-center gap-1.5 sm:gap-2"
                        >
                          <svg class="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                          </svg>
                          Nama
                        </label>
                        <input
                          type="text"
                          id="nama"
                          readonly
                          class="border-2 border-gray-200 bg-gray-50 rounded-md sm:rounded-lg h-10 sm:h-11 md:h-12 px-3 sm:px-4 w-full text-xs sm:text-sm md:text-base text-gray-600 cursor-not-allowed focus:outline-none"
                          v-model="nama"
                        />
                      </div>

                      <!-- NO TELP (EDITABLE) -->
                      <div class="flex flex-col gap-1.5 sm:gap-2">
                        <label
                          for="no-telp"
                          class="font-semibold text-xs sm:text-sm md:text-base text-gray-700 flex items-center gap-1.5 sm:gap-2"
                        >
                          <svg class="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          No. Telp
                        </label>
                        <input
                          type="text"
                          id="no-telp"
                          placeholder="Masukkan Nomor Telepon (max 15 karakter)"
                          :class="[
                            'border-2 rounded-md sm:rounded-lg h-10 sm:h-11 md:h-12 px-3 sm:px-4 w-full text-xs sm:text-sm md:text-base focus:ring-2 focus:ring-blue-200 transition-all duration-200 focus:outline-none',
                            isPhoneAtLimit
                              ? 'border-red-400 focus:border-red-500'
                              : isPhoneNearLimit
                                ? 'border-yellow-400 focus:border-yellow-500'
                                : 'border-gray-300 focus:border-blue-500',
                          ]"
                          v-model="displayPhoneNumber"
                          autocomplete="tel"
                          inputmode="tel"
                          @input="formatPhoneNumber"
                          maxlength="15"
                          title="Masukkan nomor telepon maksimal 15 karakter"
                        />
                        <!-- Character counter -->
                        <div class="flex items-center text-xs mt-1">
                          <span class="text-gray-500">Karakter: </span>
                          <span
                            :class="[
                              'font-medium pl-1',
                              isPhoneAtLimit
                                ? 'text-red-500'
                                : isPhoneNearLimit
                                  ? 'text-yellow-600'
                                  : 'text-gray-500',
                            ]"
                          >
                            {{ noTelp.length }}/15
                          </span>
                        </div>
                      </div>

                      <!-- NAMA PENGGUNA (READONLY) -->
                      <div class="flex flex-col gap-1.5 sm:gap-2">
                        <label
                          for="nama-pengguna"
                          class="font-semibold text-xs sm:text-sm md:text-base text-gray-700 flex items-center gap-1.5 sm:gap-2"
                        >
                          <svg class="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd" />
                          </svg>
                          Nama Pengguna
                        </label>
                        <input
                          type="text"
                          id="nama-pengguna"
                          readonly
                          class="border-2 border-gray-200 bg-gray-50 rounded-md sm:rounded-lg h-10 sm:h-11 md:h-12 px-3 sm:px-4 w-full text-xs sm:text-sm md:text-base text-gray-600 cursor-not-allowed focus:outline-none"
                          v-model="namaPengguna"
                        />
                      </div>

                      <!-- PASSWORD (READONLY) -->
                      <div class="flex flex-col gap-1.5 sm:gap-2">
                        <label
                          for="password"
                          class="font-semibold text-xs sm:text-sm md:text-base text-gray-700 flex items-center gap-1.5 sm:gap-2"
                        >
                          <svg class="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                          </svg>
                          Password
                        </label>
                        <input
                          type="password"
                          id="password"
                          readonly
                          class="border-2 border-gray-200 bg-gray-50 rounded-md sm:rounded-lg h-10 sm:h-11 md:h-12 px-3 sm:px-4 w-full text-xs sm:text-sm md:text-base text-gray-600 cursor-not-allowed focus:outline-none"
                          v-model="password"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <!-- Card Footer dengan Button -->
            <div class="bg-gray-50 border-t border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 lg:px-8 lg:py-6">
              <ButtonElement
                left-label="Back"
                :show-delete="showDeleteButton"
                :disabled="userStore.isLoading"
                @onClickLeft="handleLeft"
                @onClickRight="handleRight"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>

  <!-- Cropper Modal -->
  <div
    v-if="showCropper"
    class="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-2 sm:p-3 md:p-4 lg:p-6"
  >
    <Transition
      enter-active-class="transition-all duration-300 ease-out delay-100"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        class="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 max-w-[95vw] sm:max-w-sm md:max-w-lg lg:max-w-xl xl:max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <h3
          class="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 md:mb-4 text-center"
        >
          Edit Foto Profile
        </h3>

        <!-- Cropper -->
        <div
          class="cropper-container mb-3 sm:mb-4 md:mb-6"
          style="height: 200px; min-height: 180px"
        >
          <Cropper
            ref="cropperRef"
            :src="selectedImageSrc"
            :stencil-component="CircleStencil"
            :stencil-props="{
              aspectRatio: 1,
            }"
            class="cropper"
          />
        </div>

        <!-- Modal Buttons -->
        <div
          class="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3"
        >
          <button
            type="button"
            @click="cancelCrop"
            class="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 bg-gray-200 rounded-md sm:rounded-lg hover:bg-gray-300 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
          >
            Batal
          </button>
          <button
            type="button"
            @click="saveCroppedImage"
            class="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-md sm:rounded-lg hover:bg-blue-700 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
          >
            Simpan
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
  .cropper-container {
    background: linear-gradient(145deg, #f8f9fa, #e9ecef);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #dee2e6;
  }

  /* Mobile responsive cropper adjustments */
  @media (max-width: 640px) {
    .cropper-container {
      height: 180px !important;
      min-height: 160px !important;
      border-radius: 8px;
    }
  }

  @media (min-width: 641px) and (max-width: 768px) {
    .cropper-container {
      height: 220px !important;
      min-height: 200px !important;
    }
  }

  @media (min-width: 769px) and (max-width: 1024px) {
    .cropper-container {
      height: 250px !important;
      min-height: 220px !important;
    }
  }

  /* Card styling enhancements */
  .card-container {
    min-height: 400px;
  }

  @media (min-width: 640px) {
    .card-container {
      min-height: 500px;
    }
  }

  @media (min-width: 1024px) {
    .card-container {
      min-height: 600px;
    }
  }

  @media (min-width: 1280px) {
    .card-container {
      min-height: 700px;
    }
  }

  .photo-upload-container {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .photo-upload-container:hover {
    transform: translateY(-1px);
  }

  @media (max-width: 640px) {
    .photo-upload-container:hover {
      transform: none; /* Disable hover effects on mobile */
    }
  }

  /* Enhanced input styling */
  input:focus:not([readonly]) {
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    transform: translateY(-1px);
  }

  @media (max-width: 640px) {
    input:focus:not([readonly]) {
      transform: none; /* Disable transform on mobile */
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
  }

  input[readonly] {
    background-color: #f9fafb !important;
    color: #6b7280 !important;
    cursor: not-allowed !important;
    border-color: #e5e7eb !important;
  }

  /* Custom scrollbar untuk card */
  .card-scroll::-webkit-scrollbar {
    width: 4px;
  }

  @media (min-width: 640px) {
    .card-scroll::-webkit-scrollbar {
      width: 6px;
    }
  }

  .card-scroll::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }

  .card-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }

  .card-scroll::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  /* Form field animation */
  .form-field {
    transition: all 0.2s ease-in-out;
  }

  .form-field:hover {
    transform: translateY(-1px);
  }

  @media (max-width: 640px) {
    .form-field:hover {
      transform: none;
    }
  }

  /* Touch-friendly buttons on mobile */
  @media (max-width: 640px) {
    button {
      min-height: 44px; /* iOS recommended touch target size */
      min-width: 44px;
    }
    
    input, textarea, select {
      font-size: 16px; /* Prevents zoom on iOS */
    }
  }

  /* Grid responsive adjustments */
  @media (max-width: 768px) {
    .grid-cols-1.md\\:grid-cols-2 {
      grid-template-columns: repeat(1, minmax(0, 1fr));
    }
  }

  /* Safe area adjustments for mobile */
  @media (max-width: 640px) {
    .min-h-screen {
      min-height: 100vh;
      min-height: 100dvh; /* Dynamic viewport height for mobile browsers */
    }
  }

  /* Modal responsiveness */
  @media (max-width: 640px) {
    .fixed.inset-0 {
      padding: env(safe-area-inset-top, 0) env(safe-area-inset-right, 0) env(safe-area-inset-bottom, 0) env(safe-area-inset-left, 0);
    }
  }

  /* Photo upload responsive sizing */
  @media (max-width: 480px) {
    .w-24.h-24 {
      width: 80px !important;
      height: 80px !important;
    }
  }

  /* Card shadows responsive */
  @media (max-width: 640px) {
    .shadow-lg {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
  }

  /* Improved focus indicators for accessibility */
  @media (prefers-reduced-motion: no-preference) {
    * {
      transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 150ms;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>
