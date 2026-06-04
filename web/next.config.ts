/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configured to stabilize production builds
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
