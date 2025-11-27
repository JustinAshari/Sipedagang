<script setup>
  import { RouterLink, useRouter } from 'vue-router'
  import { usePengadaanStore } from '@/stores/pengadaanStore'
  import { computed, ref } from 'vue'
  import Swal from 'sweetalert2'

  const props = defineProps({
    item: {
      type: Object,
      required: true,
    },
    // parent-managed expanded ids (array)
    expandedIds: {
      type: Array,
      required: false,
      default: () => [],
    },
  })

  // Declare emitted events so Vue won't warn about extraneous listeners
  const emit = defineEmits(['toggle-in-data'])

  const pengadaanStore = usePengadaanStore()

  const openPrintPreview = () => {
    window.open(`/surat-preview/${props.item.id}`, '_blank')
  }

  const openPrintLatest = () => {
    window.open(`/surat-preview/${props.item.id}?latest=1`, '_blank')
  }

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: 'Data yang dihapus tidak dapat dikembalikan!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, hapus!',
      cancelButtonText: 'Batal',
    })

    if (result.isConfirmed) {
      try {
        await pengadaanStore.deletePengadaan(props.item.id)

        Swal.fire({
          title: 'Berhasil!',
          text: 'Data berhasil dihapus',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true,
        })
      } catch (error) {
        Swal.fire({
          title: 'Error!',
          text: error.message || 'Terjadi kesalahan saat menghapus data',
          icon: 'error',
          confirmButtonColor: '#d33',
        })
      }
    }
  }

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Helper function to convert to proper Title Case
  const toTitleCase = (str) => {
    if (!str) return '-'
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // ✅ MODIFIED: Hanya jenis pengadaan yang menggunakan Title Case
  const jenisPengadaanFormatted = computed(() => {
    const str =
      props.item.jenis_pengadaan_barang || props.item.jenisPengadaan || ''
    return toTitleCase(str)
  })

  // ✅ MODIFIED: Supplier tanpa Title Case - tampilkan original
  const supplierFormatted = computed(() => {
    const str = props.item.nama_suplier || props.item.supplier || ''
    return str || '-'
  })

  // ✅ MODIFIED: Perusahaan tanpa Title Case - tampilkan original
  const perusahaanFormatted = computed(() => {
    const str = props.item.nama_perusahaan || props.item.perusahaan || ''
    return str || '-'
  })

  const userFormatted = computed(() => {
    const str = props.item.user?.name || ''
    if (!str) return 'Unknown'
    return toTitleCase(str)
  })

  // Desktop IN Data expansion is managed by parent via expandedIds prop
  const isExpanded = computed(() => {
    try {
      return Array.isArray(props.expandedIds) && props.expandedIds.includes(props.item.id)
    } catch (e) {
      return false
    }
  })

  import parseInData from '@/utils/parseInData'
  import { useSettingPengadaanStore } from '@/stores/settingPengadaanStore'

  const parsedInData = computed(() => {
    try {
      // Prefer server-cached detail if available
      const cached = pengadaanStore.pengadaanDetails[props.item.id]
      if (cached && Array.isArray(cached.parsed_in_data)) return cached.parsed_in_data

      if (props.item?.parsed_in_data && Array.isArray(props.item.parsed_in_data)) return props.item.parsed_in_data
      return parseInData(props.item?.in_data || props.item?.parsed_in_data)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error parsing in_data for item', props.item?.id, e)
      return []
    }
  })

  const settingPengadaanStore = useSettingPengadaanStore()

  const parseKuantumNumber = (kuantumStr) => {
    if (!kuantumStr) return 0
    const s = kuantumStr.toString()
    const m = s.match(/([\d.,]+)/)
    if (!m) return 0
    // normalize comma/period
    const num = m[1].replace(/\./g, '').replace(',', '.')
    return parseFloat(num) || 0
  }

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '-'
    const num = Number(value)
    if (isNaN(num)) return '-'
    const formatted = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num)
    // If formatted contains decimal comma, keep it and append ',-' after; otherwise append ',-'
    return `Rp. ${formatted},-`
  }

  const getHargaPerSatuanForItem = (jenis) => {
    try {
      if (!jenis) return 0
      const found = settingPengadaanStore.pengaturanPengadaan.find(
        (p) => p.jenis_pengadaan_barang?.toLowerCase() === jenis.toLowerCase(),
      )
      return found ? parseFloat(found.harga_per_satuan || 0) : 0
    } catch (e) {
      return 0
    }
  }

  const getPengaturanForItem = (jenis) => {
    try {
      if (!jenis) return null
      return settingPengadaanStore.pengaturanPengadaan.find(
        (p) => p.jenis_pengadaan_barang?.toLowerCase() === jenis.toLowerCase(),
      )
    } catch (e) {
      return null
    }
  }

  const computeNominalForIn = (inItem) => {
    try {
      const rawKuantum = inItem?.kuantum || inItem?.kuantum_in || inItem?.jumlah || inItem?.jumlah_in || inItem?.kuantumIn || ''
      const qty = parseKuantumNumber(rawKuantum)
      const jenis = (props.item.jenis_pengadaan_barang || props.item.jenisPengadaan || '').toString()

      const peng = getPengaturanForItem(jenis)
      // prefer pengaturan.harga_per_satuan, fallback to inItem.harga_per_satuan, then to store lookup
      let hargaPerSatuan = 0
      if (peng && peng.harga_per_satuan) hargaPerSatuan = parseFloat(peng.harga_per_satuan)
      else if (inItem && (inItem.harga_per_satuan || inItem.harga)) hargaPerSatuan = parseFloat(inItem.harga_per_satuan || inItem.harga)
      else hargaPerSatuan = getHargaPerSatuanForItem(jenis)

      const ppnPerc = peng && peng.ppn ? parseFloat(peng.ppn) : 0
      const pphPerc = peng && peng.pph ? parseFloat(peng.pph) : 0

      // If harga per satuan and qty are available, compute nominal
      if (hargaPerSatuan > 0 && qty > 0) {
        const hargaSebelumPajak = qty * hargaPerSatuan
        const dpp = hargaSebelumPajak * (100 / 111)
        const ppnVal = dpp * (ppnPerc / 100)
        const pphVal = dpp * (pphPerc / 100)
        const nominal = hargaSebelumPajak - ppnVal - pphVal
        return Math.round((nominal + Number.EPSILON) * 100) / 100
      }

      // If inItem already carries nominal-like fields, use them
      if (inItem && (inItem.nominal || inItem.nominal_pembayaran || inItem.jumlah_pembayaran)) {
        const v = inItem.nominal || inItem.nominal_pembayaran || inItem.jumlah_pembayaran
        const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.'))
        if (!isNaN(n)) return Math.round((n + Number.EPSILON) * 100) / 100
      }

      // Fallback: distribute parent nominal proportionally by kuantum
      const parentNominalRaw = props.item?.nominal || props.item?.harga_sebelum_pajak || props.item?.nominal_pembayaran
      const parentJumlahRaw = props.item?.jumlah_pembayaran || props.item?.jumlah || props.item?.kuantum
      if (parentNominalRaw && parentJumlahRaw && qty > 0) {
        const parentNominal = parseFloat(String(parentNominalRaw).replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.'))
        const parentJumlah = parseFloat(String(parentJumlahRaw).replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.'))
        if (!isNaN(parentNominal) && !isNaN(parentJumlah) && parentJumlah > 0) {
          const proportional = parentNominal * (qty / parentJumlah)
          return Math.round((proportional + Number.EPSILON) * 100) / 100
        }
      }

      return null
    } catch (e) {
      return null
    }
  }

  const formatNominalForIn = (inItem) => {
    const val = computeNominalForIn(inItem)
    return val === null || val === undefined ? '-' : formatCurrency(val)
  }

  const totalNominalPaid = computed(() => {
    try {
      return parsedInData.value.reduce((acc, inItem) => {
        const v = computeNominalForIn(inItem)
        return acc + (v ? Number(v) : 0)
      }, 0)
    } catch (e) {
      return 0
    }
  })

  const parseKuantumParts = (kuantumStr) => {
    if (!kuantumStr) return { value: 0, unit: null }
    const s = kuantumStr.toString().trim()
    // Try to match number and unit like '1.410 KG' or '490 KG' or '1500'
    const m = s.match(/([\d.,]+)\s*(KG|LITER|PCS)?/i)
    if (!m) return { value: 0, unit: null }
    let num = m[1].replace(/\./g, '').replace(',', '.')
    const value = parseFloat(num) || 0
    const unit = m[2] ? m[2].toUpperCase() : null
    return { value, unit }
  }

  const totalKuantumByUnit = computed(() => {
    const totals = {}
    try {
      parsedInData.value.forEach((inItem) => {
        const raw = inItem?.kuantum || inItem?.kuantum_in || inItem?.jumlah || inItem?.jumlah_pembayaran || inItem?.kuantumIn || ''
        const parts = parseKuantumParts(raw)
        const unit = parts.unit || 'UNIT'
        totals[unit] = (totals[unit] || 0) + (parts.value || 0)
      })
    } catch (e) {
      // ignore
    }
    return totals
  })

  const totalKuantumDisplay = computed(() => {
    const units = Object.keys(totalKuantumByUnit.value)
    if (units.length === 0) return '-'
    const parts = units.map((u) => {
      const v = totalKuantumByUnit.value[u]
      if (!v) return null
      // format number with thousand separators, no decimals
      const fmt = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(v)
      return `${fmt} ${u === 'UNIT' ? '' : u}`.trim()
    }).filter(Boolean)
    return parts.join(' + ')
  })

  const formatKuantum = (value) => {
    if (!value || value === 'N/A') {
      return value // Jika tidak ada nilai atau 'N/A', kembalikan apa adanya
    }

    const stringValue = String(value)
    const parts = stringValue.split(' ') // Memisahkan angka dan satuan, misal: "600000 LITER" -> ["600000", "LITER"]

    const numberPart = parts[0]
    const unitPart = parts.slice(1).join(' ') // Cek apakah bagian pertama adalah angka

    if (isNaN(numberPart)) {
      return value // Jika bukan angka, kembalikan nilai asli
    } // Format bagian angka dengan titik pemisah ribuan

    const formattedNumber = numberPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.') // Gabungkan kembali dengan satuannya (jika ada)

    return unitPart ? `${formattedNumber} ${unitPart}` : formattedNumber
  }

    // ✅ Perbaiki function untuk menerima parameter item
    const handleCopy = async (item) => {
      try {
        // Ambil data IN terbaru (data terakhir dari parsed in_data)
        const latestInData = parsedInData.value.length > 0 
          ? parsedInData.value[parsedInData.value.length - 1] 
          : null

        // Format: "Jenis Pengadaan, No Preorder, No IN = Kuantum Satuan"
        let textToCopy = ''
        
        if (latestInData) {
          const jenisPengadaan = jenisPengadaanFormatted.value
          const noPreorder = item.no_preorder || item.noPreorder || '-'
          const noIn = latestInData.no_in || latestInData.noIn || '-'
          const kuantumIn = formatKuantum(
            latestInData.kuantum || 
            latestInData.kuantum_in || 
            latestInData.jumlah || 
            latestInData.jumlah_pembayaran || 
            '-'
          )
          
          textToCopy = `${jenisPengadaan}, ${noPreorder}, ${noIn} = ${kuantumIn}`
        } else {
          // Jika tidak ada data IN, tampilkan format alternatif
          const jenisPengadaan = jenisPengadaanFormatted.value
          const noPreorder = item.no_preorder || item.noPreorder || '-'
          textToCopy = `${jenisPengadaan}, ${noPreorder}, - = Belum ada data IN`
        }

        // Copy ke clipboard
        await navigator.clipboard.writeText(textToCopy)

        // Tampilkan notifikasi sukses
        Swal.fire({
          title: 'Berhasil!',
          text: 'Data berhasil disalin ke clipboard',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          timerProgressBar: true,
        })
      } catch (error) {
        console.error('Error copying:', error)
        Swal.fire({
          title: 'Error!',
          text: 'Gagal menyalin data',
          icon: 'error',
          confirmButtonColor: '#d33',
        })
      }
    }

// Ambil kuantum induk dari kolom Kuantum (bukan SPP)
const kuantumInduk = computed(() => {
  // Gunakan kolom kuantum dari item induk
  const kuantumStr = props.item.kuantum || props.item.jumlah || ""
  const parts = parseKuantumParts(kuantumStr)
  return parts.value || 0
})

// Unit satuan dari kuantum induk
const satuanPengadaan = computed(() => {
  const kuantumStr = props.item.kuantum || props.item.jumlah || ""
  const parts = parseKuantumParts(kuantumStr)
  return parts.unit || 'UNIT'
})

// Total kuantum IN dari semua data IN (berdasarkan unit yang sama)
const totalKuantumIN = computed(() => {
  const unit = satuanPengadaan.value
  return totalKuantumByUnit.value[unit] || 0
})

// Belum IN = Kuantum Induk - Total Kuantum Data IN
const belumIN = computed(() => {
  const sisa = kuantumInduk.value - totalKuantumIN.value
  return sisa > 0 ? sisa : 0
})

// Format Belum IN dengan unit dan pemisah ribuan
const belumINDisplay = computed(() => {
  const nilai = belumIN.value
  if (nilai === 0) return '0'
  const fmt = new Intl.NumberFormat('id-ID', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 3 
  }).format(nilai)
  const unit = satuanPengadaan.value
  return `${fmt} ${unit === 'UNIT' ? '' : unit}`.trim()
})

// Nominal total yang harus dibayar (dari item induk)
const totalNominalHarusDibayar = computed(() => {
  const nominal = props.item.nominal || 
                  props.item.nominal_pembayaran || 
                  props.item.jumlah_pembayaran ||
                  props.item.harga_sebelum_pajak
  return nominal ? Number(nominal) : 0
})

// Nominal belum pembayaran
const nominalBelumPembayaran = computed(() => {
  const sisa = totalNominalHarusDibayar.value - totalNominalPaid.value
  return sisa > 0 ? sisa : 0
})
</script>

<template>
  <tr
    class="border-b border-[#E4E7EC] cursor-pointer transition-all duration-200 ease-in-out hover:bg-gray-50"
  >
    <!-- No Preorder -->
    <td class="px-2 lg:px-3 py-2 lg:py-3 text-center">
      <div class="flex items-center justify-center gap-2">
        <div
          class="truncate text-xs lg:text-sm"
          :title="item.no_preorder || item.noPreorder || '-'"
        >
          {{ item.no_preorder || item.noPreorder || '-' }}
        </div>

        <!-- Badge showing count of IN items if available (moved to No Preorder column) -->
        <div v-if="parsedInData.length > 0" class="ml-2 hidden lg:block">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            IN {{ parsedInData.length }}
          </span>
        </div>

        <!-- Toggle details button for desktop (moved to No Preorder column) -->
        <button @click.stop="$emit('toggle-in-data', item.id)" class="text-gray-400 hover:text-gray-600 p-1 rounded" title="Toggle IN Data">
          <svg class="w-4 h-4 transform" :class="{ 'rotate-180': isExpanded }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </td>
    <!-- Perusahaan -->
    <td class="px-1 lg:px-2 py-2 lg:py-3 text-center">
      <div class="truncate text-xs lg:text-sm" :title="perusahaanFormatted">
        {{ perusahaanFormatted }}
      </div>
    </td>
    <!-- Supplier -->
    <td class="px-1 lg:px-2 py-2 lg:py-3 text-center">
      <div class="truncate text-xs lg:text-sm" :title="supplierFormatted">
        {{ supplierFormatted }}
      </div>
    </td>
    <!-- Admin/User -->
    <td class="px-1 lg:px-2 py-2 lg:py-3 text-center">
      <div class="truncate text-xs lg:text-sm" :title="userFormatted">
        {{ userFormatted }}
      </div>
    </td>
    <!-- Jenis Pengadaan -->
    <td class="px-1 lg:px-2 py-2 lg:py-3 text-center">
      <div class="truncate text-xs lg:text-sm" :title="jenisPengadaanFormatted">
        {{ jenisPengadaanFormatted }}
      </div>
    </td>
    <!-- Kuantum -->
    <td class="px-1 lg:px-2 py-2 lg:py-3 text-center">
      <div
        class="truncate text-xs lg:text-sm"
        :title="formatKuantum(item.kuantum || '-')"
      >
        {{ formatKuantum(item.kuantum || '-') }}
      </div>
    </td>
    <!-- SPP -->
    <td class="px-1 lg:px-2 py-2 lg:py-3 text-center">
      <div
        class="truncate text-xs lg:text-sm"
        :title="formatKuantum(pengadaanStore.pengadaanDetails[item.id]?.spp_formatted ?? item.spp_formatted ?? pengadaanStore.pengadaanDetails[item.id]?.spp ?? item.spp ?? '-')"
      >
        {{ formatKuantum(pengadaanStore.pengadaanDetails[item.id]?.spp_formatted ?? item.spp_formatted ?? pengadaanStore.pengadaanDetails[item.id]?.spp ?? item.spp ?? '-') }}
      </div>
    </td>
    <!-- Tanggal -->
    <td class="px-1 lg:px-2 py-2 lg:py-3 text-center">
      <div
        class="truncate text-xs lg:text-sm"
        :title="formatDate(item.tanggal_pengadaan || item.tanggal)"
      >
        {{ formatDate(item.tanggal_pengadaan || item.tanggal) }}
      </div>
    </td>
    <!-- Action Buttons -->
    <td class="px-1 lg:px-2 py-2 lg:py-3 text-center">
      <div class="flex space-x-1 justify-center items-center">
        <!-- Print Button -->
        <button
          @click.stop="openPrintPreview"
          class="cursor-pointer text-[#2B79EF] hover:text-white transition-all duration-200 p-1.5 rounded-full hover:bg-[#2B79EF] group"
          title="Cetak Dokumen"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="white"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            width="18"
            height="18"
            class="group-hover:fill-white transition-all"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6.75 3.75A2.25 2.25 0 0 0 4.5 6v3.75m15 0V6a2.25 2.25 0 0 0-2.25-2.25h-9m11.25 6V18a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 18V9.75m15 0H4.5m3 6h9m-6 3h3"
            />
          </svg>
        </button>

        <!-- Copy -->
         <button
                  @click.stop="handleCopy(item)"
                  class="p-1.5 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200"
                  title="Salin Data"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="h-3 w-3"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75"
                    />
                  </svg>
                </button>

        <!-- Print Latest Button -->
        <button
          @click.stop="openPrintLatest"
          class="cursor-pointer text-[#155724] hover:text-white transition-all duration-200 p-1.5 rounded-full hover:bg-[#155724] group"
          title="Cetak Dokumen Terbaru"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="18" height="18" class="group-hover:fill-white transition-all">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        <!-- Edit Button -->
        <RouterLink :to="`/superadmin/riwayat-edit/${item.id}`">
          <button
            @click.stop
            class="cursor-pointer text-[#9BA1AA] hover:text-white transition-all duration-200 p-1.5 rounded-full hover:bg-[#6B7280] group"
            title="Edit Data"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="white"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              width="18"
              height="18"
              class="group-hover:fill-white transition-all"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.862 3.487a2.25 2.25 0 1 1 3.182 3.182L7.5 19.212l-4 1 1-4 13.362-13.725z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19.5 6.75l-1.086-1.086a2.25 2.25 0 0 0-3.182 0l-9.193 9.193a.75.75 0 0 0-.22.53v2.25a.75.75 0 0 0 .75.75h2.25a.75.75 0 0 0 .53-.22l9.193-9.193a2.25 2.25 0 0 0 0-3.182z"
              />
            </svg>
          </button>
        </RouterLink>

        <!-- Delete Button -->
        <button
          @click.stop="handleDelete"
          class="cursor-pointer text-[#F44336] hover:text-white transition-all duration-200 p-1.5 rounded-full hover:bg-[#F44336] group"
          title="Hapus Data"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="white"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            width="18"
            height="18"
            class="group-hover:fill-white transition-all"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 7.5V19.5A2.25 2.25 0 0 0 8.25 21.75h7.5A2.25 2.25 0 0 0 18 19.5V7.5m-9 0V6.75A2.25 2.25 0 0 1 11.25 4.5h1.5A2.25 2.25 0 0 1 15 6.75V7.5m-9 0h12"
            />
          </svg>
        </button>
      </div>
    </td>
  </tr>
  <!-- Details row for IN Data (desktop) -->
  <tr v-if="isExpanded">
    <td colspan="9" class="bg-gray-50 border-b border-gray-200">
      <div class="p-3">
        <div v-if="parsedInData.length > 0" class="space-y-3">
          <h4 class="font-medium text-gray-700 mb-2">Detail IN Data</h4>
          <div class="overflow-x-auto bg-white rounded-lg border border-gray-200">
            <table class="min-w-full text-sm">
              <thead>
                <tr class="bg-gray-50 text-left">
                  <th class="px-3 py-2">No</th>
                  <th class="px-3 py-2">No IN</th>
                  <th class="px-3 py-2">Tanggal</th>
                  <th class="px-3 py-2">Kuantum Data IN</th>
                  <th class="px-3 py-2 text-right">Nominal pembayaran</th>
                </tr>
              </thead>
              
              <tbody>
                <tr v-for="(inItem, idx) in parsedInData" :key="idx" class="border-t">
                  <!-- Kolom No -->
                  <td class="px-3 py-2 align-top">{{ idx + 1 }}</td>

                  <!-- Kolom No IN -->
                  <td class="px-3 py-2 align-top">
                    {{ inItem.no_in ?? inItem.noIn ?? '-' }}
                  </td>

                  <!-- Kolom Tanggal -->
                  <td class="px-3 py-2 align-top">
                    {{ formatDate(inItem.tanggal ?? inItem.tanggal_in ?? inItem.date) }}
                  </td>

                  <!-- Kolom Kuantum -->
                  <td class="px-3 py-2 align-top">
                    {{ formatKuantum(
                        inItem.kuantum ??
                        inItem.kuantum_in ??
                        inItem.jumlah ??
                        inItem.jumlah_pembayaran ??
                        null
                      ) }}
                  </td>

                  <!-- Kolom Nominal -->
                  <td class="px-3 py-2 align-top text-right">
                    {{ formatNominalForIn(inItem) }}
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="text-center text-gray-500 py-3">Tidak ada data IN</div>
      </div>
      <!-- Show Informasi Pembayaran & Kuantum if available from server-cached detail or props -->
      <div v-if="pengadaanStore.pengadaanDetails[item.id] || item.harga_sebelum_pajak || item.dpp || item.ppn_total || item.pph_total || item.nominal" class="p-3 border-t bg-white mt-3">
        <h5 class="font-medium mb-2">Informasi Pembayaran & Kuantum</h5>
          <div class="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span class="text-gray-500">Total Nominal Pembayaran:</span>
            <div class="font-medium">{{ formatCurrency(totalNominalPaid) }}</div>
          </div>
          <div>
            <span class="text-gray-500">Total Kuantum Data IN:</span>
            <div class="font-medium">{{ totalKuantumDisplay }}</div>
          </div>
          <div>
            <span class="text-gray-500">Nominal Belum Pembayaran:</span>
            <div class="font-medium">{{ formatCurrency(nominalBelumPembayaran) }}</div>
          </div>
          <div>
            <span class="text-gray-500">Belum IN:</span>
            <div class="font-medium text-red-600">{{ belumINDisplay }}</div>
          </div>
        </div>
      </div>
    </td>
  </tr>
</template>

<style scoped>
  tr:hover {
    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.4);
  }
</style>
