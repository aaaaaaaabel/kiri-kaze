/**
 * Media URL helpers for templates and pages.
 */

import { getStorageUrl, isStorageUrl, extractStoragePath } from "~/utils/storage";

export const useStorage = () => {
  const toStorageUrl = (path: string): string => getStorageUrl(path);

  const isStorage = (url: string): boolean => isStorageUrl(url);

  const toStoragePath = (url: string): string => extractStoragePath(url);

  return {
    toStorageUrl,
    isStorage,
    toStoragePath,
  };
};
