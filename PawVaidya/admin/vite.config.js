import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { 
    port: 5174,
    fs: {
      allow: [
        'C:/Users/Abheet seth/Desktop/ABHEET PROJECTS ALL/PAWVAIDYA_PERSONAL_PROJECT/PawVaidya/admin',
        'C:/Users/Abheet seth/.gemini'
      ]
    }
  },
})
