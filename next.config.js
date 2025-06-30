// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  experimental: {
    allowedDevOrigins: ["https://*.cloudworkstations.dev"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // If you also need to handle .glb or .png files with a custom webpack rule,
  // ensure it's added here. For example:
  // webpack: (config, { isServer }) => {
  //   config.module.rules.push({
  //     test: /\.(glb|png)$/,
  //     use: [
  //       {
  //         loader: 'file-loader',
  //         options: {
  //           publicPath: '/_next/static/media/',
  //           outputPath: 'static/media/',
  //           name: '[name].[hash].[ext]',
  //         },
  //       },
  //     ],
  //   });
  //   return config;
  // },
};

module.exports = nextConfig;
