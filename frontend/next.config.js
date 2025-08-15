/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GRAPHQL_URL: process.env.NEXT_PUBLIC_GRAPHQL_URL,
  },
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/graphql',
        destination: `${process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql'}`,
      },
    ];
  },
};

module.exports = nextConfig;