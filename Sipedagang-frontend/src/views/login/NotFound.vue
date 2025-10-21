<script setup>
  import GuestLayout from '@/layouts/GuestLayout.vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/authStore'

  const router = useRouter()
  const authStore = useAuthStore()

  const goBack = () => {
    if (authStore.isAuthenticated) {
      const role = authStore.userRole
      if (role === 'admin') {
        router.push('/admin/dashboard')
      } else if (role === 'superadmin') {
        router.push('/superadmin/dashboard')
      }
    } else {
      router.push('/login')
    }
  }
</script>

<template>
  <GuestLayout>
    <div class="absolute font-bold text-4xl right-0">
      <div class="flex pt-7 pr-7">
        <div class="text-[#F0AB26]">Si</div>
        <div class="text-[#176BC7]">PEDAGANG</div>
      </div>
    </div>
    <section
      class="h-screen flex flex-col text-center justify-center items-center"
    >
      <div class="flex -mt-17 text-[13rem] text-[#F0AB26]">
        4
        <div class="text-[#0099FF]">0</div>
        <div class="text-[#1B4F88]">4</div>
      </div>
      <div class="-mt-12">
        <div class="text-[3.2rem] py-2">Oops! - Page not found</div>
        <div class="">
          Sepertinya kami tidak bisa menemukan halaman yang Anda cari.
          <div>Mungkin halaman ini sudah dihapus atau alamatnya berubah.</div>
        </div>
      </div>
      <button
        @click="goBack"
        class="mt-9 bg-[#176BC7] text-white px-16 py-3 rounded-xl cursor-pointer hover:focus-2 hover:sahdwow-lg transition-all duration-400 ease-in-out custom-shadow"
      >
        Kembali
      </button>
    </section>
  </GuestLayout>
</template>

<style scoped>
  .custom-shadow:hover {
    box-shadow: 0 -0px 20px 0 #176bc7;
  }
</style>
