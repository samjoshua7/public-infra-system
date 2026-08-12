/**
 * Compresses an image File in the browser before upload, using the native
 * Canvas API — no external dependency needed.
 *
 * Resizes so the longest side is at most `maxDimension` px, and re-encodes
 * as JPEG at `quality`. A 20MB iPhone photo typically comes out under 300KB.
 *
 * @param {File} file - The original image file (e.g. from an <input type="file"> or camera capture)
 * @param {Object} [options]
 * @param {number} [options.maxDimension=1600] - Max width or height in pixels
 * @param {number} [options.quality=0.72] - JPEG quality, 0-1
 * @returns {Promise<File>} A new, compressed File (same name, .jpg extension, image/jpeg type)
 */
export async function compressImage(file, options = {}) {
  const { maxDimension = 1600, quality = 0.72 } = options;

  if (!file || !file.type.startsWith('image/')) {
    throw new Error('compressImage: input is not an image file');
  }

  const bitmap = await createImageBitmap(file);

  let { width, height } = bitmap;
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('Canvas compression failed'))),
      'image/jpeg',
      quality
    );
  });

  const newName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
  return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
}
