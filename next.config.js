/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure external packages for server components
  serverExternalPackages: ["canvas"],

  // Configure static file serving
  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // Configure webpack for PDF.js compatibility
  webpack: (config, { isServer }) => {
    // Configure fallbacks for both client and server
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      util: false,
      buffer: false,
    };

    // Add externals for server-side rendering
    if (isServer) {
      config.externals = [...(config.externals || []), "canvas"];
    }

    // Handle PDF.js worker and canvas module
    config.resolve.alias = {
      ...config.resolve.alias,
      "pdfjs-dist/build/pdf.worker.js": "pdfjs-dist/build/pdf.worker.min.js",
      canvas: false,
    };

    // Ignore canvas module completely and replace with stub
    const webpack = require("webpack");
    config.plugins = [
      ...config.plugins,
      new webpack.IgnorePlugin({
        resourceRegExp: /^canvas$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /canvas/,
        contextRegExp: /pdfjs-dist/,
      }),
      new webpack.NormalModuleReplacementPlugin(
        /^canvas$/,
        require.resolve("./canvas-stub.js")
      ),
    ];

    return config;
  },

  // Configure external packages
  serverExternalPackages: ["canvas"],
};

module.exports = nextConfig;
