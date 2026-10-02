import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Allows any *.localhost tenant subdomain through Vite's Host-header
    // check (separate from the --host 0.0.0.0 bind in the Dockerfile,
    // which only controls which network interfaces it listens on).
    allowedHosts: true,
    // Docker Desktop on Windows doesn't forward inotify events for
    // bind-mounted files, so native fs.watch never fires inside the
    // container — poll instead so HMR/full-reload actually picks up edits.
    watch: {
      usePolling: true,
      // A tighter interval causes sustained CPU usage on Docker Desktop
      // because Windows bind mounts must be scanned repeatedly.
      interval: 1000,
    },
  },
});
