<script setup>
  import { ref, watch, onMounted, nextTick } from 'vue'
  import { usePemohonStore } from '@/stores/pemohonStore'

  const props = defineProps({
    isEditMode: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['form-changed'])

  const namaSupplier = ref('')
  const namaPerusahaan = ref('')
  const jenisBank = ref('')
  const nomorRekening = ref('')
  const atasNamaRekening = ref('')

  // ✅ FIX: Use store directly
  const pemohonStore = usePemohonStore()

  const hasChanges = ref(false)
  const initialFormData = ref({})

  const saveInitialData = () => {
    initialFormData.value = {
      namaSupplier: namaSupplier.value,
      namaPerusahaan: namaPerusahaan.value,
      jenisBank: jenisBank.value,
      nomorRekening: nomorRekening.value,
      atasNamaRekening: atasNamaRekening.value,
    }
    hasChanges.value = false
    emit('form-changed', false)
  }

  const checkForChanges = () => {
    const currentData = {
      namaSupplier: namaSupplier.value,
      namaPerusahaan: namaPerusahaan.value,
      jenisBank: jenisBank.value,
      nomorRekening: nomorRekening.value,
      atasNamaRekening: atasNamaRekening.value,
    }

    const hasFormChanges =
      JSON.stringify(currentData) !== JSON.stringify(initialFormData.value)
    hasChanges.value = hasFormChanges
    emit('form-changed', hasFormChanges)
  }

  function clearForm() {
    namaSupplier.value = ''
    namaPerusahaan.value = ''
    jenisBank.value = ''
    nomorRekening.value = ''
    atasNamaRekening.value = ''
    pemohonStore.clearMessages()

    nextTick(() => {
      saveInitialData()
    })
  }

  // ✅ UPDATED: Enhanced populateForm function
  function populateForm(data) {
    if (!data) {
      console.warn('No data provided to populateForm')
      return
    }

    console.log('Populating form with data:', data)

    namaSupplier.value = data.nama_suplier || ''
    namaPerusahaan.value = data.nama_perusahaan || ''
    jenisBank.value = data.jenis_bank || ''
    nomorRekening.value = data.no_rekening || ''
    atasNamaRekening.value = data.atasnama_rekening || ''

    nextTick(() => {
      saveInitialData()
      console.log('Form populated and initial data saved')
    })
  }

  function clearFormWithDelay(delay = 1000) {
    setTimeout(() => {
      clearForm()
    }, delay)
  }

  function getFormData() {
    const formData = {
      nama_suplier: namaSupplier.value,
      nama_perusahaan: namaPerusahaan.value,
      jenis_bank: jenisBank.value,
      no_rekening: nomorRekening.value,
      atasnama_rekening: atasNamaRekening.value,
    }

    return formData
  }

  function validateForm() {
    const errors = []

    if (!namaSupplier.value) errors.push('Nama Supplier harus diisi')
    if (!namaPerusahaan.value) errors.push('Nama Perusahaan harus diisi')
    if (!jenisBank.value) errors.push('Jenis Bank harus diisi')
    if (!nomorRekening.value) errors.push('Nomor Rekening harus diisi')
    if (!atasNamaRekening.value) errors.push('Atas Nama Rekening harus diisi')

    return errors
  }

  async function submitForm() {
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(', '))
    }

    const formData = getFormData()
    const result = await pemohonStore.createPemohon(formData)

    if (result) {
      clearFormWithDelay(1000)
    }

    return result
  }

  // ✅ UPDATED: Enhanced updateForm function
  async function updateForm(id) {
    if (!id) {
      throw new Error('ID pemohon tidak valid')
    }

    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(', '))
    }

    const formData = getFormData()
    console.log('Updating pemohon with ID:', id, 'Data:', formData)

    const result = await pemohonStore.updatePemohon(id, formData)

    if (result) {
      nextTick(() => {
        saveInitialData()
        console.log('Form updated and initial data refreshed')
      })
    }

    return result
  }

  defineExpose({
    clearForm,
    getFormData,
    clearFormWithDelay,
    validateForm,
    submitForm,
    updateForm,
    populateForm,
    pemohonStore, // ✅ Expose the store reference
    hasChanges,
    saveInitialData,
  })

  // ✅ UPDATED: Watch with edit mode consideration
  watch(
    [namaSupplier, namaPerusahaan, jenisBank, nomorRekening, atasNamaRekening],
    () => {
      // Only check for changes after form is properly initialized
      if (Object.keys(initialFormData.value).length > 0) {
        checkForChanges()
      }
    },
    { deep: true },
  )

  onMounted(() => {
    if (!props.isEditMode) {
      nextTick(() => {
        saveInitialData()
      })
    }
    // For edit mode, saveInitialData will be called from populateForm
  })

  // ✅ UPDATE: Function untuk validasi input angka, spasi, dash (-), dan titik (.)
  const validateAccountNumber = (value) => {
    // Hanya izinkan angka (0-9), spasi, dash (-), dan titik (.)
    return value.replace(/[^0-9\s\-.]/g, '')
  }

  // ✅ UPDATE: Handler untuk keypress (mencegah input karakter yang tidak diizinkan)
  const handleNomorRekeningKeypress = (event) => {
    const char = String.fromCharCode(event.which)
    // Izinkan: angka (0-9), spasi, dash (-), titik (.), backspace, delete, arrow keys, tab
    if (
      !/[0-9\s\-.]/.test(char) &&
      ![8, 9, 37, 38, 39, 40, 46].includes(event.keyCode)
    ) {
      event.preventDefault()
    }
  }

  // ✅ UPDATE: Validasi nomor rekening untuk memperbolehkan titik (.)
  const validateNoRekening = (value) => {
    if (!value) return true // Optional field

    // Memperbolehkan angka, spasi, dash (-), dan titik (.)
    const noRekeningPattern = /^[0-9\s\-.]+$/

    if (!noRekeningPattern.test(value)) {
      return 'Nomor rekening hanya boleh berisi angka, spasi, dash (-), dan titik (.)'
    }

    if (value.length < 3) {
      return 'Nomor rekening minimal 3 karakter'
    }

    if (value.length > 50) {
      return 'Nomor rekening maksimal 50 karakter'
    }

    return true
  }

  // Update rules untuk no_rekening
  const rules = ref({
    // ...existing rules...
    no_rekening: [validateNoRekening],
    // ...existing rules...
  })
</script>

<template>
  <section
    class="flex flex-col gap-4 overflow-y-auto w-full h-full pb-3 px-2 sm:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-scrollbar:{display:none}]"
  >
    <!-- DATA PEMOHON -->
    <div class="font-bold text-lg sm:text-xl">Data Pemohon</div>
    <div class="flex flex-col gap-4 sm:gap-6">
      <!-- Nama Perusahaan -->
      <div
        class="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0"
      >
        <label
          for="nama-perusahaan"
          class="min-w-0 sm:min-w-45 font-medium text-sm sm:text-base"
        >
          Nama Perusahaan <span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="nama-perusahaan"
          placeholder="Masukkan nama perusahaan"
          class="border-[2.2px] border-[#D9D9D9] rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-sm sm:text-base"
          v-model="namaPerusahaan"
          required
        />
      </div>

      <!-- Nama Supplier -->
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
          placeholder="Masukkan nama supplier"
          class="border-[2.2px] border-[#D9D9D9] rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-sm sm:text-base"
          v-model="namaSupplier"
          required
        />
      </div>

      <!-- Jenis Bank -->
      <div
        class="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0"
      >
        <label
          for="jenis-bank"
          class="min-w-0 sm:min-w-45 font-medium text-sm sm:text-base"
        >
          Jenis Bank <span class="text-red-500">*</span>
        </label>
        <div class="relative w-full">
          <input
            type="text"
            id="jenis-bank"
            placeholder="Masukkan jenis bank"
            class="border-[2.2px] border-[#D9D9D9] rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-sm sm:text-base"
            v-model="jenisBank"
            required
          />
        </div>
      </div>

      <!-- ✅ UPDATE: Nomor Rekening - DENGAN VALIDASI ANGKA, SPASI, DASH (-), DAN TITIK (.) -->
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
          placeholder="Masukkan nomor rekening"
          class="border-[2.2px] border-[#D9D9D9] rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-xs sm:text-base font-mono"
          v-model="nomorRekening"
          @input="handleNomorRekeningInput"
          @paste="handleNomorRekeningPaste"
          @keypress="handleNomorRekeningKeypress"
          autocomplete="off"
          inputmode="text"
          pattern="[0-9\s\-.]*"
          title="Hanya boleh mengandung angka, spasi, dash (-), dan titik (.)"
          required
        />
      </div>

      <!-- Atas Nama Rekening -->
      <div
        class="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0"
      >
        <label
          for="atas-nama-rekening"
          class="min-w-0 sm:min-w-45 font-medium text-sm sm:text-base"
        >
          Atas Nama Rekening <span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="atas-nama-rekening"
          placeholder="Masukkan nama pemilik rekening"
          class="border-[2.2px] border-[#D9D9D9] rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-sm sm:text-base"
          v-model="atasNamaRekening"
          required
        />
      </div>
    </div>
  </section>
</template>
