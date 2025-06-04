import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    open: true,
    hmr: {
      overlay: false
    },
    proxy: {
      '/api/claude': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/claude/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Add the API key to the request headers
            proxyReq.setHeader('x-api-key', process.env.VITE_CLAUDE_API_KEY);
            proxyReq.setHeader('anthropic-version', '2023-06-01');
          });
        }
      }
    }
  },
  build: {
    outDir: 'dist'
  }
})