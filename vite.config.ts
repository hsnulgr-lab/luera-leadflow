import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');




  const n8nUrl = env.VITE_N8N_WEBHOOK_URL;
  let proxy = {};

  if (n8nUrl) {
    try {
      const url = new URL(n8nUrl);
      proxy['/api/n8n'] = {
        target: url.origin,
        changeOrigin: true,
        secure: false, // Bypass SSL verification
        rewrite: (path) => path.replace(/^\/api\/n8n/, ''),
      };
      console.log(`Proxying /api/n8n to ${url.origin}`);
    } catch (e) {
      console.warn("Invalid VITE_N8N_WEBHOOK_URL in .env, proxy not configured.");
    }
  }

  // Supabase Proxy to bypass CORS
  const supabaseUrl = env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    try {
      const url = new URL(supabaseUrl);
      proxy['/api/supabase'] = {
        target: url.origin,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/supabase/, ''),
      };
      console.log(`Proxying /api/supabase to ${url.origin}`);
    } catch (e) {
      console.warn("Invalid VITE_SUPABASE_URL in .env, Supabase proxy not configured.");
    }
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: proxy
    }
  };
})
