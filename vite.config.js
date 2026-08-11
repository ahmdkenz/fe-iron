import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import VueDevTools from 'vite-plugin-vue-devtools'
import MetaLayouts from 'vite-plugin-vue-meta-layouts'
import vuetify from 'vite-plugin-vuetify'
import svgLoader from 'vite-svg-loader'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: tag => tag === 'swiper-container' || tag === 'swiper-slide',
          },
        },
      }),
      env.VITE_ENABLE_DEVTOOLS === 'true' ? VueDevTools() : null,
      vueJsx(),

      // Docs: https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin
      vuetify({
        styles: {
          configFile: 'src/assets/styles/variables/_vuetify.scss',
        },
      }),

      // Docs: https://github.com/dishait/vite-plugin-vue-meta-layouts?tab=readme-ov-file
      MetaLayouts({
        target: './src/layouts',
        defaultLayout: 'default',
      }),

      // Limit component scanning to reusable components so Vite doesn't crawl views on every startup.
      Components({
        dirs: [
          'src/@core/components',
          'src/components',
          'src/modules/**/features/**/components',
          'src/modules/**/shared/components',
        ],
        dts: true,
      }),

      // Docs: https://github.com/antfu/unplugin-auto-import#unplugin-auto-import
      AutoImport({
        imports: ['vue', 'vue-router', '@vueuse/core', '@vueuse/math', 'pinia'],
        dirs: [
          './src/@core/utils',
          './src/@core/composable/',
          './src/composables/',
          './src/utils/',
          './src/plugins/*/composables/*',
        ],
        vueTemplate: true,

        // Disabled to avoid confusion & accidental usage.
        ignore: ['useCookies', 'useStorage'],
        eslintrc: {
          enabled: true,
          filepath: './.eslintrc-auto-import.json',
        },
      }),
      svgLoader(),

      // Docs: https://vite-pwa-org.netlify.app/
      // registerType 'prompt' + injectRegister false: registration is manual,
      // from src/composables/usePwaUpdate.js only — a new SW never activates
      // on its own, so a background deploy can't wipe an in-progress form.
      VitePWA({
        registerType: 'prompt',
        injectRegister: false,
        manifest: {
          name: 'IRON - Intelligent Record of Organization Number',
          short_name: 'IRON',
          description: 'IRON — aplikasi internal finance/ERP untuk pencatatan dan rekonsiliasi keuangan.',
          theme_color: '#666CFF',
          background_color: '#FFFFFF',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            { src: '/images/iron/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/images/iron/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/images/iron/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
          // No runtimeCaching entry: /api and /sanctum calls must always hit
          // the network untouched — this is a finance app, never serve stale
          // financial data from a cache.
          navigateFallbackDenylist: [/^\/api\//, /^\/sanctum\//],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ].filter(Boolean),
    define: { 'process.env': {} },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@themeConfig': fileURLToPath(new URL('./themeConfig.js', import.meta.url)),
        '@core': fileURLToPath(new URL('./src/@core', import.meta.url)),
        '@layouts': fileURLToPath(new URL('./src/@layouts', import.meta.url)),
        '@images': fileURLToPath(new URL('./src/assets/images/', import.meta.url)),
        '@styles': fileURLToPath(new URL('./src/assets/styles/', import.meta.url)),
        '@configured-variables': fileURLToPath(new URL('./src/assets/styles/variables/_template.scss', import.meta.url)),
      },
    },
    server: {
      warmup: {
        clientFiles: [
          './src/main.js',
          './src/App.vue',
          './src/@layouts/**/*.vue',
          './src/components/**/*.vue',
        ],
      },
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-vue': ['vue', 'vue-router', 'pinia'],
            'vendor-vuetify': ['vuetify'],
            'vendor-charts': ['vue3-apexcharts', 'apexcharts'],
            'vendor-axios': ['axios'],
            'vendor-sweetalert': ['sweetalert2'],
          },
        },
      },
    },
    optimizeDeps: {
      exclude: ['vuetify'],
      include: [
        'sweetalert2',
        'axios',
        '@vueuse/core',
        'pinia',
        'vue-router',
      ],
    },
  }
})
