const path = require('path')
const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  experimental: {
    outputFileTracingRoot: path.join(__dirname),
    outputFileTracingExcludes: {
      '*': ['**/Application Data/**'],
    },
    // Optimize package imports
    optimizePackageImports: ['@/components', '@/lib', 'lucide-react', 'framer-motion'],
  },
  // Optimize font loading for production builds
  optimizeFonts: true,
  // Increase timeout for font fetching during build
  staticPageGenerationTimeout: 120,
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack(config) {
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: path.join(__dirname, '.next', 'analyze', 'client.html'),
          openAnalyzer: false,
        })
      )
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/:all*(js|css|svg|png|jpg|jpeg|gif|webp|avif|ico)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/_next/image',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, must-revalidate' }],
      },
      {
        source: '/api/(.*)',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ]
  },
}

module.exports = withMDX(nextConfig)
