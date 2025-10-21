<script setup>
  import { computed, ref, onMounted, nextTick, shallowRef } from 'vue'

  const props = defineProps({
    title: {
      type: String,
      required: true,
    },
    data: {
      type: Object,
      required: true,
    },
    type: {
      type: String,
      required: true, // 'pengadaan' or 'admin'
    },
    loading: {
      type: Boolean,
      default: false,
    },
  })

  const animationProgress = ref(0)
  const isAnimating = ref(false)

  // Gunakan shallowRef untuk performa lebih baik pada data yang tidak nested
  const cachedChartData = shallowRef([])
  const cachedPieSlices = shallowRef([])

  // Color palettes - optimized lookup
  const colorPalettes = {
    pengadaan: [
      '#3B82F6',
      '#10B981',
      '#F59E0B',
      '#EF4444',
      '#8B5CF6',
      '#06B6D4',
      '#84CC16',
      '#F97316',
      '#EC4899',
      '#6B7280',
    ],
    admin: ['#10B981', '#6B7280'],
  }

  // Cached color array untuk menghindari lookup berulang
  const currentColors = computed(
    () => colorPalettes[props.type] || colorPalettes.pengadaan,
  )

  // Optimized data processing dengan memoization
  const chartData = computed(() => {
    const entries = Object.entries(props.data)
    const total = entries.reduce((sum, [, value]) => sum + value, 0)

    if (total === 0) {
      cachedChartData.value = []
      return []
    }

    const colors = currentColors.value
    const result = entries
      .map(([label, value], index) => ({
        label,
        value,
        percentage: (value / total) * 100,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.value - a.value)

    cachedChartData.value = result
    return result
  })

  // Optimized pie slice calculation dengan fix untuk single item
  const pieSlices = computed(() => {
    if (!chartData.value.length || animationProgress.value === 0) {
      cachedPieSlices.value = []
      return []
    }

    let cumulativeAngle = 0
    const radius = 85
    const centerX = 100
    const centerY = 100
    const animProgress = animationProgress.value

    const result = chartData.value.map((item, index) => {
      const startAngle = cumulativeAngle
      const sliceAngle = (item.percentage / 100) * 2 * Math.PI * animProgress
      const endAngle = startAngle + sliceAngle

      let pathData = ''

      if (sliceAngle > 0) {
        // Fix untuk single item atau item yang hampir 100%
        if (chartData.value.length === 1 || item.percentage >= 99.9) {
          // Full circle - gunakan dua arc untuk menghindari rendering error
          const midAngle = startAngle + Math.PI
          const x1 = centerX + radius * Math.cos(startAngle)
          const y1 = centerY + radius * Math.sin(startAngle)
          const x2 = centerX + radius * Math.cos(midAngle)
          const y2 = centerY + radius * Math.sin(midAngle)
          const x3 = centerX + radius * Math.cos(startAngle + 0.001) // Slight offset untuk menghindari overlap
          const y3 = centerY + radius * Math.sin(startAngle + 0.001)

          pathData = `M ${centerX} ${centerY} 
                   L ${x1} ${y1} 
                   A ${radius} ${radius} 0 0 1 ${x2} ${y2} 
                   A ${radius} ${radius} 0 0 1 ${x3} ${y3} 
                   Z`
        } else {
          // Normal slice - pre-calculated coordinates
          const x1 = centerX + radius * Math.cos(startAngle)
          const y1 = centerY + radius * Math.sin(startAngle)
          const x2 = centerX + radius * Math.cos(endAngle)
          const y2 = centerY + radius * Math.sin(endAngle)
          const largeArcFlag = sliceAngle > Math.PI ? 1 : 0

          pathData = `M ${centerX} ${centerY} 
                   L ${x1} ${y1} 
                   A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} 
                   Z`
        }
      }

      cumulativeAngle = endAngle

      return {
        ...item,
        path: pathData,
        startAngle,
        endAngle,
      }
    })

    cachedPieSlices.value = result
    return result
  })

  // Optimized total calculation
  const totalValue = computed(() => {
    return Object.values(props.data).reduce((sum, value) => sum + value, 0)
  })

  // Optimized animation dengan requestAnimationFrame yang lebih efisien
  const startAnimation = () => {
    if (isAnimating.value) return // Prevent multiple animations

    isAnimating.value = true
    const duration = 1200 // Reduced duration for faster perception
    const startTime = performance.now() // Use performance.now() for better precision

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Simplified easing function
      animationProgress.value = progress * progress * (3.0 - 2.0 * progress)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        isAnimating.value = false
      }
    }

    requestAnimationFrame(animate)
  }

  // Container variant computation optimization
  const containerVariant = computed(() => {
    return props.type === 'pengadaan'
      ? {
          bg: 'from-white to-blue-50/30',
          border: 'border-blue-100/50',
          text: 'group-hover:text-blue-600',
        }
      : {
          bg: 'from-white to-green-50/30',
          border: 'border-green-100/50',
          text: 'group-hover:text-green-600',
        }
  })

  // Computed untuk clip path animation
  const clipPathRadius = computed(() => {
    return 85 * animationProgress.value
  })

  onMounted(async () => {
    // Use nextTick to ensure DOM is ready
    await nextTick()

    // Delay animation start for better UX
    setTimeout(startAnimation, 200) // Reduced delay
  })
</script>

<template>
  <section
    :class="`relative flex flex-col p-4 sm:p-5 lg:p-6 rounded-2xl sm:rounded-3xl min-h-[320px] bg-gradient-to-br ${containerVariant.bg} shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 border ${containerVariant.border} overflow-hidden group`"
  >
    <!-- Header -->
    <div class="mb-4">
      <h3
        :class="`font-bold text-lg sm:text-xl text-slate-700 ${containerVariant.text} transition-colors duration-300`"
      >
        {{ title }}
      </h3>
      <p class="text-sm text-slate-500 mt-1">
        Total: {{ totalValue }} {{ type === 'pengadaan' ? 'item' : 'admin' }}
      </p>
    </div>

    <!-- Loading State - Simplified -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"
        ></div>
        <span class="text-gray-600 text-sm">Memuat data...</span>
      </div>
    </div>

    <!-- Chart Content -->
    <div
      v-else-if="chartData.length > 0"
      class="flex-1 flex flex-col lg:flex-row gap-6"
    >
      <!-- Optimized SVG Pie Chart -->
      <div class="flex-shrink-0 flex justify-center items-center">
        <div class="relative">
          <svg
            width="200"
            height="200"
            viewBox="0 0 200 200"
            class="group-hover:scale-105 transition-transform duration-300"
            style="overflow: visible"
          >
            <!-- Background circle -->
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke="#f1f5f9"
              stroke-width="1"
              opacity="0.3"
            />

            <!-- Single item dengan animasi radius scaling -->
            <circle
              v-if="chartData.length === 1"
              cx="100"
              cy="100"
              :r="85 * animationProgress"
              :fill="chartData[0].color"
              stroke="white"
              stroke-width="2"
              class="transition-opacity duration-300 hover:opacity-90"
              :style="`opacity: ${animationProgress}`"
            />

            <!-- Multiple items dengan pie slices -->
            <g v-else>
              <path
                v-for="(slice, index) in pieSlices"
                :key="`slice-${index}`"
                :d="slice.path"
                :fill="slice.color"
                stroke="white"
                stroke-width="2"
                class="transition-opacity duration-300 hover:opacity-90 cursor-pointer"
                :style="`transition-delay: ${index * 100}ms`"
              />
            </g>

            <!-- Center circle dengan animasi -->
            <circle
              cx="100"
              cy="100"
              :r="45 * Math.min(animationProgress * 1.2, 1)"
              fill="white"
              stroke="#e2e8f0"
              stroke-width="1"
              :style="`opacity: ${Math.min(animationProgress * 1.3, 1)}`"
            />

            <!-- Center text dengan staggered animation -->
            <text
              x="100"
              y="92"
              text-anchor="middle"
              class="text-xs font-semibold fill-slate-600"
              style="
                font-family:
                  system-ui,
                  -apple-system,
                  sans-serif;
              "
              :style="`opacity: ${Math.min(animationProgress * 1.8, 1)}`"
            >
              Total
            </text>
            <text
              x="100"
              y="112"
              text-anchor="middle"
              class="text-xl font-bold fill-slate-800"
              style="
                font-family:
                  system-ui,
                  -apple-system,
                  sans-serif;
              "
              :style="`opacity: ${Math.min(animationProgress * 1.8, 1)}`"
            >
              {{ totalValue }}
            </text>
          </svg>
        </div>
      </div>

      <!-- Optimized Legend -->
      <div class="flex-1 min-w-0">
        <div class="space-y-3 max-h-60 overflow-y-auto pr-2">
          <div
            v-for="(item, index) in chartData"
            :key="`legend-${index}`"
            class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/80 transition-all duration-200 border border-transparent hover:border-gray-100"
          >
            <div class="flex items-center space-x-3 min-w-0 flex-1">
              <!-- Color indicator -->
              <div
                class="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                :style="`background-color: ${item.color}; box-shadow: 0 0 0 1px rgba(0,0,0,0.1)`"
              ></div>

              <!-- Label and percentage -->
              <div class="min-w-0 flex-1">
                <div class="text-sm font-semibold text-slate-700 truncate">
                  {{ item.label }}
                </div>
                <div class="text-xs text-slate-500">
                  {{ Math.round(item.percentage) }}% dari total
                </div>
              </div>
            </div>

            <!-- Value -->
            <div class="text-right flex-shrink-0 ml-3">
              <div class="text-lg font-bold text-slate-800">
                {{ item.value }}
              </div>
              <div class="text-xs text-slate-500">
                {{ type === 'pengadaan' ? 'item' : 'admin' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="flex-1 flex items-center justify-center text-center">
      <div>
        <div class="text-gray-400 mb-3">
          <svg
            class="w-16 h-16 mx-auto"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        <p class="text-gray-500 text-sm font-medium">Tidak ada data tersedia</p>
        <p class="text-gray-400 text-xs mt-1">
          Data akan muncul setelah ada input
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-4 pt-3 border-t border-slate-100">
      <div class="flex items-center justify-between text-xs text-slate-500">
        <span>Update terbaru</span>
        <div class="flex items-center space-x-1">
          <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span>Real-time</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
  /* Optimized scrollbar */
  .overflow-y-auto::-webkit-scrollbar {
    width: 4px;
  }

  .overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 2px;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  /* Remove complex animations for better performance */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>
