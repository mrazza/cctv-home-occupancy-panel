/**
 * Formats an ISO 8601 timestamp string into a localized relative date and time display.
 * Returns an empty string for falsy inputs, and falls back to the raw string
 * if parsing or formatting fails.
 */
export function formatTime(isoString?: string | null, referenceDate?: Date | string | number): string {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return isoString

    const now = referenceDate ? new Date(referenceDate) : new Date()
    if (isNaN(now.getTime())) return isoString

    // Calculate local midnight timestamps to compare calendar days safely
    const startOfToday = new Date(now).setHours(0, 0, 0, 0)
    const startOfEvent = new Date(date).setHours(0, 0, 0, 0)
    const diffDays = Math.round((startOfToday - startOfEvent) / 86400000)

    const timeString = date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    })

    if (diffDays === 0) {
      return `Today @ ${timeString}`
    }
    if (diffDays === 1) {
      return `Yesterday @ ${timeString}`
    }
    if (diffDays > 1 && diffDays < 7) {
      const dayName = date.toLocaleDateString([], { weekday: 'long' })
      return `${dayName} @ ${timeString}`
    }

    const dateString = date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' })
    })
    return `${dateString} @ ${timeString}`
  } catch {
    return isoString
  }
}

