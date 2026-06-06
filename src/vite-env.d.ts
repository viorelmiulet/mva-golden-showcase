/// <reference types="vite/client" />

declare namespace React {
  interface ImgHTMLAttributes<T> {
    fetchpriority?: "high" | "low" | "auto";
  }
}
