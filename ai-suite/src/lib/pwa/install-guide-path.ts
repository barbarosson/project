export const INSTALL_GUIDE_PATH = "/install";

export type InstallPlatform = "ios" | "android" | "desktop";

export function installGuideHref(platform?: InstallPlatform): string {
  return platform ? `${INSTALL_GUIDE_PATH}#${platform}` : INSTALL_GUIDE_PATH;
}
