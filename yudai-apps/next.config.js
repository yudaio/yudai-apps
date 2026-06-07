/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: () => require('crypto').randomBytes(8).toString('hex'),
};
module.exports = nextConfig;
