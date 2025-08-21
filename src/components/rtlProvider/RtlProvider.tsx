import { ReactNode } from "react";
import { isWindowAvailable } from "utils/navigation";

export function RtlProvider(props: { children: ReactNode }) {
  const { children } = props;
  // Only set document direction, do not wrap with CacheProvider
  if (isWindowAvailable()) {
    window.document.documentElement.dir = "ar";
  }
  return <>{children}</>;
}
