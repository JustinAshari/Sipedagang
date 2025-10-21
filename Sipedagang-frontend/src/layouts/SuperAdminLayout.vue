<script setup>
  import { RouterLink, useRoute, useRouter } from 'vue-router'
  import { reactive, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
  import { useUserStore } from '@/stores/userStore'
  import { useAuthStore } from '@/stores/authStore'
  import { computed } from 'vue'
  import { config } from '@/config/env'
  import Bulog from '@/assets/images/bulog.png'
  import InputIconElement from '@/components/InputIconElement.vue'
  import RiwayatIconElement from '@/components/RiwayatIconElement.vue'
  import StaffIconElement from '@/components/StaffIconElement.vue'
  import PemohonIconElement from '@/components/PemohonIconElement.vue'
  import SignOutIconElement from '@/components/SignOutIconElement.vue'
  import DashboardIconElement from '@/components/DashboardIconElement.vue'
  import PengadaanIconElement from '@/components/PengadaanIconElement.vue'

  const userStore = useUserStore()
  const auth = useAuthStore()
  const router = useRouter()
  const route = useRoute()

  // ✅ ENHANCED: userName dengan animasi loading
  const userName = computed(() => {
    const user = userStore.user
    if (!user || (!user.name && !user.nama_pengguna)) {
      return '...'
    }
    return user.name || user.nama_pengguna || '...'
  })

  // ✅ NEW: State untuk animasi userName
  const isUserNameLoading = computed(() => {
    return (
      isUpdatingAfterEdit.value ||
      userStore.isLoading ||
      userName.value === '...'
    )
  })

  // ✅ NEW: Animated userName (tanpa animasi ketik)
  const animatedUserName = ref('')

  // ✅ NEW: Watch userName changes untuk update langsung
  watch(
    userName,
    (newName) => {
      // Langsung set nama tanpa animasi ketik
      animatedUserName.value = newName
    },
    { immediate: true },
  )

  // ✅ PERBAIKAN: Pisahkan loading state untuk refresh dari edit profile
  const isRefreshingAfterEdit = ref(false)

  // ✅ NEW: Cache-busting key untuk foto profil
  const photoCacheKey = ref(Date.now())

  // ✅ SIMPLIFIED: Loading state dari userStore (untuk keperluan umum)
  const isRefreshing = computed(() => userStore.isLoading)

  // ✅ NEW: Loading state khusus untuk setelah edit profile
  const isUpdatingAfterEdit = computed(() => isRefreshingAfterEdit.value)

  const isHovered = reactive({
    dashboard: false,
    input: false,
    riwayat: false,
    staff: false,
    pemohon: false,
    pengadaan: false,
    signout: false,
    profile: false,
  })

  const sidebarOpen = ref(false)

  // Handle logout - tetap gunakan authStore
  const handleLogout = async () => {
    try {
      await auth.logout()
      userStore.clearUser()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      auth.clearAuth()
      userStore.clearUser()
      router.push('/login')
    }
  }

  // ✅ TAMBAHAN: Navigate to edit profile
  const goToEditProfile = () => {
    router.push('/superadmin/editprofile')
  }

  // ✅ SIMPLIFIED: Method untuk refresh data user
  const refreshUserData = async () => {
    try {
      console.log('🔄 SuperAdminLayout: Refreshing user data...')
      await userStore.fetchCurrentUser()
      console.log('✅ SuperAdminLayout: User data refreshed successfully')
    } catch (error) {
      console.error('❌ SuperAdminLayout: Failed to refresh user data:', error)
    }
  }

  // ✅ EXPOSE method untuk dipanggil dari luar
  defineExpose({
    refreshUserData,
  })

  // ✅ SIMPLIFIED: Profile photo dari userStore dengan cache busting
  const profilePhoto = computed(() => {
    const user = userStore.user
    const foto =
      user?.profile_photo ||
      user?.foto ||
      user?.img ||
      user?.gambar ||
      user?.photo

    if (foto) {
      const url = config.getStorageUrl(foto)
      // ✅ FIXED: Tambahkan cache-busting query parameter
      return `${url}?v=${photoCacheKey.value}`
    }

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Pengguna')}&background=0099FF&color=fff&size=128`
  })

  // ✅ NEW: Watch route changes untuk detect kembali dari edit profile
  // ✅ ALTERNATIF: Gunakan flag untuk mencegah double refresh
  const isRefreshingFromEdit = ref(false)

  // ✅ PERBAIKAN: Watch route changes dengan loading state khusus
  watch(
    () => route.path,
    async (newPath, oldPath) => {
      // ✅ KONDISI: Kembali dari edit profile dan ada flag
      if (
        oldPath === '/superadmin/editprofile' &&
        sessionStorage.getItem('profileUpdated')
      ) {
        console.log('🔄 SuperAdminLayout: Detected return from edit profile')

        // ✅ LANGSUNG set loading state tanpa delay
        isRefreshingAfterEdit.value = true
        sessionStorage.removeItem('profileUpdated')

        try {
          console.log('🔄 SuperAdminLayout: Starting profile refresh...')

          // ✅ PERBAIKAN: Refresh data dan tunggu sampai selesai
          await refreshUserData()

          // ✅ FIXED: Perbarui cache key untuk memaksa reload gambar
          photoCacheKey.value = Date.now()

          console.log('✅ SuperAdminLayout: Profile refreshed successfully')

          // ✅ TAMBAHAN: Tunggu sampai Vue reactivity selesai update UI
          await nextTick()

          // ✅ TAMBAHAN: Delay tambahan untuk memastikan UI ter-render
          await new Promise((resolve) => setTimeout(resolve, 500))
        } catch (error) {
          console.error('❌ SuperAdminLayout: Refresh failed:', error)
        } finally {
          // ✅ CLEAR loading state setelah semua selesai
          isRefreshingAfterEdit.value = false
        }
      }
    },
  )

  // ✅ TAMBAHAN: Watch perubahan data user untuk memastikan UI ter-update
  watch(
    () => userStore.user,
    (newUser, oldUser) => {
      if (newUser && oldUser && isRefreshingAfterEdit.value) {
        // ✅ Jika data sudah berubah dan masih dalam state refreshing
        if (
          newUser.name !== oldUser.name ||
          newUser.profile_photo !== oldUser.profile_photo
        ) {
          console.log(
            '🔄 SuperAdminLayout: User data updated, extending loading...',
          )

          // ✅ Tambah delay untuk memastikan UI ter-render dengan data baru
          setTimeout(() => {
            isRefreshingAfterEdit.value = false
            console.log('✅ SuperAdminLayout: Loading cleared after UI update')
          }, 800)
        }
      }
    },
    { deep: true },
  )

  // Toggle sidebar
  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }

  // Close sidebar when clicking outside (mobile only)
  const handleClickOutside = (event) => {
    if (window.innerWidth >= 1024) return // Don't handle on desktop

    const sidebar = document.getElementById('sidebar')
    const menuButton = document.getElementById('menu-button')

    if (
      sidebar &&
      !sidebar.contains(event.target) &&
      !menuButton.contains(event.target)
    ) {
      sidebarOpen.value = false
    }
  }

  // Handle escape key
  const handleEscape = (event) => {
    if (event.key === 'Escape' && sidebarOpen.value) {
      sidebarOpen.value = false
    }
  }

  // Close sidebar when route changes (mobile)
  const closeSidebarOnRoute = () => {
    if (window.innerWidth < 1024) {
      sidebarOpen.value = false
    }
  }

  onMounted(async () => {
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    // ✅ PERBAIKAN: Hanya fetch jika benar-benar diperlukan
    if (!userStore.user || !userStore.user.name) {
      console.log('🏗️ SuperAdminLayout mounted: Fetching initial user data...')
      await refreshUserData()
    } else {
      console.log(
        '🏗️ SuperAdminLayout mounted: Using existing user data:',
        userStore.user.name,
      )
    }
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('keydown', handleEscape)
  })
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Overlay for mobile -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
      @click="sidebarOpen = false"
    ></div>

    <!-- SIDEBAR -->
    <div
      id="sidebar"
      class="fixed lg:relative inset-y-0 left-0 z-100 flex h-full transition-all duration-300 ease-in-out lg:translate-x-0 lg:z-auto"
      :class="[
        'w-64 sm:w-72',
        sidebarOpen
          ? 'translate-x-0 shadow-2xl'
          : '-translate-x-full lg:translate-x-0',
      ]"
    >
      <div
        class="flex w-full py-8 lg:py-14 px-3 sm:px-5 justify-center shadow-xl outline-gray-200 outline-1 bg-white/95 backdrop-blur-md h-full overflow-y-auto relative"
      >
        <!-- Close button for mobile (sticky) -->
        <button
          @click="toggleSidebar"
          class="absolute top-4 right-4 lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 z-10"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div class="flex flex-col gap-4 items-center justify-between w-full">
          <div class="flex flex-col items-center w-full">
            <!-- LOGO -->
            <img
              loading="lazy"
              :src="Bulog"
              alt="Bulog Logo"
              class="w-32 sm:w-38 -ml-1"
            />

            <div class="flex flex-col gap-3 sm:gap-4 w-full">
              <!-- DASHBOARD -->
              <RouterLink
                to="/superadmin/dashboard"
                @click="closeSidebarOnRoute"
                class="group flex px-4 sm:px-7 w-full h-10 sm:h-12 mt-8 sm:mt-16 rounded-xl transition-all duration-300 ease-in-out backdrop-blur-sm"
                :class="[
                  isHovered.dashboard || route.path === '/superadmin/dashboard'
                    ? 'scale-95 bg-[#0099FF]/90 shadow-lg backdrop-blur-md transform'
                    : 'hover:scale-95 hover:bg-[#0099FF]/80 hover:shadow-md hover:backdrop-blur-sm',
                ]"
                @mouseenter="isHovered.dashboard = true"
                @mouseleave="isHovered.dashboard = false"
              >
                <div class="flex items-center gap-2 sm:gap-3">
                  <DashboardIconElement
                    :color="
                      isHovered.dashboard ||
                      route.path === '/superadmin/dashboard'
                        ? '#ffff'
                        : '#9BA1AA'
                    "
                  />
                  <div
                    class="font-poppins font-medium text-[#9BA1AA] text-xs sm:text-sm transition-colors duration-200"
                    :class="
                      isHovered.dashboard ||
                      route.path === '/superadmin/dashboard'
                        ? 'text-white'
                        : 'group-hover:text-white'
                    "
                  >
                    Dashboard
                  </div>
                </div>
              </RouterLink>

              <!-- INPUT -->
              <RouterLink
                to="/superadmin/input"
                @click="closeSidebarOnRoute"
                class="group flex px-4 sm:px-7 w-full h-10 sm:h-12 rounded-xl transition-all duration-300 ease-in-out backdrop-blur-sm"
                :class="[
                  isHovered.input || route.path === '/superadmin/input'
                    ? 'scale-95 bg-[#0099FF]/90 shadow-lg backdrop-blur-md transform'
                    : 'hover:scale-95 hover:bg-[#0099FF]/80 hover:shadow-md hover:backdrop-blur-sm',
                ]"
                @mouseenter="isHovered.input = true"
                @mouseleave="isHovered.input = false"
              >
                <div class="flex items-center gap-2 sm:gap-3">
                  <InputIconElement
                    :color="
                      isHovered.input || route.path === '/superadmin/input'
                        ? '#ffff'
                        : '#9BA1AA'
                    "
                    :innerColor="
                      isHovered.input || route.path === '/superadmin/input'
                        ? '#0099FF'
                        : '#ffff'
                    "
                  />
                  <div
                    class="font-poppins font-medium text-[#9BA1AA] text-xs sm:text-sm transition-colors duration-200"
                    :class="
                      isHovered.input || route.path === '/superadmin/input'
                        ? 'text-white'
                        : 'group-hover:text-white'
                    "
                  >
                    Input
                  </div>
                </div>
              </RouterLink>

              <!-- DATA PEMOHON -->
              <RouterLink
                to="/superadmin/datapemohon"
                @click="closeSidebarOnRoute"
                class="group flex px-4 sm:px-7 w-full h-10 sm:h-12 rounded-xl transition-all duration-300 ease-in-out backdrop-blur-sm"
                :class="[
                  isHovered.pemohon ||
                  route.path === '/superadmin/datapemohon' ||
                  route.path.startsWith('/superadmin/datapemohon-list') ||
                  route.path.startsWith('/superadmin/datapemohon-edit')
                    ? 'scale-95 bg-[#0099FF]/90 shadow-lg backdrop-blur-md transform'
                    : 'hover:scale-95 hover:bg-[#0099FF]/80 hover:shadow-md hover:backdrop-blur-sm',
                ]"
                @mouseenter="isHovered.pemohon = true"
                @mouseleave="isHovered.pemohon = false"
              >
                <div class="flex items-center gap-2 sm:gap-3">
                  <PemohonIconElement
                    :color="
                      isHovered.pemohon ||
                      route.path === '/superadmin/datapemohon' ||
                      route.path.startsWith('/superadmin/datapemohon-list') ||
                      route.path.startsWith('/superadmin/datapemohon-edit')
                        ? '#ffff'
                        : '#9BA1AA'
                    "
                    :stroke="
                      isHovered.pemohon ||
                      route.path === '/superadmin/datapemohon' ||
                      route.path.startsWith('/superadmin/datapemohon-list') ||
                      route.path.startsWith('/superadmin/datapemohon-edit')
                        ? '#0099FF'
                        : '#ffff'
                    "
                  />
                  <div
                    class="font-poppins font-medium text-[#9BA1AA] text-xs sm:text-sm transition-colors duration-200"
                    :class="
                      isHovered.pemohon ||
                      route.path === '/superadmin/datapemohon' ||
                      route.path.startsWith('/superadmin/datapemohon-list') ||
                      route.path.startsWith('/superadmin/datapemohon-edit')
                        ? 'text-white'
                        : 'group-hover:text-white'
                    "
                  >
                    Pemohon
                  </div>
                </div>
              </RouterLink>

              <!-- SETTING PENGADAAN -->
              <RouterLink
                to="/superadmin/settingpengadaan"
                @click="closeSidebarOnRoute"
                class="group flex px-4 sm:px-7 w-full h-10 sm:h-12 rounded-xl transition-all duration-300 ease-in-out backdrop-blur-sm"
                :class="[
                  isHovered.pengadaan ||
                  route.path === '/superadmin/settingpengadaan' ||
                  route.path.startsWith('/superadmin/settingpengadaan-list') ||
                  route.path.startsWith('/superadmin/settingpengadaan-edit')
                    ? 'scale-95 bg-[#0099FF]/90 shadow-lg backdrop-blur-md transform'
                    : 'hover:scale-95 hover:bg-[#0099FF]/80 hover:shadow-md hover:backdrop-blur-sm',
                ]"
                @mouseenter="isHovered.pengadaan = true"
                @mouseleave="isHovered.pengadaan = false"
              >
                <div class="flex items-center gap-2 sm:gap-3">
                  <PengadaanIconElement
                    :color="
                      isHovered.pengadaan ||
                      route.path === '/superadmin/settingpengadaan' ||
                      route.path.startsWith(
                        '/superadmin/settingpengadaan-list',
                      ) ||
                      route.path.startsWith('/superadmin/settingpengadaan-edit')
                        ? '#ffff'
                        : '#9BA1AA'
                    "
                    :stroke="
                      isHovered.pengadaan ||
                      route.path === '/superadmin/settingpengadaan' ||
                      route.path.startsWith(
                        '/superadmin/settingpengadaan-list',
                      ) ||
                      route.path.startsWith('/superadmin/settingpengadaan-edit')
                        ? '#0099FF'
                        : '#ffff'
                    "
                  />
                  <div
                    class="font-poppins font-medium text-[#9BA1AA] text-xs sm:text-sm transition-colors duration-200"
                    :class="
                      isHovered.pengadaan ||
                      route.path === '/superadmin/settingpengadaan' ||
                      route.path.startsWith(
                        '/superadmin/settingpengadaan-list',
                      ) ||
                      route.path.startsWith('/superadmin/settingpengadaan-edit')
                        ? 'text-white'
                        : 'group-hover:text-white'
                    "
                  >
                    Pengadaan
                  </div>
                </div>
              </RouterLink>

              <!-- RIWAYAT -->
              <RouterLink
                to="/superadmin/riwayat"
                @click="closeSidebarOnRoute"
                class="group flex px-4 sm:px-7 w-full h-10 sm:h-12 rounded-xl transition-all duration-300 ease-in-out backdrop-blur-sm"
                :class="[
                  isHovered.riwayat ||
                  route.path === '/superadmin/riwayat' ||
                  route.path.startsWith('/superadmin/riwayat-edit') ||
                  route.path.startsWith('/superadmin/riwayat-preview')
                    ? 'scale-95 bg-[#0099FF]/90 shadow-lg backdrop-blur-md transform'
                    : 'hover:scale-95 hover:bg-[#0099FF]/80 hover:shadow-md hover:backdrop-blur-sm',
                ]"
                @mouseenter="isHovered.riwayat = true"
                @mouseleave="isHovered.riwayat = false"
              >
                <div class="flex items-center gap-2 sm:gap-3">
                  <RiwayatIconElement
                    :color="
                      isHovered.riwayat ||
                      route.path === '/superadmin/riwayat' ||
                      route.path.startsWith('/superadmin/riwayat-edit') ||
                      route.path.startsWith('/superadmin/riwayat-preview')
                        ? '#ffff'
                        : '#9BA1AA'
                    "
                  />
                  <div
                    class="font-poppins font-medium text-[#9BA1AA] text-xs sm:text-sm transition-colors duration-200"
                    :class="
                      isHovered.riwayat ||
                      route.path === '/superadmin/riwayat' ||
                      route.path.startsWith('/superadmin/riwayat-edit') ||
                      route.path.startsWith('/superadmin/riwayat-preview')
                        ? 'text-white'
                        : 'group-hover:text-white'
                    "
                  >
                    Riwayat
                  </div>
                </div>
              </RouterLink>

              <!-- STAFF -->
              <RouterLink
                to="/superadmin/admin"
                @click="closeSidebarOnRoute"
                class="group flex px-4 sm:px-7 w-full h-10 sm:h-12 rounded-xl transition-all duration-300 ease-in-out backdrop-blur-sm"
                :class="[
                  isHovered.staff ||
                  route.path === '/superadmin/admin' ||
                  route.path === '/superadmin/admin-add' ||
                  route.path.startsWith('/superadmin/admin-edit')
                    ? 'scale-95 bg-[#0099FF]/90 shadow-lg backdrop-blur-md transform'
                    : 'hover:scale-95 hover:bg-[#0099FF]/80 hover:shadow-md hover:backdrop-blur-sm',
                ]"
                @mouseenter="isHovered.staff = true"
                @mouseleave="isHovered.staff = false"
              >
                <div class="flex items-center gap-2 sm:gap-3">
                  <StaffIconElement
                    :color="
                      isHovered.staff ||
                      route.path === '/superadmin/admin' ||
                      route.path === '/superadmin/admin-add' ||
                      route.path.startsWith('/superadmin/admin-edit')
                        ? '#ffff'
                        : '#9BA1AA'
                    "
                    :stroke="
                      isHovered.staff ||
                      route.path === '/superadmin/admin' ||
                      route.path === '/superadmin/admin-add' ||
                      route.path.startsWith('/superadmin/admin-edit')
                        ? '#0099FF'
                        : '#ffff'
                    "
                  />
                  <div
                    class="font-poppins font-medium text-[#9BA1AA] text-xs sm:text-sm transition-colors duration-200"
                    :class="
                      isHovered.staff ||
                      route.path === '/superadmin/admin' ||
                      route.path === '/superadmin/admin-add' ||
                      route.path.startsWith('/superadmin/admin-edit')
                        ? 'text-white'
                        : 'group-hover:text-white'
                    "
                  >
                    Admin
                  </div>
                </div>
              </RouterLink>
            </div>
          </div>

          <!-- LOGOUT -->
          <button
            @click="handleLogout"
            class="group flex bottom-0 h-fit gap-2 sm:gap-3 items-center justify-center hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer p-2 rounded-lg hover:bg-gray-100"
            @mouseenter="isHovered.signout = true"
            @mouseleave="isHovered.signout = false"
          >
            <div
              class="text-hover font-poppins font-medium text-[#9BA1AA] group-hover:text-[#0099FF] text-xs sm:text-sm transition-colors duration-200"
            >
              Log out
            </div>
            <SignOutIconElement
              :color="isHovered.signout ? '#0099FF' : '#9BA1AA'"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- MAIN CONTENT -->
    <div class="flex-1 min-w-0 lg:ml-0 flex flex-col h-full">
      <!-- NAVBAR -->
      <div class="flex-shrink-0">
        <div
          class="flex bg-[#0099FF] h-16 sm:h-18 w-full items-center px-4 sm:px-7 justify-between lg:justify-end gap-3 sm:gap-5"
        >
          <!-- Mobile Menu Button -->
          <button
            id="menu-button"
            @click="toggleSidebar"
            class="lg:hidden p-2 text-white hover:bg-blue-600 rounded-md transition-all duration-300 relative group"
          >
            <div
              class="w-6 h-6 relative flex flex-col justify-center items-center"
            >
              <span
                class="block w-5 h-0.5 bg-white transition-all duration-300 ease-in-out"
                :class="
                  sidebarOpen ? 'rotate-45 translate-y-1.5' : 'translate-y-0'
                "
              ></span>
              <span
                class="block w-5 h-0.5 bg-white transition-all duration-300 ease-in-out mt-1"
                :class="sidebarOpen ? 'opacity-0' : 'opacity-100'"
              ></span>
              <span
                class="block w-5 h-0.5 bg-white transition-all duration-300 ease-in-out mt-1"
                :class="
                  sidebarOpen ? '-rotate-45 -translate-y-1.5' : 'translate-y-0'
                "
              ></span>
            </div>
          </button>

          <!-- ✅ Profile Button dengan loading yang lebih spesifik -->
          <div class="relative">
            <!-- Loading Overlay - HANYA untuk setelah edit profile -->
            <div
              v-if="isUpdatingAfterEdit"
              class="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-md flex items-center justify-center z-10"
            >
              <div class="flex items-center gap-2 text-white">
                <div
                  class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"
                ></div>
                <span class="text-sm font-medium">Updating...</span>
              </div>
            </div>

            <!-- Profile Button -->
            <button
              @click="goToEditProfile"
              @mouseenter="isHovered.profile = true"
              @mouseleave="isHovered.profile = false"
              class="group relative flex items-center gap-3 sm:gap-5 py-2 px-6 rounded-md transition-all duration-300 ease-in-out hover:shadow-lg overflow-hidden"
              :class="{ 'opacity-70': isUpdatingAfterEdit }"
              :disabled="isUpdatingAfterEdit"
            >
              <!-- Profile Photo -->
              <div class="relative -mr-1 sm:-mr-2">
                <!-- ✅ NEW: Skeleton loading for initial load -->
                <div
                  v-if="isUserNameLoading && userName === '...'"
                  class="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/30 animate-pulse"
                ></div>

                <!-- ✅ ENHANCED: Container for photo and update overlay -->
                <div v-else>
                  <!-- Loading overlay for profile photo update -->
                  <div
                    v-if="isUpdatingAfterEdit"
                    class="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center z-10"
                  >
                    <div
                      class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"
                    ></div>
                  </div>

                  <img
                    loading="lazy"
                    :src="profilePhoto"
                    :alt="userName"
                    class="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover outline outline-white transition-transform duration-200 group-hover:scale-105"
                    @error="
                      (e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0099FF&color=fff&size=128`
                      }
                    "
                  />
                </div>
              </div>

              <!-- User Name -->
              <!-- ✅ ENHANCED: User Name dengan animasi loading dan typing effect -->
              <div class="relative">
                <!-- ✅ Skeleton loading saat data belum ada -->
                <div
                  v-if="isUserNameLoading && userName === '...'"
                  class="h-5 sm:h-6 w-24 sm:w-32 bg-white/30 rounded animate-pulse"
                ></div>

                <!-- ✅ Loading dots animation saat updating -->
                <div
                  v-else-if="isUpdatingAfterEdit"
                  class="font-poppins font-medium text-white text-sm sm:text-base flex items-center gap-1"
                >
                  <span>{{ animatedUserName || 'Updating' }}</span>
                  <div class="flex gap-1 ml-1">
                    <div
                      class="w-1 h-1 bg-white rounded-full animate-bounce"
                      style="animation-delay: 0ms"
                    ></div>
                    <div
                      class="w-1 h-1 bg-white rounded-full animate-bounce"
                      style="animation-delay: 150ms"
                    ></div>
                    <div
                      class="w-1 h-1 bg-white rounded-full animate-bounce"
                      style="animation-delay: 300ms"
                    ></div>
                  </div>
                </div>

                <!-- ✅ Normal state (tanpa animasi ketik) -->
                <div
                  v-else
                  class="font-poppins font-medium text-white text-sm sm:text-base truncate max-w-32 sm:max-w-none relative"
                >
                  <span class="relative">
                    {{ animatedUserName }}
                  </span>
                </div>
              </div>

              <!-- ✅ SHINE EFFECT hanya saat hover dan tidak sedang updating -->
              <div
                v-if="!isUpdatingAfterEdit"
                class="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 translate-x-[-100%] opacity-0 group-hover:opacity-100 group-hover:translate-x-[100%] transition-all duration-700"
              ></div>

              <!-- ✅ HOVER INDICATOR: Small edit icon yang muncul saat hover -->
              <div
                v-if="!isUpdatingAfterEdit"
                class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0"
              >
                <div class="bg-white/20 rounded-full p-1">
                  <svg
                    class="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- MAIN CONTENT -->
      <div
        class="flex-1 overflow-y-auto bg-gray-50 [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-scrollbar:{display:none}]"
      >
        <router-view />
      </div>
    </div>
  </div>
</template>
