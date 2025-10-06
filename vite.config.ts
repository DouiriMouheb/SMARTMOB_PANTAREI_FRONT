import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy /api requests to your backend to avoid CORS
      '/api': {
        target: 'https://localhost:5133',
        changeOrigin: true,
        secure: false, // Allow self-signed certificates in dev
      },
    },
  },
})
