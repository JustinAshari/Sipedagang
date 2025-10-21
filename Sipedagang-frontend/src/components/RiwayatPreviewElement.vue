<script setup>
  import Permohonan from '@/assets/images/misc/1.jpg'
  import PO from '@/assets/images/misc/2.jpg'
  import Kwitansi from '@/assets/images/misc/3.jpg'
</script>

<template>
  <section class="w-full h-[calc(100vh-270px)] pt-3 sm:pt-4 lg:pt-6 overflow-hidden">
    <!-- Mobile/Tablet View - Vertical Scroll -->
    <div class="block xl:hidden h-full">
      <div class="h-full overflow-y-auto px-2 sm:px-4 space-y-3 sm:space-y-4">
        <div class="bg-white rounded-lg shadow-sm border p-2 sm:p-3">
          <h3 class="text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">
            Surat Permohonan
          </h3>
          <img
            :src="Permohonan"
            class="w-full h-auto max-h-[300px] sm:max-h-[400px] object-contain rounded border border-gray-200"
            alt="Surat Permohonan"
          />
        </div>
        <div class="bg-white rounded-lg shadow-sm border p-2 sm:p-3">
          <h3 class="text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">
            Purchase Order
          </h3>
          <img
            :src="PO"
            class="w-full h-auto max-h-[300px] sm:max-h-[400px] object-contain rounded border border-gray-200"
            alt="Purchase Order"
          />
        </div>
        <div class="bg-white rounded-lg shadow-sm border p-2 sm:p-3">
          <h3 class="text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">
            Kwitansi
          </h3>
          <img
            :src="Kwitansi"
            class="w-full h-auto max-h-[300px] sm:max-h-[400px] object-contain rounded border border-gray-200"
            alt="Kwitansi"
          />
        </div>
      </div>
    </div>

    <!-- Desktop View - Horizontal Scroll -->
    <div class="hidden xl:block w-full h-full overflow-x-auto overflow-y-hidden">
      <div class="w-full h-full flex gap-4 px-1 py-1 min-w-max">
        <div class="flex-shrink-0 bg-white rounded-lg shadow-sm border p-3">
          <h3 class="text-base font-medium text-gray-700 mb-3 text-center">
            Surat Permohonan
          </h3>
          <img
            :src="Permohonan"
            class="h-[calc(100%-60px)] w-auto object-contain rounded border border-gray-200"
            alt="Surat Permohonan"
          />
        </div>
        <div class="flex-shrink-0 bg-white rounded-lg shadow-sm border p-3">
          <h3 class="text-base font-medium text-gray-700 mb-3 text-center">
            Purchase Order
          </h3>
          <img
            :src="PO"
            class="h-[calc(100%-60px)] w-auto object-contain rounded border border-gray-200"
            alt="Purchase Order"
          />
        </div>
        <div class="flex-shrink-0 bg-white rounded-lg shadow-sm border p-3">
          <h3 class="text-base font-medium text-gray-700 mb-3 text-center">
            Kwitansi
          </h3>
          <img
            :src="Kwitansi"
            class="h-[calc(100%-60px)] w-auto object-contain rounded border border-gray-200"
            alt="Kwitansi"
          />
        </div>
      </div>
    </div>
  </section>
</template>
