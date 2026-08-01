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
      if (animDef.type === 'spritesheet' && animDef.src) {
        allSrcs.add(animDef.src);
      } else if (animDef.type === 'framearray' && animDef.srcArray) {
        for (const src of animDef.srcArray) {
          if (src) {
            allSrcs.add(src);
          }
        }
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
    } else {
      console.warn(`[SpriteLoader] Failed to preload image: ${result.reason}`);
    }
  }

  console.log(
    `[SpriteLoader] Preloaded ${loaded.size}/${allSrcs.size} sprite assets.`
  );
  return loaded;
}

/**
 * Ensure a set of image URLs are loaded into the target map.
 * Skips images already present in the map. Loads missing ones in parallel.
 * Used by the compositor to load dynamically composed frame images
 * that were not part of the initial preload.
 *
 * @param srcs - Array of image URLs to ensure are loaded.
 * @param targetMap - The compositor's live image map to populate.
 */
export async function ensureImagesLoaded(
  srcs: string[],
  targetMap: Map<string, HTMLImageElement>
): Promise<void> {
  const missing = srcs.filter(src => src && !targetMap.has(src));
  if (missing.length === 0) return;

  const uniqueMissing = [...new Set(missing)];
  console.log(`[SpriteLoader] Loading ${uniqueMissing.length} new frame image(s) on demand.`);

  const results = await Promise.allSettled(
    uniqueMissing.map(async (src) => {
      const img = await loadImage(src);
      return { src, img };
    })
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      targetMap.set(result.value.src, result.value.img);
    } else {
      console.warn(`[SpriteLoader] Failed to load on-demand image: ${result.reason}`);
    }
  }
}

/**
 * Clear the image cache. Useful for hot-reloading sprites during development.
 */
export function clearImageCache(): void {
  imageCache.clear();
}
