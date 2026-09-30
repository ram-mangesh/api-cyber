import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Dynamic Reverse Proxy to bypass CORS and SSL Errors for any Frontend-provided IP
app.use('/dynamic-proxy', createProxyMiddleware({
  router: (req) => {
    const target = req.headers['x-target-base-url'];
    if (!target) throw new Error('Missing x-target-base-url header');
    return target;
  },
  changeOrigin: true,
  secure: false, // Bypass self-signed cert issues
  ws: true,
  pathRewrite: {
    '^/dynamic-proxy': '' // Strip the /dynamic-proxy prefix before sending to target
  },
  onProxyReq: (proxyReq) => {
     proxyReq.removeHeader('x-target-base-url');
  }
}));

app.use(express.static(path.join(__dirname, 'dist')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
