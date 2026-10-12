import { MAX_COMPRESSED_IMAGE_BYTES, MAX_IMAGE_DATA_URL_LENGTH } from './imageLimits';

function readDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read photo'));
    reader.onerror = () => reject(new Error('Could not read photo'));
    reader.readAsDataURL(blob);
  });
}

/** Enforce both the encoded API limit and byte limit, including PNG fallbacks. */
export async function compressImage(file: Blob): Promise<{ blob: Blob; dataUrl: string }> {
  if (typeof window === 'undefined') throw new Error('compressImage is browser-only');
  const source = await readDataUrl(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load photo'));
    img.src = source;
  });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context || !image.width || !image.height) throw new Error('Could not prepare photo');
  let scale = Math.min(1, 1080 / Math.max(image.width, image.height));
  for (let resize = 0; resize < 12; resize++) {
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [.82, .67, .52, .37, .22, .1]) {
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('Could not compress photo')), 'image/webp', quality));
      if (blob.size > MAX_COMPRESSED_IMAGE_BYTES) continue;
      const dataUrl = await readDataUrl(blob);
      if (dataUrl.length <= MAX_IMAGE_DATA_URL_LENGTH) return { blob, dataUrl };
    }
    scale *= .75;
  }
  throw new Error('This photo could not be resized safely. Please choose another image.');
}

/** Also repair oversized photos restored from older drafts before card creation. */
export async function prepareCardImages(images: string[]): Promise<string[]> {
  const prepared: string[] = [];
  for (const source of images) {
    if (source.length <= MAX_IMAGE_DATA_URL_LENGTH) { prepared.push(source); continue; }
    if (!source.startsWith('data:image/')) throw new Error('One photo link is too long. Please upload that photo again.');
    const response = await fetch(source);
    prepared.push((await compressImage(await response.blob())).dataUrl);
  }
  return prepared;
}
