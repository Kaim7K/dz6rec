/// <reference types="vite/client" />

import "react";
declare module "react" {
  interface CSSProperties { [name: `--${string}`]: string | number; }
}
