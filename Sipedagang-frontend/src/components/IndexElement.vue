<script setup>
  import { computed, ref, onMounted } from 'vue'

  const props = defineProps({
    item: {
      type: Object,
      required: true,
    },
  })

  // Generate random data untuk animasi chart
  const chartData = ref([])
  const animatedValues = ref([])

  const generateChartData = () => {
    const baseValue = parseInt(props.item.desc) || 0
    const dataPoints = 8
    const data = []

    for (let i = 0; i < dataPoints; i++) {
      // Generate nilai berdasarkan total dengan variasi
      const variation = Math.random() * 0.3 + 0.7 // 70%-100% dari base
      const value = Math.max(
        1,
        Math.floor((baseValue * variation) / dataPoints),
      )
      data.push(value)
    }

    return data
  }

  const maxValue = computed(() => {
    return Math.max(...chartData.value, 1)
  })

  // Animate chart bars
  const animateChart = () => {
    animatedValues.value = new Array(chartData.value.length).fill(0)

    setTimeout(() => {
      chartData.value.forEach((value, index) => {
        setTimeout(() => {
          animatedValues.value[index] = value
        }, index * 100)
      })
    }, 300)
  }

  onMounted(() => {
    chartData.value = generateChartData()
    animateChart()
  })

  // Compute bar heights as percentages
  const getBarHeight = (value, index) => {
    const animated = animatedValues.value[index] || 0
    return Math.max((animated / maxValue.value) * 100, 5)
  }

  // Color variants based on title
  const getColorVariant = computed(() => {
    const title = props.item.title.toLowerCase()
    if (title.includes('pengadaan')) {
      return {
        gradient: 'from-blue-500 to-blue-600',
        bg: 'from-white to-blue-50/30',
        border: 'border-blue-100/50',
        text: 'group-hover:text-blue-600',
        decoration: 'from-blue-400/10 to-blue-600/5',
      }
    } else if (title.includes('admin')) {
      return {
        gradient: 'from-green-500 to-green-600',
        bg: 'from-white to-green-50/30',
        border: 'border-green-100/50',
        text: 'group-hover:text-green-600',
        decoration: 'from-green-400/10 to-green-600/5',
      }
    }
    return {
      gradient: 'from-purple-500 to-purple-600',
      bg: 'from-white to-purple-50/30',
      border: 'border-purple-100/50',
      text: 'group-hover:text-purple-600',
      decoration: 'from-purple-400/10 to-purple-600/5',
    }
  })
</script>

<template>
  <section
    :class="`relative flex flex-col p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl h-40 sm:h-44 lg:h-48 bg-gradient-to-br ${getColorVariant.bg} shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 border ${getColorVariant.border} overflow-hidden group`"
  >
    <!-- Background decoration -->
    <div
      :class="`absolute top-0 right-0 w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-gradient-to-br ${getColorVariant.decoration} rounded-full -translate-y-6 translate-x-6 sm:-translate-y-8 sm:translate-x-8 group-hover:scale-110 transition-transform duration-500`"
    ></div>

    <!-- Content with better layout structure -->
    <div class="relative z-10 flex flex-col justify-between h-full">
      <!-- Title and Value section -->
      <div class="flex-1 min-h-0">
        <!-- Title -->
        <div class="mb-2 sm:mb-3">
          <h3
            :class="`font-bold text-base sm:text-lg md:text-xl lg:text-2xl text-slate-700 ${getColorVariant.text} transition-colors duration-300 leading-tight`"
          >
            {{ item.title }}
          </h3>
        </div>

        <!-- Value with emphasis -->
        <div class="mb-3 sm:mb-4">
          <div class="flex items-baseline space-x-2">
            <span
              class="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 group-hover:scale-105 transition-transform duration-300"
            >
              {{ item.desc === 'Loading...' ? '...' : item.desc }}
            </span>
            <span class="text-xs sm:text-sm text-slate-500 font-medium">
              total
            </span>
          </div>
        </div>
      </div>

      <!-- Responsive Chart Container -->
      <div class="flex justify-between items-end h-12 sm:h-14 lg:h-16 px-1">
        <!-- Chart bars -->
        <div
          v-if="item.desc !== 'Loading...'"
          class="flex items-end justify-between w-full space-x-1 sm:space-x-1.5"
        >
          <div
            v-for="(value, index) in chartData"
            :key="index"
            class="flex flex-col items-center"
          >
            <div
              :class="`w-2 sm:w-3 lg:w-4 bg-gradient-to-t ${getColorVariant.gradient} rounded-t-full transition-all duration-500 ease-out opacity-80 hover:opacity-100 group-hover:scale-110`"
              :style="`height: ${getBarHeight(value, index)}%; transition-delay: ${index * 50}ms`"
            ></div>
          </div>
        </div>

        <!-- Loading state -->
        <div
          v-else
          class="flex items-end justify-between w-full space-x-1 sm:space-x-1.5"
        >
          <div
            v-for="n in 8"
            :key="n"
            :class="`w-2 sm:w-3 lg:w-4 bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-full animate-pulse`"
            :style="`height: ${Math.random() * 60 + 20}%; animation-delay: ${n * 100}ms`"
          ></div>
        </div>
      </div>

      <!-- Chart Icon in corner -->
      <div class="absolute bottom-3 right-3 sm:bottom-4 sm:right-4">
        <div
          :class="`p-1.5 sm:p-2 rounded-lg bg-gradient-to-r ${getColorVariant.gradient} shadow-md group-hover:shadow-lg transition-all duration-300 opacity-80 group-hover:opacity-100`"
        >
          <svg
            class="w-3 h-3 sm:w-4 sm:h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
      </div>
    </div>
  </section>
</template>
