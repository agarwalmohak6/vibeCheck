import { describe, expect, it, vi } from 'vitest';
import { compressImage, prepareCardImages } from '@/lib/imageCompressor';
import { MAX_IMAGE_DATA_URL_LENGTH, MAX_COMPRESSED_IMAGE_BYTES } from '@/lib/imageLimits';
import { cardDataSchema } from '@/lib/contracts';

function browserCanvas(alwaysOversized = false) {
  const widths: number[] = [];
  vi.stubGlobal('window', {});
  vi.stubGlobal('FileReader', class {
    result = ''; onload?: () => void;
    readAsDataURL(blob: Blob) { this.result = 'data:image/png;base64,' + 'A'.repeat(Math.ceil(blob.size / 3) * 4); queueMicrotask(() => this.onload?.()); }
  });
  vi.stubGlobal('Image', class {
    width = 1600; height = 1200; onload?: () => void;
    set src(_source: string) { queueMicrotask(() => this.onload?.()); }
  });
  const canvas = { width: 0, height: 0, getContext: () => ({ drawImage: vi.fn() }), toBlob(callback: (blob: Blob) => void) {
    widths.push(this.width);
    // A browser falling back to PNG ignores the requested WebP quality.
    callback(new Blob([new Uint8Array(alwaysOversized ? 500000 : this.width * this.height)], { type: 'image/png' }));
  } };
  vi.stubGlobal('document', { createElement: () => canvas });
  return widths;
}

describe('photo submission limits', () => {
  it('resizes a PNG fallback rather than accepting an oversized result at minimum quality', async () => {
    const widths = browserCanvas();
    const result = await compressImage(new Blob(['photo']));
    expect(new Set(widths).size).toBeGreaterThan(1);
    expect(result.blob.size).toBeLessThanOrEqual(MAX_COMPRESSED_IMAGE_BYTES);
    expect(result.dataUrl.length).toBeLessThanOrEqual(MAX_IMAGE_DATA_URL_LENGTH);
    expect(() => cardDataSchema.parse({ message_title: 'For you', main_body: 'A note', cover_image_url: result.dataUrl, cover_image_urls: [result.dataUrl] })).not.toThrow();
  });
  it('rejects rather than returning an image that never reaches the limit', async () => {
    browserCanvas(true);
    await expect(compressImage(new Blob(['photo']))).rejects.toThrow('could not be resized safely');
  });
  it('repairs old oversized draft images and keeps photo order', async () => {
    browserCanvas();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ blob: async () => new Blob(['photo']) }));
    const small = 'data:image/png;base64,AAAA';
    const large = 'data:image/png;base64,' + 'A'.repeat(400001);
    const result = await prepareCardImages([small, large, '/themes/blush_cream.svg']);
    expect(result[0]).toBe(small);
    expect(result[1].length).toBeLessThanOrEqual(MAX_IMAGE_DATA_URL_LENGTH);
    expect(result[2]).toBe('/themes/blush_cream.svg');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
