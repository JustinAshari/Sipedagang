import { describe, it, expect } from 'vitest'
import { parseInDataString } from '@/utils/parseInData'

describe('parseInDataString', () => {
  it('returns empty array for null/undefined', () => {
    expect(parseInDataString(null)).toEqual([])
    expect(parseInDataString(undefined)).toEqual([])
  })

  it('parses valid JSON string array', () => {
    const json = JSON.stringify([{ no_in: 1, kuantum: '10 KG' }])
    expect(parseInDataString(json)).toEqual([{ no_in: 1, kuantum: '10 KG' }])
  })

  it('returns empty array for invalid JSON', () => {
    expect(parseInDataString('not json')).toEqual([])
  })

  it('returns input if already array', () => {
    const arr = [{ a: 1 }]
    expect(parseInDataString(arr)).toEqual(arr)
  })
})
