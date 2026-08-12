import { describe, expect, it } from 'vitest';
import {
  ALLOWED_IMAGE_TYPES,
  getImageValidationError,
  MAX_FILE_SIZE_BYTES,
} from '@/lib/polls/uploads';

function fakeFile(overrides: { type?: string; size?: number; name?: string } = {}) {
  const { type = 'image/png', size = 1024, name = 'photo.png' } = overrides;
  return { type, size, name } as File;
}

describe('getImageValidationError', () => {
  it('allows supported image types under the size limit', () => {
    for (const type of Object.keys(ALLOWED_IMAGE_TYPES)) {
      expect(getImageValidationError(fakeFile({ type }))).toBeNull();
    }
  });

  it('rejects oversized images', () => {
    expect(
      getImageValidationError(fakeFile({ size: MAX_FILE_SIZE_BYTES + 1 }))
    ).toBe('Image is too large (max 5MB)');
  });

  it('rejects unsupported types including SVG', () => {
    expect(getImageValidationError(fakeFile({ type: 'image/svg+xml' }))).toBe(
      'Unsupported image type (use PNG, JPG, GIF, or WEBP)'
    );
    expect(getImageValidationError(fakeFile({ type: 'application/pdf' }))).toBe(
      'Unsupported image type (use PNG, JPG, GIF, or WEBP)'
    );
  });
});
