import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Builds the demo page (index.html) for GitHub Pages instead of the library.
export default defineConfig({
  plugins: [react()],
  base: '/react-button-o-matic/',
  build: {
    outDir: 'site',
  },
})
