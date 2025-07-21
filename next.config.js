/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration for Next.js Image component
  images: {
    // Legacy configuration for static domain allowlist
    domains: [
      "pub-your-account.r2.dev", // Cloudflare R2 bucket domain for storing user uploads
      "ik.imagekit.io", // ImageKit CDN domain for optimized image delivery
      "lh3.googleusercontent.com", // Google profile images
      "lh4.googleusercontent.com", // Google profile images (alternative)
      "lh5.googleusercontent.com", // Google profile images (alternative)
      "lh6.googleusercontent.com", // Google profile images (alternative)
      "ui-avatars.com", // UI Avatars service for fallback avatars
      "localhost", // Allow localhost for development API endpoints
    ],
    // Modern pattern-based configuration for external image sources
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com", // Cloudflare R2 storage pattern
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev", // R2 developer domains pattern
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.cloudflare.com", // General Cloudflare domains pattern
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com", // Google profile images and content
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com", // UI Avatars service for fallback avatars
        pathname: "/api/**",
      },
      {
        protocol: "http",
        hostname: "localhost", // Development server HTTP
        pathname: "/api/**",
      },
      {
        protocol: "https",
        hostname: "localhost", // Development server HTTPS
        pathname: "/api/**",
      },
    ],
  },
};

export default nextConfig;
