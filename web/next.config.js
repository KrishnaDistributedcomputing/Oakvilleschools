/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // In production behind Front Door, /api/* is routed at the CDN level.
    // This rewrite is only for local development.
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
