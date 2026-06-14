/** @type {import('next').NextConfig} */
const backendApiUrl = process.env.INTERNAL_API_URL || 'http://localhost:8000'

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Configuration pour l'API backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendApiUrl}/:path*`
      }
    ]
  },
  
  // Configuration pour les images
  images: {
    domains: ['localhost'],
    minimumCacheTTL: 60,
  },
  
  // Configuration pour l'export
  output: 'standalone',
  
  // Configuration pour les headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
