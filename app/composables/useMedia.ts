import { getMediaUrl } from "~/utils/media";

export const useMedia = () => {
  const toMediaUrl = (path: string): string => getMediaUrl(path);

  return {
    toMediaUrl,
  };
};
