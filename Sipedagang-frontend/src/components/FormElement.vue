<script setup>
  import {
    ref,
    watch,
    onMounted,
    onBeforeUnmount,
    nextTick,
    computed,
  } from 'vue'
  import { usePengadaanStore } from '@/stores/pengadaanStore'
  import api from '@/services/authService' // Import untuk API call
  import Swal from 'sweetalert2' // ✅ Add this import

  const props = defineProps({
    isEditMode: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['form-changed'])

  // ✅ Simplified data pemohon - hanya yang diperlukan
  const namaSupplier = ref('')
  const namaPerusahaan = ref('')
  const jenisBank = ref('')
  const nomorRekening = ref('')
  const atasnamaRekening = ref('')
  const nomorPO = ref('')
  const tanggalPengadaan = ref('')
  const tanggalPengajuan = ref('') // ✅ NEW: Add tanggal_pengajuan field
  const jenisPengadaan = ref('')
  const kuantum = ref('')
  const satuanKuantum = ref('')
  const satuanJumlahPembayaran = ref('')
  const satuanJumlahSPP = ref('')
  const jumlahSPP = ref('') // ✅ ADD: Missing jumlahSPP definition

  // ✅ State untuk autocomplete perusahaan
  const searchCompany = ref('')
  const companyResults = ref([])
  const showDropdown = ref(false)
  const isSearching = ref(false)
  const selectedCompany = ref(null)
  const searchTimeout = ref(null)

  // ✅ NEW: State untuk autocomplete jenis pengadaan
  const searchJenisPengadaan = ref('')
  const jenisPengadaanResults = ref([])
  const showJenisPengadaanDropdown = ref(false)
  const isSearchingJenisPengadaan = ref(false)
  const selectedJenisPengadaan = ref(null)
  const searchJenisPengadaanTimeout = ref(null)

  const pengadaanStore = usePengadaanStore()
  const hasChanges = ref(false)
  const initialFormData = ref({})

  // ✅ DATA IN dengan satuan kosong di awal
  const dataInList = ref([{ no_in: '', tanggal: '', jumlah: '', satuan: '' }])

  // ✅ Computed property untuk Jumlah Pembayaran
  const jumlahPembayaran = computed(() => {
    const total = dataInList.value.reduce((sum, row) => {
      const jumlah = parseFloat(row.jumlah) || 0
      return sum + jumlah
    }, 0)
    return total > 0 ? total.toString() : ''
  })

  // ✅ Function untuk search perusahaan
  const searchPerusahaan = async (query) => {
    if (!query || query.trim().length < 2) {
      companyResults.value = []
      showDropdown.value = false
      return
    }

    isSearching.value = true
    try {
      const response = await api.get('/data-pemohon/by-perusahaan', {
        params: {
          nama_perusahaan: query.trim(),
        },
      })

      companyResults.value = response.data || []
      showDropdown.value = companyResults.value.length > 0
    } catch (error) {
      console.error('Error searching company:', error)
      companyResults.value = []
      showDropdown.value = false
    } finally {
      isSearching.value = false
    }
  }

  // ✅ MODIFIED: Function untuk search jenis pengadaan - RETURN FULL DATA
  const searchJenisPengadaanData = async (query = '') => {
    isSearchingJenisPengadaan.value = true
    try {
      const response = await api.get('/pengaturan-pengadaan')

      // Filter data berdasarkan query (jika ada)
      const allData = response.data?.data || response.data || []

      let filteredData = allData

      // ✅ NEW: Hanya filter jika ada query
      if (query && query.trim().length > 0) {
        filteredData = allData.filter(
          (item) =>
            item.jenis_pengadaan_barang &&
            item.jenis_pengadaan_barang
              .toLowerCase()
              .includes(query.trim().toLowerCase()),
        )
      }

      // ✅ Group by jenis_pengadaan_barang dan ambil data lengkap
      const groupedData = {}
      filteredData.forEach((item) => {
        const jenis = item.jenis_pengadaan_barang
        if (!groupedData[jenis]) {
          groupedData[jenis] = {
            jenis_pengadaan_barang: jenis,
            satuan: item.satuan || 'KG',
            pph: item.pph,
            ppn: item.ppn,
            fullData: item,
          }
        }
      })

      jenisPengadaanResults.value = Object.values(groupedData)
      showJenisPengadaanDropdown.value = jenisPengadaanResults.value.length > 0
    } catch (error) {
      console.error('Error searching jenis pengadaan:', error)
      jenisPengadaanResults.value = []
      showJenisPengadaanDropdown.value = false
    } finally {
      isSearchingJenisPengadaan.value = false
    }
  }

  // ✅ Handle input search perusahaan dengan debounce
  const handleSearchInput = (event) => {
    const query = event.target.value
    searchCompany.value = query

    // Clear previous timeout
    if (searchTimeout.value) {
      clearTimeout(searchTimeout.value)
    }

    // ✅ NEW: Auto-clear ketika input dikosongkan
    if (!query || query.trim() === '') {
      clearSelection() // Panggil fungsi yang sama seperti tombol X
      return
    }

    // Clear selection if user types something different
    if (
      selectedCompany.value &&
      query !== selectedCompany.value.nama_perusahaan
    ) {
      selectedCompany.value = null
      clearPemohonData()
    }

    // Show dropdown for feedback
    if (query.length >= 2) {
      // Debounce search
      searchTimeout.value = setTimeout(() => {
        searchPerusahaan(query)
      }, 300)
    } else {
      showDropdown.value = true // Show hint text
    }
  }

  // ✅ MODIFIED: Handle input search jenis pengadaan dengan debounce
  const handleJenisPengadaanSearchInput = (event) => {
    const query = event.target.value
    searchJenisPengadaan.value = query
    jenisPengadaan.value = query

    // Clear previous timeout
    if (searchJenisPengadaanTimeout.value) {
      clearTimeout(searchJenisPengadaanTimeout.value)
    }

    // ✅ NEW: Auto-clear ketika input dikosongkan
    if (!query || query.trim() === '') {
      clearJenisPengadaanSelection() // Panggil fungsi yang sama seperti tombol X
      return
    }

    // Clear selection if user types something different
    if (
      selectedJenisPengadaan.value &&
      query !== selectedJenisPengadaan.value.jenis_pengadaan_barang
    ) {
      selectedJenisPengadaan.value = null
    }

    // Debounce search
    searchJenisPengadaanTimeout.value = setTimeout(() => {
      searchJenisPengadaanData(query)
    }, 200)
  }

  // ✅ Handle focus perusahaan
  const handleFocus = () => {
    if (companyResults.value.length > 0 && !selectedCompany.value) {
      showDropdown.value = true
    }
  }

  // ✅ MODIFIED: Handle focus jenis pengadaan
  const handleJenisPengadaanFocus = () => {
    // ✅ NEW: Langsung tampilkan semua data ketika focus
    searchJenisPengadaanData('')

    // Jika sudah ada hasil sebelumnya, tampilkan dropdown
    if (jenisPengadaanResults.value.length > 0) {
      showJenisPengadaanDropdown.value = true
    }
  }

  // ✅ Handle blur perusahaan
  const handleBlur = () => {
    setTimeout(() => {
      showDropdown.value = false
    }, 150)
  }

  // ✅ NEW: Handle blur jenis pengadaan
  const handleJenisPengadaanBlur = () => {
    setTimeout(() => {
      showJenisPengadaanDropdown.value = false
    }, 150)
  }

  // ✅ Handle pemilihan perusahaan
  const selectCompany = (company) => {
    selectedCompany.value = company
    searchCompany.value = company.nama_perusahaan

    // ✅ Auto-fill semua field
    namaSupplier.value = company.nama_suplier || ''
    namaPerusahaan.value = company.nama_perusahaan || ''
    jenisBank.value = company.jenis_bank || ''
    nomorRekening.value = company.no_rekening || ''
    atasnamaRekening.value = company.atasnama_rekening || ''

    showDropdown.value = false
    companyResults.value = []

    // Trigger change detection
    nextTick(() => {
      checkForChanges()
    })
  }

  // ✅ MODIFIED: Handle pemilihan jenis pengadaan - UPDATE SEMUA SATUAN
  const selectJenisPengadaan = (jenisPengadaanObj) => {
    selectedJenisPengadaan.value = jenisPengadaanObj
    searchJenisPengadaan.value = jenisPengadaanObj.jenis_pengadaan_barang
    jenisPengadaan.value = jenisPengadaanObj.jenis_pengadaan_barang

    // ✅ NEW: Update semua satuan berdasarkan jenis pengadaan
    const newSatuan = jenisPengadaanObj.satuan || 'KG'
    updateAllSatuan(newSatuan)

    showJenisPengadaanDropdown.value = false
    jenisPengadaanResults.value = []

    // Trigger change detection
    nextTick(() => {
      checkForChanges()
    })
  }

  // ✅ NEW: Function untuk update semua satuan
  const updateAllSatuan = (newSatuan) => {
    console.log('Updating all satuan to:', newSatuan)

    // Update semua ref satuan
    satuanKuantum.value = newSatuan
    satuanJumlahPembayaran.value = newSatuan
    satuanJumlahSPP.value = newSatuan

    // Update satuan di semua data IN
    dataInList.value.forEach((row) => {
      row.satuan = newSatuan
    })
  }

  // ✅ Clear data pemohon
  const clearPemohonData = () => {
    namaSupplier.value = ''
    namaPerusahaan.value = ''
    jenisBank.value = ''
    nomorRekening.value = ''
    atasnamaRekening.value = ''
  }

  // ✅ MODIFIED: Clear jenis pengadaan - reset satuan ke kosong
  const clearJenisPengadaanData = () => {
    selectedJenisPengadaan.value = null
    searchJenisPengadaan.value = ''
    jenisPengadaan.value = ''

    // ✅ Reset satuan ke kosong jika tidak ada jenis pengadaan
    updateAllSatuan('')
  }

  // ✅ Clear selection perusahaan
  const clearSelection = () => {
    selectedCompany.value = null
    searchCompany.value = ''
    clearPemohonData()
    showDropdown.value = false
    companyResults.value = []

    nextTick(() => {
      checkForChanges()
    })
  }

  // ✅ NEW: Clear selection jenis pengadaan
  const clearJenisPengadaanSelection = () => {
    clearJenisPengadaanData()
    showJenisPengadaanDropdown.value = false
    jenisPengadaanResults.value = []

    nextTick(() => {
      checkForChanges()
    })
  }

  // ✅ Handle click outside untuk close dropdown
  const handleClickOutside = (event) => {
    const dropdown = event.target.closest('.company-search-container')
    const jenisPengadaanDropdown = event.target.closest(
      '.jenis-pengadaan-search-container',
    )

    if (!dropdown) {
      showDropdown.value = false
    }

    if (!jenisPengadaanDropdown) {
      showJenisPengadaanDropdown.value = false
    }
  }

  const saveInitialData = () => {
    initialFormData.value = {
      searchCompany: searchCompany.value,
      namaSupplier: namaSupplier.value,
      namaPerusahaan: namaPerusahaan.value,
      jenisBank: jenisBank.value,
      nomorRekening: nomorRekening.value,
      atasnamaRekening: atasnamaRekening.value,
      nomorPO: nomorPO.value,
      tanggalPengadaan: tanggalPengadaan.value,
      tanggalPengajuan: tanggalPengajuan.value, // ✅ NEW: Include in initial data
      jenisPengadaan: jenisPengadaan.value,
      kuantum: kuantum.value,
      satuanKuantum: satuanKuantum.value,
      jumlahPembayaran: jumlahPembayaran.value,
      satuanJumlahPembayaran: satuanJumlahPembayaran.value,
      jumlahSPP: jumlahSPP.value,
      satuanJumlahSPP: satuanJumlahSPP.value,
      dataInList: JSON.parse(JSON.stringify(dataInList.value)),
    }
    hasChanges.value = false
    emit('form-changed', false)
  }

  const checkForChanges = () => {
    const currentData = {
      searchCompany: searchCompany.value,
      namaSupplier: namaSupplier.value,
      namaPerusahaan: namaPerusahaan.value,
      jenisBank: jenisBank.value,
      nomorRekening: nomorRekening.value,
      atasnamaRekening: atasnamaRekening.value,
      nomorPO: nomorPO.value,
      tanggalPengadaan: tanggalPengadaan.value,
      tanggalPengajuan: tanggalPengajuan.value, // ✅ NEW: Include in change detection
      jenisPengadaan: jenisPengadaan.value,
      kuantum: kuantum.value,
      satuanKuantum: satuanKuantum.value,
      jumlahPembayaran: jumlahPembayaran.value,
      satuanJumlahPembayaran: satuanJumlahPembayaran.value,
      jumlahSPP: jumlahSPP.value,
      satuanJumlahSPP: satuanJumlahSPP.value,
      dataInList: JSON.parse(JSON.stringify(dataInList.value)),
    }

    const hasFormChanges =
      JSON.stringify(currentData) !== JSON.stringify(initialFormData.value)
    hasChanges.value = hasFormChanges
    emit('form-changed', hasFormChanges)
  }

  // ✅ UPDATED: Add getFormData function with tanggal_pengajuan
  const getFormData = () => {
    const formattedDataIn = dataInList.value.map((row) => ({
      no_in: row.no_in,
      tanggal_in: row.tanggal,
      kuantum_in: row.jumlah ? `${row.jumlah} ${row.satuan}` : '',
    }))

    const kuantumFormatted = kuantum.value
      ? `${kuantum.value} ${satuanKuantum.value}`
      : ''

    const sppFormatted =
      jumlahSPP.value && String(jumlahSPP.value).trim() !== ''
        ? `${jumlahSPP.value} ${satuanJumlahSPP.value}`
        : ''

    const jumlahPembayaranFormatted = jumlahPembayaran.value
      ? `${jumlahPembayaran.value} ${satuanJumlahPembayaran.value}`
      : ''

    const formData = {
      // Data Pemohon
      nama_suplier: namaSupplier.value,
      nama_perusahaan: namaPerusahaan.value,
      jenis_bank: jenisBank.value,
      no_rekening: nomorRekening.value,
      atasnama_rekening: atasnamaRekening.value,

      // Detail PO
      no_preorder: nomorPO.value,
      tanggal_pengadaan: tanggalPengadaan.value,
      tanggal_pengajuan: tanggalPengajuan.value, // ✅ NEW: Add tanggal_pengajuan
      jenis_pengadaan_barang: jenisPengadaan.value,
      kuantum: kuantumFormatted,
      satuan: satuanKuantum.value,

      // Data IN
      in_data: formattedDataIn,

      // Pembayaran
      jumlah_pembayaran: jumlahPembayaranFormatted,
      spp: sppFormatted,
    }

    console.log('Generated form data:', formData)
    return formData
  }

  const validateForm = () => {
    const errors = []

    // Validasi Data Pemohon
    if (!namaSupplier.value) errors.push('Nama Supplier harus diisi')
    if (!namaPerusahaan.value) errors.push('Nama Perusahaan harus diisi')
    if (!jenisBank.value) errors.push('Jenis Bank harus diisi')
    if (!nomorRekening.value) errors.push('Nomor Rekening harus diisi')
    if (!atasnamaRekening.value) errors.push('Atas Nama Rekening harus diisi')

    // Validasi Detail PO
    if (!nomorPO.value) errors.push('Nomor PO harus diisi')
    if (!tanggalPengadaan.value) errors.push('Tanggal PO harus diisi')
    if (!tanggalPengajuan.value) errors.push('Tanggal Pengajuan harus diisi') // ✅ NEW: Add validation
    if (!jenisPengadaan.value) errors.push('Jenis Pengadaan harus diisi')
    if (!kuantum.value) errors.push('Kuantum harus diisi')

    // Validasi Data IN
    const hasValidDataIn = dataInList.value.some(
      (row) => row.no_in && row.tanggal && row.jumlah,
    )
    if (!hasValidDataIn) errors.push('Minimal satu Data IN harus diisi lengkap')

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  function clearForm() {
    // ✅ Clear search dan data pemohon
    searchCompany.value = ''
    selectedCompany.value = null
    clearPemohonData()

    // ✅ Clear jenis pengadaan
    clearJenisPengadaanData()

    nomorPO.value = ''
    tanggalPengadaan.value = ''
    tanggalPengajuan.value = '' // ✅ NEW: Clear tanggal_pengajuan
    kuantum.value = ''
    jumlahSPP.value = ''
    dataInList.value = [{ no_in: '', tanggal: '', jumlah: '', satuan: '' }]

    // Clear store messages
    if (pengadaanStore && pengadaanStore.clearMessages) {
      pengadaanStore.clearMessages()
    }

    // Clear dropdown
    companyResults.value = []
    showDropdown.value = false
    jenisPengadaanResults.value = []
    showJenisPengadaanDropdown.value = false

    return nextTick(() => {
      saveInitialData()
    })
  }

  const forceClearForm = async () => {
    console.log('Force clearing form...')

    // Clear all form values step by step
    searchCompany.value = ''
    selectedCompany.value = null
    namaSupplier.value = ''
    namaPerusahaan.value = ''
    jenisBank.value = ''
    nomorRekening.value = ''
    atasnamaRekening.value = ''
    searchJenisPengadaan.value = ''
    selectedJenisPengadaan.value = null
    jenisPengadaan.value = ''
    nomorPO.value = ''
    tanggalPengadaan.value = ''
    tanggalPengajuan.value = '' // ✅ NEW: Clear tanggal_pengajuan
    kuantum.value = ''
    jumlahSPP.value = ''
    satuanKuantum.value = ''
    satuanJumlahPembayaran.value = ''
    satuanJumlahSPP.value = ''
    dataInList.value = [{ no_in: '', tanggal: '', jumlah: '', satuan: '' }]
    companyResults.value = []
    showDropdown.value = false
    jenisPengadaanResults.value = []
    showJenisPengadaanDropdown.value = false
    isSearching.value = false
    isSearchingJenisPengadaan.value = false

    // Clear timeouts
    if (searchTimeout.value) {
      clearTimeout(searchTimeout.value)
      searchTimeout.value = null
    }

    if (searchJenisPengadaanTimeout.value) {
      clearTimeout(searchJenisPengadaanTimeout.value)
      searchJenisPengadaanTimeout.value = null
    }

    // Clear store
    if (pengadaanStore && pengadaanStore.clearMessages) {
      pengadaanStore.clearMessages()
    }

    await nextTick()
    saveInitialData()

    console.log('Force clear completed')
  }

  // ✅ UPDATED: populateForm with tanggal_pengajuan
  const populateForm = (formData) => {
    console.log('populateForm called with:', formData)

    // — Pemohon —
    searchCompany.value = formData.nama_perusahaan || ''
    selectedCompany.value = {
      nama_perusahaan: formData.nama_perusahaan,
      nama_suplier: formData.nama_suplier,
      jenis_bank: formData.jenis_bank,
      no_rekening: formData.no_rekening,
      atasnama_rekening: formData.atasnama_rekening,
    }
    namaSupplier.value = formData.nama_suplier || ''
    namaPerusahaan.value = formData.nama_perusahaan || ''
    jenisBank.value = formData.jenis_bank || ''
    nomorRekening.value = formData.no_rekening || ''
    atasnamaRekening.value = formData.atasnama_rekening || ''

    // — PO Detail —
    nomorPO.value = formData.no_preorder || ''
    tanggalPengadaan.value = formData.tanggal_pengadaan || ''
    tanggalPengajuan.value = formData.tanggal_pengajuan || '' // ✅ NEW: Populate tanggal_pengajuan
    jenisPengadaan.value = formData.jenis_pengadaan_barang || ''
    searchJenisPengadaan.value = jenisPengadaan.value

    // ✅ FIXED: Ambil satuan dari berbagai sumber dengan prioritas
    let actualSatuan = ''

    // 1. Coba ambil dari field satuan langsung
    if (formData.satuan) {
      actualSatuan = formData.satuan
    }
    // 2. Coba ambil dari kuantum (format: "123 PCS")
    else if (formData.kuantum && formData.kuantum.includes(' ')) {
      const kuantumParts = formData.kuantum.split(' ')
      actualSatuan = kuantumParts[1] || ''
    }
    // 3. Coba ambil dari jumlah_pembayaran (format: "123 PCS")
    else if (
      formData.jumlah_pembayaran &&
      formData.jumlah_pembayaran.includes(' ')
    ) {
      const pembayaranParts = formData.jumlah_pembayaran.split(' ')
      actualSatuan = pembayaranParts[1] || ''
    }
    // 4. Coba ambil dari spp (format: "123 PCS")
    else if (formData.spp && formData.spp.includes(' ')) {
      const sppParts = formData.spp.split(' ')
      actualSatuan = sppParts[1] || ''
    }
    // 5. Coba ambil dari in_data jika ada
    else if (formData.in_data) {
      try {
        let inDataArray = []
        if (typeof formData.in_data === 'string') {
          inDataArray = JSON.parse(formData.in_data)
        } else if (Array.isArray(formData.in_data)) {
          inDataArray = formData.in_data
        }

        if (inDataArray.length > 0 && inDataArray[0].kuantum_in) {
          const inParts = inDataArray[0].kuantum_in.toString().split(' ')
          actualSatuan = inParts[1] || ''
        }
      } catch (error) {
        console.warn('Could not parse in_data for satuan detection:', error)
      }
    }

    console.log('Detected actualSatuan:', actualSatuan)
    console.log('Source data:', {
      satuan: formData.satuan,
      kuantum: formData.kuantum,
      jumlah_pembayaran: formData.jumlah_pembayaran,
      spp: formData.spp,
    })

    // ✅ FIXED: Set selectedJenisPengadaan dengan satuan yang terdeteksi
    selectedJenisPengadaan.value = {
      jenis_pengadaan_barang: jenisPengadaan.value,
      satuan: actualSatuan, // ✅ Gunakan satuan yang terdeteksi dari data
      fullData: formData,
    }

    kuantum.value = formData.kuantum ? formData.kuantum.split(' ')[0] : ''

    // ✅ FIXED: Set semua satuan dengan nilai yang sama dari data
    satuanKuantum.value = actualSatuan
    satuanJumlahPembayaran.value = actualSatuan
    satuanJumlahSPP.value = actualSatuan

    console.log('Setting all satuan to:', actualSatuan)

    // — Data IN — ✅ FIXED: Handle JSON string
    try {
      let inDataArray = []

      if (formData.in_data) {
        console.log('Raw in_data:', formData.in_data, typeof formData.in_data)

        // ✅ Cek apakah in_data adalah string JSON atau sudah array
        if (typeof formData.in_data === 'string') {
          console.log('Parsing JSON string...')
          inDataArray = JSON.parse(formData.in_data)
        } else if (Array.isArray(formData.in_data)) {
          console.log('Already an array...')
          inDataArray = formData.in_data
        } else {
          console.warn('in_data format not recognized:', formData.in_data)
          inDataArray = []
        }

        console.log('Parsed inDataArray:', inDataArray)
      }

      // ✅ Mapping dengan error handling
      if (Array.isArray(inDataArray) && inDataArray.length > 0) {
        dataInList.value = inDataArray.map((item, index) => {
          console.log(`Processing item ${index}:`, item)

          // ✅ Handle kuantum_in yang mungkin berupa string dengan satuan
          let jumlah = ''
          let satuan = actualSatuan // ✅ Gunakan satuan yang sama untuk konsistensi

          if (item.kuantum_in) {
            const parts = item.kuantum_in.toString().split(' ')
            jumlah = parts[0] || ''
            // ✅ FIXED: Gunakan satuan yang terdeteksi, bukan dari parts
            // satuan tetap menggunakan actualSatuan untuk konsistensi
          }

          return {
            no_in: item.no_in?.toString() || '',
            tanggal: item.tanggal_in || '',
            jumlah: jumlah,
            satuan: satuan, // ✅ Gunakan satuan yang konsisten
          }
        })
      } else {
        console.log('No valid in_data found, using default')
        dataInList.value = [
          { no_in: '', tanggal: '', jumlah: '', satuan: actualSatuan }, // ✅ Gununakan satuan yang konsisten
        ]
      }

      console.log('Final dataInList:', dataInList.value)
    } catch (error) {
      console.error('Error parsing in_data:', error)
      console.error('Raw in_data that caused error:', formData.in_data)

      // ✅ Fallback ke default jika parsing gagal
      dataInList.value = [
        { no_in: '', tanggal: '', jumlah: '', satuan: actualSatuan }, // ✅ Gunakan satuan yang konsisten
      ]

      // ✅ Show user-friendly error
      Swal.fire({
        title: 'Peringatan!',
        text: 'Data IN tidak dapat dimuat dengan benar. Menggunakan data kosong.',
        icon: 'warning',
        timer: 3000,
        showConfirmButton: false,
        timerProgressBar: true,
        customClass: {
          popup: 'rounded-xl',
        },
      })
    }

    // — Pembayaran/SPP — ✅ FIXED: Parse tapi tetap gunakan satuan yang konsisten
    const [jp, up] = (formData.jumlah_pembayaran || '').split(' ')
    const [sppV, sppU] = (formData.spp || '').split(' ')

    // ✅ FIXED: Gunakan actualSatuan yang sudah terdeteksi untuk konsistensi
    // Jangan gunakan up/sppU karena bisa berbeda, harus konsisten
    satuanJumlahPembayaran.value = actualSatuan
    jumlahSPP.value = sppV || ''
    satuanJumlahSPP.value = actualSatuan

    // mark this as the new "initial" state
    nextTick(() => {
      saveInitialData()
      console.log('Form population completed and initial data saved')
      console.log('Final satuan values:', {
        satuanKuantum: satuanKuantum.value,
        satuanJumlahPembayaran: satuanJumlahPembayaran.value,
        satuanJumlahSPP: satuanJumlahSPP.value,
        actualSatuan: actualSatuan,
        selectedJenisPengadaan: selectedJenisPengadaan.value,
      })
    })
  }

  // ✅ ADD: Missing functions that are exposed but not defined

  const clearFormWithDelay = (delay = 1000) => {
    setTimeout(() => {
      clearForm()
    }, delay)
  }

  const submitForm = async () => {
    try {
      const validation = validateForm()
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }

      const formData = getFormData()
      const result = await pengadaanStore.createPengadaan(formData)

      if (result) {
        await nextTick()
        clearForm()
      }

      return result
    } catch (error) {
      console.error('Submit form error:', error)
      throw error
    }
  }

  const updateForm = async (id, formData) => {
    try {
      console.log('updateForm called with:', { id, formData })

      // ✅ FIXED: Jangan ambil data dari getFormData() lagi, gunakan formData yang dikirim
      const validation = validateForm()
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '))
      }

      // ✅ FIXED: Gunakan formData yang sudah dikirim dari parent
      const result = await pengadaanStore.updatePengadaan(id, formData)

      if (result) {
        // ✅ FIXED: Jangan clear form, hanya update initial data
        nextTick(() => {
          saveInitialData()
          console.log('Initial data updated after successful update')
        })
      }

      return result
    } catch (error) {
      console.error('Update form error:', error)
      throw error
    }
  }

  const addDataInRow = () => {
    const newSatuan =
      selectedJenisPengadaan.value?.satuan || satuanKuantum.value || ''
    dataInList.value.push({
      no_in: '',
      tanggal: '',
      jumlah: '',
      satuan: newSatuan,
    })
  }

  const removeDataInRow = (index) => {
    if (dataInList.value.length > 1) {
      dataInList.value.splice(index, 1)
    }
  }

  // ✅ ADD: Missing input handlers
  const handleKuantumInput = (event) => {
    const value = unformatAngka(event.target.value)
    kuantum.value = value
    event.target.value = formatAngkaRibuan(value)
    checkForChanges()
  }

  const handleSPPInput = (event) => {
    const value = unformatAngka(event.target.value)
    jumlahSPP.value = value
    event.target.value = formatAngkaRibuan(value)
    checkForChanges()
  }

  const handleDataInJumlahInput = (event, index) => {
    const value = unformatAngka(event.target.value)
    dataInList.value[index].jumlah = value
    event.target.value = formatAngkaRibuan(value)
    checkForChanges()
  }

  // ✅ ENHANCED: Keypress handler dengan limit 16 digit dan desimal 2 digit
  const handleNumericKeypress = (event) => {
    const char = String.fromCharCode(event.which || event.keyCode)
    const currentValue = event.target.value

    // Allow: backspace, delete, tab, escape, enter
    if (
      [8, 9, 27, 13, 46].indexOf(event.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (event.keyCode === 65 && event.ctrlKey === true) ||
      (event.keyCode === 67 && event.ctrlKey === true) ||
      (event.keyCode === 86 && event.ctrlKey === true) ||
      (event.keyCode === 88 && event.ctrlKey === true) ||
      // Allow: home, end, left, right, down, up
      (event.keyCode >= 35 && event.keyCode <= 40)
    ) {
      return
    }

    // ✅ NEW: Check digit limit (16 digits max)
    const cleanValue = unformatAngka(currentValue)
    const digitCount = cleanValue.replace(/[^\d]/g, '').length

    if (char >= '0' && char <= '9' && digitCount >= 16) {
      event.preventDefault()
      return
    }

    // ✅ ENHANCED: Allow angka (0-9) dan koma untuk desimal
    if ((char >= '0' && char <= '9') || char === ',') {
      // Cek jika koma sudah ada
      if (char === ',' && currentValue.includes(',')) {
        event.preventDefault()
        return
      }

      // ✅ NEW: Cek limit 2 digit setelah koma
      if (char >= '0' && char <= '9' && currentValue.includes(',')) {
        const parts = currentValue.split(',')
        if (parts[1] && parts[1].length >= 2) {
          event.preventDefault()
          return
        }
      }

      return
    }

    // Block semua karakter lain
    event.preventDefault()
  }

  // ✅ ENHANCED: Format function dengan desimal 2 digit max
  const formatAngkaRibuan = (value) => {
    if (!value && value !== 0) return ''

    // Convert to string dan handle berbagai format input
    let cleanValue = value.toString()

    // Replace koma dengan titik untuk decimal (Indonesia format)
    cleanValue = cleanValue.replace(',', '.')

    // Remove semua karakter selain angka, titik, dan minus
    cleanValue = cleanValue.replace(/[^\d.-]/g, '')

    // Handle empty atau invalid values
    if (!cleanValue || cleanValue === '-' || cleanValue === '.') return ''

    // ✅ ENHANCED: Limit to 16 digits dan 2 decimal places
    const digitsOnly = cleanValue.replace(/[^\d]/g, '')
    if (digitsOnly.length > 16) {
      const hasDecimal = cleanValue.includes('.')
      const parts = cleanValue.split('.')
      const integerPart = parts[0].replace(/[^\d]/g, '').substring(0, 16)

      if (hasDecimal && parts[1]) {
        const remainingDigits = 16 - integerPart.length
        const decimalPart = parts[1]
          .replace(/[^\d]/g, '')
          .substring(0, Math.max(0, Math.min(remainingDigits, 2))) // ✅ Max 2 decimal places
        cleanValue = decimalPart ? `${integerPart}.${decimalPart}` : integerPart
      } else {
        cleanValue = integerPart
      }
    } else if (cleanValue.includes('.')) {
      // ✅ NEW: Limit decimal places to 2 even if total digits < 16
      const parts = cleanValue.split('.')
      if (parts[1] && parts[1].length > 2) {
        cleanValue = `${parts[0]}.${parts[1].substring(0, 2)}`
      }
    }

    // Convert ke number
    const num = parseFloat(cleanValue)
    if (isNaN(num)) return ''

    // ✅ ENHANCED: Format dengan titik sebagai thousand separator dan koma sebagai decimal
    // Pastikan maksimal 2 decimal places
    const formatted = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num)

    return formatted
  }

  // ✅ ENHANCED: Unformat function yang handle desimal dengan benar
  const unformatAngka = (value) => {
    if (!value) return ''

    let cleanValue = value.toString()

    // ✅ ENHANCED: Handle Indonesia format dengan desimal
    // 1. Pisahkan bagian integer dan decimal berdasarkan koma terakhir
    const lastCommaIndex = cleanValue.lastIndexOf(',')

    if (lastCommaIndex !== -1) {
      // Ada koma (decimal separator)
      const beforeComma = cleanValue.substring(0, lastCommaIndex)
      const afterComma = cleanValue.substring(lastCommaIndex + 1)

      // Remove titik dari bagian sebelum koma (thousand separator)
      const integerPart = beforeComma.replace(/\./g, '')

      // Keep hanya angka di bagian decimal dan limit 2 digit
      const decimalPart = afterComma.replace(/[^\d]/g, '').substring(0, 2)

      cleanValue = decimalPart ? `${integerPart}.${decimalPart}` : integerPart
    } else {
      // Tidak ada koma (decimal) - remove semua titik (thousand separator)
      cleanValue = cleanValue.replace(/\./g, '')
    }

    // Remove karakter lain selain angka, titik decimal, dan minus
    cleanValue = cleanValue.replace(/[^\d.-]/g, '')

    return cleanValue
  }

  // ✅ ENHANCED: Paste handler dengan desimal support
  const handlePaste = (event, type, rowIndex = null) => {
    event.preventDefault()

    const pastedData = (event.clipboardData || window.clipboardData).getData(
      'text',
    )
    let cleanValue = unformatAngka(pastedData)

    // ✅ ENHANCED: Limit to 16 digits dan 2 decimal places
    const digitsOnly = cleanValue.replace(/[^\d]/g, '')
    if (digitsOnly.length > 16) {
      const hasDecimal = cleanValue.includes('.')
      const parts = cleanValue.split('.')
      const integerPart = parts[0].replace(/[^\d]/g, '').substring(0, 16)

      if (hasDecimal && parts[1]) {
        const remainingDigits = 16 - integerPart.length
        const decimalPart = parts[1]
          .replace(/[^\d]/g, '')
          .substring(0, Math.max(0, Math.min(remainingDigits, 2))) // ✅ Max 2 decimal places
        cleanValue = decimalPart ? `${integerPart}.${decimalPart}` : integerPart
      } else {
        cleanValue = integerPart
      }
    } else if (cleanValue.includes('.')) {
      // ✅ NEW: Limit decimal places to 2 even if total digits < 16
      const parts = cleanValue.split('.')
      if (parts[1] && parts[1].length > 2) {
        cleanValue = `${parts[0]}.${parts[1].substring(0, 2)}`
      }
    }

    if (type === 'kuantum') {
      kuantum.value = cleanValue
      event.target.value = formatAngkaRibuan(cleanValue)
    } else if (type === 'spp') {
      jumlahSPP.value = cleanValue
      event.target.value = formatAngkaRibuan(cleanValue)
    } else if (type === 'dataIn' && rowIndex !== null) {
      dataInList.value[rowIndex].jumlah = cleanValue
      event.target.value = formatAngkaRibuan(cleanValue)
    }

    checkForChanges()
  }

  // ✅ FIXED: Expose all methods including populateForm
  defineExpose({
    clearForm,
    forceClearForm,
    populateForm, // ✅ ADD: Expose populateForm method
    getFormData,
    validateForm,
    submitForm,
    updateForm,
    clearFormWithDelay,
    addDataInRow,
    removeDataInRow,
    handleKuantumInput,
    handleSPPInput,
    handleDataInJumlahInput,
    handleNumericKeypress,
    formatAngkaRibuan,
    unformatAngka,
    handlePaste,
  })
</script>

<template>
  <section
    class="flex flex-col gap-4 mt-4 sm:mt-6 overflow-y-auto w-full h-full pb-3 px-2 sm:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-scrollbar:{display:none}]"
  >
    <div class="font-bold text-lg sm:text-xl">Data Pemohon</div>
    <div class="flex flex-col gap-4 sm:gap-6">
      <div
        class="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0"
      >
        <label
          for="search-company"
          class="min-w-0 sm:min-w-45 font-medium text-sm sm:text-base"
        >
          Nama Perusahaan <span class="text-red-500">*</span>  
        </label>
        <div class="relative w-full company-search-container">
          <input
            type="text"
            id="search-company"
            placeholder="Ketik nama perusahaan untuk mencari..."
            class="border-[2.2px] border-[#D9D9D9] rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-sm sm:text-base"
            v-model="searchCompany"
            @input="handleSearchInput"
            @focus="handleFocus"
            @blur="handleBlur"
            required
          />
          <div
            v-if="!selectedCompany"
            class="absolute inset-y-0 right-7.5 flex items-center pointer-events-none"
          >
            <svg
              v-if="!isSearching"
              class="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <svg
              v-else
              class="animate-spin h-4 w-4 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 118-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <button
            v-if="selectedCompany"
            type="button"
            @click="clearSelection"
            class="absolute inset-y-0 right-7.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div
            v-if="showDropdown && companyResults.length > 0"
            class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            <div
              v-for="(company, index) in companyResults"
              :key="index"
              @mousedown="selectCompany(company)"
              class="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div class="font-medium text-sm text-gray-900">
                {{ company.nama_perusahaan }}  
              </div>
              <div class="text-xs text-gray-500 mt-1">
                {{ company.nama_suplier }} • {{ company.jenis_bank }}  
              </div>
            </div>
          </div>
          <div
            v-if="
              showDropdown &&
              companyResults.length === 0 &&
              searchCompany.length >= 2 &&
              !isSearching &&
              !selectedCompany
            "
            class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm"
          >
            Tidak ada perusahaan ditemukan untuk "{{ searchCompany }}"    
          </div>
          <div
            v-if="
              showDropdown &&
              searchCompany.length > 0 &&
              searchCompany.length < 2 &&
              !selectedCompany
            "
            class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm"
          >
            Ketik minimal 2 karakter untuk mencari...    
          </div>
        </div>
      </div>
      <template v-if="selectedCompany">
        <div
          class="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0"
        >
          <label
            for="nama-supplier"
            class="min-w-0 sm:min-w-45 font-medium text-sm sm:text-base"
          >
            Nama Supplier <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="nama-supplier"
            class="border-[2.2px] border-green-200 bg-green-50 rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-sm sm:text-base cursor-not-allowed text-green-700 font-medium"
            v-model="namaSupplier"
            readonly
            disabled
            required
          />
        </div>
        <div
          class="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0"
        >
          <label
            for="jenis-bank"
            class="min-w-0 sm:min-w-45 font-medium text-sm sm:text-base"
          >
            Jenis Bank <span class="text-red-500">*</span>    
          </label>
          <input
            type="text"
            id="jenis-bank"
            class="border-[2.2px] border-green-200 bg-green-50 rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-sm sm:text-base cursor-not-allowed text-green-700 font-medium"
            v-model="jenisBank"
            readonly
            disabled
            required
          />
        </div>
        <div
          class="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0"
        >
          <label
            for="nomor-rekening"
            class="min-w-0 sm:min-w-45 font-medium text-sm sm:text-base"
          >
            Nomor Rekening <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="nomor-rekening"
            class="border-[2.2px] border-green-200 bg-green-50 rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-sm sm:text-base cursor-not-allowed text-green-700 font-medium font-mono"
            v-model="nomorRekening"
            readonly
            disabled
            required
          />
        </div>
        <div
          class="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0"
        >
          <label
            for="atasnama-rekening"
            class="min-w-0 sm:min-w-45 font-medium text-sm sm:text-base"
          >
            Atas Nama Rekening <span class="text-red-500">*</span>      
          </label>
          <input
            type="text"
            id="atasnama-rekening"
            class="border-[2.2px] border-green-200 bg-green-50 rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-smsm:text-base cursor-not-allowed text-green-700 font-medium"
            v-model="atasnamaRekening"
            readonly
            disabled
            required
          />
        </div>
        <div
          class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700"
        >
          <div class="flex items-center gap-2">
            <svg
              class="w-4 h-4 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span class="font-medium"
              >Data pemohon berhasil diisi otomatis</span
            >
          </div>
          <div class="mt-1 text-xs">
            Data supplier, bank, dan rekening telah diambil dari database
            berdasarkan perusahaan yang dipilih.    
          </div>
        </div>
      </template>
      <div
        v-else-if="!selectedCompany && searchCompany.length === 0"
        class="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500"
      >
        <div class="flex items-center justify-center gap-2 mb-2">
          <svg
            class="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span class="font-medium">Mulai dengan mencari perusahaan</span>
        </div>
        <p>
          Ketik nama perusahaan di kolom pencarian untuk menampilkan dan mengisi
            data pemohon secara otomatis.  
        </p>
      </div>
    </div>
    <div class="font-bold text-lg sm:text-xl mt-4">Detail Purchasing Order</div>
    <div class="flex flex-col gap-4 sm:gap-6">
      <div
        class="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0"
      >
        <label
          for="nomor-po"
          class="min-w-0 sm:min-w-45 font-medium text-sm sm:text-base"
        >
          Nomor PO <span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="nomor-po"
          placeholder="Masukkan nomor PO"
          class="border-[2.2px] border-[#D9D9D9] rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-sm sm:text-base"
          v-model="nomorPO"
          required
        />
      </div>
      <div
        class="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0"
      >
        <label
          for="tanggal-pengadaan"
          class="min-w-0 sm:min-w-45 font-medium text-sm sm:text-base"
        >
          Tanggal PO <span class="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="tanggal-pengadaan"
          class="border-[2.2px] border-[#D9D9D9] rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-sm sm:text-base"
          v-model="tanggalPengadaan"
          required
        />
      </div>

      <!-- ✅ NEW: Tanggal Pengajuan field -->
      <div
        class="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0"
      >
        <label
          for="tanggal-pengajuan"
          class="min-w-0 sm:min-w-45 font-medium text-sm sm:text-base"
        >
          Tanggal Pengajuan <span class="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="tanggal-pengajuan"
          class="border-[2.2px] border-[#D9D9D9] rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-sm sm:text-base"
          v-model="tanggalPengajuan"
          required
        />
      </div>
      <div
        class="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0"
      >
        <label
          for="search-jenis-pengadaan"
          class="min-w-0 sm:min-w-45 font-medium text-sm sm:text-base"
        >
          Jenis Pengadaan <span class="text-red-500">*</span>  
        </label>
        <div class="relative w-full jenis-pengadaan-search-container">
          <input
            type="text"
            id="search-jenis-pengadaan"
            placeholder="Ketik atau pilih jenis pengadaan..."
            class="border-[2.2px] border-[#D9D9D9] rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-sm sm:text-base"
            v-model="searchJenisPengadaan"
            @input="handleJenisPengadaanSearchInput"
            @focus="handleJenisPengadaanFocus"
            @blur="handleJenisPengadaanBlur"
            required
          />
          <div
            v-if="!selectedJenisPengadaan"
            class="absolute inset-y-0 right-7.5 flex items-center pointer-events-none"
          >
            <svg
              v-if="!isSearchingJenisPengadaan"
              class="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <svg
              v-else
              class="animate-spin h-4 w-4 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 118-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <button
            v-if="selectedJenisPengadaan || searchJenisPengadaan"
            type="button"
            @click="clearJenisPengadaanSelection"
            class="absolute inset-y-0 right-7.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div
            v-if="
              showJenisPengadaanDropdown && jenisPengadaanResults.length > 0
            "
            class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            <div
              v-if="isSearchingJenisPengadaan"
              class="px-4 py-3 text-center text-gray-500 text-sm"
            >
              <div class="flex items-center justify-center gap-2">
                <svg
                  class="animate-spin h-4 w-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 118-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Memuat jenis pengadaan...  
              </div>
            </div>
            <div v-else>
              <div
                v-for="(jenisObj, index) in jenisPengadaanResults"
                :key="index"
                @mousedown="selectJenisPengadaan(jenisObj)"
                class="px-4 py-3 hover:bg-green-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div
                  class="font-medium text-sm text-gray-900 flex items-center"
                >
                  <svg
                    class="w-4 h-4 text-green-600 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  {{ jenisObj.jenis_pengadaan_barang }}

                  <span
                    class="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded"
                  >
                    {{ jenisObj.satuan }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="
              showJenisPengadaanDropdown &&
              jenisPengadaanResults.length === 0 &&
              searchJenisPengadaan.length >= 1 &&
              !isSearchingJenisPengadaan &&
              !selectedJenisPengadaan
            "
            class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm"
          >
            Tidak ada jenis pengadaan ditemukan untuk "{{
              searchJenisPengadaan
            }}"    
          </div>

          <div
            v-if="
              showJenisPengadaanDropdown &&
              jenisPengadaanResults.length === 0 &&
              (!searchJenisPengadaan || searchJenisPengadaan.length === 0) &&
              !isSearchingJenisPengadaan
            "
            class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm"
          >
            <div class="flex items-center justify-center gap-2 mb-2">
              <svg
                class="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h2m0 0V6a2 2 0 012-2h2.09M7 13h10v-3a2 2 0 00-2-2H9a2 2 0 00-2 2v3z"
                />
              </svg>
            </div>
            Belum ada data pengaturan pengadaan tersedia    
          </div>
        </div>
      </div>
      <div
        v-if="selectedJenisPengadaan"
        class="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700"
      >
        <div class="flex items-center gap-2">
          <svg
            class="w-4 h-4 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span class="font-medium">
            Satuan otomatis diatur ke:
            {{ selectedJenisPengadaan.satuan }}    
          </span>
        </div>
        <div class="mt-1 text-xs">
          Semua satuan dalam form ini akan mengikuti satuan dari jenis pengadaan
            yang dipilih.  
        </div>
      </div>
      <div
        class="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0"
      >
        <label
          for="kuantum"
          class="min-w-0 sm:min-w-45 font-medium text-sm sm:text-base"
        >
          Kuantum <span class="text-red-500">*</span>  
        </label>
        <div class="relative w-full">
          <input
            type="text"
            id="kuantum"
            placeholder="Masukkan kuantum"
            class="border-[2.2px] border-[#D9D9D9] rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            :value="formatAngkaRibuan(kuantum)"
            @input="handleKuantumInput"
            @keypress="handleNumericKeypress"
            @paste="handlePaste($event, 'kuantum')"
            inputmode="decimal"
            autocomplete="off"
            required
          />
          <div
            class="absolute inset-y-0 right-2 flex items-center text-gray-500 border-l-[1px] border-[#D9D9D9] my-0.5 pl-2"
          >
            <span
              class="text-center text-sm sm:text-base px-1 sm:px-2.5 py-1 min-w-[60px] font-medium"
              :class="
                selectedJenisPengadaan
                  ? 'text-green-600'
                  : satuanKuantum
                    ? 'text-gray-500'
                    : 'text-gray-400'
              "
            >
              {{ satuanKuantum || 'Satuan' }}
            </span>
          </div>
        </div>
      </div>
    </div>
    <div class="font-bold text-lg sm:text-xl mt-4 flex gap-x-2 items-center">
      <div>
        Data IN
        <span class="text-red-500 text-base sm:text-base">*</span>
      </div>
    </div>
    <div class="flex flex-col gap-4 sm:gap-6">
      <div
        v-for="(row, idx) in dataInList"
        :key="idx"
        class="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-x-3"
      >
        <input
          type="text"
          v-model="row.no_in"
          class="w-full sm:w-20 md:w-24 h-10 sm:h-12 border-[2.2px] border-[#D9D9D9] rounded-lg px-2 text-center text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="No"
          inputmode="numeric"
          required
        />
        <input
          type="date"
          v-model="row.tanggal"
          class="border-[2.2px] border-[#D9D9D9] rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-sm sm:text-base"
          required
        />
        <div class="relative w-full">
          <input
            type="text"
            :value="formatAngkaRibuan(row.jumlah)"
            @input="handleDataInJumlahInput($event, idx)"
            @keypress="handleNumericKeypress"
            @paste="handlePaste($event, 'dataIn', idx)"
            placeholder="Masukkan jumlah"
            class="border-[2.2px] border-[#D9D9D9] rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            inputmode="decimal"
            autocomplete="off"
            required
          />
          <div
            class="absolute inset-y-0 right-2 flex items-center text-gray-500 border-l-[1px] border-[#D9D9D9] my-0.5 pl-2"
          >
            <span
              class="text-center text-sm sm:text-base px-1 sm:px-2.5 py-1 min-w-[60px] font-medium"
              :class="
                selectedJenisPengadaan
                  ? 'text-green-600'
                  : satuanKuantum
                    ? 'text-gray-500'
                    : 'text-gray-400'
              "
            >
              {{ satuanKuantum || 'Satuan' }}
            </span>
          </div>
        </div>
        <button
          type="button"
          class="ml-0 sm:ml-2 p-2 rounded hover:bg-red-100 transition self-center sm:self-auto"
          @click="removeDataInRow(idx)"
          v-if="dataInList.length > 1"
          title="Hapus baris"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4 sm:w-5 sm:h-5 text-red-500 hover:text-red-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div class="flex justify-center w-full">
        <button
          type="button"
          class="mt-2 px-3 sm:px-4 py-2 hover:bg-green-500 text-white rounded bg-green-600 transition-all duration-200 ease-in-out w-fit text-sm sm:text-base"
          @click="addDataInRow"
        >
          + Tambah Data IN  
        </button>
      </div>
      <div
        v-if="dataInList.length >= 2"
        class="text-gray-500 text-center text-sm"
      >
        Total {{ dataInList.length }} baris Data IN
      </div>
    </div>
    <div class="font-bold text-lg sm:text-xl mt-4">Informasi Pembayaran</div>
    <div class="flex flex-col gap-4 sm:gap-6">
      <div
        class="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0"
      >
        <label
          for="jumlah-pembayaran"
          class="min-w-0 sm:min-w-45 font-medium text-sm sm:text-base"
        >
          Jumlah Pembayaran  
        </label>
        <div class="relative w-full">
          <input
            type="text"
            id="jumlah-pembayaran"
            :value="formatAngkaRibuan(jumlahPembayaran)"
            readonly
            class="border-[2.2px] border-[#E5E5E5] rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-sm sm:text-base bg-gray-50 cursor-not-allowed"
            placeholder="Akan otomatis terhitung dari Data IN"
          />
          <div
            class="absolute inset-y-0 right-2 flex items-center text-gray-500 border-l-[1px] border-[#E5E5E5] my-0.5 pl-2"
          >
            <span
              class="text-center text-sm sm:text-base px-1 sm:px-2.5 py-1 min-w-[60px] font-medium"
              :class="
                selectedJenisPengadaan
                  ? 'text-green-600'
                  : satuanJumlahPembayaran
                    ? 'text-gray-500'
                    : 'text-gray-400'
              "
            >
              {{ satuanJumlahPembayaran || 'Satuan' }}
            </span>
          </div>
        </div>
      </div>
      <div
        class="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0"
      >
        <label
          for="jumlah-spp"
          class="min-w-0 sm:min-w-45 font-medium text-sm sm:text-base flex items-center gap-1"
        >
          Jumlah SPP<span class="text-gray-500 text-sm">(Opsional)</span>
        </label>
        <div class="relative w-full">
          <input
            type="text"
            id="jumlah-spp"
            placeholder="Masukkan jumlah SPP"
            class="border-[2.2px] border-[#D9D9D9] rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            :value="formatAngkaRibuan(jumlahSPP)"
            @input="handleSPPInput"
            @keypress="handleNumericKeypress"
            @paste="handlePaste($event, 'spp')"
            inputmode="decimal"
            autocomplete="off"
          />
          <div
            class="absolute inset-y-0 right-2 flex items-center text-gray-500 border-l-[1px] border-[#D9D9D9] my-0.5 pl-2"
          >
            <span
              class="text-center text-sm sm:text-base px-1 sm:px-2.5 py-1 min-w-[60px] font-medium"
              :class="
                selectedJenisPengadaan
                  ? 'text-green-600'
                  : satuanJumlahSPP
                    ? 'text-gray-500'
                    : 'text-gray-400'
              "
            >
              {{ satuanJumlahSPP || 'Satuan' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
