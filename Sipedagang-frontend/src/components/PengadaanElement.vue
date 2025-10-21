<script setup>
  import { ref, watch, onMounted, nextTick, computed } from 'vue'
  import { useSettingPengadaanStore } from '@/stores/settingPengadaanStore'

  const props = defineProps({
    isEditMode: {
      type: Boolean,
      default: false,
    },
  })

  const emit = defineEmits(['form-changed'])

  const jenisPengadaanBarang = ref('')
  const satuan = ref('')
  const hargaPerSatuanRaw = ref(null)
  const ppn = ref('0')
  const pph = ref('0')
  const tanpaPajak = ref(false) // ✅ NEW: Add tanpa_pajak field

  const settingPengadaanStore = useSettingPengadaanStore()

  // ✅ Computed property untuk format tampilan
  const hargaPerSatuan = computed({
    get() {
      if (
        hargaPerSatuanRaw.value === null ||
        hargaPerSatuanRaw.value === undefined
      ) {
        return ''
      }
      return formatCurrency(hargaPerSatuanRaw.value)
    },
    set(newValue) {
      const numericValue = newValue.toString().replace(/[^0-9]/g, '')
      hargaPerSatuanRaw.value = numericValue ? parseInt(numericValue, 10) : null
    },
  })

  const hasChanges = ref(false)
  const initialFormData = ref({})

  const saveInitialData = () => {
    initialFormData.value = {
      jenisPengadaanBarang: jenisPengadaanBarang.value,
      satuan: satuan.value,
      hargaPerSatuan: hargaPerSatuanRaw.value,
      ppn: ppn.value,
      pph: pph.value,
      tanpaPajak: tanpaPajak.value, // ✅ NEW: Include in initial data
    }
    hasChanges.value = false
    emit('form-changed', false)
  }

  const checkForChanges = () => {
    const currentData = {
      jenisPengadaanBarang: jenisPengadaanBarang.value,
      satuan: satuan.value,
      hargaPerSatuan: hargaPerSatuanRaw.value,
      ppn: ppn.value,
      pph: pph.value,
      tanpaPajak: tanpaPajak.value, // ✅ NEW: Include in change detection
    }

    const hasFormChanges =
      JSON.stringify(currentData) !== JSON.stringify(initialFormData.value)
    hasChanges.value = hasFormChanges
    emit('form-changed', hasFormChanges)
  }

  function clearForm() {
    jenisPengadaanBarang.value = ''
    satuan.value = ''
    hargaPerSatuanRaw.value = null
    ppn.value = '0'
    pph.value = '0'
    tanpaPajak.value = false // ✅ NEW: Reset tanpa_pajak
    settingPengadaanStore.clearCurrentPengaturanPengadaan()

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

    jenisPengadaanBarang.value = data.jenis_pengadaan_barang || ''
    satuan.value = data.satuan || ''
    hargaPerSatuanRaw.value = data.harga_per_satuan
      ? parseFloat(data.harga_per_satuan)
      : null
    ppn.value =
      data.ppn !== undefined && data.ppn !== null ? data.ppn.toString() : '0'
    pph.value =
      data.pph !== undefined && data.pph !== null ? data.pph.toString() : '0'
    tanpaPajak.value = Boolean(data.tanpa_pajak) // ✅ NEW: Handle tanpa_pajak

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

  // ✅ UPDATED: Convert satuan to uppercase before sending to database
  function getFormData() {
    const formData = {
      jenis_pengadaan_barang: jenisPengadaanBarang.value,
      satuan: satuan.value.toUpperCase(),
      harga_per_satuan: hargaPerSatuanRaw.value || 0,
      ppn: parseFloat(ppn.value) || 0,
      pph: parseFloat(pph.value) || 0,
      tanpa_pajak: tanpaPajak.value, // ✅ NEW: Include tanpa_pajak
    }

    return formData
  }

  function validateForm() {
    const errors = []

    if (!jenisPengadaanBarang.value)
      errors.push('Jenis Pengadaan Barang harus diisi')
    if (!satuan.value) errors.push('Satuan harus diisi')
    if (
      hargaPerSatuanRaw.value === null ||
      hargaPerSatuanRaw.value === undefined
    ) {
      errors.push('Harga Per Satuan harus diisi')
    }

    // Validate numeric values
    const priceValue = hargaPerSatuanRaw.value
    if (priceValue !== null && isNaN(priceValue)) {
      errors.push('Harga Per Satuan harus berupa angka')
    }

    // ✅ NEW: Only validate PPN/PPH if tanpa_pajak is false
    if (!tanpaPajak.value) {
      if (ppn.value && isNaN(parseFloat(ppn.value))) {
        errors.push('PPN harus berupa angka')
      }
      if (pph.value && isNaN(parseFloat(pph.value))) {
        errors.push('PPh harus berupa angka')
      }
    }

    return errors
  }

  // ✅ NEW: Handle tanpa_pajak checkbox change
  const handleTanpaPajakChange = () => {
    if (tanpaPajak.value) {
      // If tanpa_pajak is checked, set PPN and PPH to 0
      ppn.value = '0'
      pph.value = '0'
    }
  }

  async function submitForm() {
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(', '))
    }

    const formData = getFormData()
    const result =
      await settingPengadaanStore.createPengaturanPengadaan(formData)

    if (result) {
      clearFormWithDelay(1000)
    }

    return result
  }

  // ✅ UPDATED: Enhanced updateForm function
  async function updateForm(id) {
    if (!id) {
      throw new Error('ID pengaturan pengadaan tidak valid')
    }

    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(', '))
    }

    const formData = getFormData()
    console.log('Updating pengaturan pengadaan with ID:', id, 'Data:', formData)

    const result = await settingPengadaanStore.updatePengaturanPengadaan(
      id,
      formData,
    )

    if (result) {
      nextTick(() => {
        saveInitialData()
        console.log('Form updated and initial data refreshed')
      })
    }

    return result
  }

  // ✅ UPDATED: Currency formatting functions
  const formatCurrency = (value) => {
    if (!value) return ''
    const numericValue = value.toString().replace(/[^0-9]/g, '')
    if (!numericValue) return ''

    // Add thousand separators
    const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return `Rp ${formatted}`
  }

  const handlePriceKeypress = (event) => {
    // Only allow numbers
    const char = String.fromCharCode(event.which)
    if (
      !/[0-9]/.test(char) &&
      ![8, 9, 37, 38, 39, 40, 46].includes(event.keyCode)
    ) {
      event.preventDefault()
    }
  }

  // ✅ FIXED: Enhanced number input handlers
  const handleNumberInput = (event, field) => {
    let value = event.target.value
    // Allow only numbers and decimal point
    value = value.replace(/[^0-9.]/g, '')

    // ✅ FIXED: Remove leading zeros unless it's just "0" or "0."
    if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
      value = value.substring(1)
    }

    // ✅ If value becomes empty, default to "0"
    if (value === '') {
      value = '0'
    }

    if (field === 'ppn') {
      ppn.value = value
    } else if (field === 'pph') {
      pph.value = value
    }
  }

  // ✅ FIXED: Enhanced focus handler to clear "0" and leading zeros
  const handleNumberFocus = (event, field) => {
    const currentValue = event.target.value

    // Clear if value is "0" or starts with "0" followed by numbers (like "012")
    if (
      currentValue === '0' ||
      (currentValue.startsWith('0') &&
        currentValue.length > 1 &&
        !currentValue.startsWith('0.'))
    ) {
      if (field === 'ppn') {
        ppn.value = ''
      } else if (field === 'pph') {
        pph.value = ''
      }
      event.target.value = ''
    }
  }

  // ✅ ENHANCED: Better keypress handler
  const handleNumberKeypress = (event) => {
    const char = String.fromCharCode(event.which)
    const currentValue = event.target.value

    // Allow: numbers (0-9), decimal point (.), backspace, delete, arrow keys, tab
    if (
      !/[0-9.]/.test(char) &&
      ![8, 9, 37, 38, 39, 40, 46].includes(event.keyCode)
    ) {
      event.preventDefault()
      return
    }

    // Prevent multiple decimal points
    if (char === '.' && currentValue.includes('.')) {
      event.preventDefault()
      return
    }

    // ✅ NEW: If current value is "0" and user types a number (not decimal), replace the "0"
    if (currentValue === '0' && /[1-9]/.test(char)) {
      event.preventDefault()
      const field = event.target.id === 'ppn' ? 'ppn' : 'pph'
      if (field === 'ppn') {
        ppn.value = char
      } else {
        pph.value = char
      }
      event.target.value = char
    }
  }

  // ✅ UPDATED: Enhanced blur handler
  const handleNumberBlur = (field) => {
    let value = field === 'ppn' ? ppn.value : pph.value

    // If empty or just whitespace, set to "0"
    if (!value || value.trim() === '') {
      value = '0'
    } else {
      // Remove leading zeros (except for "0" or "0.something")
      if (
        value.length > 1 &&
        value.startsWith('0') &&
        !value.startsWith('0.')
      ) {
        value = value.replace(/^0+/, '') || '0'
      }

      // If it becomes empty after removing zeros, set to "0"
      if (value === '') {
        value = '0'
      }
    }

    if (field === 'ppn') {
      ppn.value = value
    } else if (field === 'pph') {
      pph.value = value
    }
  }

  // ✅ NEW: Handle satuan input - convert to uppercase on blur for better UX
  const handleSatuanBlur = () => {
    if (satuan.value) {
      satuan.value = satuan.value.toUpperCase()
    }
  }

  defineExpose({
    clearForm,
    getFormData,
    clearFormWithDelay,
    validateForm,
    submitForm,
    updateForm,
    populateForm,
    settingPengadaanStore,
    hasChanges,
    saveInitialData,
  })

  // ✅ UPDATED: Watch with tanpa_pajak included
  watch(
    [jenisPengadaanBarang, satuan, hargaPerSatuanRaw, ppn, pph, tanpaPajak],
    () => {
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
  })
</script>

<template>
  <section
    class="flex flex-col gap-4 overflow-y-auto w-full h-full pb-3 px-2 sm:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-scrollbar:{display:none}]"
  >
    <!-- DATA PENGATURAN PENGADAAN -->
    <div class="font-bold text-lg sm:text-xl">Pengaturan Pengadaan</div>
    <div class="flex flex-col gap-4 sm:gap-6">
      <!-- Jenis Pengadaan Barang -->
      <div
        class="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0"
      >
        <label
          for="jenis-pengadaan-barang"
          class="min-w-0 sm:min-w-45 font-medium text-sm sm:text-base"
        >
          Pengadaan Barang <span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="jenis-pengadaan-barang"
          placeholder="Masukkan jenis pengadaan barang"
          class="border-[2.2px] border-[#D9D9D9] rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-sm sm:text-base"
          v-model="jenisPengadaanBarang"
          required
        />
      </div>

      <!-- Satuan -->
      <div
        class="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0"
      >
        <label
          for="satuan"
          class="min-w-0 sm:min-w-45 font-medium text-sm sm:text-base"
        >
          Satuan <span class="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="satuan"
          placeholder="Masukkan satuan (contoh: PCS, KG, LITER)"
          class="border-[2.2px] border-[#D9D9D9] rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-sm sm:text-base uppercase placeholder:normal-case"
          v-model="satuan"
          @blur="handleSatuanBlur"
          style="text-transform: uppercase"
          title="Satuan akan otomatis diubah ke huruf kapital"
          required
        />
      </div>

      <!-- Harga Per Satuan -->
      <div
        class="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0"
      >
        <label
          for="harga-per-satuan"
          class="min-w-0 sm:min-w-45 font-medium text-sm sm:text-base"
        >
          Harga Per Satuan <span class="text-red-500">*</span>
        </label>
        <div class="relative w-full">
          <input
            type="text"
            id="harga-per-satuan"
            placeholder="Rp 0"
            class="border-[2.2px] border-[#D9D9D9] rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-sm sm:text-base font-mono"
            v-model="hargaPerSatuan"
            @keypress="handlePriceKeypress"
            autocomplete="off"
            inputmode="numeric"
            title="Masukkan harga dalam angka (contoh: 120000 akan menjadi Rp 120.000)"
            required
          />
        </div>
      </div>

      <!-- ✅ NEW: Tanpa Pajak Checkbox -->
      <div
        class="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0"
      >
        <label
          for="tanpa-pajak"
          class="min-w-0 sm:min-w-45 font-medium text-sm sm:text-base"
        >
          Tanpa Pajak
        </label>
        <div class="flex items-center gap-3 w-full">
          <input
            type="checkbox"
            id="tanpa-pajak"
            v-model="tanpaPajak"
            @change="handleTanpaPajakChange"
            class="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded"
          />
          <label
            for="tanpa-pajak"
            class="text-sm sm:text-base text-gray-700 cursor-pointer"
          >
            Centang jika pengadaan ini tanpa pajak (PPN dan PPH akan diatur ke
            0%)
          </label>
        </div>
      </div>

      <!-- PPN -->
      <div
        class="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0"
      >
        <label
          for="ppn"
          class="min-w-0 sm:min-w-45 font-medium text-sm sm:text-base"
        >
          PPN (%) <span class="text-red-500">*</span>
        </label>
        <div class="relative w-full">
          <input
            type="text"
            id="ppn"
            class="border-[2.2px] border-[#D9D9D9] rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-sm sm:text-base font-mono"
            :class="{ 'bg-gray-100 cursor-not-allowed': tanpaPajak }"
            v-model="ppn"
            @focus="handleNumberFocus($event, 'ppn')"
            @input="handleNumberInput($event, 'ppn')"
            @keypress="handleNumberKeypress"
            @blur="handleNumberBlur('ppn')"
            :disabled="tanpaPajak"
            autocomplete="off"
            inputmode="decimal"
            pattern="[0-9.]*"
            title="Masukkan persentase PPN (contoh: 12)"
            required
          />
          <div
            class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
          >
            <span class="text-gray-500 text-sm sm:text-base">%</span>
          </div>
        </div>
      </div>

      <!-- PPh -->
      <div
        class="flex flex-col sm:flex-row sm:items-center w-full gap-2 sm:gap-0"
      >
        <label
          for="pph"
          class="min-w-0 sm:min-w-45 font-medium text-sm sm:text-base"
        >
          PPh (%) <span class="text-red-500">*</span>
        </label>
        <div class="relative w-full">
          <input
            type="text"
            id="pph"
            class="border-[2.2px] border-[#D9D9D9] rounded-lg h-10 sm:h-11.5 px-3 sm:px-7 w-full text-sm sm:text-base font-mono"
            :class="{ 'bg-gray-100 cursor-not-allowed': tanpaPajak }"
            v-model="pph"
            @focus="handleNumberFocus($event, 'pph')"
            @input="handleNumberInput($event, 'pph')"
            @keypress="handleNumberKeypress"
            @blur="handleNumberBlur('pph')"
            :disabled="tanpaPajak"
            autocomplete="off"
            inputmode="decimal"
            pattern="[0-9.]*"
            title="Masukkan persentase PPh (contoh: 1.5)"
            required
          />
          <div
            class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
          >
            <span class="text-gray-500 text-sm sm:text-base">%</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
