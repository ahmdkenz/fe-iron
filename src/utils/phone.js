export function sanitizePhoneNumber(raw) {
  if (!raw) return ''

  return raw.replace(/[^\d+]/g, '')
}
