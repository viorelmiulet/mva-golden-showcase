// Compat shim for react-helmet-async under SSR (Vite/workerd).
// The package is CommonJS, so named exports fail to resolve during SSR module
// evaluation. Re-export through the default-export interop instead.
// ported during TanStack Start migration — call sites keep `import { Helmet } from "@/lib/helmet-compat"`.
import * as helmetPkg from "react-helmet-async";

type HelmetModule = typeof import("react-helmet-async");

const resolved: HelmetModule =
  ((helmetPkg as unknown as { default?: HelmetModule }).default ??
    (helmetPkg as unknown as HelmetModule));

export const Helmet = resolved.Helmet;
export const HelmetProvider = resolved.HelmetProvider;
export type { HelmetProps } from "react-helmet-async";
