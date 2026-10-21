import { fileURLToPath } from 'node:url';

const nextConfig = {
  poweredByHeader: false,
  transpilePackages: ['@escudo/rules'],
  turbopack: { root: fileURLToPath(new URL('../../', import.meta.url)) },
};

export default nextConfig;
