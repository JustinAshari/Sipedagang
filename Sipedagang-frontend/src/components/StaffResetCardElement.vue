<script setup>
  import AcceptedIconElement from './AcceptedIconElement.vue'
  import DeclineIconElement from './DeclineIconElement.vue'
  import { ref, computed } from 'vue'
  import { useResetPasswordStore } from '@/stores/resetStore'
  import { config } from '@/config/env'

  const props = defineProps({
    person: Object,
  })
  const emit = defineEmits(['refresh'])

  const resetStore = useResetPasswordStore()
  const isProcessing = ref(false)

  // Helper function untuk format URL foto - konsisten dengan StaffElement
  const getPhotoUrl = computed(() => {
    const foto =
      props.person?.img ||
      props.person?.foto ||
      props.person?.gambar ||
      props.person?.photo

    if (foto) {
      // Gunakan fungsi getStorageUrl dari env.js
      return config.getStorageUrl(foto)
    }

    // Fallback ke UI-Avatars seperti di StaffElement
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(props.person?.nama || 'Pengguna')}&background=0099FF&color=fff&size=128`
  })

  const handleApprove = async () => {
    if (isProcessing.value || props.person.status !== 'pending') return

    isProcessing.value = true
    try {
      const result = await resetStore.approveRequest(props.person.id)
      if (result.success) {
        emit('refresh')
      } else {
        alert('Gagal menyetujui permintaan: ' + result.error)
      }
    } catch (e) {
      alert('Gagal menyetujui permintaan')
    } finally {
      isProcessing.value = false
    }
  }

  const handleDecline = async () => {
    if (isProcessing.value || props.person.status !== 'pending') return

    isProcessing.value = true
    try {
      const result = await resetStore.declineRequest(props.person.id)
      if (result.success) {
        emit('refresh')
      } else {
        alert('Gagal menolak permintaan: ' + result.error)
      }
    } catch (e) {
      alert('Gagal menolak permintaan')
    } finally {
      isProcessing.value = false
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Baru saja'
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'Tanggal tidak valid'
    }
  }
</script>

<template>
  <div
    class="flex flex-col sm:flex-row bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 ease-in-out gap-4 sm:gap-6"
    :class="{ 'opacity-70': isProcessing || person.status !== 'pending' }"
  >
    <!-- Avatar Section -->
    <div
      class="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 flex-1"
    >
      <div class="relative flex-shrink-0">
        <img
          :src="getPhotoUrl"
          :alt="person.nama"
          loading="lazy"
          class="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-gray-100 shadow-sm"
          @error="
            (e) => {
              // Fallback ke UI-Avatars jika gambar gagal dimuat
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person?.nama || 'Pengguna')}&background=0099FF&color=fff&size=128`
            }
          "
        />
        <!-- Status indicator dot -->
        <div
          class="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 sm:border-3 border-white shadow-sm flex items-center justify-center"
          :class="{
            'bg-yellow-400': person.status === 'pending',
            'bg-green-500': person.status === 'approved',
            'bg-red-500': person.status === 'declined',
          }"
        >
          <svg
            v-if="person.status === 'approved'"
            xmlns="http://www.w3.org/2000/svg"
            class="h-2 w-2 sm:h-3 sm:w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="3"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <svg
            v-else-if="person.status === 'declined'"
            xmlns="http://www.w3.org/2000/svg"
            class="h-2 w-2 sm:h-3 sm:w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="3"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <div
            v-else
            class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"
          ></div>
        </div>
      </div>

      <!-- User Info -->
      <div
        class="flex flex-col justify-center flex-1 min-w-0 text-center sm:text-left"
      >
        <h3
          class="font-bold text-base sm:text-lg text-gray-900 mb-1 break-words sm:truncate"
        >
          {{ person.nama || 'Nama tidak tersedia' }}
        </h3>
        <p class="text-sm text-gray-600 mb-2 break-words sm:truncate">
          @{{ person.nama_pengguna || 'Username tidak tersedia' }}
        </p>

        <!-- Date -->
        <p
          class="text-xs text-gray-500 flex items-center justify-center sm:justify-start gap-1 mb-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-3 w-3 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span class="break-words">{{ formatDate(person.requested_at) }}</span>
        </p>

        <!-- Status Badge -->
        <div class="flex justify-center sm:justify-start">
          <span
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold w-fit"
            :class="{
              'bg-yellow-100 text-yellow-800 border border-yellow-200':
                person.status === 'pending',
              'bg-green-100 text-green-800 border border-green-200':
                person.status === 'approved',
              'bg-red-100 text-red-800 border border-red-200':
                person.status === 'declined',
            }"
          >
            {{
              person.status === 'pending'
                ? 'Menunggu'
                : person.status === 'approved'
                  ? 'Disetujui'
                  : person.status === 'declined'
                    ? 'Ditolak'
                    : 'Status Tidak Diketahui'
            }}
          </span>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div
      class="flex items-center justify-center sm:justify-end gap-3 flex-shrink-0"
    >
      <!-- Accept Button -->
      <button
        @click="handleApprove"
        :disabled="isProcessing || person.status !== 'pending'"
        class="relative group flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 rounded-full transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
        :title="
          person.status !== 'pending' ? 'Sudah diproses' : 'Setujui permintaan'
        "
      >
        <!-- Loading spinner -->
        <div
          v-if="isProcessing"
          class="absolute inset-0 flex items-center justify-center"
        >
          <svg
            class="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white"
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
        </div>

        <!-- Check Icon -->
        <svg
          :class="{ invisible: isProcessing }"
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 sm:h-6 sm:w-6 text-white group-hover:scale-110 transition-transform duration-150"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </button>

      <!-- Decline Button -->
      <button
        @click="handleDecline"
        :disabled="isProcessing || person.status !== 'pending'"
        class="group flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 rounded-full transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed"
        :title="
          person.status !== 'pending' ? 'Sudah diproses' : 'Tolak permintaan'
        "
      >
        <!-- X Icon -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 sm:h-6 sm:w-6 text-white group-hover:scale-110 transition-transform duration-150"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  </div>
</template>
