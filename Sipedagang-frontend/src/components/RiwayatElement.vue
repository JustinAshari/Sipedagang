<script setup>
  import { RouterLink, useRouter } from 'vue-router'
  import { usePengadaanStore } from '@/stores/pengadaanStore'
  import { computed } from 'vue'
  import Swal from 'sweetalert2'

  const props = defineProps({
    item: {
      type: Object,
      required: true,
    },
  })

  const pengadaanStore = usePengadaanStore()

  const openPrintPreview = () => {
    window.open(`/surat-preview/${props.item.id}`, '_blank')
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
</script>

<template>
  <tr
    class="border-b border-[#E4E7EC] cursor-pointer transition-all duration-200 ease-in-out hover:bg-gray-50"
  >
    <!-- No Preorder -->
    <td class="px-2 lg:px-3 py-2 lg:py-3 text-center">
      <div
        class="truncate text-xs lg:text-sm"
        :title="item.no_preorder || item.noPreorder || '-'"
      >
        {{ item.no_preorder || item.noPreorder || '-' }}
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
          @click="openPrintPreview"
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

        <!-- Edit Button -->
        <RouterLink :to="`/superadmin/riwayat-edit/${item.id}`">
          <button
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
          @click="handleDelete"
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
</template>

<style scoped>
  tr:hover {
    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.4);
  }
</style>
