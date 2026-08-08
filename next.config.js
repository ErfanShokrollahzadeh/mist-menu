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
};

module.exports = nextConfig;
