import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const gaId =
    env.GA_MEASUREMENT_ID ||
    env.VITE_GA_MEASUREMENT_ID ||
    env.VITE_GA_ID ||
    env.GOOGLE_ANALYTICS_ID ||
    process.env.GA_MEASUREMENT_ID ||
    process.env.VITE_GA_MEASUREMENT_ID ||
    process.env.VITE_GA_ID ||
    '';

  return {
    plugins: [react()],
    define: {
      'import.meta.env.GA_MEASUREMENT_ID': JSON.stringify(gaId),
      'import.meta.env.VITE_GA_MEASUREMENT_ID': JSON.stringify(gaId),
      'import.meta.env.VITE_GA_ID': JSON.stringify(gaId),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
    },
  };
});
