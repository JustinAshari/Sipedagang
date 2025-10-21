import api from '@/services/authService'

export const createPengadaan = (data) => {
  return api.post('/pengadaan', data)
}

export const getPengadaan = (
  page = 1,
  perPage = 10,
  search = '',
  tanggalAwal = '',
  tanggalAkhir = '',
) => {
  const params = new URLSearchParams()
  params.append('page', page)
  params.append('per_page', perPage)

  if (search && search.trim()) {
    params.append('search', search.trim())
  }

  if (tanggalAwal && tanggalAwal.trim()) {
    params.append('tanggal_awal', tanggalAwal.trim())
  }

  if (tanggalAkhir && tanggalAkhir.trim()) {
    params.append('tanggal_akhir', tanggalAkhir.trim())
  }

  const url = `/pengadaan?${params.toString()}`

  return api.get(url)
}

export const getPengadaanById = (id) => {
  return api.get(`/pengadaan/${id}`)
}

export const updatePengadaan = (id, data) => {
  const requestData = {
    _method: 'PUT',
    ...data,
  }

  return api.post(`/pengadaan/${id}`, requestData, {
    headers: {
      'Content-Type': 'application/json',
      'X-HTTP-Method-Override': 'PUT',
    },
  })
}

export const deletePengadaan = (id) => {
  const formData = new FormData()
  formData.append('_method', 'DELETE')

  return api.post(`/pengadaan/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}
