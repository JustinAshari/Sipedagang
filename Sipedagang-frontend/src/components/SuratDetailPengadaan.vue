<script setup>
  import { computed } from 'vue'
  import DataIn from '@/components/SuratDataInElement.vue'

  const props = defineProps({
    item: {
      type: Object,
      required: true,
    },
  })

  const dataInList = computed(() => {
    if (!props.item || !props.item.in_data) return []
    if (Array.isArray(props.item.in_data)) return props.item.in_data
    try {
      return JSON.parse(props.item.in_data)
    } catch {
      return []
    }
  })

  const jumlah = computed(() =>
    dataInList.value.reduce((acc, item) => {
      const angka = parseInt(
        (item.kuantum_in || '0').toString().replace(/\D/g, ''),
      )
      return acc + (isNaN(angka) ? 0 : angka)
    }, 0),
  )

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

  const tanggalSurat = computed(() => {
    if (!props.item?.tanggal_pengajuan) return ''
    const [tahun, bulan, tanggal] = props.item.tanggal_pengajuan.split('-')
    return `${parseInt(tanggal)} ${bulanIndo[parseInt(bulan)]} ${tahun}`
  })

  const tanggalFormatSurat = computed(() => {
    if (!props.item?.tanggal_pengadaan) return ''
    const [tahun, bulan, tanggal] = props.item.tanggal_pengadaan.split('-')
    return `Tanggal ${parseInt(tanggal)} Bulan ${bulanIndo[parseInt(bulan)]} Tahun ${tahun}`
  })

  const jenisPengadaanCapital = computed(() => {
    const str = props.item.jenis_pengadaan_barang || ''
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  })

  // Fungsi format angka dengan titik ribuan
  function formatAngka(angka) {
    if (!angka) return '0'
    return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  function splitAngkaSatuan(val) {
    const str = (val || '').toString()
    const angka = str.replace(/[^\d]/g, '')
    const satuan = str.replace(/[\d\s.]/g, '')
    return {
      angka: angka ? formatAngka(angka) : '0',
      satuan: satuan ? ' ' + satuan : '',
    }
  }
</script>

<template>
  <section class="flex justify-center w-full">
    <!-- SURATE -->
    <div
      v-if="item"
      class="w-[210mm] font-arial text-black text-[13.5px] px-7 pl-12 pt-1"
    >
      <!-- Header -->
      <div class="grid grid-cols-2 gap-y-1 gap-x-17">
        <div class="col-start-2">Surakarta, {{ tanggalSurat }}</div>
        <div class="col-span-2">
          <div class="grid grid-cols-2 w-[30%]">
            <div>No</div>
            <div>:</div>
            <div>Hal</div>
            <div class="whitespace-nowrap">
              <div class="flex flex-col gap-y-1">
                <span>: Permohonan Pembayaran</span>
                <span class="ml-2"
                  >Pengadaan DN {{ jenisPengadaanCapital }}</span
                >
              </div>
            </div>
          </div>
        </div>
        <div class="col-start-2 flex flex-col gap-y-1">
          <span>Kepada</span>
          <span>Yth. Pemimpin / Wakil Pemimpin</span>
          <span>Perum BULOG Kantor Cabang Surakarta</span>
          <span>Jl. LU. Adisucipto No. 17 Surakarta</span>
        </div>
      </div>

      <!-- Isi Surat -->
      <div class="mt-1 flex flex-col text-justify gap-y-2">
        <div>Dengan Hormat,</div>
        <div>
          Menunjuk kontrak Purchashing Order (PO) No
          {{ item.no_preorder }} {{ tanggalFormatSurat }}
        </div>
        <div
          class="grid grid-flow-col grid-rows-3 gap-y-2 gap-x-2 w-[40%] text-left whitespace-nowrap"
        >
          <!-- KANAN -->
          <div>Kuantum</div>
          <div>Jumlah diajukan untuk pembayaran</div>
          <div>Telah di-SPP-kan</div>

          <!-- KIRI -->
          <div class="lowercase">
            : <span>{{ splitAngkaSatuan(item.kuantum).angka }}</span
            >{{ splitAngkaSatuan(item.kuantum).satuan }}
          </div>
          <div class="lowercase">
            : <span>{{ splitAngkaSatuan(item.jumlah_pembayaran).angka }}</span
            >{{ splitAngkaSatuan(item.jumlah_pembayaran).satuan }}
          </div>
          <div class="lowercase">
            : <span>{{ splitAngkaSatuan(item.spp).angka }}</span
            >{{ splitAngkaSatuan(item.spp).satuan }}
          </div>
        </div>
        <div>
          Dengan ini kami mengajukan permohonan pembayaran pengadaan
          {{ jenisPengadaanCapital }}
          sesuai IN :
        </div>

        <!-- DATA IN -->
        <div class="flex flex-col">
          <DataIn
            v-for="(datain, index) in dataInList"
            :key="index"
            :datain="datain"
          />
          <div class="ml-[294.9px] mt-2">
            Jumlah : {{ formatAngka(jumlah) }}
            {{
              (() => {
                const first = dataInList[0]?.kuantum_in || ''
                const match = first.match(/[a-zA-Z]+$/)
                return match ? ' ' + match[0].toLowerCase() : ''
              })()
            }}
          </div>
        </div>

        <!-- TERLAMPIR -->
        <div>Terlampir :</div>
        <div class="grid grid-cols-2 gap-y-1 w-[40%]">
          <div>PO</div>
          <div>: 1 Set</div>
          <div>Dokumen IN</div>
          <div>: 1 Set</div>
          <div>Sertifikat LHPK</div>
          <div>: 1 Set</div>
        </div>

        <!-- PENUTUP -->
        <div>
          Demikian atas terkabulnya permohonan tersebut diucapkan terima kasih.
        </div>

        <!-- BOTTOM -->
        <div class="grid grid-cols-2 gap-x-29 mt-3 font-calibri">
          <div class="outline flex flex-col gap-y-3 pt-2 pl-4 pb-19">
            <div class="text-center underline font-bold tracking-tighter">
              DISPOSISI :
            </div>
            <div class="italic">AM Administrasi dan Keuangan</div>

            <div class="flex">
              <div class="px-5">-</div>
              <div>Dibayarkan Sesuai ketentuan</div>
            </div>
            <div class="flex">
              <div class="px-5">-</div>
              <div>Tertib Administrasi</div>
            </div>
          </div>
          <div class="flex flex-col gap-y-25 items-center mr-12">
            <div>Pemohon</div>
            <div class="text-center">
              <div>{{ item.nama_suplier }}</div>
              <div>{{ item.nama_perusahaan }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
