/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Mark packages that use native bindings as external
    serverComponentsExternalPackages: ['pdf-parse', '@xenova/transformers', 'onnxruntime-node'],
  },
  
  webpack: (config, { isServer }) => {
    // Handle node-specific modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    
    // Exclude native modules from webpack bundling on server
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'onnxruntime-node': 'commonjs onnxruntime-node',
      });
    }
    
    return config;
  },
}

module.exports = nextConfig
