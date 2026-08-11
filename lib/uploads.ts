export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// SVG is intentionally excluded - it can embed scripts and is a known XSS vector.
export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

export function getImageValidationError(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'Image is too large (max 5MB)';
  }
  if (!ALLOWED_IMAGE_TYPES[file.type]) {
    return 'Unsupported image type (use PNG, JPG, GIF, or WEBP)';
  }
  return null;
}
