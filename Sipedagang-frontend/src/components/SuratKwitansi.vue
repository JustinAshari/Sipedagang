<script setup>
  import { computed } from 'vue'
  import { useSettingPengadaanStore } from '@/stores/settingPengadaanStore'

  const props = defineProps({
    item: {
      type: Object,
      required: true,
    },
  })

  const settingPengadaanStore = useSettingPengadaanStore()

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
    const [tahun, bulan] = props.item.tanggal_pengajuan.split('-')
    return `${bulanIndo[parseInt(bulan)]} ${tahun}`
  })

  const jenisPengadaanCapital = computed(() => {
    const str = props.item.jenis_pengadaan_barang || ''
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  })

  const tahunPengadaan = computed(() => {
    if (!props.item?.tanggal_pengadaan) return new Date().getFullYear()
    return new Date(props.item.tanggal_pengadaan).getFullYear()
  })

  const settingPengadaan = computed(() => {
    if (
      !props.item?.jenis_pengadaan_barang ||
      !settingPengadaanStore.pengaturanPengadaan.length
    ) {
      return null
    }

    return settingPengadaanStore.pengaturanPengadaan.find(
      (setting) =>
        setting.jenis_pengadaan_barang?.toLowerCase() ===
        props.item.jenis_pengadaan_barang.toLowerCase(),
    )
  })

  const hargaPerSatuan = computed(() => {
    if (settingPengadaan.value?.harga_per_satuan) {
      return parseFloat(settingPengadaan.value.harga_per_satuan)
    }
    return 0
  })

  const hargaSebelumPajak = computed(() => {
    return parseFloat(props.item?.harga_sebelum_pajak) || 0
  })

  const dpp = computed(() => {
    return parseFloat(props.item?.dpp) || 0
  })

  const ppnTotal = computed(() => {
    return parseFloat(props.item?.ppn_total) || 0
  })

  const pphTotal = computed(() => {
    return parseFloat(props.item?.pph_total) || 0
  })

  const nominal = computed(() => {
    return parseFloat(props.item?.nominal) || 0
  })

  function angkaSaja(val) {
    if (!val) return 0
    const num = (val + '').replace(/[^\d]/g, '')
    return num ? parseInt(num) : 0
  }

  function satuanSaja(val) {
    if (!val) return ''
    const match = (val + '').match(/[a-zA-Z]+$/)
    return match ? match[0] : ''
  }

  const formatRupiah = (angka) => {
    if (!angka && angka !== 0) return '0'
    return new Intl.NumberFormat('id-ID').format(angka)
  }

  // Fungsi konversi angka ke huruf (terbilang) sederhana untuk rupiah
  function terbilang(n) {
    const satuan = [
      '',
      'satu',
      'dua',
      'tiga',
      'empat',
      'lima',
      'enam',
      'tujuh',
      'delapan',
      'sembilan',
      'sepuluh',
      'sebelas',
    ]
    n = Math.floor(n)
    if (n < 12) return satuan[n]
    if (n < 20) return terbilang(n - 10) + ' belas'
    if (n < 100)
      return terbilang(Math.floor(n / 10)) + ' puluh ' + terbilang(n % 10)
    if (n < 200) return 'seratus ' + terbilang(n - 100)
    if (n < 1000)
      return terbilang(Math.floor(n / 100)) + ' ratus ' + terbilang(n % 100)
    if (n < 2000) return 'seribu ' + terbilang(n - 1000)
    if (n < 1000000)
      return terbilang(Math.floor(n / 1000)) + ' ribu ' + terbilang(n % 1000)
    if (n < 1000000000)
      return (
        terbilang(Math.floor(n / 1000000)) + ' juta ' + terbilang(n % 1000000)
      )
    if (n < 1000000000000)
      return (
        terbilang(Math.floor(n / 1000000000)) +
        ' miliar ' +
        terbilang(n % 1000000000)
      )
    if (n < 1000000000000000)
      return (
        terbilang(Math.floor(n / 1000000000000)) +
        ' triliun ' +
        terbilang(n % 1000000000000)
      )
    return ''
  }

  // computed untuk hasil terbilang nominal
  const nominalTerbilang = computed(() => {
    if (!nominal.value) return ''
    return (
      terbilang(nominal.value)
        .replace(/\s+/g, ' ')
        .replace(/^\s+|\s+$/g, '')
        .replace(/ +/g, ' ')
        .replace(/^\w/, (c) => c.toUpperCase()) + ' rupiah'
    )
  })
</script>

<template>
  <section class="flex justify-center w-full">
    <section class="w-[210mm]">
      <section
        class="w-full h-full grid grid-cols-[22%_78%] px-2 font-calibri text-sm"
      >
        <!-- KIRI -->
        <div class="border flex flex-col items-center relative h-[97%]">
          <div class="-rotate-90 absolute bottom-0 my-5.5 -translate-x-2">
            <div class="w-35">
              <img
                src="@/assets/images/bulog.png"
                alt="Logo Bulog"
                class="w-full h-full"
              />
            </div>
            <div class="font-bold tracking-tight leading-snug">
              <p>Perum BULOG</p>
              <p>Kantor Cabang Surakarta</p>
              <p>Jl. LU. Adisucipto No. 17</p>
              <p>Surakarta</p>
            </div>
          </div>
        </div>

        <!-- KANAN -->
        <div class="flex flex-col px-3">
          <div class="text-[42px] text-center -mt-3.5">KUITANSI</div>
          <div class="text-[18px] grid grid-cols-[34%_66%] mt-2">
            <div class="flex justify-between pr-1">
              <p>Telah terima dari</p>
              <p>:</p>
            </div>
            <div>Perum BULOG Kantor Cabang Surakarta</div>
            <div class="flex justify-between pr-1">
              <p>Uang sejumlah</p>
              <p>:</p>
            </div>
            <div>
              {{ nominalTerbilang }}
            </div>
            <div class="flex justify-between pr-1">
              <p>Untuk pembayaran</p>
              <p>:</p>
            </div>
            <div>
              {{ jenisPengadaanCapital }}
              {{ formatRupiah(angkaSaja(item.kuantum)) }}
              <span class="lowercase">{{ satuanSaja(item.kuantum) }}</span>
              sesuai dengan PO/{{ item.no_preorder }} Tahun {{ tahunPengadaan }}
            </div>

            <div class="col-start-2 flex flex-col">
              <div class="flex justify-between">
                <div>Kuantum</div>
                <div>
                  {{ formatRupiah(angkaSaja(item.jumlah_pembayaran)) }}
                  <span class="lowercase">{{
                    satuanSaja(item.jumlah_pembayaran)
                  }}</span>
                </div>
              </div>
              <div class="flex justify-between">
                <div>Harga</div>
                <div>Rp. {{ formatRupiah(hargaPerSatuan) }},-</div>
              </div>
              <div
                class="flex justify-between"
                v-if="ppnTotal !== 0 || pphTotal !== 0"
              >
                <div>Harga Sebelum Pajak</div>
                <div>Rp. {{ formatRupiah(hargaSebelumPajak) }},-</div>
              </div>
              <div
                class="flex justify-between"
                v-if="ppnTotal !== 0 || pphTotal !== 0"
              >
                <div>DPP</div>
                <div>Rp. {{ formatRupiah(dpp) }},-</div>
              </div>
              <div class="flex justify-between" v-if="ppnTotal !== 0">
                <div>PPN 12%</div>
                <div>Rp. {{ formatRupiah(ppnTotal) }},-</div>
              </div>
              <div class="flex justify-between" v-if="pphTotal !== 0">
                <div>PPH 22</div>
                <div>Rp. {{ formatRupiah(pphTotal) }},-</div>
              </div>
              <div class="flex justify-between font-bold">
                <div>Nominal</div>
                <div>Rp. {{ formatRupiah(nominal) }},-</div>
              </div>

              <div class="text-center text-[16px] pt-1">
                <div>
                  Surakarta, <span class="pl-6">{{ tanggalSurat }}</span>
                </div>

                <div class="mt-24">
                  <div>{{ item.nama_suplier || '-' }}</div>
                  <div>{{ item.nama_perusahaan || '-' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  </section>
</template>
