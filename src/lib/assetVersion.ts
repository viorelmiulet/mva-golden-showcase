/**
 * Cache-busting version for static logo/favicon assets.
 * Bump this string whenever a logo or favicon file is replaced so browsers
 * pick up the new file immediately instead of serving a cached copy.
 */
export const ASSET_VERSION = "20260725";

/**
 * Append the current ASSET_VERSION as a query string to a public asset path.
 * Safe for use on both absolute and root-relative URLs.
 */
export function withAssetVersion(path: string, version: string = ASSET_VERSION): string {
  if (!path) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}v=${version}`;
}
