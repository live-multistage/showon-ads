import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // @live-show/design-system ships as TS/SCSS source with no build step —
  // must be transpiled by the consuming app (mirrors live-show-react).
  transpilePackages: ['@live-show/design-system'],
};

export default nextConfig;
