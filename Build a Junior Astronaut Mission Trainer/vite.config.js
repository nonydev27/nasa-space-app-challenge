import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'
import { attachCrewRelay } from './server/relay.js'

// Runs the multiplayer crew relay inside `vite` and `vite preview`, so co-op
// works out of the box during development (use `npm run dev:lan` for a classroom).
const crewRelay = () => ({
  name: 'crew-relay',
  configureServer(server) {
    if (server.httpServer) attachCrewRelay(server.httpServer)
  },
  configurePreviewServer(server) {
    if (server.httpServer) attachCrewRelay(server.httpServer)
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    crewRelay(),
  ],
})
