<script setup>
  import { computed, ref, watch } from 'vue'

  const props = defineProps({
    currentPage: { type: Number, default: 1 },
    totalPages: { type: Number, default: 1 },
  })

  const emit = defineEmits(['change'])

  function goToPage(page) {
    if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
      emit('change', page)
    }
  }

  const pageNumbers = computed(() => {
    const total = props.totalPages
    const current = props.currentPage
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
    if (current <= 3) return [1, 2, 3, 4, 5]
    if (current >= total - 2)
      return [total - 4, total - 3, total - 2, total - 1, total]
    return [current - 2, current - 1, current, current + 1, current + 2]
  })

  const canGoPrevious = computed(() => props.currentPage > 1)
  const canGoNext = computed(() => props.currentPage < props.totalPages)

  // Ref untuk input manual page
  const inputPage = ref('')
  const inputRef = ref(null)

  // ✅ NEW: Computed untuk placeholder yang menunjukkan max halaman
  const placeholderText = computed(() => {
    return `1-${props.totalPages}`
  })

  // Fungsi untuk handle input page - DIPERBAIKI
  function handleInputPage(e) {
    const value = e.target.value.trim()

    // Jika input kosong, abaikan
    if (!value) {
      e.target.value = ''
      return
    }

    let page = parseInt(value)

    // Validasi input
    if (isNaN(page) || page < 1) {
      page = 1
    } else if (page > props.totalPages) {
      page = props.totalPages
    }

    // Clear input setelah submit
    e.target.value = ''
    inputPage.value = ''

    // Emit perubahan page
    if (page !== props.currentPage) {
      goToPage(page)
    }
  }

  // Handle Enter key
  function handleKeyUp(e) {
    if (e.key === 'Enter') {
      handleInputPage(e)
    }
  }
</script>

<template>  <!-- Mobile Pagination -->
  <section class="block lg:hidden">
    <div class="flex flex-col items-center gap-3">
      <!-- Current Page Info with Quick Jump -->
      <div class="flex items-center gap-3">
        <div class="text-sm text-gray-600 font-medium">
          Halaman {{ currentPage }} dari {{ totalPages }}
        </div>
        
        <!-- Quick Jump Input (Mobile) - Positioned next to page info -->
        <div class="flex text-xs gap-1 items-center">
          <span class="text-[#6C757D] text-xs">|</span>
          <span class="text-[#6C757D] text-xs">Ke:</span>
          <input
            ref="inputRef"
            type="number"
            min="1"
            :max="props.totalPages"
            :placeholder="placeholderText"
            v-model="inputPage"
            @change="handleInputPage"
            @keyup="handleKeyUp"
            class="border border-[#CED4DA] rounded-md w-14 h-6 px-1 text-center text-xs focus:outline-[#0099FF] focus:text-[#0099FF] focus:border-[#0099FF] transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-gray-400"
          />
        </div>
      </div>
      
      <!-- Navigation Controls -->
      <div class="flex items-center justify-center gap-2">
        <!-- First Page Button -->
        <button
          v-if="currentPage > 1"
          :class="[
            'font-poppins rounded-md px-2 py-1 text-xs transition-all duration-200',
            'border border-[#CED4DA] hover:bg-[#0099FF] hover:border-[#0099FF] hover:text-white text-[#333] cursor-pointer'
          ]"
          @click="goToPage(1)"
        >
          ««
        </button>

        <!-- Prev Button -->
        <button
          :class="[
            'font-poppins rounded-md px-3 py-1 text-xs transition-all duration-200',
            canGoPrevious
              ? 'border border-[#CED4DA] hover:bg-[#0099FF] hover:border-[#0099FF] hover:text-white text-[#333] cursor-pointer'
              : 'bg-[#EAE9EF] text-[#ADB5BD] cursor-not-allowed border border-[#EAE9EF]',
          ]"
          :disabled="!canGoPrevious"
          @click="canGoPrevious && goToPage(props.currentPage - 1)"
        >
          « Prev
        </button>

        <!-- Current Page Indicator -->
        <div class="bg-[#0099FF] text-white border border-[#0099FF] font-medium text-sm rounded-md px-3 py-1 min-w-[40px] text-center">
          {{ currentPage }}
        </div>

        <!-- Next Button -->
        <button
          :class="[
            'font-poppins rounded-md px-3 py-1 text-xs transition-all duration-200',
            canGoNext
              ? 'border border-[#CED4DA] hover:bg-[#0099FF] hover:border-[#0099FF] hover:text-white text-[#333] cursor-pointer'
              : 'bg-[#EAE9EF] text-[#ADB5BD] cursor-not-allowed border border-[#EAE9EF]',
          ]"
          :disabled="!canGoNext"
          @click="canGoNext && goToPage(props.currentPage + 1)"
        >
          Next »
        </button>

        <!-- Last Page Button -->
        <button
          v-if="currentPage < totalPages"
          :class="[
            'font-poppins rounded-md px-2 py-1 text-xs transition-all duration-200',
            'border border-[#CED4DA] hover:bg-[#0099FF] hover:border-[#0099FF] hover:text-white text-[#333] cursor-pointer'
          ]"
          @click="goToPage(totalPages)"
        >
          »»
        </button>
      </div>
    </div>
  </section>

  <!-- Desktop Pagination -->
  <section class="hidden lg:flex justify-center items-center gap-2">
    <!-- Prev Button -->
    <button
      :class="[
        'font-poppins rounded-sm w-8 h-8 transition-all duration-200',
        canGoPrevious
          ? 'border border-[#CED4DA] hover:bg-[#0099FF] hover:border-[#0099FF] hover:text-white text-[#333] cursor-pointer'
          : 'bg-[#EAE9EF] text-[#ADB5BD] cursor-not-allowed border border-[#EAE9EF]',
      ]"
      :disabled="!canGoPrevious"
      @click="canGoPrevious && goToPage(props.currentPage - 1)"
    >
      &lt;
    </button>

    <!-- Page Numbers -->
    <div
      v-for="page in pageNumbers"
      :key="page"
      :class="[
        'font-medium border border-[#CED4DA] text-sm rounded-sm w-8 h-8 flex justify-center items-center cursor-pointer transition-all duration-200',
        page === props.currentPage
          ? 'bg-[#0099FF] text-white border-[#0099FF]'
          : 'hover:border-[#0099FF] hover:text-[#0099FF] text-[#333]',
      ]"
      @click="goToPage(page)"
    >
      {{ page }}
    </div>

    <!-- Next Button -->
    <button
      :class="[
        'font-poppins rounded-sm w-8 h-8 transition-all duration-200',
        canGoNext
          ? 'border border-[#CED4DA] hover:bg-[#0099FF] hover:border-[#0099FF] hover:text-white text-[#333] cursor-pointer'
          : 'bg-[#EAE9EF] text-[#ADB5BD] cursor-not-allowed border border-[#EAE9EF]',
      ]"
      :disabled="!canGoNext"
      @click="canGoNext && goToPage(props.currentPage + 1)"
    >
      &gt;
    </button>

    <!-- SEARCH PAGE INPUT -->
    <div class="flex text-sm gap-3 items-center ml-2">
      <input
        ref="inputRef"
        type="number"
        min="1"
        :max="props.totalPages"
        :placeholder="placeholderText"
        v-model="inputPage"
        @change="handleInputPage"
        @keyup="handleKeyUp"
        class="border border-[#CED4DA] rounded-sm w-20 h-8 px-2 text-center focus:outline-[#0099FF] focus:text-[#0099FF] focus:border-[#0099FF] transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-gray-400"
      />
      <div class="text-[#6C757D]">/Page</div>
    </div>
  </section>
</template>
