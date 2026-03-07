import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { espViteBuild } from "@ikoz/vite-plugin-preact-esp32";

// https://vite.dev/config/
export default defineConfig({
  plugins: [espViteBuild(), preact()],
})
