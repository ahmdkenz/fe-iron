import { deepMerge } from '@antfu/utils'
import { createVuetify } from 'vuetify'
import { VBtn } from 'vuetify/components/VBtn'
import defaults from './defaults'
import { icons } from './icons'
import { staticPrimaryColor, staticPrimaryDarkenColor, themes } from './theme'
import { themeConfig } from '@themeConfig'

// Styles
import { cookieRef } from '@/@layouts/stores/config'
import '@core/scss/template/libs/vuetify/index.scss'
import 'vuetify/styles'

// Warna primary lama (Bootstrap blue) dari skin sebelum di-restore ke skin admin ungu.
// Cookie yang masih menyimpan warna ini belum pernah di-custom manual oleh user secara
// sadar (nilai ini hanya pernah jadi default lama), jadi aman dialihkan otomatis ke
// default baru. Warna custom lain yang benar-benar dipilih user tetap dipertahankan.
const legacyLightPrimaryColors = ['#0d6efd', '#0D6EFD']
const legacyLightPrimaryDarkenColors = ['#0b5ed7', '#0B5ED7']

function resolveLightPrimaryColor(cookieKey, legacyColors, fallback) {
  const colorRef = cookieRef(cookieKey, fallback)

  if (legacyColors.includes(colorRef.value))
    colorRef.value = fallback

  return colorRef.value
}

export default function (app) {
  const cookieThemeValues = {
    defaultTheme: resolveVuetifyTheme(themeConfig.app.theme),
    themes: {
      light: {
        colors: {
          'primary': resolveLightPrimaryColor('lightThemePrimaryColor', legacyLightPrimaryColors, staticPrimaryColor),
          'primary-darken-1': resolveLightPrimaryColor('lightThemePrimaryDarkenColor', legacyLightPrimaryDarkenColors, staticPrimaryDarkenColor),
        },
      },
      dark: {
        colors: {
          'primary': cookieRef('darkThemePrimaryColor', staticPrimaryColor).value,
          'primary-darken-1': cookieRef('darkThemePrimaryDarkenColor', staticPrimaryDarkenColor).value,
        },
      },
    },
  }

  const optionTheme = deepMerge({ themes }, cookieThemeValues)

  const vuetify = createVuetify({
    aliases: {
      IconBtn: VBtn,
    },
    defaults,
    icons,
    theme: optionTheme,
  })

  app.use(vuetify)
}
