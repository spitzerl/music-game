import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [vue()],
    server: {
      port: 3000,
      watch: {
        usePolling: true,
      },
      proxy: {
        '/api': {
          target: env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001',
          changeOrigin: true,
        },
        '/socket.io': {
          target: env.VITE_SOCKET_URL || 'http://localhost:3001',
          changeOrigin: true,
          ws: true,
        },
        '/uploads': {
          target: env.VITE_SOCKET_URL || 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  };
});
