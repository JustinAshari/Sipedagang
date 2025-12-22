<script setup>
  import { computed } from 'vue'
  import parseInData from '@/utils/parseInData'

  const props = defineProps({
    item: {
      type: Object,
      required: true,
    },
  })

  const bulanIndo = [
    '',
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

  const tanggalFormatSurat = computed(() => {
    if (!props.item?.tanggal_pengadaan) return ''
    const [tahun, bulan, tanggal] = props.item.tanggal_pengadaan.split('-')
    return `Tanggal ${parseInt(tanggal)} Bulan ${bulanIndo[parseInt(bulan)]} Tahun ${tahun}`
  })

  const tanggalSurat = computed(() => {
    if (!props.item?.tanggal_pengajuan) return ''
    const [tahun, bulan, tanggal] = props.item.tanggal_pengajuan.split('-')
    return `${parseInt(tanggal)} ${bulanIndo[parseInt(bulan)]} ${tahun}`
  })

  const tahunPengadaan = computed(() => {
    if (!props.item?.tanggal_pengadaan) return new Date().getFullYear()
    return new Date(props.item.tanggal_pengadaan).getFullYear()
  })

  const jenisPengadaanCapital = computed(() => {
    const str = props.item.jenis_pengadaan_barang || ''
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
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

  const dataInEntries = computed(() => {
    if (props.item?.parsed_in_data && Array.isArray(props.item.parsed_in_data)) {
      return props.item.parsed_in_data
    }
    return parseInData(props.item?.in_data)
  })

  const parseKuantumValue = (value) => {
    if (!value) return { jumlah: 0, satuan: '' }
    const match = value.toString().trim().match(/([\d.,]+)\s*([a-zA-Z]+)?$/)
    if (!match) return { jumlah: 0, satuan: '' }
    const jumlah = parseFloat(match[1].replace(/\./g, '').replace(',', '.')) || 0
    const satuan = match[2] ? match[2].toUpperCase() : ''
    return { jumlah, satuan }
  }

  const totalInDisplay = computed(() => {
    let total = 0
    let satuan = ''
    dataInEntries.value.forEach((entry) => {
      const raw =
        entry?.kuantum || entry?.kuantum_in || entry?.jumlah || entry?.jumlah_pembayaran
      const { jumlah, satuan: unit } = parseKuantumValue(raw)
      total += jumlah
      if (!satuan && unit) satuan = unit
    })

    if (!total) return '0'
    const formatted = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    }).format(total)

    return satuan ? `${formatted} ${satuan.toLowerCase()}` : formatted
  })

  const jenisPengadaanUpper = computed(() => {
    return (props.item?.jenis_pengadaan_barang || '').toUpperCase()
  })
</script>

<template>
  <section class="flex justify-center w-full">
    <!-- SURATE -->
    <div class="w-[210mm] font-arial text-black px-7 pl-12 pt-1">
      <!-- Header -->
      <div class="text-center font-times">
        <div class="m-0 font-bold uppercase leading-none text-[18px]">
          SURAT PERMOHONAN PEMBAYARAN
        </div>
        <div class="m-0 font-bold uppercase text-[18px]">
          PENGADAAN {{ item.jenis_pengadaan_barang }} DALAM NEGERI TAHUN
          {{ tahunPengadaan }}
        </div>
      </div>

      <!-- KPD -->
      <div class="mt-14 font-arial text-[13.5px]">
        <div>Kepada Yth.</div>
        <div class="flex flex-col font-bold">
          Pemimpin/Wakil Pemimpin
          <span>Perum BULOG Kantor Cabang Surakarta</span>
        </div>
        <div>Di Tempat</div>
      </div>

      <!-- Isi Surat -->
      <div class="text-justify font-arial text-[13.5px]">
        <!-- 1 -->
        <div class="mt-14">
          Bersama ini, kami {{ item.nama_perusahaan }}, menyampaikan permohonan
          pembayaran {{ jenisPengadaanCapital }} 
          <span class="font-bold">
            Pengadaan Dalam Negeri Tahun {{ tahunPengadaan }}</span
          >
           Sesuai PO No. {{ item.no_preorder }} a.n.
          {{ item.atasnama_rekening }}, {{ tanggalFormatSurat }} sebesar
          <span class="lowercase">{{ formatKuantum(item.kuantum) }}</span> dengan
          pengajuan penagihan pembayaran sebanyak
          <span class="lowercase">{{ totalInDisplay }}</span> dengan bukti dokumen
          terlampir.
        </div>

        <!-- 2 -->
        <div class="mt-2.5">
          Mohon kiranya harga {{ jenisPengadaanUpper }} tersebut di atas dapat
          dibayar/dipindahbukukan ke rekening kami Bank {{ item.jenis_bank }},
          sebagaimana No. Rekening {{ item.no_rekening }}.
        </div>

        <!-- 3 -->
        <div class="mt-2.5">
          Demikian disampaikan. Atas perkenannya, diucapkan terima kasih.
        </div>
      </div>

      <!-- TTD -->
      <div
        class="flex flex-col mt-22 font-arial text-[13.5px] w-[37%] text-center mx-[63%]"
      >
        <div>Surakarta, {{ tanggalSurat }}</div>
        <div>
          <div>Pemohon</div>
          <div class="mt-17">{{ item.nama_suplier }}</div>
          <div>{{ item.nama_perusahaan }}</div>
        </div>
      </div>
    </div>
  </section>
</template>
