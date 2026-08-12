import { onBeforeUnmount, ref } from 'vue'

const timeFormatter = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Jakarta',
})

/**
 * Jam live WIB (Asia/Jakarta) untuk header, update tiap menit.
 */
export function useWibClock() {
  const timeLabel = ref(timeFormatter.format(new Date()))

  const tickTimer = setInterval(() => {
    timeLabel.value = timeFormatter.format(new Date())
  }, 60000)

  onBeforeUnmount(() => clearInterval(tickTimer))

  return { timeLabel }
}
