<script setup>
  const props = defineProps({
    color: { type: String, default: '#9BA1AA' },
    stroke: { type: String, default: 'white' },
  })
</script>

<template>
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16.1357 0C19.8769 0 21.989 2.12218 22 5.86328V16.1367C22 19.8767 19.8769 22 16.1357 22H5.86328C2.12215 22 0 19.8767 0 16.1367V5.86328C0 2.12218 2.12215 0 5.86328 0H16.1357Z"
      :fill="color"
    />
    <path
      d="M12.4375 14.0001V12.7889C13.5505 11.9178 14.3125 10.875 14.3125 8.63551C14.3125 7.18574 14.0481 5.875 12.4616 5.875C12.4616 5.875 11.9021 5.25 10.5577 5.25C8.65921 5.25 7.4375 6.39185 7.4375 8.63551C7.4375 10.875 8.19948 11.9179 9.3125 12.7889V14.0001L6.99001 14.6987C6.12287 14.964 5.47871 15.6596 5.26485 16.5063C5.18028 16.8411 5.46942 17.1251 5.81649 17.1251H12.1835"
      :stroke="stroke"
      stroke-width="1.4"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M15.5625 17.75V13.375M13.375 15.5625H17.75"
      :stroke="stroke"
      stroke-width="1.4"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
