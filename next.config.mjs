/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: /\.git\b|\.next\b|\.gemini\b|node_modules\b|checkpoints\b|public[\\/]uploads\b|uploads\b|\.(sqlite|sqlite-journal|db|log|json)$/i,
    };
    return config;
  },
};

export default nextConfig;
