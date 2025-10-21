<script setup></script>

<template>
  <section class="w-full h-[90.3dvh] px-2 sm:px-3 lg:px-4">
    <div class="flex justify-center items-center w-full h-full">
      <div
        class="shadow-lg outline-1 outline-gray-300 w-full max-w-[1200px] h-full max-h-[85vh] px-3 sm:px-4 lg:px-6 py-3 sm:py-4 mt-1 overflow-hidden rounded-md bg-white"
      >
        <div class="h-full w-full">
          <slot />
        </div>
      </div>
    </div>
  </section>
</template>
