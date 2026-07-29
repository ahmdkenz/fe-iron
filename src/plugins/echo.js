import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import api from '@/utils/axios'

// Beberapa bagian pusher-js/laravel-echo masih membaca window.Pusher sebagai fallback.
window.Pusher = Pusher

let echoInstance = null

// Authorizer custom: reuse instance axios `api` yang sudah ada (bukan fetch/XHR
// bawaan Echo) supaya request ke /broadcasting/auth ikut withCredentials, header
// X-XSRF-TOKEN, dan interceptor refresh token 401 yang sudah dipakai endpoint lain.
function ironAuthorizer(channel) {
  return {
    authorize(socketId, callback) {
      api.post('/broadcasting/auth', {
        socket_id: socketId,
        channel_name: channel.name,
      })
        .then(response => callback(false, response.data))
        .catch(error => callback(true, error))
    },
  }
}

export function getEcho() {
  if (echoInstance)
    return echoInstance

  const port = Number(import.meta.env.VITE_REVERB_PORT) || 443
  const forceTLS = (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https'

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: forceTLS ? 80 : port,
    wssPort: port,
    forceTLS,
    enabledTransports: forceTLS ? ['ws', 'wss'] : ['ws'],
    authorizer: ironAuthorizer,
  })

  return echoInstance
}

export function disconnectEcho() {
  if (!echoInstance)
    return

  echoInstance.disconnect()
  echoInstance = null
}
