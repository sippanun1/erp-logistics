/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  async rewrites() {
    // Proxy all /api/* calls through the Next.js server to the API Gateway.
    // This means the browser never talks to the gateway directly — no CORS needed.
    // In Docker Compose: API_GATEWAY_URL=http://api-gateway:3000
    // On Render:         API_GATEWAY_URL=https://erp-gateway.onrender.com
    const gatewayUrl = process.env.API_GATEWAY_URL ?? 'http://localhost:3000';
    return [
      {
        source: '/api/:path*',
        destination: `${gatewayUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
