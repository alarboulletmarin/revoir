// SPDX-License-Identifier: AGPL-3.0-only

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const { version } = JSON.parse(readFileSync('./package.json', 'utf8'))

/**
 * Le commit d'où sort ce build, pour que les réglages puissent pointer la
 * source *exacte* du JavaScript servi — c'est ce que l'AGPL appelle la
 * « Corresponding Source », et un lien vers `main` ne la désigne pas.
 *
 * Un build depuis une archive n'a pas de dépôt git : on renvoie une chaîne
 * vide plutôt que d'échouer, et l'application n'affiche alors que la version.
 */
function commit() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

export default defineConfig({
  base: '/',
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APP_COMMIT__: JSON.stringify(commit()),
  },
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
