import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: fileURLToPath(new URL('./src', import.meta.url)),
      },
    ],
  },
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,

    // Enable source maps for debugging (optional)
    sourcemap: false,

    // Ganti minifier dari terser ke esbuild (default dan lebih cepat)
    minify: 'esbuild',

    rollupOptions: {
      output: {
        // Manual chunks configuration - hanya untuk vendor yang sudah terinstall
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // Vue ecosystem
            if (
              id.includes('vue') ||
              id.includes('vue-router') ||
              id.includes('pinia')
            ) {
              return 'vendor-vue'
            }

            // HTTP clients
            if (id.includes('axios')) {
              return 'vendor-http'
            }

            // Utilities
            if (id.includes('lodash') || id.includes('date-fns')) {
              return 'vendor-utils'
            }

            // Other vendor libraries
            return 'vendor'
          }

          // Application chunks berdasarkan path
          if (id.includes('/views/login/')) {
            return 'auth'
          }

          if (id.includes('/views/admin/')) {
            return 'admin'
          }

          if (id.includes('/views/superadmin/')) {
            return 'superadmin'
          }

          if (id.includes('/layouts/')) {
            return 'layouts'
          }

          if (id.includes('/stores/')) {
            return 'stores'
          }

          if (id.includes('/components/')) {
            return 'components'
          }
        },

        // Naming pattern for chunks
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            if (facadeModuleId.includes('views/admin')) {
              return 'assets/admin-[name]-[hash].js'
            }
            if (facadeModuleId.includes('views/superadmin')) {
              return 'assets/superadmin-[name]-[hash].js'
            }
            if (facadeModuleId.includes('views/login')) {
              return 'assets/auth-[name]-[hash].js'
            }
          }
          return 'assets/[name]-[hash].js'
        },

        // Asset naming
        assetFileNames: 'assets/[name]-[hash].[ext]',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },

  // ESBuild options (alternative to terser)
  esbuild: {
    drop: ['console', 'debugger'],
  },

  // Optimization for development
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia'],
  },

  // Server configuration for development
  server: {
    port: 5173,
    open: true,
    cors: true,
  },

  // Preview configuration
  preview: {
    port: 8080,
    open: true,
  },
})
