import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { createProxyMiddleware } from 'http-proxy-middleware'

// Custom plugin to add the dynamic proxy to the Vite Dev Server
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Fallback target is only used when the request omits x-target-base-url.
  // Left empty by default so a misconfigured request fails loudly instead of
  // silently hitting a hardcoded host.
  const fallbackTarget = env.VITE_API_BASE_URL

  const dynamicProxyPlugin = () => ({
    name: 'dynamic-proxy',
    configureServer(server) {
      server.middlewares.use(
        '/dynamic-proxy',
        createProxyMiddleware({
          router: (req) => {
            const target = req.headers['x-target-base-url'] || fallbackTarget
            if (!target) throw new Error('Missing x-target-base-url header')
            return target
          },
          changeOrigin: true,
          secure: false, // Bypass SSL cert errors
          pathRewrite: { '^/dynamic-proxy': '' },
          onProxyReq: (proxyReq) => {
            proxyReq.removeHeader('x-target-base-url')
          }
        })
      )
    }
  })

  return {
    plugins: [react(), tailwindcss(), dynamicProxyPlugin()],
    server: {
      allowedHosts: true,
      hmr: false,
      proxy: {
        // Legacy Twilio route
        '/twilio': {
          target: 'https://api.twilio.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/twilio/, ''),
        }
      }
    }
  }
})
