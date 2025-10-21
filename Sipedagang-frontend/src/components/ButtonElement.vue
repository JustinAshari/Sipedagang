<script setup>
  const props = defineProps({
    leftLabel: {
      type: String,
      default: 'Clear',
    },
    rightLabel: {
      type: String,
      default: 'Save',
    },
    showDelete: {
      type: Boolean,
      default: false,
    },
    deleteLabel: {
      type: String,
      default: 'Delete',
    },
    rightLoading: {
      type: Boolean,
      default: false,
    },
    leftDisabled: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['onClickLeft', 'onClickRight', 'onClickDelete'])
</script>

<template>
  <div class="flex flex-col sm:flex-row justify-end gap-3 sm:gap-5 mt-5 sm:mt-7.5 w-full px-2 sm:px-0">
    <!-- Delete Button -->
    <button
      v-if="showDelete"
      type="button"
      :disabled="rightLoading"
      class="bg-[#F44336] text-white rounded-lg h-10 sm:h-11 px-4 sm:px-6 md:px-9 font-medium sm:font-semibold text-sm sm:text-base cursor-pointer hover:scale-95 disabled:bg-red-300 disabled:cursor-not-allowed disabled:hover:scale-100 focus:ring-2 focus:ring-offset-2 focus:ring-[#F44336] transition-all duration-200 ease-in-out order-3 sm:order-1"
      @click="$emit('onClickDelete')"
    >
      {{ deleteLabel }}
    </button>

    <!-- Left Button (Clear) -->
    <button
      type="button"
      :disabled="leftDisabled || rightLoading"
      class="bg-[#9BA1AA] text-white rounded-lg h-10 sm:h-11 px-4 sm:px-6 md:px-8 lg:px-11 font-medium sm:font-semibold text-sm sm:text-base cursor-pointer hover:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:scale-100 focus:ring-2 focus:ring-[#9BA1AA] focus:ring-offset-2 transition-all duration-200 ease-in-out order-2 sm:order-2"
      @click="$emit('onClickLeft')"
    >
      {{ leftLabel }}
    </button>

    <!-- Right Button (Save/Submit) -->
    <button
      type="button" 
      :disabled="rightLoading"
      class="bg-[#0099FF] text-white rounded-lg h-10 sm:h-11 px-6 sm:px-8 md:px-12 lg:px-20 font-medium sm:font-semibold text-sm sm:text-base cursor-pointer hover:scale-95 disabled:bg-blue-300 disabled:cursor-not-allowed disabled:hover:scale-100 focus:ring-2 focus:ring-offset-2 focus:ring-[#0099FF] transition-all duration-200 ease-in-out flex items-center justify-center gap-2 order-1 sm:order-3"
      @click="$emit('onClickRight')"
    >
      <!-- Loading Spinner -->
      <svg
        v-if="rightLoading"
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

      <!-- Button Text -->
      <span>{{ rightLabel }}</span>
    </button>
  </div>
</template>
