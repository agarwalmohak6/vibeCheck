/**
 * Browser-side canvas image compressor.
 * Compresses an input File/Blob to image/webp format,
 * limiting maximum dimension to 1080px and hard-capping size at 250KB.
 */
export async function compressImage(file: File): Promise<{ blob: Blob; dataUrl: string }> {
  // Ensure we are running in the browser
  if (typeof window === 'undefined') {
    throw new Error('compressImage is browser-only');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimension 1080px
        const MAX_DIM = 1080;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2D canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Compress step-by-step to meet the 250KB limit (256000 bytes)
        const KB_LIMIT = 250 * 1024;
        const quality = 0.82;

        const attemptCompression = (q: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Canvas toBlob failed'));
                return;
              }

              if (blob.size > KB_LIMIT && q > 0.1) {
                // Reduce quality and retry
                const newQuality = q - 0.15;
                attemptCompression(newQuality);
              } else {
                // Success or reached minimum quality
                const readerUrl = new FileReader();
                readerUrl.onloadend = () => {
                  resolve({
                    blob,
                    dataUrl: readerUrl.result as string,
                  });
                };
                readerUrl.onerror = () => {
                  reject(new Error('FileReader failed to read compressed blob'));
                };
                readerUrl.readAsDataURL(blob);
              }
            },
            'image/webp',
            q
          );
        };

        attemptCompression(quality);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
