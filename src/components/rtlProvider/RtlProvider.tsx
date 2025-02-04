import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { ReactNode } from "react";
import rtl from "stylis-plugin-rtl";
import { isWindowAvailable } from "utils/navigation";
// NB: A unique `key` is important for it to work!
let options = {
  rtl: { key: "css-ar", stylisPlugins: [rtl] },
  ltr: { key: "css-en" },
};
export function RtlProvider(props: { children: ReactNode }) {
  const { children } = props;
  const dir =
    isWindowAvailable() && window.document.documentElement.dir == "ar"
      ? "rtl"
      : "ltr";
  const cache = createCache(options[dir]);
  // eslint-disable-next-line react/no-children-prop
  return <CacheProvider value={cache} children={children} />;
}
