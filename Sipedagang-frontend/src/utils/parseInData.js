/**
 * Safely parse in_data coming from API or local payloads.
 * - Accepts already-parsed arrays, JSON strings, null/undefined and objects.
 * - Returns an array (possibly empty) and never throws.
 *
 * @param {any} raw
 * @returns {Array}
 */
export function parseInData(raw) {
  try {
    if (!raw) return []

    // If already an array, return as-is
    if (Array.isArray(raw)) return raw

    // If it's an object (single item), wrap in array
    if (typeof raw === 'object') return [raw]

    // If it's a JSON string, try to parse
    if (typeof raw === 'string') {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    }

    return []
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('parseInData: failed to parse', e)
    return []
  }
}

export default parseInData
export function parseInDataString(inData) {
  if (!inData) return []
  try {
    const parsed = typeof inData === 'string' ? JSON.parse(inData) : inData
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    // swallow error and return empty array
    // eslint-disable-next-line no-console
    console.error('parseInDataString error', e)
    return []
  }
}
