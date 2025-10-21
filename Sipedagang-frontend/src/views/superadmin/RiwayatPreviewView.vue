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

  onMounted(async () => {
    const id = route.params.id
    if (id) {
      try {
        // ✅ Load setting pengadaan terlebih dahulu
        await settingPengadaanStore.fetchPengaturanPengadaan()

        // Kemudian load data pengadaan
        pengadaan.value = await pengadaanStore.fetchPengadaanById(id)

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
