/**
 * Formats an ISO 8601 timestamp string into a localized time display (HH:MM:SS).
 * Returns an empty string for falsy inputs, and falls back to the raw string
 * if parsing or formatting fails.
 */
export function formatTime(isoString?: string | null): string {
  if (!isoString) return ''
  try {
    return new Date(isoString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return isoString
  }
}
