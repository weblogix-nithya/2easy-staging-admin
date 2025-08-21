import createCache from "@emotion/cache";
import rtlPlugin from "stylis-plugin-rtl";

export function createEmotionCache(dir: "ltr" | "rtl" = "ltr") {
  return createCache(
    dir === "rtl"
      ? { key: "css-ar", stylisPlugins: [rtlPlugin] }
      : { key: "css-en" }
  );
}