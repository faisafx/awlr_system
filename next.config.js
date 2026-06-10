/** @type {import('next').NextConfig} */
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

module.exports = nextConfig;