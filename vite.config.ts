import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Optimize for production
    minify: 'esbuild',
    sourcemap: true,
    // Split chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for third-party libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // UI components chunk
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-label', '@radix-ui/react-slot', '@radix-ui/react-tabs', '@radix-ui/react-tooltip'],
          // Supabase and data handling
          data: ['@supabase/supabase-js', '@tanstack/react-query'],
          // Utilities
          utils: ['clsx', 'tailwind-merge', 'class-variance-authority', 'zustand']
        }
      }
    },
    // Netlify functions compatibility
    target: 'es2020',
    // Optimize bundle size
    chunkSizeWarningLimit: 1000,
  },
  server: {
    // Development server optimization
    hmr: true,
    port: 5173,
  },
  preview: {
    port: 4173,
  },
  // Environment variable handling
  define: {
    // Ensure proper environment variable replacement
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'lucide-react'
    ],
  },
})
