import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react()
    ],
    base: '/',
    build: {
      outDir: 'dist',
      sourcemap: env.VITE_APP_ENV !== 'production',
    },
    server: {
      port: 5173,
      strictPort: true,
      host: true
    }
  }
})
