import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv } from 'vite'
import { attachCrewRelay } from './server/relay.js'
import { nasaProxyMiddleware } from './server/nasaProxy.js'

// Runs the multiplayer crew relay and the NASA data proxy inside `vite` and
// `vite preview`, so co-op and live data work out of the box during development
// (use `npm run dev:lan` for a classroom).
const astrolabServer = () => ({
  name: 'astrolab-server',
  configureServer(server) {
    server.middlewares.use(nasaProxyMiddleware())
    if (server.httpServer) attachCrewRelay(server.httpServer)
  },
  configurePreviewServer(server) {
    server.middlewares.use(nasaProxyMiddleware())
    if (server.httpServer) attachCrewRelay(server.httpServer)
  },
})

const env = loadEnv('development', process.cwd(), '')
if (!process.env.NASA_API_KEY && env.NASA_API_KEY) process.env.NASA_API_KEY = env.NASA_API_KEY

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    astrolabServer(),
  ],
  build: {
    rolldownOptions: {
      output: {
        // three.js in its own long-cached chunk
        advancedChunks: { groups: [{ name: 'three', test: /node_modules[\\/]three/ }] },
      },
    },
    chunkSizeWarningLimit: 800,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'server/**/*.test.js'],
  },
})
