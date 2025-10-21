<script setup>
  defineProps({
    datain: {
      type: Object,
      required: true,
    },
  })

  // Fungsi format tanggal dengan tanda minus
  function formatTanggal(tanggal) {
    if (!tanggal) return ''
    const date = new Date(tanggal)
    const day = date.getDate()
    const month = date.getMonth() + 1 // bulan dimulai dari 0
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }

  // Fungsi format angka dengan titik ribuan
  function formatAngka(angka) {
    if (!angka) return '0'
    return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }
</script>

<template>
  <div class="pt-1">
    <div class="grid grid-cols-2 w-[89%]">
      <div class="grid grid-cols-3">
        <div>No. {{ datain.no_in }}</div>
        <div class="col-span-2">
          Tgl <span class="ml-2">{{ formatTanggal(datain.tanggal_in) }}</span>
        </div>
      </div>
      <div>
        Kuantum :
        <span class="lowercase">
          {{ formatAngka(datain.kuantum_in) }}
        </span>
      </div>
    </div>
  </div>
</template>
