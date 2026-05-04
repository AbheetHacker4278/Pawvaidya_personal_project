import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Triggering restart...
export default defineConfig({
  plugins: [react()],
  server: { port: 5175 }
})
