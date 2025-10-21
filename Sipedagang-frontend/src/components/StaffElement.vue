<script setup>
  import { RouterLink, useRouter } from 'vue-router'
  import { computed } from 'vue'
  import { config } from '@/config/env'

  const props = defineProps({
    person: {
      type: Object,
      default: () => ({}),
    },
  })

  const router = useRouter()

  // Computed property untuk foto staff dengan fallback
  const fotoStaff = computed(() => {
    const foto =
      props.person?.foto ||
      props.person?.img ||
      props.person?.gambar ||
      props.person?.photo

    if (foto) {
      // Gunakan fungsi getStorageUrl dari env.js
      return config.getStorageUrl(foto)
    }    // Fallback ke avatar berdasarkan nama atau avatar generik
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(props.person?.nama || 'Pengguna')}&background=0099FF&color=fff&size=128`
  })

  const keHalamanStaff = () => {
    router.push(`/superadmin/admin-edit/${props.person.id}`)
  }
</script>

<template>  <div
    @click="keHalamanStaff"
    class="w-full cursor-pointer flex items-center bg-[#F7F8FA] py-2 sm:py-3 px-3 sm:px-4 rounded-lg shadow-md/25 min-h-[90px] sm:min-h-[100px] hover:scale-[0.98] hover:bg-[#E4E7EC] transition-all duration-200 ease-in-out relative"
  >
    <!-- Gambar Profil -->
    <div class="relative flex-shrink-0">
      <div
        class="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center"
      >
        <img
          :src="fotoStaff"
          :alt="person.nama"
          loading="lazy"
          :class="[
            'w-full h-full object-cover object-center',
            person.status === 'inactive' ? 'grayscale opacity-60' : '',
          ]"
          @error="
            (e) => {
              // Fallback ke layanan avatar jika gambar gagal dimuat
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person?.nama || 'Pengguna')}&background=0099FF&color=fff&size=128`
            }
          "
        />
      </div>
      <!-- Indikator status -->
      <div
        :class="[
          'absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white',
          person.status === 'active' ? 'bg-green-500' : 'bg-red-500',
        ]"
        :title="person.status === 'active' ? 'Aktif' : 'Tidak Aktif'"
      ></div>
    </div>    <!-- Konten Teks dengan lebar responsif -->
    <div
      class="flex flex-col justify-center items-start ml-3 sm:ml-4 flex-1 min-w-0 pr-6 sm:pr-1 h-full overflow-hidden"
    >      <div
        :class="[
          'font-semibold text-xs sm:text-sm md:text-base leading-tight block overflow-hidden text-ellipsis whitespace-nowrap',
          person.status === 'inactive' ? 'text-gray-500' : 'text-black',
        ]"
        :title="person.nama"
        style="max-width: calc(100% - 1rem);"
      >
        {{ person.nama }}
      </div>
      <p
        :class="[
          'text-xs sm:text-xs md:text-sm leading-tight mt-1 block overflow-hidden text-ellipsis whitespace-nowrap',
          person.status === 'inactive' ? 'text-gray-400' : 'text-gray-600',
        ]"
        :title="person.nama_pengguna"
        style="max-width: calc(100% - 1rem);"
      >
        {{ person.nama_pengguna }}
      </p>
    </div>

    <!-- Ikon SVG dengan posisi responsive -->
    <div class="absolute right-3 sm:right-4 bottom-3 sm:bottom-4 flex-shrink-0">
      <svg
        class="w-5 h-5 sm:w-6 sm:h-6"
        viewBox="0 0 26 25"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M17.6089 4.79697L18.6402 3.76573C19.4946 2.91142 20.8797 2.91142 21.7339 3.76573C22.5882 4.62004 22.5882 6.00513 21.7339 6.85945L20.7027 7.89068M17.6089 4.79697L10.6722 11.7337C10.1435 12.2625 9.76847 12.9248 9.58714 13.6501L8.83301 16.6667L11.8496 15.9125C12.5749 15.7312 13.2372 15.3561 13.7659 14.8275L20.7027 7.89068M17.6089 4.79697L20.7027 7.89068"
          :stroke="person.status === 'inactive' ? '#9CA3AF' : '#575757'"
          stroke-width="2"
          stroke-linejoin="round"
        />
        <path
          d="M19.3458 13.0208C19.3458 16.4453 20.2916 19.1991 19.3458 20.3516C19.1727 20.5626 18.9793 20.756 18.7682 20.9291C17.6158 21.875 15.9035 21.875 12.4791 21.875H11.9583C8.02996 21.875 6.06579 21.875 4.84541 20.6546C3.62503 19.4343 3.625 17.47 3.625 13.5416V13.0208C3.625 9.59635 3.625 7.88414 4.57077 6.73169C4.74393 6.52071 4.9374 6.32724 5.14837 6.15408C6.30082 5.20831 8.01304 5.20831 11.4375 5.20831"
          :stroke="person.status === 'inactive' ? '#9CA3AF' : '#575757'"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
  </div>
</template>


