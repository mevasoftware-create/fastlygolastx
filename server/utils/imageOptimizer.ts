import sharp from "sharp";
import { storagePut } from "../storage";

/**
 * Image optimization configuration
 */
const IMAGE_CONFIGS = {
  thumbnail: { width: 150, height: 150, quality: 80 },
  small: { width: 400, height: 400, quality: 85 },
  medium: { width: 800, height: 800, quality: 90 },
  large: { width: 1200, height: 1200, quality: 90 },
} as const;

export type ImageSize = keyof typeof IMAGE_CONFIGS;

/**
 * Optimize and resize image
 * @param buffer - Image buffer
 * @param size - Target size
 * @returns Optimized image buffer
 */
export async function optimizeImage(
  buffer: Buffer,
  size: ImageSize = "medium"
): Promise<Buffer> {
  const config = IMAGE_CONFIGS[size];

  return await sharp(buffer)
    .resize(config.width, config.height, {
      fit: "inside", // Maintain aspect ratio
      withoutEnlargement: true, // Don't upscale small images
    })
    .jpeg({ quality: config.quality, progressive: true })
    .toBuffer();
}

/**
 * Upload and optimize image to S3
 * @param buffer - Image buffer
 * @param key - S3 key
 * @param sizes - Array of sizes to generate (default: all sizes)
 * @returns Object with URLs for each size
 */
export async function uploadOptimizedImages(
  buffer: Buffer,
  key: string,
  sizes: ImageSize[] = ["thumbnail", "small", "medium", "large"]
): Promise<Record<ImageSize, string>> {
  const results: Partial<Record<ImageSize, string>> = {};

  // Generate and upload each size
  for (const size of sizes) {
    const optimized = await optimizeImage(buffer, size);
    const sizeKey = `${key}-${size}`;
    const { url } = await storagePut(sizeKey, optimized, "image/jpeg");
    results[size] = url;
  }

  return results as Record<ImageSize, string>;
}

/**
 * Get image metadata
 * @param buffer - Image buffer
 * @returns Image metadata
 */
export async function getImageMetadata(buffer: Buffer) {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: buffer.length,
  };
}

/**
 * Validate image file
 * @param buffer - Image buffer
 * @param maxSizeMB - Maximum file size in MB
 * @returns Validation result
 */
export async function validateImage(
  buffer: Buffer,
  maxSizeMB: number = 10
): Promise<{ valid: boolean; error?: string }> {
  try {
    const metadata = await getImageMetadata(buffer);

    // Check file size
    const sizeMB = metadata.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return {
        valid: false,
        error: `Image size (${sizeMB.toFixed(2)}MB) exceeds maximum (${maxSizeMB}MB)`,
      };
    }

    // Check format
    const validFormats = ["jpeg", "jpg", "png", "webp"];
    if (!metadata.format || !validFormats.includes(metadata.format)) {
      return {
        valid: false,
        error: `Invalid image format. Supported: ${validFormats.join(", ")}`,
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: "Invalid image file",
    };
  }
}
