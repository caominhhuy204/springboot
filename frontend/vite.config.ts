import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || "http://localhost:8080";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/oauth2": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/login": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
})
