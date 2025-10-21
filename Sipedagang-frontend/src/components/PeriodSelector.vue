<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useDashboardStore } from '@/stores/dashboardStore'

  const dashboard = useDashboardStore()
  const showDropdown = ref(false)

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ]

  const currentYear = new Date().getFullYear()
  const years = computed(() => {
    const yearList = []
    for (let i = currentYear - 2; i <= currentYear + 1; i++) {
      yearList.push(i)
    }
    return yearList
  })

  const selectedPeriod = computed(() => dashboard.periodLabel)

  const selectPeriod = async (month, year) => {
    showDropdown.value = false
    await dashboard.changePeriod(month, year)
  }

  const toggleDropdown = () => {
    showDropdown.value = !showDropdown.value
  }

  // Close dropdown when clicking outside
  const handleClickOutside = (event) => {
    const dropdown = document.getElementById('period-dropdown')
    if (dropdown && !dropdown.contains(event.target)) {
      showDropdown.value = false
    }
  }

  onMounted(() => {
    document.addEventListener('click', handleClickOutside)
  })
</script>

<template>
  <div class="relative" id="period-dropdown">
    <!-- Period Button -->
    <button
      @click="toggleDropdown"
      class="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors duration-200 shadow-sm"
      :disabled="dashboard.loading"
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
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <span>Periode:</span>
      <span class="font-semibold">{{ selectedPeriod }}</span>
      <svg
        class="w-4 h-4 transition-transform duration-200"
        :class="showDropdown ? 'rotate-180' : ''"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="showDropdown"
      class="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto"
    >
      <div class="p-4">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">Pilih Periode</h3>

        <!-- Years -->
        <div v-for="year in years" :key="year" class="mb-4">
          <div class="text-xs font-medium text-gray-500 mb-2">{{ year }}</div>

          <!-- Months Grid -->
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="(monthName, index) in monthNames"
              :key="`${year}-${index + 1}`"
              @click="selectPeriod(index + 1, year)"
              class="px-3 py-2 text-xs rounded-md transition-colors duration-200 text-center"
              :class="[
                dashboard.currentPeriod.month === index + 1 &&
                dashboard.currentPeriod.year === year
                  ? 'bg-blue-500 text-white font-medium'
                  : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700',
              ]"
            >
              {{ monthName }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  /* Custom scrollbar untuk dropdown */
  .overflow-y-auto::-webkit-scrollbar {
    width: 4px;
  }

  .overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
</style>
