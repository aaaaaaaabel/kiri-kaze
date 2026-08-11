/**
 * Normalize a media path for use in <img src> / CSS.
 * Absolute http(s) URLs and root-relative paths (/...) are returned as-is.
 * Bare relative paths gain a leading slash.
 */
export function getMediaUrl(path: string): string {
  if (!path) return "";

  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
    return path;
  }

  return `/${path}`;
}
