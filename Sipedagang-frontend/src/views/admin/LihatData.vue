<script setup>
  import { ref, computed, onMounted, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import LihatDataComponent from '@/components/LihatDataComponent.vue'
  import { usePengadaanStore } from '@/stores/pengadaanStore'
  import Swal from 'sweetalert2'

  const router = useRouter()
  const pengadaanStore = usePengadaanStore()

  // ✅ State untuk backend pagination (hapus selectedMonth)
  const currentPage = ref(1)
  const itemsPerPage = ref(10)
  const pageInput = ref(1)
  const searchQuery = ref('')
  // ✅ State untuk rentang tanggal
  const tanggalAwal = ref('')
  const tanggalAkhir = ref('')

  // ✅ Fetch data dengan backend pagination
  onMounted(async () => {
    await fetchData()
  })

  // ✅ Function untuk fetch data dengan parameter (hapus selectedMonth)
  const fetchData = async () => {
    try {
      await pengadaanStore.fetchPengadaan(
        currentPage.value,
        itemsPerPage.value,
        searchQuery.value,
        tanggalAwal.value,
        tanggalAkhir.value,
      )
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  // ✅ Data langsung dari store (sudah ter-paginasi dari backend)
  const tableData = computed(() => pengadaanStore.pengadaanList || [])
  const paginatedData = computed(() => {
    // ✅ Transform data untuk ditampilkan
    return tableData.value.map((item) => ({
      id: item.id,
      jenisPengadaan: item.jenis_pengadaan_barang,
      noProorder: item.no_preorder,
      supplier: item.nama_suplier,
      perusahaan: item.nama_perusahaan,
      kuantum: item.kuantum,
      tanggal: item.tanggal_pengadaan,
      rawData: item,
    }))
  })

  // ✅ Pagination info dari store
  const totalPages = computed(() => pengadaanStore.totalPages)
  const totalItems = computed(() => pengadaanStore.totalItems)

  // ✅ Watch untuk fetch data ketika ada perubahan filter (hapus selectedMonth)
  watch([searchQuery, tanggalAwal, tanggalAkhir], () => {
    currentPage.value = 1
    pageInput.value = 1
    fetchData()
  })

  // ✅ Watch untuk fetch data ketika page berubah
  watch(currentPage, () => {
    pageInput.value = currentPage.value
    fetchData()
  })

  // ✅ Handlers
  const handlePageInput = () => {
    let page = pageInput.value
    if (page < 1) page = 1
    if (page > totalPages.value) page = totalPages.value
    currentPage.value = page
  }

  const handlePageChange = (page) => {
    currentPage.value = page
  }

  const handlePreview = (item) => {
    pengadaanStore.currentPengadaan = item.rawData
    router.push('/admin/previewpermohonan')
  }

  const handlePrint = (item) => {
    // Print logic here
  }

  const handleEdit = (item) => {
    router.push(`/admin/form-edit/${item.id}`)
  }

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: 'Hapus Data?',
      text: 'Data yang dihapus tidak dapat dikembalikan!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
    })

    if (result.isConfirmed) {
      try {
        await pengadaanStore.deletePengadaan(item.id)

        Swal.fire({
          title: 'Berhasil!',
          text: 'Data berhasil dihapus',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        })
      } catch (error) {
        Swal.fire({
          title: 'Error!',
          text: 'Gagal menghapus data',
          icon: 'error',
        })
      }
    }
  }
</script>

<template>
  <LihatDataComponent
    :tableData="tableData"
    :filteredData="paginatedData"
    :paginatedData="paginatedData"
    :searchQuery="searchQuery"
    :tanggalAwal="tanggalAwal"
    :tanggalAkhir="tanggalAkhir"
    :currentPage="currentPage"
    :itemsPerPage="itemsPerPage"
    :pageInput="pageInput"
    :getTotalPages="totalPages"
    :totalItems="totalItems"
    :isExtraSmallScreen="false"
    :userType="'admin'"
    @update:searchQuery="searchQuery = $event"
    @update:tanggalAwal="tanggalAwal = $event"
    @update:tanggalAkhir="tanggalAkhir = $event"
    @update:currentPage="handlePageChange"
    @update:pageInput="pageInput = $event"
    @page-input-submit="handlePageInput"
    @back="router.push('/admin/dashboard')"
    @preview="handlePreview"
    @print="handlePrint"
    @edit="handleEdit"
    @delete="handleDelete"
  />
</template>
