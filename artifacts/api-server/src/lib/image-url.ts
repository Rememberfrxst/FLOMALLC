import type { Request } from "express";
import { networkInterfaces } from "node:os";

const LOCAL_PRODUCT_IMAGE_RE =
  /^\/api\/uploads\/local-products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp)$/i;

export function isLocalProductImageUrl(value: unknown): value is string {
  return typeof value === "string" && LOCAL_PRODUCT_IMAGE_RE.test(value);
}

export function apiOriginForRequest(req: Request): string {
  const configuredOrigin = process.env.PUBLIC_API_ORIGIN?.replace(/\/$/, "");
  if (configuredOrigin) return configuredOrigin;

  const host = req.get("host");
  if (host && !/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host)) {
    return `${req.protocol}://${host}`;
  }

  const port = req.socket.localPort;
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses || []) {
      if (address.family === "IPv4" && !address.internal) {
        return `http://${address.address}:${port}`;
      }
    }
  }

  return host ? `${req.protocol}://${host}` : `http://localhost:${port}`;
}

export function resolveProductImageUrl(
  req: Request,
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  if (!isLocalProductImageUrl(value)) return value;

  const origin = apiOriginForRequest(req);
  return origin ? `${origin}${value}` : value;
}
