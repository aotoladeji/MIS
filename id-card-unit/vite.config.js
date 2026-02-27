import { defineConfig } from 'vite'
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3001,  // ← ADD THIS: Different port from ID-Card-Platform
    proxy: {
      "/api": {
        target: "http://localhost:5000",  // Your other app's backend
        changeOrigin: true,
        secure: false
      }
    }
  }
})
