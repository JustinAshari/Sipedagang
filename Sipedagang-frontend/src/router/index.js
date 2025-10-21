import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useResetPasswordStore } from '@/stores/resetStore'
import { usePengadaanStore } from '@/stores/pengadaanStore'

import AdminLayout from '@/layouts/AdminLayout.vue'
import SuperAdminLayout from '@/layouts/SuperAdminLayout.vue'

// GUEST
import Login from '../views/login/Login.vue'
import ResetRequest from '../views/login/ResetPassword.vue'
import ResetPasswordAccepted from '../views/login/ResetPasswordAccepted.vue'
import NotFound from '@/views/login/NotFound.vue'

// Admin
import DashboardAdmin from '../views/admin/AdminView.vue'
import FormAdmin from '../views/admin/FormData.vue'
import LihatDataAdmin from '../views/admin/LihatData.vue'
import DataPemohonAdmin from '../views/admin/DataPemohon.vue'
import LihatDataPemohonAdmin from '../views/admin/LihatDataPemohon.vue'
import EditProfileAdmin from '../views/admin/EditProfile.vue'
import EditFormData from '../views/admin/EditFormData.vue'

// Super Admin
import SuperAdminView from '@/views/superadmin/SuperAdminView.vue'
import FormDataView from '@/views/superadmin/FormDataView.vue'
import RiwayatView from '@/views/superadmin/RiwayatView.vue'
import RiwayatEditView from '@/views/superadmin/RiwayatEditView.vue'
import RiwayatPreviewView from '@/views/superadmin/RiwayatPreviewView.vue'
import Staff from '@/views/superadmin/StaffView.vue'
import StaffAddEditView from '@/views/superadmin/StaffAddEditView.vue'
import DataPemohonView from '@/views/superadmin/DataPemohonView.vue'
import LihatDataPemohonView from '@/views/superadmin/LihatDataPemohonView.vue'
import SettingPengadaanView from '@/views/superadmin/SettingPengadaanView.vue'
import LihatSettingPengadaanView from '@/views/superadmin/LihatSettingPengadaanView.vue'
import EditProfileView from '@/views/superadmin/EditProfileView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Login },
    { path: '/login', component: Login, name: 'Login' },
    { path: '/resetpassword', component: ResetRequest, name: 'ResetRequest' },
    {
      path: '/resetpassword-accepted',
      component: ResetPasswordAccepted,
      name: 'ResetPasswordAccepted',
      beforeEnter: (to, from, next) => {
        const namapengguna =
          to.params.namapengguna ||
          to.query.namapengguna ||
          to.query.nama_pengguna

        if (!namapengguna) {
          const resetStore = useResetPasswordStore()

          if (!resetStore.requestedUsername) {
            next({
              path: '/resetpassword',
            })
          } else {
            next()
          }
        } else {
          next()
        }
      },
    },
    {
      path: '/logout',
      name: 'Logout',
      beforeEnter: async (to, from, next) => {
        const authStore = useAuthStore()
        try {
          if (authStore.isAuthenticated) {
            await authStore.logout()
          }
        } catch (error) {
          console.error('Logout error:', error)
        }
        next('/login')
      },
    },

    // --- ADMIN ROUTES (Struktur Diperbaiki) ---
    {
      path: '/admin',
      component: AdminLayout,
      redirect: '/admin/dashboard',
      children: [
        {
          path: 'dashboard',
          component: DashboardAdmin,
          name: 'Dashboard',
          meta: { requiresAuth: true, role: 'admin' },
        },
        {
          path: 'form',
          component: FormAdmin,
          name: 'Form',
          meta: { requiresAuth: true, role: 'admin' },
        },
        {
          path: 'form-edit/:id',
          component: EditFormData,
          name: 'EditPage',
          props: true,
          meta: { requiresAuth: true, role: 'admin' },
        },
        {
          path: 'lihatdata',
          component: LihatDataAdmin,
          name: 'LihatData',
          meta: { requiresAuth: true, role: 'admin' },
        },
        {
          path: 'datapemohon',
          name: 'data pemohon admin',
          component: DataPemohonAdmin,
          meta: { requiresAuth: true, role: 'admin' },
        },
        {
          path: 'datapemohon-list',
          name: 'data pemohon list',
          component: LihatDataPemohonAdmin,
          meta: { requiresAuth: true, role: 'admin' },
        },
        {
          path: 'datapemohon-edit/:id',
          name: 'edit pemohon admin',
          component: DataPemohonAdmin,
          meta: { requiresAuth: true, role: 'admin' },
        },
        {
          path: 'editprofile',
          name: 'edit profile admin',
          component: EditProfileAdmin,
          meta: { requiresAuth: true, role: 'admin' },
        },
      ],
    },

    // --- SUPER ADMIN ROUTES (Struktur Diperbaiki) ---
    {
      path: '/superadmin',
      component: SuperAdminLayout,
      redirect: '/superadmin/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'superadmin dashboard',
          component: SuperAdminView,
          meta: { requiresAuth: true, role: 'superadmin' },
        },
        {
          path: 'input',
          name: 'formdata superadmin',
          component: FormDataView,
          meta: { requiresAuth: true, role: 'superadmin' },
        },
        {
          path: 'riwayat',
          name: 'riwayat superadmin',
          component: RiwayatView,
          meta: { requiresAuth: true, role: 'superadmin' },
        },
        {
          path: 'riwayat-edit/:id',
          name: 'edit riwayat',
          component: RiwayatEditView,
          meta: { requiresAuth: true, role: 'superadmin' },
        },
        {
          path: 'admin',
          name: 'staff',
          component: Staff,
          meta: { requiresAuth: true, role: 'superadmin' },
        },
        {
          path: 'admin-add',
          name: 'add staff',
          component: StaffAddEditView,
          meta: { requiresAuth: true, role: 'superadmin' },
        },
        {
          path: 'admin-edit/:id',
          name: 'edit staff',
          component: StaffAddEditView,
          props: true,
          meta: { requiresAuth: true, role: 'superadmin' },
        },
        {
          path: 'datapemohon',
          name: 'rekap data',
          component: DataPemohonView,
          meta: { requiresAuth: true, role: 'superadmin' },
        },
        {
          path: 'datapemohon-list',
          name: 'list pemohon',
          component: LihatDataPemohonView,
          meta: { requiresAuth: true, role: 'superadmin' },
        },
        {
          path: 'datapemohon-edit/:id',
          name: 'edit pemohon',
          component: DataPemohonView,
          meta: { requiresAuth: true, role: 'superadmin' },
        },
        {
          path: 'settingpengadaan',
          name: 'setting pengadaan',
          component: SettingPengadaanView,
          meta: { requiresAuth: true, role: 'superadmin' },
        },
        {
          path: 'settingpengadaan-list',
          name: 'setting pengadaan list',
          component: LihatSettingPengadaanView,
          meta: { requiresAuth: true, role: 'superadmin' },
        },
        {
          path: 'settingpengadaan-edit/:id',
          name: 'setting pengadaan edit',
          component: SettingPengadaanView,
          meta: { requiresAuth: true, role: 'superadmin' },
        },
        {
          path: 'editprofile',
          name: 'edit profile superadmin',
          component: EditProfileView,
          meta: { requiresAuth: true, role: 'superadmin' },
        },
      ],
    },

    // --- OTHER ROUTES (Tidak berubah) ---
    {
      path: '/surat-preview/:id',
      name: 'cetak surat',
      component: RiwayatPreviewView,
      props: true,
      meta: { requiresAuth: true },
      beforeEnter: async (to, from, next) => {
        const pengadaanStore = usePengadaanStore()
        try {
          const data = await pengadaanStore.fetchPengadaanById(to.params.id)
          const noPO = data?.no_preorder || 'PO'
          const namaPerusahaan = data?.nama_perusahaan || 'Perusahaan'
          document.title = `SIPEDAGANG-${noPO}-${namaPerusahaan}`
        } catch {
          document.title = 'SIPEDAGANG - Cetak Surat'
        }
        next()
      },
    },
    { path: '/unauthorized', name: 'Unauthorized', component: NotFound },
    { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (authStore.token && !authStore.checkTokenExpiration()) {
    authStore.clearAuth()
  }

  const isAuthenticated = authStore.isAuthenticated
  const userRole = authStore.userRole
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const requiredRole = to.meta.role

  if (requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (requiredRole && userRole !== requiredRole) {
    next('/unauthorized')
  } else if (to.path === '/login' && isAuthenticated) {
    if (userRole === 'admin') {
      next('/admin/dashboard')
    } else if (userRole === 'superadmin') {
      next('/superadmin/dashboard')
    } else {
      next('/')
    }
  } else {
    next()
  }
})

export default router
