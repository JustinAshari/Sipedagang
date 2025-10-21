import api from '@/services/authService'

export const fetchDashboardStats = async (month = null, year = null) => {
  try {
    const response = await api.get('/pengadaanclear')
    const allData = response.data || []

    // Jika tidak ada parameter bulan/tahun, return semua data
    if (!month || !year) {
      return allData
    }

    // Filter data berdasarkan bulan dan tahun dari created_at atau tanggal_pengadaan
    const filteredData = allData.filter((item) => {
      if (!item.created_at && !item.tanggal_pengadaan) {
        return false // Exclude item tanpa tanggal
      }

      const itemDate = new Date(item.created_at || item.tanggal_pengadaan)
      const itemMonth = itemDate.getMonth() + 1 // 1-12
      const itemYear = itemDate.getFullYear()

      return itemMonth === month && itemYear === year
    })

    console.log(
      `Filtered pengadaan data for ${month}/${year}:`,
      filteredData.length,
      'items',
    )
    return filteredData
  } catch (error) {
    console.error('Service: Dashboard stats error:', error)
    throw error
  }
}

export const fetchPengadaanByCategory = async (month = null, year = null) => {
  try {
    const response = await api.get('/pengadaanclear')
    const allData = response.data || []

    // Filter data berdasarkan bulan dan tahun jika parameter diberikan
    let filteredData = allData
    if (month && year) {
      filteredData = allData.filter((item) => {
        if (!item.created_at && !item.tanggal_pengadaan) {
          return false
        }

        const itemDate = new Date(item.created_at || item.tanggal_pengadaan)
        const itemMonth = itemDate.getMonth() + 1
        const itemYear = itemDate.getFullYear()

        return itemMonth === month && itemYear === year // ✅ Strict month/year filtering
      })
    }

    // Hitung berdasarkan jenis_pengadaan_barang
    const categories = {}
    filteredData.forEach((item) => {
      const category = item.jenis_pengadaan_barang || 'Lainnya'
      categories[category] = (categories[category] || 0) + 1
    })

    // ✅ Jika tidak ada data untuk bulan tersebut, categories akan menjadi {}
    console.log(`Pengadaan categories for ${month}/${year}:`, categories)
    return categories
  } catch (error) {
    console.error('Service: Pengadaan category error:', error)
    throw error
  }
}
