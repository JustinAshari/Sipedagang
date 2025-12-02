<script setup>
  import { onMounted, ref, nextTick } from 'vue'
  import { useRoute } from 'vue-router'
  import { usePengadaanStore } from '@/stores/pengadaanStore'
  import { useSettingPengadaanStore } from '@/stores/settingPengadaanStore' // ✅ Import store
  import SuratPermohonan from '@/components/SuratPermohonan.vue'
  import SuratKwitansi from '@/components/SuratKwitansi.vue'
  import SuratDetailPengadaan from '@/components/SuratDetailPengadaan.vue'
  import ButtonPrintElement from '@/components/ButtonPrintElement.vue'

  const pengadaanStore = usePengadaanStore()
  const settingPengadaanStore = useSettingPengadaanStore() // ✅ Inisialisasi store
  const route = useRoute()
  const pengadaan = ref(null)
  const isLoading = ref(true)

  const extractInDate = (entry) => {
    if (!entry) return null
    const raw = entry.tanggal_in || entry.tanggal || entry.date
    if (!raw) return null
    const dateObj = new Date(raw)
    return Number.isNaN(dateObj.getTime()) ? null : dateObj
  }

  const filterLatestEntriesByDate = (entries) => {
    if (!Array.isArray(entries) || entries.length === 0) {
      return { latestEntries: [], latestTimestamp: null }
    }

    let maxTime = null
    const normalized = entries.map((entry) => ({ entry, dateObj: extractInDate(entry) }))

    normalized.forEach(({ dateObj }) => {
      if (!dateObj) return
      const time = dateObj.getTime()
      if (maxTime === null || time > maxTime) {
        maxTime = time
      }
    })

    if (maxTime === null) {
      return { latestEntries: [entries[entries.length - 1]], latestTimestamp: null }
    }

    const latestEntries = normalized
      .filter(({ dateObj }) => dateObj && dateObj.getTime() === maxTime)
      .map(({ entry }) => entry)

    return { latestEntries, latestTimestamp: maxTime }
  }

  const extractNumericAndUnit = (rawValue) => {
    if (!rawValue) return { value: 0, unit: '' }
    const match = rawValue.toString().match(/([\d.,]+)\s*(KG|LITER|PCS)?/i)
    if (!match) return { value: 0, unit: '' }
    const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.')) || 0
    const unit = match[2] ? match[2].toUpperCase() : ''
    return { value, unit }
  }

  const summarizeKuantumEntries = (entries) => {
    let totalValue = 0
    let detectedUnit = ''
    entries.forEach((entry) => {
      const raw = entry?.kuantum_in || entry?.kuantum || entry?.jumlah || entry?.jumlah_pembayaran
      if (!raw) return
      const { value, unit } = extractNumericAndUnit(raw)
      totalValue += value
      if (!detectedUnit && unit) detectedUnit = unit
    })

    const formatted = totalValue > 0
      ? `${new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(totalValue)}${detectedUnit ? ` ${detectedUnit}` : ''}`
      : ''

    return {
      totalValue,
      formatted,
      unit: detectedUnit,
    }
  }

  onMounted(async () => {
    const id = route.params.id
    const latestOnly = route.query && (route.query.latest === '1' || route.query.latest === 'true')
    if (id) {
      try {
        // ✅ Load setting pengadaan terlebih dahulu
        await settingPengadaanStore.fetchPengaturanPengadaan()

        // Kemudian load data pengadaan
        pengadaan.value = await pengadaanStore.fetchPengadaanById(id)

        // Jika diminta hanya cetak data IN terbaru, ambil semua entri dengan tanggal paling baru
        if (pengadaan.value && latestOnly) {
          try {
            let inData = pengadaan.value.in_data || pengadaan.value.parsed_in_data || []
            if (typeof inData === 'string') {
              inData = JSON.parse(inData)
            }
            if (Array.isArray(inData) && inData.length > 0) {
              const { latestEntries } = filterLatestEntriesByDate(inData)
              const selectedEntries = latestEntries && latestEntries.length > 0 ? latestEntries : [inData[inData.length - 1]]

              pengadaan.value = Object.assign({}, pengadaan.value, {
                in_data: selectedEntries,
                parsed_in_data: selectedEntries,
              })

              const summary = summarizeKuantumEntries(selectedEntries)
              const fallbackLatest = selectedEntries[selectedEntries.length - 1]
              const fallbackKuantum = fallbackLatest
                ? fallbackLatest.kuantum_in || fallbackLatest.kuantum || fallbackLatest.jumlah || fallbackLatest.jumlah_pembayaran || ''
                : ''
              const jumlahKuantumDisplay = summary.formatted || fallbackKuantum || ''
              const jumlahNumerik = summary.totalValue > 0
                ? summary.totalValue
                : extractNumericAndUnit(fallbackKuantum).value

              if (jumlahKuantumDisplay) {
                pengadaan.value.jumlah_pembayaran = jumlahKuantumDisplay
              }

              // Keep the PO kuantum unchanged; do not overwrite pengadaan.value.kuantum

              // Recalculate nominal/pricing using pengaturan if available in store
              try {
                const jenis = (pengadaan.value.jenis_pengadaan_barang || '').toLowerCase()
                const pengaturan = settingPengadaanStore.pengaturanPengadaan.find(p => p.jenis_pengadaan_barang?.toLowerCase() === jenis)
                if (pengaturan) {
                  const jumlah = jumlahNumerik || 0

                  if (pengaturan.tanpa_pajak) {
                    pengadaan.value.harga_sebelum_pajak = null
                    pengadaan.value.dpp = null
                    pengadaan.value.ppn_total = null
                    pengadaan.value.pph_total = null
                    pengadaan.value.nominal = Math.round(jumlah * parseFloat(pengaturan.harga_per_satuan) * 100) / 100
                  } else {
                    const hargaSebelumPajak = jumlah * parseFloat(pengaturan.harga_per_satuan)
                    const dpp = hargaSebelumPajak * (100 / 111)
                    const ppn = dpp * (pengaturan.ppn / 100)
                    // Use PPh from pengaturan; if missing treat as 0% (no PPh)
                    const pphRate = (typeof pengaturan.pph !== 'undefined' && pengaturan.pph !== null) ? parseFloat(pengaturan.pph) : 0.0
                    const pph = dpp * (pphRate / 100)
                    const nominal = dpp - pph

                    pengadaan.value.harga_sebelum_pajak = Math.round(hargaSebelumPajak * 100) / 100
                    pengadaan.value.dpp = Math.round(dpp * 100) / 100
                    pengadaan.value.ppn_total = Math.round(ppn * 100) / 100
                    pengadaan.value.pph_total = Math.round(pph * 100) / 100
                    pengadaan.value.nominal = Math.round(nominal * 100) / 100
                  }
                }
              } catch (err) {
                console.error('Error recalculating nominal for latest IN:', err)
              }
            } else {
              pengadaan.value = Object.assign({}, pengadaan.value, { in_data: [], parsed_in_data: [] })
            }
          } catch (e) {
            console.error('Failed to trim in_data to latest:', e)
          }
        }

        if (pengadaan.value) {
          await nextTick()
          isLoading.value = false

          setTimeout(() => {
            window.print()
          }, 300)
        } else {
          isLoading.value = false
        }
      } catch (error) {
        console.error('Error loading data:', error)
        isLoading.value = false
      }
    } else {
      isLoading.value = false
    }
  })
</script>

<template>
  <div
    v-if="isLoading"
    class="fixed inset-0 bg-white z-50 flex items-center justify-center px-4"
  >
    <div class="text-center max-w-xs sm:max-w-sm lg:max-w-md mx-auto">
      <div
        class="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 border-b-2 border-blue-500 mx-auto mb-3 sm:mb-4"
      ></div>
      <div class="text-sm sm:text-base lg:text-lg font-medium text-gray-700">
        Memuat data dokumen...
      </div>
    </div>
  </div>

  <div v-else class="min-h-screen bg-gray-50 print:bg-white">
    <div class="print:hidden">
      <ButtonPrintElement />
    </div>
    <!-- Section untuk Surat Permohonan dan Detail -->
    <section
      v-if="pengadaan"
      class="surat-section m-2 sm:m-4 lg:m-[8mm] xl:m-[10mm] print:m-[10mm]"
    >
      <div
        class="bg-white print:bg-transparent rounded-lg print:rounded-none shadow-sm print:shadow-none border print:border-none overflow-hidden"
      >
        <div class="space-y-42 p-4 sm:p-6 lg:p-8 print:p-0">
          <div class="page-break">
            <SuratPermohonan :item="pengadaan" />
          </div>
          <div class="page-break">
            <SuratDetailPengadaan :item="pengadaan" />
          </div>
          <div class="page-break">
            <SuratKwitansi :item="pengadaan" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style>
  @media print {
    @page {
      size: A4 portrait;
      margin: 10mm;
      /* Mencoba menyembunyikan header/footer browser */
      @top-left {
        content: '';
      }
      @top-center {
        content: '';
      }
      @top-right {
        content: '';
      }
      @bottom-left {
        content: '';
      }
      @bottom-center {
        content: '';
      }
      @bottom-right {
        content: '';
      }
    }

    /* Hindari konten terpotong header/footer */
    body {
      margin: 0 !important;
      padding: 0 !important;
    }

    .page-break {
      page-break-after: always;
      margin-top: 0 !important;
      margin-bottom: 0 !important;
    }

    .page-break:last-child {
      page-break-after: auto;
    }

    .surat-section {
      margin: 0 !important;
      padding: 0 !important;
    }

    /* Gunakan properti yang benar untuk print colors */
    * {
      print-color-adjust: exact !important;
      -webkit-print-color-adjust: exact !important;
    }
  }
</style>
