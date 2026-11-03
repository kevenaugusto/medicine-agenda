import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Agenda de Medicamentos',
        short_name: 'Agenda Med',
        description:
          'Aplicação web progressiva para o gerenciamento de medicamentos, doses e horários — apoio à rotina de tratamento (ação de extensão UFMS Digital).',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        theme_color: '#0e7c66',
        background_color: '#f1f6f4',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: true, // service worker ativo também no localhost (desenvolvimento)
      },
    }),
  ],
})
