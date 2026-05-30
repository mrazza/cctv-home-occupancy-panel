import { describe, it, expect, vi } from 'vitest'
import { formatTime } from '../../app/utils/formatTime'

describe('formatTime utility', () => {
  const mockRefDate = '2026-05-30T12:00:00.000Z' // Saturday, May 30, 2026

  it('handles empty, null, or undefined inputs', () => {
    expect(formatTime()).toBe('')
    expect(formatTime(null)).toBe('')
    expect(formatTime('')).toBe('')
  })

  it('handles invalid date strings by returning the original string', () => {
    expect(formatTime('invalid-date')).toBe('invalid-date')
    expect(formatTime('not-a-timestamp', mockRefDate)).toBe('not-a-timestamp')
  })

  it('handles invalid referenceDate by returning the original string', () => {
    expect(formatTime('2026-05-30T10:00:00Z', 'invalid-ref-date')).toBe('2026-05-30T10:00:00Z')
  })

  it('formats Today relative time correctly', () => {
    // Today, May 30
    const todayEvent = '2026-05-30T10:00:00.000Z'
    const result = formatTime(todayEvent, mockRefDate)
    expect(result).toContain('Today @')
  })

  it('formats Yesterday relative time correctly', () => {
    // Yesterday, May 29
    const yesterdayEvent = '2026-05-29T15:00:00.000Z'
    const result = formatTime(yesterdayEvent, mockRefDate)
    expect(result).toContain('Yesterday @')
  })

  it('formats week days (2-6 days ago) correctly', () => {
    // Thursday, May 28 (2 days ago)
    const result2Days = formatTime('2026-05-28T10:00:00.000Z', mockRefDate)
    expect(result2Days).toContain('Thursday @')

    // Monday, May 25 (5 days ago)
    const result5Days = formatTime('2026-05-25T08:00:00.000Z', mockRefDate)
    expect(result5Days).toContain('Monday @')

    // Sunday, May 24 (6 days ago)
    const result6Days = formatTime('2026-05-24T08:00:00.000Z', mockRefDate)
    expect(result6Days).toContain('Sunday @')
  })

  it('formats numerical date within the current year for events 7+ days ago', () => {
    // Saturday, May 23 (exactly 7 days ago)
    const result7Days = formatTime('2026-05-23T10:00:00.000Z', mockRefDate)
    expect(result7Days).toContain('May 23 @')

    // May 5
    const resultMay5 = formatTime('2026-05-05T11:00:00.000Z', mockRefDate)
    expect(resultMay5).toContain('May 5 @')
  })

  it('formats numerical date with year for events from a different year', () => {
    // May 5, 2025 (different year)
    const resultPrevYear = formatTime('2025-05-05T11:00:00.000Z', mockRefDate)
    expect(resultPrevYear).toContain('May 5, 2025 @')

    // May 5, 2027 (future year - treated as numerical date with year)
    const resultFutureYear = formatTime('2027-05-05T11:00:00.000Z', mockRefDate)
    expect(resultFutureYear).toContain('May 5, 2027 @')
  })

  it('gracefully falls back on formatting exceptions inside try-catch', () => {
    const toLocaleTimeStringSpy = vi.spyOn(Date.prototype, 'toLocaleTimeString').mockImplementation(() => {
      throw new Error('Simulated formatting error')
    })

    const testDate = '2026-05-30T10:00:00.000Z'
    expect(formatTime(testDate, mockRefDate)).toBe(testDate)

    toLocaleTimeStringSpy.mockRestore()
  })

  it('uses default new Date() when no referenceDate is provided', () => {
    // If we don't provide a reference date, it uses the current system time.
    // Let's set a fake system time to ensure it works correctly.
    vi.useFakeTimers()
    vi.setSystemTime(new Date(mockRefDate))

    const todayEvent = '2026-05-30T10:00:00.000Z'
    expect(formatTime(todayEvent)).toContain('Today @')

    vi.useRealTimers()
  })
})
