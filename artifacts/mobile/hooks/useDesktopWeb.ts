import { Platform, useWindowDimensions } from "react-native";

/**
 * Keeps the wide browser storefront separate from the native/mobile layouts.
 * A narrow browser continues to use the mobile experience deliberately.
 */
export const DESKTOP_WEB_BREAKPOINT = 960;

export function useDesktopWeb() {
  const { width } = useWindowDimensions();
  return Platform.OS === "web" && width >= DESKTOP_WEB_BREAKPOINT;
}
