<script setup>
  import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useAuthStore } from '@/stores/authStore'
  import { useUserStore } from '@/stores/userStore'
  import { config } from '@/config/env'
  import AdminWave from '../components/AdminWave.vue'
  import SipedagangIconElement from '../components/SipedagangIconElement.vue'

  const router = useRouter()
  const route = useRoute()
  const auth = useAuthStore()
  const userStore = useUserStore()

  const isRefreshing = ref(false)

  const currentUser = computed(() => userStore.currentUser)

  const userName = computed(() => {
    return (
      currentUser.value?.name || currentUser.value?.nama_pengguna || 'Admin'
    )
  })

  const userRole = computed(() => {
    return (
      currentUser.value?.role ||
      currentUser.value?.jabatan ||
      currentUser.value?.level ||
      'Administrator'
    )
  })

  const photoCacheKey = ref(Date.now())
  const profilePhoto = computed(() => {
    const foto =
      currentUser.value?.profile_photo ||
      currentUser.value?.foto ||
      currentUser.value?.img ||
      currentUser.value?.gambar ||
      currentUser.value?.photo

    if (foto) {
      return `${config.getStorageUrl(foto)}?v=${photoCacheKey.value}`
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName.value)}&background=0099FF&color=fff&size=128`
  })

  const refreshProfile = async () => {
    await userStore.fetchCurrentUser()
    photoCacheKey.value = Date.now()
  }

  // Ganti blok 'watch' yang lama dengan yang ini
  watch(
    () => route.path,
    async (newPath, oldPath) => {
      // Hanya refresh jika kembali dari halaman edit profile
      if (
        oldPath.includes('/editprofile') &&
        sessionStorage.getItem('profileUpdated')
      ) {
        console.log(
          '🔄 AdminLayout: Update detected. Starting solid animation...',
        )
        sessionStorage.removeItem('profileUpdated')

        // 1. Tampilkan loader
        isRefreshing.value = true

        // 2. PENTING: Tunggu loader benar-benar muncul di layar SEBELUM mengambil data baru
        await nextTick()

        try {
          // 3. SEKARANG baru mulai ambil data & pastikan animasi berjalan minimal 500ms
          await Promise.all([
            refreshProfile(),
            new Promise((resolve) => setTimeout(resolve, 500)),
          ])

          // 4. PENTING: Tunggu data BARU selesai digambar di layar
          await nextTick()
        } catch (error) {
          console.error('❌ AdminLayout: Error during refresh process:', error)
        } finally {
          // 5. Terakhir, SETELAH semua selesai, baru sembunyikan loader
          isRefreshing.value = false
          console.log('✅ AdminLayout: UI updated. Animation stopped.')
        }
      }
    },
  )

  const isProfileDropdownOpen = ref(false)

  const toggleProfileDropdown = () => {
    isProfileDropdownOpen.value = !isProfileDropdown.value
  }

  const closeDropdown = (event) => {
    const profileElement = document.getElementById('profile-dropdown-container')
    if (profileElement && !profileElement.contains(event.target)) {
      isProfileDropdownOpen.value = false
    }
  }

  const handleLogout = async () => {
    try {
      isProfileDropdownOpen.value = false
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

  const handleEditProfile = () => {
    isProfileDropdownOpen.value = false
    router.push('/admin/editprofile')
  }

  onMounted(async () => {
    document.addEventListener('click', closeDropdown)
    if (!userStore.currentUser) {
      isRefreshing.value = true
      await nextTick()
      try {
        await Promise.all([
          refreshProfile(),
          new Promise((resolve) => setTimeout(resolve, 500)), // minimal 500ms animasi
        ])
        await nextTick()
      } finally {
        isRefreshing.value = false
      }
    }
  })

  onUnmounted(() => {
    document.removeEventListener('click', closeDropdown)
  })
</script>

<template>
  <section
    class="h-screen w-full relative bg-gradient-to-br from-slate-50 to-blue-50"
  >
    <AdminWave />
    <header>
      <div
        class="flex flex-row justify-between items-center px-4 sm:px-6 md:px-8 lg:px-10 sm:pt-3 sm:pb-2 lg:pt-4 lg:pb-5"
      >
        <SipedagangIconElement class="w-49 sm:w-55 md:w-60 lg:w-76 xl:w-80" />
        <div class="flex items-center gap-3 sm:gap-4 lg:gap-5">
          <div id="profile-dropdown-container" class="relative z-[100000]">
            <div
              @click="toggleProfileDropdown"
              class="flex items-center gap-2 sm:gap-3 cursor-pointer transition-all hover:opacity-90 p-1 sm:p-2 rounded-lg hover:bg-white/10 relative z-[9999] border border-white/20 bg-white/5"
            >
              <Transition
                mode="out-in"
                enter-active-class="transition-opacity duration-200 ease-out"
                enter-from-class="opacity-0"
                enter-to-class="opacity-100"
                leave-active-class="transition-opacity duration-150 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
              >
                <div
                  v-if="isRefreshing"
                  class="flex items-center gap-2 sm:gap-3 animate-pulse"
                  key="loader"
                >
                  <div
                    class="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full bg-white/30 flex-shrink-0"
                  ></div>
                  <div class="hidden xs:block">
                    <div class="h-4 w-24 rounded bg-white/30"></div>
                  </div>
                  <div
                    class="w-4 h-4 sm:w-5 sm:h-5 text-white opacity-50 hidden sm:block"
                  ></div>
                </div>

                <div
                  v-else
                  class="flex items-center gap-2 sm:gap-3"
                  key="profile"
                >
                  <div
                    class="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-white/30"
                  >
                    <img
                      :key="profilePhoto"
                      :src="profilePhoto"
                      :alt="userName"
                      class="w-full h-full object-cover"
                      @error="
                        (e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0099FF&color=fff&size=128`
                        }
                      "
                    />
                  </div>
                  <div
                    :key="userName"
                    class="text-white text-[11px] sm:text-[13px] lg:text-[14px] xl:text-[15px] font-medium font-poppins hidden xs:hidden sm:block profile-text-adaptive truncate max-w-[120px] sm:max-w-[140px] lg:max-w-[160px] xl:max-w-[180px]"
                    :title="userName"
                  >
                    {{ userName }}
                  </div>
                  <svg
                    class="w-4 h-4 sm:w-5 sm:h-5 text-white transition-transform duration-300 hidden sm:block"
                    :class="{ 'rotate-180': isProfileDropdownOpen }"
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
                </div>
              </Transition>
            </div>

            <Transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div
                v-if="isProfileDropdownOpen"
                class="absolute right-0 mt-3 w-52 sm:w-56 bg-white/98 rounded-2xl shadow-2xl py-3 z-[10001] origin-top-right border border-gray-200/50 ring-1 ring-black/5 overflow-hidden"
              >
                <div class="px-4 py-3 border-b border-gray-100 sm:hidden">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 relative"
                    >
                      <img
                        :key="profilePhoto"
                        :src="profilePhoto"
                        :alt="userName"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div :key="userName + userRole">
                        <div
                          class="text-sm font-semibold text-gray-900 truncate"
                          :title="userName"
                        >
                          {{ userName }}
                        </div>
                        <div class="text-xs text-gray-500">
                          {{ userRole }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  @click="handleEditProfile"
                  :disabled="isRefreshing"
                  class="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div
                    class="w-5 h-5 flex items-center justify-center bg-gray-100 group-hover:bg-blue-100 rounded-lg transition-colors duration-200"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      class="text-gray-600 group-hover:text-blue-600 transition-colors duration-200"
                    >
                      <path
                        d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M15.36 10.44L16.95 12.03L21.77 7.21"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                  <span class="font-semibold">Edit Profil</span>
                </button>
                <div class="border-t border-gray-100 my-1"></div>
                <button
                  @click="handleLogout"
                  :disabled="isRefreshing"
                  class="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div
                    class="w-5 h-5 flex items-center justify-center bg-gray-100 group-hover:bg-red-100 rounded-lg transition-colors duration-200"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 20 21"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      class="text-gray-600 group-hover:text-red-600 transition-colors duration-200"
                    >
                      <g clip-path="url(#clip0_410_6997)">
                        <path
                          d="M19.0241 8.1427L15.7916 4.9102C15.6344 4.7584 15.4239 4.6744 15.2054 4.6763C14.9869 4.6782 14.7779 4.76584 14.6234 4.92035C14.4689 5.07485 14.3812 5.28386 14.3793 5.50236C14.3774 5.72086 14.4614 5.93136 14.6132 6.08853L17.8457 9.32103C17.9418 9.41897 18.0257 9.52808 18.0957 9.64603C18.0832 9.64603 18.0732 9.63936 18.0607 9.63936L4.99074 9.66603C4.76973 9.66603 4.55777 9.75383 4.40149 9.91011C4.24521 10.0664 4.15741 10.2783 4.15741 10.4994C4.15741 10.7204 4.24521 10.9323 4.40149 11.0886C4.55777 11.2449 4.76973 11.3327 4.99074 11.3327L18.0557 11.306C18.0791 11.306 18.0982 11.2944 18.1207 11.2927C18.0468 11.4337 17.9531 11.5633 17.8424 11.6777L14.6099 14.9102C14.5303 14.9871 14.4668 15.079 14.4232 15.1807C14.3795 15.2824 14.3565 15.3917 14.3555 15.5024C14.3546 15.613 14.3757 15.7227 14.4176 15.8252C14.4595 15.9276 14.5213 16.0206 14.5996 16.0989C14.6778 16.1771 14.7709 16.239 14.8733 16.2809C14.9757 16.3228 15.0854 16.3439 15.1961 16.3429C14.3067 16.3419 15.4161 16.319 15.5177 16.2753C15.6194 16.2316 15.7114 16.1681 15.7882 16.0885L19.0207 12.856C19.6456 12.2309 19.9967 11.3832 19.9967 10.4994C19.9967 9.61548 19.6456 8.76779 19.0207 8.1427H19.0241Z"
                          fill="currentColor"
                        />
                        <path
                          d="M5.83333 18.8333H4.16667C3.50363 18.8333 2.86774 18.5699 2.3989 18.1011C1.93006 17.6323 1.66667 16.9964 1.66667 16.3333V4.66667C1.66667 4.00363 1.93006 3.36774 2.3989 2.8989C2.86774 2.43006 3.50363 2.16667 4.16667 2.16667H5.83333C6.05435 2.16667 6.26631 2.07887 6.42259 1.92259C6.57887 1.76631 6.66667 1.55435 6.66667 1.33333C6.66667 1.11232 6.57887 0.900358 6.42259 0.744078C6.26631 0.587797 6.05435 0.5 5.83333 0.5H4.16667C3.062 0.501323 2.00296 0.940735 1.22185 1.72185C0.440735 2.50296 0.00132321 3.562 0 4.66667L0 16.3333C0.00132321 17.438 0.440735 18.497 1.22185 19.2782C2.00296 20.0593 3.062 20.4987 4.16667 20.5H5.83333C6.05435 20.5 6.26631 20.4122 6.42259 20.2559C6.57887 20.0996 6.66667 19.8877 6.66667 19.6667C6.66667 19.4457 6.57887 19.2337 6.42259 19.0774C6.26631 18.9211 6.05435 18.8333 5.83333 18.8333Z"
                          fill="currentColor"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_410_6997">
                          <rect
                            width="20"
                            height="20"
                            fill="white"
                            transform="translate(0 0.5)"
                          />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                  <span class="font-semibold">Keluar Akun</span>
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </header>

    <div class="relative z-10 -mt-3 sm:mt-0 md:-mt-2">
      <router-view />
    </div>
  </section>
  <div
    class="absolute items-center lg:items-end bottom-0 flex flex-col w-full pr-3 mb-3 text-[#232323] text-[12px] md:text-sm md:text-white"
  >
    <p>Copyright @ 2025 Pengadaan Komoditas Kantor Cabang Surakarta</p>
  </div>
</template>

<style scoped>
  /* ✅ TAMBAH: Custom transition styles */
  .profile-image-enter-active,
  .profile-image-leave-active {
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .profile-image-enter-from {
    opacity: 0;
    transform: scale(0.95) rotate(5deg);
  }

  .profile-image-leave-to {
    opacity: 0;
    transform: scale(0.95) rotate(-5deg);
  }

  .profile-text-enter-active,
  .profile-text-leave-active {
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .profile-text-enter-from {
    opacity: 0;
    transform: translateX(8px);
  }

  .profile-text-leave-to {
    opacity: 0;
    transform: translateX(-8px);
  }

  .dropdown-image-enter-active,
  .dropdown-image-leave-active {
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .dropdown-image-enter-from,
  .dropdown-image-leave-to {
    opacity: 0;
    transform: scale(0.9);
  }

  .dropdown-text-enter-active,
  .dropdown-text-leave-active {
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .dropdown-text-enter-from {
    opacity: 0;
    transform: translateY(4px);
  }

  .dropdown-text-leave-to {
    opacity: 0;
    transform: translateY(-4px);
  }

  /* Extra small screen utilities */
  /* @media (min-width: 475px) {
    .xs\:block {
      display: block;
    }
  } */

  /* Prevent horizontal scrolling and improve mobile experience */
  * {
    box-sizing: border-box;
  }

  /* Mobile-first improvements */
  @media (max-width: 640px) {
    /* Better touch targets on mobile */
    button {
      min-height: 48px;
      min-width: 48px;
    }
    /* Improved dropdown positioning for mobile */
    .absolute.right-0 {
      right: 0;
      left: auto;
      min-width: 208px; /* 52 * 4 = 208px, sesuai dengan w-52 */
    }

    /* Better dropdown content overflow protection */
    .absolute.right-0 > div {
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    /* Better text readability on mobile - clean shadow */
    .text-white {
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }

    /* Profile name truncation for mobile */
    .profile-text-adaptive {
      max-width: 100px !important;
    }

    /* Improved header spacing on mobile - keep horizontal layout */
    header {
      padding-bottom: 1rem !important;
    }

    /* More compact logo for mobile horizontal layout */
    .font-poppins {
      letter-spacing: -0.01em;
    }

    /* Profile button improvements */
    .cursor-pointer {
      padding: 0.75rem !important;
      border-radius: 1rem !important;
    }
  }

  /* Better visibility for very small screens - clean text */
  @media (max-width: 475px) {
    .text-white {
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
      font-weight: 600;
    }

    /* Profile name truncation for very small screens */
    .profile-text-adaptive {
      max-width: 80px !important;
    }

    /* Ensure horizontal layout on very small screens */
    header .flex {
      gap: 0.5rem !important;
    }

    /* Dropdown adjustments for very small screens */
    #profile-dropdown-container .absolute {
      width: calc(100vw - 1rem) !important;
      right: 0.5rem !important;
      max-width: 200px !important;
    }

    /* More prominent profile button */
    .cursor-pointer {
      background: rgba(255, 255, 255, 0.1) !important;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
  }

  /* Animation improvements for better performance */
  .transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;
  }

  /* Ensure dropdown is always on top */
  .z-\[9999\] {
    z-index: 9999 !important;
  }

  .z-\[10000\] {
    z-index: 10000 !important;
  }

  .z-\[10001\] {
    z-index: 10001 !important;
  }

  /* Prevent dropdown from being covered by other elements */
  #profile-dropdown-container {
    position: relative;
    z-index: 10000 !important;
  }

  /* Dropdown content overflow fixes */
  #profile-dropdown-container .absolute {
    z-index: 10001 !important;
    max-width: calc(100vw - 2rem); /* Prevent dropdown from going off-screen */
  }

  /* Ensure text fits properly in dropdown */
  #profile-dropdown-container .truncate {
    max-width: 100%;
  }

  /* Better text wrapping for dropdown content */
  #profile-dropdown-container .text-sm {
    line-height: 1.4;
    word-break: break-word;
  }

  /* Override any competing z-index values */
  .transition.ease-out {
    z-index: 10000 !important;
  }

  /* Ensure dropdown menu appears above everything */
  #profile-dropdown-container .absolute {
    z-index: 10001 !important;
  }

  /* Improved backdrop blur support */
  @supports (backdrop-filter: blur(10px)) {
    .backdrop-blur-sm {
      backdrop-filter: blur(4px);
    }

    .backdrop-blur-lg {
      backdrop-filter: blur(16px);
    }
  }

  /* Fallback for browsers without backdrop-filter */
  @supports not (backdrop-filter: blur(10px)) {
    .backdrop-blur-sm {
      background-color: rgba(255, 255, 255, 0.9);
    }

    .backdrop-blur-lg {
      background-color: rgba(255, 255, 255, 0.95);
    }
  }

  /* Safe area adjustments for mobile devices with notches */
  @supports (padding: max(0px)) {
    header {
      padding-left: max(1rem, env(safe-area-inset-left));
      padding-right: max(1rem, env(safe-area-inset-right));
      padding-top: max(1rem, env(safe-area-inset-top));
    }

    main {
      padding-left: max(1rem, env(safe-area-inset-left));
      padding-right: max(1rem, env(safe-area-inset-right));
      padding-bottom: max(5rem, env(safe-area-inset-bottom));
    }
  }

  /* Adaptive text color for profile name - clean white text */
  .profile-text-adaptive {
    color: white;
    /* Subtle shadow for better readability without black border */
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);

    transition: all 0.3s ease;
  }

  /* Enhanced text shadow for high contrast mode - without black border */
  @media (prefers-contrast: high) {
    .profile-text-adaptive {
      text-shadow: 0 2px 6px rgba(0, 0, 0, 0.8);
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6));
    }
  }

  /* Alternative approach for better contrast - clean appearance */
  @media (prefers-contrast: high) {
    .profile-text-adaptive {
      color: white;
      text-shadow:
        0 1px 4px rgba(0, 0, 0, 0.9),
        0 2px 8px rgba(0, 0, 0, 0.6);
      filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.8));
    }
  }
</style>
