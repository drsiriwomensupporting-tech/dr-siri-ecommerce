import imageCompression from 'browser-image-compression';

export async function optimizeImage(file: File): Promise<File> {
  // If not in a browser environment, return original file
  if (typeof window === 'undefined') {
    return file;
  }

  // Configuration for visually lossless compression
  const options = {
    maxSizeMB: 0.8, // Target size under 800KB
    maxWidthOrHeight: 1200, // Max dimension (width or height) to 1200px
    useWebWorker: true,
    fileType: 'image/webp', // Convert format to WebP
    initialQuality: 0.85, // 85% quality factor (visually lossless)
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    
    // Generate WebP filename
    const originalName = file.name;
    const lastDotIndex = originalName.lastIndexOf('.');
    const baseName = lastDotIndex !== -1 ? originalName.substring(0, lastDotIndex) : originalName;
    const webpName = `${baseName}.webp`;

    return new File([compressedBlob], webpName, { type: 'image/webp' });
  } catch (error) {
    console.error('Image compression failed, falling back to original file:', error);
    return file; // Fallback to original file
  }
}
