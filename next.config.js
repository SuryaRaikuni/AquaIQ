/** @type {import('next').NextConfig} */

// On Vercel, VERCEL_URL is auto-injected (e.g. "aquaiq.vercel.app").
// next-auth requires a full HTTPS URL for NEXTAUTH_URL.
// We derive it here so users never need to set it manually in Vercel env vars.
const NEXTAUTH_URL =
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

const nextConfig = {
  compress:        true,
  poweredByHeader: false,

  // Expose NEXTAUTH_URL to server-side code so next-auth can build callback URLs
  env: {
    NEXTAUTH_URL,
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },

  // Allow Leaflet to work server-side safely
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },

  // Security + preconnect response headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options',        value: 'DENY'    },
          { key: 'X-XSS-Protection',       value: '1; mode=block' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
