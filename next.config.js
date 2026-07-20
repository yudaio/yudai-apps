/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: () => require('crypto').randomBytes(8).toString('hex'),
  webpack: (config, { dev }) => {
    if (!dev) config.cache = false;
    return config;
  },
};
module.exports = nextConfig;
