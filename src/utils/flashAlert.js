const FLASH_ALERT_KEY = 'iron:flash-alert'

export function setFlashAlert(payload) {
  if (typeof window === 'undefined')
    return

  sessionStorage.setItem(FLASH_ALERT_KEY, JSON.stringify(payload))
}

export function consumeFlashAlert() {
  if (typeof window === 'undefined')
    return null

  const rawPayload = sessionStorage.getItem(FLASH_ALERT_KEY)
  if (!rawPayload)
    return null

  sessionStorage.removeItem(FLASH_ALERT_KEY)

  try {
    return JSON.parse(rawPayload)
  } catch {
    return null
  }
}
