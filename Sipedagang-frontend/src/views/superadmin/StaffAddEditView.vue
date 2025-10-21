<script setup>
  import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
  import { useRouter, onBeforeRouteLeave } from 'vue-router'
  import { fetchAdminById } from '@/services/adminService'
  import {
    createAdmin,
    updateAdmin,
    setAdminInactive,
    setAdminActive,
  } from '@/services/adminService'
  import { config } from '@/config/env'
  import { Cropper, CircleStencil } from 'vue-advanced-cropper'
  import Swal from 'sweetalert2'
  import MainElement from '@/components/MainElement.vue'
  import StaffIconElement from '@/components/StaffIconElement.vue'
  import ArrowIconElement from '@/components/ArrowIconElement.vue'
  import StaffAddIconElement from '@/components/StaffAddIconElement.vue'
  import ButtonElement from '@/components/ButtonElement.vue'
  import PasswordShowElement from '@/components/PasswordShowElement.vue'
  import PasswordHideElement from '@/components/PasswordHideElement.vue'
  import 'vue-advanced-cropper/dist/style.css'

  const props = defineProps(['id'])
  const iconHover = ref(false)
  const router = useRouter()

  const pageTitle = computed(() =>
    props.id ? 'Management Admin - Edit' : 'Management Admin - Tambah',
  )

  const nama = ref('')
  const namaPengguna = ref('')
  const noTelp = ref('')
  const password = ref('')
  const passwordConfirmation = ref('')
  const showPassword = ref(false)
  const showPasswordConfirmation = ref(false)
  const userStatus = ref('active')
  const originalPasswordExists = ref(false)
  const photoUrl = ref('')
  const photoFile = ref(null)
  const fileInputRef = ref(null)

  const showCropper = ref(false)
  const selectedImageSrc = ref('')
  const cropperRef = ref(null)

  const originalPassword = ref('')

  const showDeleteButton = computed(() => !!props.id)

  const deleteButtonLabel = computed(() => {
    if (!props.id) return 'Hapus'

    const isActive = userStatus.value === 'active'
    const label = isActive ? 'Nonaktifkan' : 'Aktifkan'

    return label
  })

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

  watch(password, (newPassword, oldPassword) => {
    if (props.id && newPassword !== oldPassword) {
      passwordConfirmation.value = ''
    }
  })

  const shouldShowPasswordConfirmation = computed(() => {
    if (!props.id) {
      return true
    } else {
      return password.value !== originalPassword.value
    }
  })

  const isPasswordChanged = computed(() => {
    if (!props.id) return true
    return password.value !== originalPassword.value
  })

  const deleteAction = computed(() => {
    if (!props.id) return 'delete'

    const isActive = userStatus.value === 'active'
    return isActive ? 'deactivate' : 'activate'
  })

  const getPhotoUrl = (photoPath) => {
    return config.getStorageUrl(photoPath)
  }

  const bypassConfirmation = ref(false)

  const hasUnsavedChanges = ref(false)
  const initialFormData = ref({})

  const saveInitialData = () => {
    initialFormData.value = {
      nama: nama.value,
      namaPengguna: namaPengguna.value,
      noTelp: noTelp.value,
      password: password.value,
      photoUrl: photoUrl.value,
    }
    hasUnsavedChanges.value = false
  }

  const checkForChanges = () => {
    const currentData = {
      nama: nama.value,
      namaPengguna: namaPengguna.value,
      noTelp: noTelp.value,
      password: password.value,
      photoUrl: photoUrl.value,
    }

    hasUnsavedChanges.value =
      JSON.stringify(currentData) !== JSON.stringify(initialFormData.value)
  }

  watch(
    [nama, namaPengguna, noTelp, password, photoUrl],
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

    if (props.id) {
      try {
        const data = await fetchAdminById(props.id)

        if (!data) throw new Error('not found')

        nama.value = data.name || ''
        namaPengguna.value = data.nama_pengguna || ''
        noTelp.value = data.phone_number || ''
        photoUrl.value = getPhotoUrl(data.profile_photo)

        const statusValue = data.status || data.user_status || data.is_active

        if (
          statusValue === 'active' ||
          statusValue === 1 ||
          statusValue === true
        ) {
          userStatus.value = 'active'
        } else if (
          statusValue === 'inactive' ||
          statusValue === 0 ||
          statusValue === false
        ) {
          userStatus.value = 'inactive'
        } else {
          userStatus.value = 'active'
        }

        const currentPassword = data.plain_password || data.password || ''
        password.value = currentPassword
        originalPassword.value = currentPassword
        passwordConfirmation.value = currentPassword
        originalPasswordExists.value = !!currentPassword

        saveInitialData()
      } catch (e) {
        nama.value = ''
        namaPengguna.value = ''
        noTelp.value = ''
        photoUrl.value = ''
        userStatus.value = 'active'
        password.value = ''
        passwordConfirmation.value = ''
        originalPasswordExists.value = false
        Swal.fire({
          title: 'Error!',
          text: 'Data admin tidak ditemukan!',
          icon: 'error',
          confirmButtonColor: '#d33',
        })
      }
    } else {
      setTimeout(() => {
        saveInitialData()
      }, 100)
    }
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })

  const togglePasswordVisibility = (event) => {
    event.stopPropagation()
    event.preventDefault()
    showPassword.value = !showPassword.value
  }

  const togglePasswordConfirmationVisibility = (event) => {
    event.stopPropagation()
    event.preventDefault()
    showPasswordConfirmation.value = !showPasswordConfirmation.value
  }

  const formatPhoneNumber = (event) => {
    let value = event.target.value.replace(/[^0-9+\-]/g, '')

    if (value.includes('+')) {
      const parts = value.split('+')
      if (parts[0] === '') {
        value = '+' + parts.slice(1).join('').replace(/\+/g, '')
      } else {
        value = value.replace(/\+/g, '')
      }
    }

    if (value.length > 20) {
      value = value.slice(0, 20)
    }

    noTelp.value = value === '' ? '' : value
  }

  const displayPhoneNumber = computed({
    get: () => noTelp.value || '',
    set: (value) => {
      noTelp.value = value.trim() === '' ? '' : value
    },
  })

  async function handleRight() {
    if (!nama.value || !namaPengguna.value || (!props.id && !password.value)) {
      Swal.fire({
        title: 'Error!',
        text: 'Mohon lengkapi semua field yang diperlukan!',
        icon: 'error',
        confirmButtonColor: '#d33',
      })
      return
    }

    if (
      shouldShowPasswordConfirmation.value &&
      password.value !== passwordConfirmation.value
    ) {
      Swal.fire({
        title: 'Error!',
        text: 'Password dan konfirmasi password tidak sama!',
        icon: 'error',
        confirmButtonColor: '#d33',
      })
      return
    }

    try {
      if (props.id) {
        let updateData = new FormData()
        updateData.append('name', nama.value)
        updateData.append('nama_pengguna', namaPengguna.value)

        const phoneValue =
          noTelp.value && noTelp.value.trim() !== '' ? noTelp.value.trim() : ''
        updateData.append('phone_number', phoneValue)

        if (isPasswordChanged.value) {
          updateData.append('password', password.value)
          updateData.append('password_confirmation', passwordConfirmation.value)
        }

        if (photoFile.value) {
          updateData.append('profile_photo', photoFile.value)
        }

        await updateAdmin(props.id, updateData)

        Swal.fire({
          title: 'Berhasil!',
          text: 'Data admin berhasil diupdate!',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true,
        })
      } else {
        let createData

        const phoneValue =
          noTelp.value && noTelp.value.trim() !== '' ? noTelp.value.trim() : ''

        if (photoFile.value) {
          createData = new FormData()
          createData.append('name', nama.value)
          createData.append('nama_pengguna', namaPengguna.value)
          createData.append('password', password.value)
          createData.append('password_confirmation', passwordConfirmation.value)
          createData.append('phone_number', phoneValue)
          createData.append('profile_photo', photoFile.value)
        } else {
          createData = {
            name: nama.value,
            nama_pengguna: namaPengguna.value,
            password: password.value,
            password_confirmation: passwordConfirmation.value,
            phone_number: phoneValue,
          }
        }

        await createAdmin(createData)

        Swal.fire({
          title: 'Berhasil!',
          text: 'Admin berhasil ditambahkan!',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true,
        })
      }

      hasUnsavedChanges.value = false

      bypassConfirmation.value = true

      setTimeout(() => {
        router.push('/superadmin/admin')
      }, 2000)
    } catch (e) {
      Swal.fire({
        title: 'Error!',
        text: e.response?.data?.message || 'Gagal menyimpan data admin!',
        icon: 'error',
        confirmButtonColor: '#d33',
      })
    }
  }

  async function handleLeft() {
    const canLeave = await confirmLeave()

    if (canLeave) {
      bypassConfirmation.value = true
      router.push('/superadmin/admin')
    }
  }

  async function handleDelete() {
    if (!props.id) return

    const isActive = userStatus.value === 'active'
    const actionText = isActive ? 'nonaktifkan' : 'aktifkan'
    const confirmText = isActive ? 'Ya, Nonaktifkan!' : 'Ya, Aktifkan!'

    let confirmTitle = `Konfirmasi ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`
    let confirmMessage = `Yakin ingin ${actionText} admin ini?`

    if (hasUnsavedChanges.value) {
      confirmMessage = `Ada perubahan yang belum disimpan. Sistem akan menyimpan perubahan terlebih dahulu, kemudian ${actionText} admin ini. Lanjutkan?`
    }

    const result = await Swal.fire({
      title: confirmTitle,
      text: confirmMessage,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: isActive ? '#d33' : '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: confirmText,
      cancelButtonText: 'Batal',
    })

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: hasUnsavedChanges.value
            ? `Menyimpan dan ${actionText} admin...`
            : `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} admin...`,
          text: 'Mohon tunggu',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading()
          },
        })

        if (hasUnsavedChanges.value) {
          if (
            !nama.value ||
            !namaPengguna.value ||
            (!props.id && !password.value)
          ) {
            Swal.fire({
              title: 'Error!',
              text: 'Mohon lengkapi semua field yang diperlukan sebelum mengubah status!',
              icon: 'error',
              confirmButtonColor: '#d33',
            })
            return
          }

          if (
            shouldShowPasswordConfirmation.value &&
            password.value !== passwordConfirmation.value
          ) {
            Swal.fire({
              title: 'Error!',
              text: 'Password dan konfirmasi password tidak sama!',
              icon: 'error',
              confirmButtonColor: '#d33',
            })
            return
          }

          let updateData = new FormData()
          updateData.append('name', nama.value)
          updateData.append('nama_pengguna', namaPengguna.value)

          const phoneValue =
            noTelp.value && noTelp.value.trim() !== ''
              ? noTelp.value.trim()
              : ''
          updateData.append('phone_number', phoneValue)

          if (isPasswordChanged.value) {
            updateData.append('password', password.value)
            updateData.append(
              'password_confirmation',
              passwordConfirmation.value,
            )
          }

          if (photoFile.value) {
            updateData.append('profile_photo', photoFile.value)
          }

          await updateAdmin(props.id, updateData)

          hasUnsavedChanges.value = false
          saveInitialData()
        }

        if (isActive) {
          await setAdminInactive(props.id)
        } else {
          await setAdminActive(props.id)
        }

        const successMessage = hasUnsavedChanges.value
          ? `Data berhasil disimpan dan admin berhasil ${isActive ? 'di-nonaktifkan' : 'diaktifkan'}!`
          : `Admin berhasil ${isActive ? 'di-nonaktifkan' : 'diaktifkan'}!`

        Swal.fire({
          title: 'Berhasil!',
          text: successMessage,
          icon: 'success',
          timer: 2500,
          showConfirmButton: false,
          timerProgressBar: true,
        })

        bypassConfirmation.value = true

        setTimeout(() => {
          router.push('/superadmin/admin')
        }, 2500)
      } catch (e) {
        Swal.fire({
          title: 'Error!',
          text: e.response?.data?.message || `Gagal ${actionText} admin!`,
          icon: 'error',
          confirmButtonColor: '#d33',
        })
      }
    }
  }
</script>

<template>
  <MainElement>
    <!-- ✅ Improved container with proper height management for desktop -->
    <div class="flex flex-col h-full px-2">
      <!-- ✅ Header section with controlled height -->
      <section class="flex-shrink-0">
        <!-- TITLE -->
        <div
          class="text-center font-semibold text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl text-[#0099FF] underline underline-offset-2 sm:underline-offset-4 md:underline-offset-6 lg:underline-offset-8 relative px-3 sm:px-4 md:px-6"
        >
          {{ pageTitle }}
          <!-- DOT -->
          <span
            v-if="hasUnsavedChanges"
            class="absolute -top-0.5 sm:-top-1 -right-1 sm:-right-2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse shadow-sm"
            title="Ada perubahan yang belum disimpan"
          ></span>
        </div>

        <!-- NAV -->
        <RouterLink
          to="/superadmin/admin"
          class="flex gap-1.5 pb-4 mx-3 sm:mx-4 md:mx-12 lg:mx-0 xl:mx-0 sm:gap-2 items-center px-3 sm:px-4 md:px-0 mt-3 sm:mt-4 md:mt-6 lg:mt-4"
        >
          <div
            @mouseenter="iconHover = true"
            @mouseleave="iconHover = false"
            class="flex gap-1.5 sm:gap-2 items-center cursor-pointer"
          >
            <div class="scale-75 sm:scale-90 md:scale-100">
              <StaffIconElement
                :color="iconHover ? '#0099FF' : '#9BA1AA'"
                :stroke="iconHover ? 'white' : 'white'"
              />
            </div>
            <div
              :class="[
                'text-xs sm:text-sm md:text-base font-poppins font-medium transition-colors duration-200',
                iconHover ? 'text-[#0099FF]' : 'text-[#9BA1AA]',
              ]"
            >
              Admin
            </div>
          </div>
          <div class="mt-0.5 scale-75 sm:scale-90 md:scale-100">
            <ArrowIconElement />
          </div>
          <div
            class="text-[#9BA1AA] text-xs sm:text-sm md:text-base font-poppins font-medium"
          >
            {{ props.id ? 'Edit Admin' : 'Tambah Admin' }}
          </div>
        </RouterLink>
      </section>

      <!-- ✅ Scrollable content area with proper overflow handling -->
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
                      alt="Foto Admin"
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
                <!-- NAMA Staff -->
                <div
                  class="flex flex-col gap-1.5 sm:gap-2 md:gap-2.5 mb-4 sm:mb-5 md:mb-6"
                >
                  <label
                    for="nama-staff"
                    class="font-medium text-xs sm:text-sm md:text-base text-gray-700"
                    >Nama Admin <span class="text-red-500">*</span></label
                  >
                  <input
                    type="text"
                    id="nama-staff"
                    placeholder="Masukkan Nama Admin"
                    class="border-2 border-gray-300 rounded-lg h-10 sm:h-11 md:h-12 px-3 sm:px-4 md:px-5 w-full text-xs sm:text-sm md:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    v-model="nama"
                    autocomplete="name"
                    required
                  />
                </div>

                <!-- NO TELP -->
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
                    placeholder="Masukkan Nomor Telepon"
                    class="border-2 border-gray-300 rounded-lg h-10 sm:h-11 md:h-12 px-3 sm:px-4 md:px-5 w-full text-xs sm:text-sm md:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    v-model="displayPhoneNumber"
                    autocomplete="tel"
                    pattern="[0-9+\-]*"
                    inputmode="tel"
                    @input="formatPhoneNumber"
                    maxlength="20"
                    title="Masukkan nomor telepon (dapat menggunakan + dan - untuk format internasional)"
                  />
                </div>

                <!-- NAMA PENGGUNA -->
                <div
                  class="flex flex-col gap-1.5 sm:gap-2 md:gap-2.5 mb-4 sm:mb-5 md:mb-6"
                >
                  <label
                    for="nama-pengguna"
                    class="font-medium text-xs sm:text-sm md:text-base text-gray-700"
                    >Nama Pengguna <span class="text-red-500">*</span></label
                  >
                  <input
                    type="text"
                    id="nama-pengguna"
                    placeholder="Masukkan Nama Pengguna"
                    class="border-2 border-gray-300 rounded-lg h-10 sm:h-11 md:h-12 px-3 sm:px-4 md:px-5 w-full text-xs sm:text-sm md:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    v-model="namaPengguna"
                    autocomplete="username"
                    required
                  />
                </div>

                <!-- PASSWORD -->
                <div
                  class="flex flex-col gap-1.5 sm:gap-2 md:gap-2.5 mb-4 sm:mb-5 md:mb-6"
                >
                  <label
                    for="password"
                    class="font-medium text-xs sm:text-sm md:text-base text-gray-700"
                  >
                    Password <span class="text-red-500">*</span>
                    <span
                      v-if="props.id && !isPasswordChanged"
                      class="text-green-600 text-xs sm:text-sm block sm:inline"
                    >
                      (password saat ini)
                    </span>
                    <span
                      v-if="props.id && isPasswordChanged"
                      class="text-orange-500 text-xs sm:text-sm block sm:inline"
                    >
                      (password baru)
                    </span>
                  </label>
                  <div class="relative">
                    <input
                      :type="showPassword ? 'text' : 'password'"
                      id="password"
                      :placeholder="
                        props.id
                          ? 'Edit password atau biarkan sama'
                          : 'Masukkan Password'
                      "
                      class="border-2 border-gray-300 rounded-lg h-10 sm:h-11 md:h-12 px-3 sm:px-4 md:px-5 w-full pr-10 sm:pr-12 text-xs sm:text-sm md:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      v-model="password"
                      autocomplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      class="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600 transition-colors p-1 z-10"
                      @click="togglePasswordVisibility"
                      @mousedown.prevent
                      tabindex="-1"
                    >
                      <PasswordShowElement
                        v-if="!showPassword"
                        class="w-4 h-4 sm:w-5 sm:h-5 pointer-events-none"
                      />
                      <PasswordHideElement
                        v-else
                        class="w-4 h-4 sm:w-5 sm:h-5 pointer-events-none"
                      />
                    </button>
                  </div>
                </div>

                <!-- PASSWORD CONFIRMATION -->
                <div
                  class="flex flex-col gap-1.5 sm:gap-2 md:gap-2.5 mb-4 sm:mb-5 md:mb-6"
                  v-if="shouldShowPasswordConfirmation"
                >
                  <label
                    for="password-confirmation"
                    class="font-medium text-xs sm:text-sm md:text-base text-gray-700"
                  >
                    Konfirmasi Password <span class="text-red-500">*</span>
                    <span
                      v-if="props.id"
                      class="text-orange-500 text-xs sm:text-sm block sm:inline"
                    >
                      (ulangi password baru)
                    </span>
                  </label>
                  <div class="relative">
                    <input
                      :type="showPasswordConfirmation ? 'text' : 'password'"
                      id="password-confirmation"
                      placeholder="Ulangi Password"
                      class="border-2 border-gray-300 rounded-lg h-10 sm:h-11 md:h-12 px-3 sm:px-4 md:px-5 w-full pr-10 sm:pr-12 text-xs sm:text-sm md:text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      v-model="passwordConfirmation"
                      autocomplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      class="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600 transition-colors p-1 z-10"
                      @click="togglePasswordConfirmationVisibility"
                      @mousedown.prevent
                      tabindex="-1"
                    >
                      <PasswordShowElement
                        v-if="!showPasswordConfirmation"
                        class="w-4 h-4 sm:w-5 sm:h-5 pointer-events-none"
                      />
                      <PasswordHideElement
                        v-else
                        class="w-4 h-4 sm:w-5 sm:h-5 pointer-events-none"
                      />
                    </button>
                  </div>
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
          :delete-label="deleteButtonLabel"
          :delete-action="deleteAction"
          @onClickDelete="handleDelete"
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

    /* Increase touch target size for mobile */
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
  input:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  /* Smooth transitions for better UX */
  .photo-upload-container {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .photo-upload-container:hover {
    transform: translateY(-2px);
  }

  /* Loading states */
  .form-loading {
    pointer-events: none;
    opacity: 0.7;
  }

  /* Mobile-first grid improvements */
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

  input[type='password']::-ms-reveal,
  input[type='password']::-ms-clear {
    display: none;
  }

  input[type='password']::-webkit-textfield-decoration-container,
  input[type='password']::-webkit-reveal {
    display: none;
  }

  /* For newer Edge versions */
  input[type='password']::-webkit-credentials-auto-fill-button {
    display: none;
  }

  .cropper-container {
    background: linear-gradient(145deg, #f8f9fa, #e9ecef);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #dee2e6;
  }
</style>
