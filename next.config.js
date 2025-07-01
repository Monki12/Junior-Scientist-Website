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
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
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
