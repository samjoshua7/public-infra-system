import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: [
        '**/* - Copy.*',
        '**/*- Copy.*',
        '**/*.tmp',
        '**/*.log',
        '**/.git/**',
        '**/node_modules/**',
      ],
    },
  },
  optimizeDeps: {
    // Force Vite to pre-bundle MUI icons and dependencies to prevent
    // mid-session re-optimization reloads on Windows
    include: [
      '@mui/icons-material',
      '@mui/icons-material/GetApp',
      '@mui/icons-material/IosShare',
      '@mui/icons-material/AddBoxOutlined',
      '@mui/icons-material/CheckCircleOutline',
      '@mui/material',
      '@emotion/react',
      '@emotion/styled',
    ],
  },
});
