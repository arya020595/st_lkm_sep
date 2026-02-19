require("dotenv").config({
  path: "../../.env",
});
const appConfig = require("./app.json");

module.exports = {
  basePath: appConfig.basePath || "/",
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Menghapus opsi yang tidak lagi diperlukan di Next.js 14
    serverComponentsExternalPackages: [], // Daftar package yang akan dijalankan sebagai external di server components
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        module: false,
        '@grpc': false
      };
    }
    return config;
  },
  env: {
    ADMIN_PORT: process.env.ADMIN_PORT,
    APP_BIND_PORT: process.env.ADMIN_PORT,
    GRAPHQL_API_HOST: process.env.GRAPHQL_API_HOST,
    GRAPHQL_API_PORT: process.env.GRAPHQL_API_PORT,
    STAGING_ENV: process.env.STAGING_ENV,
    VERSION_PREFIX: process.env.VERSION_PREFIX,
    CDN_PREFIX: process.env.CDN_PREFIX,
  },
  publicRuntimeConfig: {
    MODE: process.env.MODE || "",
    TOKENIZE: process.env.TOKENIZE || "",
  },
};
