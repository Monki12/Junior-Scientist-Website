// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
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
  experimental: {
    allowedDevOrigins: [
      'https://9000-firebase-studio-1750187955130.cluster-fdkw7vjj7bgguspe3fbbc25tra.cloudworkstations.dev',
      'https://6000-firebase-studio-1750187955130.cluster-fdkw7vjj7bgguspe3fbbc25tra.cloudworkstations.dev',
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