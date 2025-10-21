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
  import SuperAdminLayout from '@/layouts/SuperAdminLayout.vue'
  import MainElement from '@/components/MainElement.vue'
  import StaffAddIconElement from '@/components/StaffAddIconElement.vue'
  import ButtonElement from '@/components/ButtonElement.vue'
  import 'vue-advanced-cropper/dist/style.css'

  const iconHover = ref(false)
  const router = useRouter()
  const userStore = useUserStore()

  // ✅ Get instance untuk akses parent component
  const instance = getCurrentInstance()

  // Update pageTitle untuk menampilkan nama pengguna
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
        router.push('/superadmin/dashboard')
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

      // ✅ PERBAIKAN: Set flag yang lebih jelas
      sessionStorage.setItem('profileUpdated', 'true')
      sessionStorage.setItem('profileUpdating', 'true') // ✅ Flag tambahan

      Swal.fire({
        title: 'Berhasil!',
        text: 'Profile berhasil diupdate!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        timerProgressBar: true,
      })

      setTimeout(async () => {
        console.log('🚀 Redirecting to dashboard...')
        await router.push('/superadmin/dashboard')
        console.log('✅ Redirected to dashboard with refresh flag')
      }, 1500)
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
      router.push('/superadmin/dashboard')
    }
  }
</script>

<template>
  <MainElement>
    <div class="flex flex-col h-full px-2">
      <!-- Header section -->
      <section class="flex-shrink-0">
        <!-- TITLE -->
        <div
          class="text-center font-semibold text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl text-[#0099FF] underline underline-offset-2 sm:underline-offset-4 md:underline-offset-6 lg:underline-offset-8 relative px-3 sm:px-4 md:px-6 pb-12"
        >
          {{ pageTitle }}
          <!-- DOT -->
          <span
            v-if="hasUnsavedChanges"
            class="absolute -top-0.5 sm:-top-1 -right-1 sm:-right-2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse shadow-sm"
            title="Ada perubahan yang belum disimpan"
          ></span>
        </div>
      </section>

      <!-- ✅ HAPUS LOADING STATE SECTION -->
      <!-- Form content langsung tanpa loading indicator -->
      <section
        class="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-scrollbar:{display:none}] px-3 sm:px-4 md:px-6 lg:px-0"
      >
        <!-- FORM -->
        <div class="px-3 sm:px-4 md:px-6 lg:px-0">
          <form @submit.prevent="handleRight">
            <div
              class="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12 xl:gap-16 w-full"
            >
              <!-- FOTO -->
              <div
                class="flex flex-col items-center flex-shrink-0 lg:w-auto w-full"
              >
                <div
                  class="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40"
                >
                  <div
                    class="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full overflow-hidden border-2 border-gray-300 hover:border-blue-400 hover:shadow-lg transition-all duration-300 shadow-md"
                  >
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
                        class="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14"
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
                    class="absolute cursor-pointer overflow-visible -bottom-1 -right-1 sm:bottom-0 sm:right-0 md:-bottom-1 md:-right-1 lg:bottom-2 lg:right-1 z-20 scale-75 sm:scale-90 md:scale-100 hover:scale-110 transition-transform duration-200"
                  >
                    <StaffAddIconElement />
                  </div>
                </div>
                <div
                  class="pt-2 sm:pt-3 w-full text-center text-gray-600 max-w-xs"
                >
                  <div class="text-xs sm:text-sm md:text-base font-medium">
                    Upload Your Photo
                  </div>
                  <div
                    class="text-xs sm:text-sm text-gray-500 mt-1 leading-tight"
                  >
                    Klik untuk upload & edit foto
                  </div>
                </div>
              </div>

              <!-- INPUT FIELDS -->
              <div
                class="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-6 w-full min-w-0"
              >
                <!-- NAMA (READONLY) -->
                <div
                  class="flex flex-col gap-1.5 sm:gap-2 md:gap-2.5 mb-4 sm:mb-5 md:mb-6"
                >
                  <label
                    for="nama"
                    class="font-medium text-xs sm:text-sm md:text-base text-gray-700"
                    >Nama</label
                  >
                  <input
                    type="text"
                    id="nama"
                    readonly
                    class="border-2 border-gray-200 bg-gray-100 rounded-lg h-10 sm:h-11 md:h-12 px-3 sm:px-4 md:px-5 w-full text-xs sm:text-sm md:text-base text-gray-600 cursor-not-allowed"
                    v-model="nama"
                  />
                </div>

                <!-- NO TELP (EDITABLE) -->
                <div
                  class="flex flex-col gap-1.5 sm:gap-2 md:gap-2.5 mb-4 sm:mb-5 md:mb-6"
                >
                  <label
                    for="no-telp"
                    class="font-medium text-xs sm:text-sm md:text-base text-gray-700"
                    >No. Telp</label
                  >
                  <input
                    type="text"
                    id="no-telp"
                    placeholder="Masukkan Nomor Telepon (max 15 karakter)"
                    :class="[
                      'border-2 rounded-lg h-10 sm:h-11 md:h-12 px-3 sm:px-4 md:px-5 w-full text-xs sm:text-sm md:text-base focus:ring-2 focus:ring-blue-200 transition-all duration-200',
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
                  <!-- Character counter dan helper text -->
                  <div class="flex items-center text-xs mt-1">
                    <span class="text-gray-500"> Karakter: </span>
                    <span
                      :class="[
                        'font-medium, pl-1',
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
                <div
                  class="flex flex-col gap-1.5 sm:gap-2 md:gap-2.5 mb-4 sm:mb-5 md:mb-6"
                >
                  <label
                    for="nama-pengguna"
                    class="font-medium text-xs sm:text-sm md:text-base text-gray-700"
                    >Nama Pengguna</label
                  >
                  <input
                    type="text"
                    id="nama-pengguna"
                    readonly
                    class="border-2 border-gray-200 bg-gray-100 rounded-lg h-10 sm:h-11 md:h-12 px-3 sm:px-4 md:px-5 w-full text-xs sm:text-sm md:text-base text-gray-600 cursor-not-allowed"
                    v-model="namaPengguna"
                  />
                </div>

                <!-- PASSWORD (READONLY) -->
                <div
                  class="flex flex-col gap-1.5 sm:gap-2 md:gap-2.5 mb-4 sm:mb-5 md:mb-6"
                >
                  <label
                    for="password"
                    class="font-medium text-xs sm:text-sm md:text-base text-gray-700"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    readonly
                    class="border-2 border-gray-200 bg-gray-100 rounded-lg h-10 sm:h-11 md:h-12 px-3 sm:px-4 md:px-5 w-full text-xs sm:text-sm md:text-base text-gray-600 cursor-not-allowed"
                    v-model="password"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>

      <!-- BUTTON -->
      <section class="mt-6 sm:mt-8 md:mt-10 px-3 sm:px-4 md:px-6 lg:px-0">
        <ButtonElement
          left-label="Back"
          :show-delete="showDeleteButton"
          :disabled="userStore.isLoading"
          @onClickLeft="handleLeft"
          @onClickRight="handleRight"
        />
      </section>
    </div>
  </MainElement>

  <!-- Cropper Modal -->
  <div
    v-if="showCropper"
    class="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-3 sm:p-4 md:p-6"
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
        class="bg-white rounded-xl p-4 sm:p-6 max-w-[95vw] sm:max-w-lg md:max-w-xl w-full shadow-2xl"
      >
        <h3
          class="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 text-center sm:text-left"
        >
          Edit Foto Profile
        </h3>

        <!-- Cropper -->
        <div
          class="cropper-container mb-4 sm:mb-6"
          style="height: 250px; min-height: 200px"
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
            class="px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors touch-manipulation"
          >
            Batal
          </button>
          <button
            type="button"
            @click="saveCroppedImage"
            class="px-4 py-2.5 sm:py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors touch-manipulation"
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
      height: 200px !important;
      min-height: 180px !important;
    }
  }

  @media (min-width: 641px) and (max-width: 768px) {
    .cropper-container {
      height: 280px !important;
      min-height: 220px !important;
    }
  }

  /* Touch optimizations for mobile devices */
  @media (hover: none) and (pointer: coarse) {
    .cropper-container {
      touch-action: pan-x pan-y;
    }

    input[type='file'] {
      min-height: 44px;
      min-width: 44px;
    }

    button {
      min-height: 44px;
      min-width: 44px;
    }
  }

  /* Enhanced focus states for accessibility */
  input:focus:not([readonly]) {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  input[readonly] {
    background-color: #f3f4f6 !important;
    color: #6b7280 !important;
    cursor: not-allowed !important;
  }

  .photo-upload-container {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .photo-upload-container:hover {
    transform: translateY(-2px);
  }

  .form-loading {
    pointer-events: none;
    opacity: 0.7;
  }

  @media (max-width: 375px) {
    .form-grid {
      gap: 0.75rem;
    }
  }

  @media (min-width: 376px) and (max-width: 640px) {
    .form-grid {
      gap: 1rem;
    }
  }
</style>
