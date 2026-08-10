/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mistcafe.trqr.com.tr',
      },
    ],
  },
  allowedDevOrigins: ['192.168.48.251'],
};

module.exports = nextConfig;
