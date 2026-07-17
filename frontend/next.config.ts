import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname, // Définit la racine sur le dossier 'frontend'
  },
};

export default nextConfig;
