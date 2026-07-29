import type { AvatarConfig } from './sprite-types';

/**
 * Cache of loaded images keyed by their src path.
 * Shared across the application lifetime.
 */
const imageCache = new Map<string, HTMLImageElement>();

/**
 * Load a single image by URL. Returns a cached instance if already loaded.
 * Rejects if the image fails to load (e.g., file not found).
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached) {
    return Promise.resolve(cached);
  }

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = (_event) => {
      console.warn(`[SpriteLoader] Failed to load image: ${src}`);
      reject(new Error(`Failed to load sprite: ${src}`));
    };
    img.src = src;
  });
}

/**
 * Preload all sprite sheet images referenced in an AvatarConfig.
 * Logs warnings for any sprites that fail to load but does NOT reject —
 * the compositor will simply skip drawing parts with missing images.
 *
 * @returns A Map of src → HTMLImageElement for all successfully loaded images.
 */
export async function preloadAvatarSprites(
  config: AvatarConfig
): Promise<Map<string, HTMLImageElement>> {
  const loaded = new Map<string, HTMLImageElement>();
  const allSrcs = new Set<string>();

  // Collect all unique image paths
  for (const partConfig of Object.values(config.parts)) {
    for (const animDef of Object.values(partConfig.animations)) {
      if (animDef.src) {
        allSrcs.add(animDef.src);
      }
    }
  }

  // Load all in parallel, tolerating individual failures
  const results = await Promise.allSettled(
    Array.from(allSrcs).map(async (src) => {
      const img = await loadImage(src);
      return { src, img };
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      loaded.set(result.value.src, result.value.img);
    }
    // Failures already logged by loadImage
  }

  console.log(
    `[SpriteLoader] Loaded ${loaded.size}/${allSrcs.size} sprite sheets.`
  );
  return loaded;
}

/**
 * Clear the image cache. Useful for hot-reloading sprites during development.
 */
export function clearImageCache(): void {
  imageCache.clear();
}
