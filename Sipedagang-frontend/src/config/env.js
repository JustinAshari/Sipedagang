export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  storageUrl:
    import.meta.env.VITE_STORAGE_URL || 'http://localhost:8000/storage',

  getStorageUrl: (path) => {
    if (!path) return null

    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }

    if (path.startsWith('storage/')) {
      return `${config.apiBaseUrl}/${path}`
    }

    return `${config.storageUrl}/profile_photos/${path}`
  },
}
