import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      // 'prompt' plutot que 'autoUpdate' : l'utilisateur decide quand recharger,
      // via le toast affiche par <UpdatePrompt />.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Revoir',
        short_name: 'Revoir',
        description:
          'Planifier ses révisions grâce à la répétition espacée, sans stocker le contenu à apprendre.',
        lang: 'fr',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FAF9F6',
        theme_color: '#FAF9F6',
        categories: ['education', 'productivity'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // `txt` couvre THIRD-PARTY.txt : les licences des composants tiers
        // doivent rester lisibles hors ligne, comme le reste de l'application.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,txt}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
