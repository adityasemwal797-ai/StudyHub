import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships a WASM Postgres binary and resolves its assets relative to
  // node_modules — do not bundle it into the server chunks.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
};

export default nextConfig;
