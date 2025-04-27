/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration for Next.js Image component
  images: {
    // Legacy configuration for static domain allowlist
    domains: [
      'pub-your-account.r2.dev', // Cloudflare R2 bucket domain for storing user uploads
    ],
    // Modern pattern-based configuration for external image sources
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com', // Cloudflare R2 storage pattern
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev', // R2 developer domains pattern
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudflare.com', // General Cloudflare domains pattern
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig;