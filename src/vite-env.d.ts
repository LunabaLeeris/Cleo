/// <reference types="vite/client" />

// Image asset modules – Vite resolves these to hashed URLs at build time.
declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
