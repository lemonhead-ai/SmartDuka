declare module "next-pwa" {
  import type { NextConfig } from "next";

  interface PWAConfig {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    scope?: string;
    sw?: string;
    skipWaiting?: boolean;
    fallbacks?: {
      document?: string;
      image?: string;
      audio?: string;
      video?: string;
      font?: string;
    };
    runtimeCaching?: Array<{
      urlPattern: RegExp | string | ((options: unknown) => boolean);
      handler: string | ((options: unknown) => unknown);
      options?: Record<string, unknown>;
    }>;
    [key: string]: unknown;
  }

  function withPWA(
    pwaConfig?: PWAConfig
  ): (nextConfig?: NextConfig) => NextConfig;

  export default withPWA;
}
