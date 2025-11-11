import { describe, it, expect } from 'vitest'
import { parseInData } from '../parseInData'

describe('parseInData', () => {
  it('returns empty array for null/undefined', () => {
    expect(parseInData(null)).toEqual([])
    expect(parseInData(undefined)).toEqual([])
  })

  it('returns array if input already array', () => {
    const arr = [{ a: 1 }]
    expect(parseInData(arr)).toBe(arr)
  })

  it('wraps object into array', () => {
    const obj = { a: 1 }
    expect(parseInData(obj)).toEqual([obj])
  })

  it('parses JSON string to array', () => {
    const json = JSON.stringify([{ x: 1 }, { y: 2 }])
    expect(parseInData(json)).toEqual([{ x: 1 }, { y: 2 }])
  })

  it('returns empty array for invalid JSON string', () => {
    expect(parseInData('not json')).toEqual([])
  })
})
