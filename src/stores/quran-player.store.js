import { defineStore } from 'pinia'
import { DEFAULT_QARI_KODE, namaQari } from '@/constants/qari'

// Elemen <audio> sendiri sengaja TIDAK disimpan di reactive state (DOM node
// di Pinia state itu anti-pattern) — disimpan sebagai closure module-level,
// di-set sekali lewat registerAudioEl() dari GlobalQuranPlayer.vue.
let _audioEl = null

export const useQuranPlayerStore = defineStore('quran-player', {
  state: () => ({
    mode: null, // null | 'ikuti' | 'santai'
    qariKode: localStorage.getItem('quran:qari') || DEFAULT_QARI_KODE,
    surah: null, // objek surah penuh dari GET /quran/surah/:nomor
    currentAyatNumber: null,
    playing: false,
    currentTime: 0,
    duration: 0,
    error: '',

    // Di-bump saat sequential playback natural selesai (habis ayat terakhir).
    // GlobalQuranPlayer.vue watch nilai ini utk trigger toast "Selesai
    // membaca" — sengaja tidak dieksekusi di sini karena useSweetAlert()
    // butuh context komponen (pakai useTheme() di dalamnya).
    finishedToken: 0,
  }),

  getters: {
    hasTrack: state => state.mode !== null && !!state.surah,

    currentAyat: state => (state.mode === 'ikuti'
      ? (state.surah?.ayat?.find(a => a.nomorAyat === state.currentAyatNumber) ?? null)
      : null),

    hasNextAyat: state => {
      if (state.mode !== 'ikuti' || !state.surah) return false

      const idx = state.surah.ayat.findIndex(a => a.nomorAyat === state.currentAyatNumber)

      return idx >= 0 && idx < state.surah.ayat.length - 1
    },

    hasPrevAyat: state => {
      if (state.mode !== 'ikuti' || !state.surah) return false

      return state.surah.ayat.findIndex(a => a.nomorAyat === state.currentAyatNumber) > 0
    },

    title: state => {
      if (!state.surah) return ''
      if (state.mode === 'ikuti' && state.currentAyatNumber)
        return `${state.surah.namaLatin} · Ayat ${state.currentAyatNumber}`

      return state.surah.namaLatin
    },

    qariName: state => namaQari(state.qariKode),
  },

  actions: {
    registerAudioEl(el) {
      _audioEl = el
    },

    playAyat(surah, nomorAyat, qariKode = this.qariKode) {
      this.mode = 'ikuti'
      this.surah = surah
      this.qariKode = qariKode
      this._loadAyat(nomorAyat)
    },

    playFull(surah, qariKode = this.qariKode) {
      this.mode = 'santai'
      this.surah = surah
      this.qariKode = qariKode
      this.currentAyatNumber = null
      this.currentTime = 0
      this.duration = 0

      const src = surah.audioFull?.[qariKode] ?? Object.values(surah.audioFull ?? {})[0] ?? ''
      if (!src || !_audioEl) return

      _audioEl.src = src
      _audioEl.play()?.catch(() => {})
    },

    togglePlayPause() {
      if (!_audioEl || !this.hasTrack) return

      if (this.playing) _audioEl.pause()
      else _audioEl.play()?.catch(() => {})
    },

    seek(time) {
      if (_audioEl) _audioEl.currentTime = time
    },

    setQari(kode) {
      if (kode === this.qariKode) return

      this.qariKode = kode
      try {
        localStorage.setItem('quran:qari', kode)
      } catch (e) {
        console.error('Gagal menyimpan preferensi qari', e)
      }

      if (!this.surah) return

      if (this.mode === 'ikuti' && this.currentAyatNumber != null) {
        // Restart ayat aktif dgn suara baru + autoplay — sama seperti
        // watch(qariKode) yang dulu ada di Baca.vue.
        this._loadAyat(this.currentAyatNumber)
      } else if (this.mode === 'santai') {
        // Ganti src tanpa autoplay — sama seperti perilaku QuranAudioPlayer
        // lama (autoplay prop tidak pernah dipakai di mode santai).
        this.currentTime = 0
        this.duration = 0
        if (_audioEl) _audioEl.src = this.surah.audioFull?.[kode] ?? ''
      }
    },

    nextAyat() {
      if (this.mode !== 'ikuti' || !this.surah) return

      const idx = this.surah.ayat.findIndex(a => a.nomorAyat === this.currentAyatNumber)
      const next = idx >= 0 ? this.surah.ayat[idx + 1] : null

      if (next) {
        this._loadAyat(next.nomorAyat)

        return
      }

      _audioEl?.pause()
      this.currentAyatNumber = null
      this.currentTime = 0
      this.duration = 0
      this.finishedToken++
    },

    prevAyat() {
      if (this.mode !== 'ikuti' || !this.surah) return

      const idx = this.surah.ayat.findIndex(a => a.nomorAyat === this.currentAyatNumber)
      if (idx > 0) this._loadAyat(this.surah.ayat[idx - 1].nomorAyat)
    },

    stop() {
      _audioEl?.pause()
      this.mode = null
      this.surah = null
      this.currentAyatNumber = null
      this.playing = false
      this.currentTime = 0
      this.duration = 0

      if (_audioEl) {
        _audioEl.removeAttribute('src')
        _audioEl.load()
      }

      // qariKode SENGAJA tidak direset — itu preferensi tingkat device, bukan
      // bagian dari sesi playback (lihat catatan senada di useQuranLocalStore.js).
    },

    _loadAyat(nomorAyat) {
      const ayat = this.surah?.ayat?.find(a => a.nomorAyat === nomorAyat)
      const src = ayat?.audio?.[this.qariKode]
      if (!ayat || !src || !_audioEl) return

      this.currentAyatNumber = nomorAyat
      this.currentTime = 0
      this.duration = 0
      _audioEl.src = src
      _audioEl.play()?.catch(() => {})
    },

    // Handler internal, dipanggil dari event <audio> di GlobalQuranPlayer.vue.
    _handleLoadedMetadata() {
      if (_audioEl) this.duration = _audioEl.duration || 0
    },

    _handleTimeUpdate() {
      if (_audioEl) this.currentTime = _audioEl.currentTime
    },

    _handlePlay() {
      this.playing = true
    },

    _handlePause() {
      this.playing = false
    },

    _handleEnded() {
      if (this.mode === 'ikuti') this.nextAyat()
      else {
        this.playing = false
        this.currentTime = 0
      }
    },

    _handleError() {
      this.playing = false
      this.error = 'Gagal memuat audio, coba lagi.'
    },
  },
})
