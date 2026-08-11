/**
 * Media URL helpers for site-relative and absolute paths.
 * Historical Firebase Storage URLs are still recognized for old data, but new paths use /cdn or /images.
 */

/**
 * Normalize a media path for use in <img src> / CSS.
 * Absolute http(s) URLs and root-relative paths (/...) are returned as-is.
 * Bare relative paths gain a leading slash.
 */
export function getStorageUrl(path: string, _bucket?: string): string {
  if (!path) return "";

  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/")) {
    return path;
  }

  return `/${path}`;
}

/**
 * Check whether a URL is a legacy Firebase Storage URL.
 */
export function isStorageUrl(url: string): boolean {
  if (!url) return false;
  return url.includes("firebasestorage.googleapis.com");
}

/**
 * Extract a relative path from a legacy Firebase Storage URL.
 * Non-Storage URLs are returned unchanged.
 */
export function extractStoragePath(url: string): string {
  if (!url) return "";

  if (!isStorageUrl(url)) {
    return url;
  }

  try {
    const match = url.match(/\/o\/([^?]+)/);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  } catch (error) {
    console.warn("⚠️ 無法解析 Storage URL:", url, error);
  }

  return url;
}
