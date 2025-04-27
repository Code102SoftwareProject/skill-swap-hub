/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'pub-your-account.r2.dev', // Replace with your specific R2 domain
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cloudflare.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig;