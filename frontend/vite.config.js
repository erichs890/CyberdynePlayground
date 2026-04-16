import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // VULN-076/213: source maps habilitados em build — expoe source completo + secrets em comentarios
  build: {
    sourcemap: true
  },
  server: {
    port: 5173,
    // Sem headers de segurança no dev server
    headers: {
      'X-Powered-By': 'Vite 5.2 / React 18.3',
      'Server': 'VulnHub-Dev/1.0'
    },
    proxy: {
      '/api': 'http://localhost:3000',
      '/wp-login.php': 'http://localhost:3000',
      '/wp-admin': 'http://localhost:3000',
      '/wp-json': 'http://localhost:3000',
      '/wp-content': 'http://localhost:3000',
      '/wp-config.php.bak': 'http://localhost:3000',
      '/wp-author': 'http://localhost:3000',
      '/xmlrpc.php': 'http://localhost:3000',
      '/readme.html': 'http://localhost:3000'
    }
  }
});
