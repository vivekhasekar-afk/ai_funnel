// =============================================================================
// AI FUNNEL PLATFORM - VITE CONFIGURATION
// =============================================================================
// Production-ready Vite config with optimizations, code splitting, and proxying
// https://vitejs.dev/config/
// =============================================================================

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Optional plugins for production optimization
// import { visualizer } from 'rollup-plugin-visualizer';
// import viteCompression from 'vite-plugin-compression';
// import { VitePWA } from 'vite-plugin-pwa';

// =============================================================================
// CONFIGURATION
// =============================================================================

export default defineConfig(({ command, mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '');
  const isDevelopment = mode === 'development';
  const isProduction = mode === 'production';

  return {
    // ---------------------------------------------------------------------------
    // PLUGINS
    // ---------------------------------------------------------------------------
    plugins: [
      // React plugin with Fast Refresh
      react({
        // Exclude node_modules from Fast Refresh
        exclude: /node_modules/,
        
        // Include .jsx files
        include: '**/*.{jsx,js}',
        
        // Babel configuration for React
        babel: {
          plugins: [
            // Add any Babel plugins here if needed
          ],
        },
        
        // Fast Refresh options
        fastRefresh: true,
      }),

      // Bundle analyzer (uncomment to analyze bundle size)
      // visualizer({
      //   open: true,
      //   gzipSize: true,
      //   brotliSize: true,
      //   filename: './dist/stats.html',
      // }),

      // Compression plugin (gzip & brotli for production)
      // isProduction && viteCompression({
      //   algorithm: 'gzip',
      //   ext: '.gz',
      // }),
      // isProduction && viteCompression({
      //   algorithm: 'brotliCompress',
      //   ext: '.br',
      // }),

      // PWA plugin (uncomment if you want PWA support)
      // VitePWA({
      //   registerType: 'autoUpdate',
      //   includeAssets: ['favicon.ico', 'robots.txt', 'assets/**/*'],
      //   manifest: {
      //     name: 'AI Funnel Platform',
      //     short_name: 'Funnel AI',
      //     description: 'AI-Powered Funnel Builder Platform',
      //     theme_color: '#6366f1',
      //     icons: [
      //       {
      //         src: '/pwa-192x192.png',
      //         sizes: '192x192',
      //         type: 'image/png',
      //       },
      //       {
      //         src: '/pwa-512x512.png',
      //         sizes: '512x512',
      //         type: 'image/png',
      //       },
      //     ],
      //   },
      // }),
    ].filter(Boolean),

    // ---------------------------------------------------------------------------
    // PATH RESOLUTION & ALIASES
    // ---------------------------------------------------------------------------
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@ui': path.resolve(__dirname, './src/components/ui'),
        '@layout': path.resolve(__dirname, './src/components/layout'),
        '@common': path.resolve(__dirname, './src/components/common'),
        '@features': path.resolve(__dirname, './src/features'),
        '@lib': path.resolve(__dirname, './src/lib'),
        '@api': path.resolve(__dirname, './src/lib/api'),
        '@hooks': path.resolve(__dirname, './src/lib/hooks'),
        '@utils': path.resolve(__dirname, './src/lib/utils'),
        '@constants': path.resolve(__dirname, './src/lib/constants'),
        '@store': path.resolve(__dirname, './src/store'),
        '@slices': path.resolve(__dirname, './src/store/slices'),
        '@config': path.resolve(__dirname, './src/config'),
        '@schemas': path.resolve(__dirname, './src/schemas'),
        '@routes': path.resolve(__dirname, './src/routes'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@styles': path.resolve(__dirname, './src/styles'),
        '@public': path.resolve(__dirname, './public'),
      },
      
      // Extensions to resolve
      extensions: ['.js', '.jsx', '.json'],
    },

    // ---------------------------------------------------------------------------
    // DEVELOPMENT SERVER
    // ---------------------------------------------------------------------------
    server: {
      // Port for development server
      port: parseInt(env.VITE_HMR_PORT) || 3000,
      
      // Automatically open browser
      open: false,
      
      // Enable CORS
      cors: true,
      
      // Strict port (exit if port is already in use)
      strictPort: false,
      
      // Host
      host: true, // Listen on all addresses (0.0.0.0)
      
      // HMR configuration
      hmr: {
        overlay: true, // Show error overlay
      },
      
      // Proxy configuration for API requests
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Proxying:', req.method, req.url);
            });
          },
        },
        
        // WebSocket proxy
        '/ws': {
          target: env.VITE_WS_URL || 'ws://localhost:8000',
          ws: true,
          changeOrigin: true,
        },
      },
      
      // Watch options
      watch: {
        usePolling: false, // Set to true if working in containers/VMs
        interval: 100,
      },
    },

    // ---------------------------------------------------------------------------
    // PREVIEW SERVER (for testing production build)
    // ---------------------------------------------------------------------------
    preview: {
      port: 4173,
      strictPort: false,
      host: true,
      open: false,
    },

    // ---------------------------------------------------------------------------
    // BUILD CONFIGURATION
    // ---------------------------------------------------------------------------
    build: {
      // Output directory
      outDir: 'dist',
      
      // Assets directory (relative to outDir)
      assetsDir: 'assets',
      
      // Generate source maps for production
      sourcemap: isProduction ? false : true,
      
      // Minification
      minify: isProduction ? 'esbuild' : false,
      
      // Target browsers
      target: 'es2015',
      
      // Chunk size warning limit (in KB)
      chunkSizeWarningLimit: 1000,
      
      // CSS code splitting
      cssCodeSplit: true,
      
      // Inline assets smaller than this (in bytes)
      assetsInlineLimit: 4096,
      
      // Rollup options
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: (id) => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              // React core
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              
              // React Router
              if (id.includes('react-router')) {
                return 'vendor-router';
              }
              
              // State management (Zustand)
              if (id.includes('zustand')) {
                return 'vendor-state';
              }
              
              // React Flow (visual builder)
              if (id.includes('@xyflow') || id.includes('reactflow')) {
                return 'vendor-flow';
              }
              
              // Axios
              if (id.includes('axios')) {
                return 'vendor-http';
              }
              
              // Date libraries
              if (id.includes('date-fns')) {
                return 'vendor-date';
              }
              
              // Other third-party libraries
              return 'vendor-misc';
            }
            
            // Feature-based chunks
            if (id.includes('/features/funnels')) {
              return 'feature-funnels';
            }
            
            if (id.includes('/features/auth')) {
              return 'feature-auth';
            }
            
            if (id.includes('/features/analytics')) {
              return 'feature-analytics';
            }
            
            if (id.includes('/features/leads')) {
              return 'feature-leads';
            }
          },
          
          // Asset file naming
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            
            if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            
            return `assets/[name]-[hash][extname]`;
          },
          
          // Chunk file naming
          chunkFileNames: 'assets/js/[name]-[hash].js',
          
          // Entry file naming
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },
      
      // CommonJS options
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
      },
      
      // Report compressed size
      reportCompressedSize: isProduction,
      
      // Emit manifest for SSR
      manifest: false,
    },

    // ---------------------------------------------------------------------------
    // OPTIMIZATIONS
    // ---------------------------------------------------------------------------
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'axios',
        'zustand',
      ],
      exclude: [],
      
      // Pre-bundling options
      esbuildOptions: {
        target: 'es2015',
      },
    },

    // ---------------------------------------------------------------------------
    // CSS CONFIGURATION
    // ---------------------------------------------------------------------------
    css: {
      // CSS modules configuration
      modules: {
        localsConvention: 'camelCaseOnly',
      },
      
      // PostCSS configuration
      postcss: './postcss.config.js',
      
      // CSS preprocessor options
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@styles/variables.scss";`,
        },
      },
      
      // Dev source map
      devSourcemap: isDevelopment,
    },

    // ---------------------------------------------------------------------------
    // ENVIRONMENT VARIABLES
    // ---------------------------------------------------------------------------
    define: {
      // Make environment variables available
      'process.env.NODE_ENV': JSON.stringify(mode),
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },

    // ---------------------------------------------------------------------------
    // ESBUILD OPTIONS
    // ---------------------------------------------------------------------------
    esbuild: {
      // Drop console and debugger in production
      drop: isProduction ? ['console', 'debugger'] : [],
      
      // JSX configuration
      jsxInject: '', // Auto-import React if needed (not required for React 17+)
      
      // Legal comments
      legalComments: 'none',
    },

    // ---------------------------------------------------------------------------
    // JSON OPTIONS
    // ---------------------------------------------------------------------------
    json: {
      namedExports: true,
      stringify: false,
    },

    // ---------------------------------------------------------------------------
    // LOGGING
    // ---------------------------------------------------------------------------
    logLevel: isDevelopment ? 'info' : 'warn',
    clearScreen: true,
  };
});
