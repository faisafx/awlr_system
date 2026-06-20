/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  // Transpile Three.js and React Three Fiber for proper bundling
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],

  webpack: (config) => {
    // Ensure proper handling of Three.js module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      'three/addons': 'three/examples/jsm',
    };
    return config;
  },

  // Strict mode for better development experience
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);