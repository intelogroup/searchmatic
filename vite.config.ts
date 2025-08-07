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
    sourcemap: false, // Disable sourcemaps for smaller bundle
    // Split chunks for better caching and smaller initial load
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React vendors
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          // Routing and navigation
          if (id.includes('react-router')) {
            return 'router';
          }
          // Supabase and database
          if (id.includes('@supabase') || id.includes('@tanstack/react-query')) {
            return 'data';
          }
          // UI component libraries
          if (id.includes('@radix-ui') || id.includes('lucide-react')) {
            return 'ui-components';
          }
          // Form handling
          if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
            return 'forms';
          }
          // Utilities and styling
          if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) {
            return 'utils';
          }
          // State management
          if (id.includes('zustand')) {
            return 'state';
          }
          // Date handling
          if (id.includes('date-fns')) {
            return 'date-utils';
          }
          // Other vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        },
        // Optimize chunk sizes
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Netlify functions compatibility
    target: 'es2020',
    // Reduce chunk size warnings
    chunkSizeWarningLimit: 500,
    // Additional optimizations - remove terserOptions since using esbuild
    // Console logs and debuggers are handled by esbuild minifier automatically
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
