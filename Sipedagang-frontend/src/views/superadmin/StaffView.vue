<script setup>
  import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
  import { useAdminStore } from '@/stores/adminStore'
  import { useResetPasswordStore } from '@/stores/resetStore'
  import { RouterLink } from 'vue-router'
  import { config } from '@/config/env'
  import StaffElement from '@/components/StaffElement.vue'
  import MainElement from '../../components/MainElement.vue'
  import StaffResetElement from '@/components/StaffResetElement.vue'
  import defaultProfile from '@/assets/images/misc/default-profile.png'

  const showPopup = ref(false)
  const adminStore = useAdminStore()
  const resetStore = useResetPasswordStore()
  const search = ref('')
  const showInactive = ref(false)
  const showMenu = ref(false)

  const getPhotoUrl = (photoPath) => {
    return config.getStorageUrl(photoPath) || defaultProfile
  }

  onMounted(() => {
    adminStore.getAdmins('', '')
  })

  onBeforeUnmount(() => {
    // Remove event listener
    document.removeEventListener('click', handleClickOutside)
  })

  watch(showPopup, (newValue) => {
    if (newValue) {
      resetStore.fetchResetRequests()
    }
  })

  const filteredAdmins = computed(() => {
    let filtered = adminStore.admins || []

    if (showInactive.value) {
      filtered = filtered.filter((admin) => admin.status === 'inactive')
    } else {
      filtered = filtered.filter(
        (admin) => admin.status === 'active' || !admin.status,
      )
    }

    if (search.value && search.value.trim()) {
      const searchTerm = search.value.toLowerCase()
      filtered = filtered.filter(
        (admin) =>
          admin.name?.toLowerCase().includes(searchTerm) ||
          admin.nama_pengguna?.toLowerCase().includes(searchTerm),
      )
    }

    filtered.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase()
      const nameB = (b.name || '').toLowerCase()

      return nameA.localeCompare(nameB, 'id', {
        sensitivity: 'base',
        numeric: true,
        caseFirst: 'lower',
      })
    })

    return filtered
  })

  const toggleInactiveView = () => {
    showInactive.value = !showInactive.value
  }

  const buttonLabel = computed(() => {
    return showInactive.value ? 'Active Staff' : 'Inactive Staff'
  })

  const buttonClass = computed(() => {
    return showInactive.value
      ? 'bg-[#4CAF50] hover:bg-[#45a049]'
      : 'bg-gray-500 hover:bg-gray-400'
  })

  const closeResetPopup = () => {
    showPopup.value = false
    resetStore.clearAdminMessages()
  }

  // ✅ ADD: Separate refs for desktop and mobile dropdowns
  const dropdownDesktopRef = ref(null)
  const dropdownMobileRef = ref(null)

  // ✅ ADD: Click outside handler
  const handleClickOutside = (event) => {
    if (!showMenu.value) return

    const clickedInsideDesktop = dropdownDesktopRef.value?.contains(
      event.target,
    )
    const clickedInsideMobile = dropdownMobileRef.value?.contains(event.target)

    // Tutup dropdown jika click tidak di dalam dropdown manapun
    if (!clickedInsideDesktop && !clickedInsideMobile) {
      showMenu.value = false
    }
  }

  // ✅ Clear search function
  const clearSearch = () => {
    search.value = ''
  }

  onMounted(() => {
    // Add event listener for click outside
    document.addEventListener('click', handleClickOutside)

    adminStore.getAdmins('', '')
  })
</script>

<template>
  <section class="relative h-full">
    <!-- Main Content dengan overlay conditional -->
    <div class="relative h-full">
      <MainElement :class="showPopup ? 'blur-[3px]' : ''">
        <div class="flex flex-col h-full">
          <!-- ATAS -->
          <section
            class="flex flex-col gap-3 px-2 sm:px-4 mb-4 sm:mb-6 lg:mb-8 flex-shrink-0"
          >
            <!-- ✅ Layout Desktop (xl dan ke atas) -->
            <div
              class="hidden xl:grid xl:grid-cols-2 xl:items-center xl:justify-between"
            >
              <!-- TITLE -->
              <div
                class="font-semibold text-base sm:text-lg lg:text-xl text-[#0099FF] underline underline-offset-4 lg:underline-offset-8"
              >
                Admin - {{ showInactive ? 'Inactive' : 'Active' }}
              </div>

              <!-- Search dan Controls untuk desktop -->
              <div
                class="flex justify-end items-center gap-2 sm:gap-3 lg:gap-4"
              >
                <!-- Search result info compact (desktop) -->
                <div v-if="search">
                  <span
                    class="inline-flex items-center px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-md"
                  >
                    <svg
                      class="w-3 h-3 mr-1 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      ></path>
                    </svg>
                    <span class="truncate max-w-[120px]"> "{{ search }}" </span>
                    <span class="ml-1 text-gray-600 flex-shrink-0">
                      ({{ filteredAdmins.length }})
                    </span>
                    <button
                      @click="clearSearch"
                      class="ml-1.5 text-blue-600 hover:text-blue-800 flex-shrink-0"
                      title="Hapus pencarian"
                    >
                      <svg
                        class="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        ></path>
                      </svg>
                    </button>
                  </span>
                </div>

                <!-- Container untuk Search dan Actions -->
                <div class="flex items-center gap-2 sm:gap-3">
                  <!-- Search Input (desktop) -->
                  <div class="relative min-w-[200px]">
                    <input
                      v-model="search"
                      type="text"
                      placeholder="Cari admin..."
                      :disabled="showPopup"
                      class="border border-[#D9D9D9] rounded-lg h-9 sm:h-10 px-3 sm:px-4 pr-10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0099ff] focus:border-[#0099ff] transition-all duration-200 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <!-- Clear search button -->
                    <button
                      v-if="search"
                      @click="clearSearch"
                      class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        ></path>
                      </svg>
                    </button>
                    <!-- Search icon -->
                    <div
                      v-else
                      class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        ></path>
                      </svg>
                    </div>
                  </div>

                  <!-- ✅ FIXED: Action Menu Dropdown (desktop) -->
                  <div ref="dropdownDesktopRef" class="relative flex-shrink-0">
                    <button
                      @click="showMenu = !showMenu"
                      :disabled="showPopup"
                      class="inline-flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        class="w-4 h-4 text-gray-600 mr-2"
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
                      <span class="text-sm font-medium text-gray-700"
                        >Aksi</span
                      >
                      <svg
                        class="w-3 h-3 ml-1 text-gray-500"
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

                    <!-- Dropdown Menu -->
                    <div
                      v-show="showMenu"
                      class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 transform transition-all duration-200 origin-top-right"
                      :class="
                        showMenu
                          ? 'scale-100 opacity-100'
                          : 'scale-95 opacity-0'
                      "
                    >
                      <div class="py-2">
                        <!-- Reset Password -->
                        <button
                          @click="
                            () => {
                              showPopup = true
                              showMenu = false
                            }
                          "
                          class="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center transition-colors duration-150"
                        >
                          <svg
                            class="w-4 h-4 mr-3 text-blue-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                              clip-rule="evenodd"
                            />
                          </svg>
                          Reset Password
                        </button>

                        <!-- Add Staff -->
                        <RouterLink
                          to="/superadmin/admin-add"
                          @click="showMenu = false"
                          class="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 flex items-center transition-colors duration-150"
                        >
                          <svg
                            class="w-4 h-4 mr-3 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                              clip-rule="evenodd"
                            />
                          </svg>
                          Tambah Staff
                        </RouterLink>

                        <!-- Divider -->
                        <div class="border-t border-gray-100 my-1"></div>

                        <!-- Toggle Status -->
                        <button
                          @click="
                            () => {
                              toggleInactiveView()
                              showMenu = false
                            }
                          "
                          :class="[
                            'w-full px-4 py-3 text-left text-sm text-gray-700 flex items-center transition-colors duration-150',
                            showInactive
                              ? 'hover:bg-green-50 hover:text-green-600'
                              : 'hover:bg-gray-50 hover:text-gray-600',
                          ]"
                        >
                          <svg
                            v-if="showInactive"
                            class="w-4 h-4 mr-3 text-green-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clip-rule="evenodd"
                            />
                          </svg>
                          <svg
                            v-else
                            class="w-4 h-4 mr-3 text-gray-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                              clip-rule="evenodd"
                            />
                          </svg>
                          {{
                            showInactive
                              ? 'Lihat Active Staff'
                              : 'Lihat Inactive Staff'
                          }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ✅ Layout Mobile/Tablet (di bawah xl) -->
            <div class="xl:hidden">
              <!-- Title dan Action Menu -->
              <div class="flex items-center justify-between mb-3">
                <div
                  class="font-semibold text-base sm:text-lg text-[#0099FF] underline underline-offset-4"
                >
                  Admin - {{ showInactive ? 'Inactive' : 'Active' }}
                </div>

                <!-- ✅ FIXED: Action Menu Dropdown (mobile/tablet) -->
                <div ref="dropdownMobileRef" class="relative flex-shrink-0">
                  <button
                    @click="showMenu = !showMenu"
                    :disabled="showPopup"
                    class="inline-flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg
                      class="w-4 h-4 text-gray-600 mr-2"
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
                      class="w-3 h-3 ml-1 text-gray-500"
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

                  <!-- Dropdown Menu (sama untuk mobile) -->
                  <div
                    v-show="showMenu"
                    class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-20 transform transition-all duration-200 origin-top-right"
                    :class="
                      showMenu ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                    "
                  >
                    <div class="py-2">
                      <!-- Reset Password -->
                      <button
                        @click="
                          () => {
                            showPopup = true
                            showMenu = false
                          }
                        "
                        class="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center transition-colors duration-150"
                      >
                        <svg
                          class="w-4 h-4 mr-3 text-blue-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                        Reset Password
                      </button>

                      <!-- Add Staff -->
                      <RouterLink
                        to="/superadmin/admin-add"
                        @click="showMenu = false"
                        class="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 flex items-center transition-colors duration-150"
                      >
                        <svg
                          class="w-4 h-4 mr-3 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            clip-rule="evenodd"
                          />
                        </svg>
                        Tambah Staff
                      </RouterLink>

                      <!-- Divider -->
                      <div class="border-t border-gray-100 my-1"></div>

                      <!-- Toggle Status -->
                      <button
                        @click="
                          () => {
                            toggleInactiveView()
                            showMenu = false
                          }
                        "
                        :class="[
                          'w-full px-4 py-3 text-left text-sm text-gray-700 flex items-center transition-colors duration-150',
                          showInactive
                            ? 'hover:bg-green-50 hover:text-green-600'
                            : 'hover:bg-gray-50 hover:text-gray-600',
                        ]"
                      >
                        <svg
                          v-if="showInactive"
                          class="w-4 h-4 mr-3 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                        <svg
                          v-else
                          class="w-4 h-4 mr-3 text-gray-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                            clip-rule="evenodd"
                          />
                        </svg>
                        {{
                          showInactive
                            ? 'Lihat Active Staff'
                            : 'Lihat Inactive Staff'
                        }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Search input full width -->
              <div class="space-y-2">
                <div class="relative w-full">
                  <input
                    v-model="search"
                    type="text"
                    placeholder="Cari admin..."
                    :disabled="showPopup"
                    class="border border-[#D9D9D9] rounded-lg h-9 sm:h-10 px-3 sm:px-4 pr-10 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0099ff] focus:border-[#0099ff] transition-all duration-200 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <!-- Clear search button -->
                  <button
                    v-if="search"
                    @click="clearSearch"
                    class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                  <!-- Search icon -->
                  <div
                    v-else
                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  >
                    <svg
                      class="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      ></path>
                    </svg>
                  </div>
                </div>

                <!-- Search result info -->
                <div v-if="search">
                  <span
                    class="inline-flex items-center px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-md"
                  >
                    <svg
                      class="w-3 h-3 mr-1 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      ></path>
                    </svg>
                    <span class="truncate max-w-[150px] sm:max-w-[200px]">
                      "{{ search }}"
                    </span>
                    <span class="ml-1 text-gray-600 flex-shrink-0">
                      ({{ filteredAdmins.length }})
                    </span>
                    <button
                      @click="clearSearch"
                      class="ml-1.5 text-blue-600 hover:text-blue-800 flex-shrink-0"
                      title="Hapus pencarian"
                    >
                      <svg
                        class="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 18L18 6M6 6l12 12"
                        ></path>
                      </svg>
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </section>

          <!-- STAFF section tetap sama -->
          <section
            class="flex-1 px-2 sm:px-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-scrollbar:{display:none}] pb-2"
            :class="showPopup ? 'pointer-events-none' : ''"
          >
            <div
              v-if="adminStore.loading"
              class="flex justify-center items-center h-full min-h-[300px]"
            >
              <div class="text-gray-500 text-sm">Loading...</div>
            </div>

            <div
              v-else-if="filteredAdmins.length === 0"
              class="flex flex-col items-center justify-center h-full min-h-[300px] w-full py-4"
            >
              <div
                v-if="search"
                class="text-gray-500 text-sm sm:text-base font-medium text-center px-4"
              >
                {{ showInactive ? 'Staff inactive' : 'Staff active' }} tidak
                ditemukan
              </div>
              <div
                v-else
                class="text-gray-500 text-sm sm:text-base font-medium text-center px-4"
              >
                {{
                  showInactive
                    ? 'Tidak ada staff inactive'
                    : 'Tidak ada staff active'
                }}
              </div>
            </div>
            <div
              v-else
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 py-1 sm:py-2"
            >
              <StaffElement
                v-for="person in filteredAdmins"
                :key="person.id"
                :person="{
                  id: person.id,
                  nama: person.name,
                  nama_pengguna: person.nama_pengguna,
                  img: getPhotoUrl(person.profile_photo),
                  status: person.status || 'active',
                }"
              />
            </div>
          </section>
        </div>
      </MainElement>

      <!-- Popup overlay yang hanya menutupi MainElement -->
      <div
        v-if="showPopup"
        class="absolute inset-0 bg-black/10 backdrop-blur-sm z-20 p-4 sm:p-6 md:p-8"
        @click="closeResetPopup"
      >
        <!-- Container dengan centering yang lebih eksplisit -->
        <div class="w-full h-full flex items-center justify-center">
          <div
            @click.stop
            class="relative bg-white rounded-lg shadow-2xl w-full max-w-[95vw] sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl h-full max-h-[90vh] sm:max-h-[85vh] md:max-h-[80vh] flex flex-col"
          >
            <!-- Header -->
            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 md:px-8 py-4 sm:py-6 border-b border-gray-200 gap-3 sm:gap-4"
            >
              <div
                class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
              >
                <h2 class="text-lg sm:text-xl font-semibold text-[#0099FF]">
                  Request Password Reset
                </h2>
                <div class="hidden sm:block h-6 w-px bg-gray-300"></div>
                <span class="text-sm text-gray-600">
                  {{ resetStore.resetRequests.length }} permintaan
                </span>
              </div>

              <div class="flex items-center gap-3 flex-shrink-0">
                <!-- Refresh Button -->
                <button
                  @click="resetStore.fetchResetRequests"
                  :disabled="resetStore.adminLoading"
                  class="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  title="Refresh Data"
                >
                  <svg
                    :class="{ 'animate-spin': resetStore.adminLoading }"
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span class="hidden sm:inline font-medium">Refresh</span>
                </button>

                <!-- Close Button -->
                <button
                  @click="closeResetPopup"
                  class="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Tutup"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 text-gray-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 flex flex-col min-h-0">
              <StaffResetElement
                :show="true"
                @close="closeResetPopup"
                :is-inline="true"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
