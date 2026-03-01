/**
 * Image optimization utilities for Supabase Storage
 * With automatic WebP conversion for smaller file sizes
 */

// Supabase project configuration
const SUPABASE_PROJECT_ID = 'fdpandnzblzvamhsoukt';
const STORAGE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1`;

interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  resize?: 'contain' | 'cover' | 'fill';
  format?: 'origin' | 'webp';
}

/**
 * Check if browser supports WebP
 */
export const supportsWebP = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
};

/**
 * Get the optimal image format based on browser support
 */
export const getOptimalFormat = (): 'webp' | 'jpeg' => {
  return supportsWebP() ? 'webp' : 'jpeg';
};

/**
 * Compress an image file before upload - defaults to WebP for smaller sizes
 * Reduces file size significantly while maintaining visual quality
 */
export const compressImage = (
  file: File,
  options: ImageCompressionOptions = {}
): Promise<Blob> => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    format = 'webp' // Default to WebP for better compression
  } = options;

  const MAX_FILE_SIZE = 200 * 1024; // 200KB max

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Use better image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw the image
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = format === 'webp' ? 'image/webp' : 
                         format === 'png' ? 'image/png' : 'image/jpeg';

        // Iteratively reduce quality until under MAX_FILE_SIZE
        const tryCompress = (currentQuality: number) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                if (blob.size > MAX_FILE_SIZE && currentQuality > 0.3) {
                  // Reduce quality and try again
                  tryCompress(currentQuality - 0.1);
                  return;
                }
                const reduction = Math.round((1 - blob.size / file.size) * 100);
                console.log(`Image compressed to ${format.toUpperCase()}: ${(file.size / 1024).toFixed(1)}KB → ${(blob.size / 1024).toFixed(1)}KB (${reduction}% reduction, q=${currentQuality.toFixed(1)})`);
                resolve(blob);
              } else if (format === 'webp') {
                // Fallback to JPEG if WebP fails
                canvas.toBlob(
                  (jpegBlob) => {
                    if (jpegBlob) {
                      resolve(jpegBlob);
                    } else {
                      reject(new Error('Failed to compress image'));
                    }
                  },
                  'image/jpeg',
                  currentQuality
                );
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            mimeType,
            currentQuality
          );
        };

        tryCompress(quality);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Compress an image file and return as a File object - defaults to WebP
 */
export const compressImageToFile = async (
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> => {
  const format = options.format || 'webp';
  const blob = await compressImage(file, { ...options, format });
  const extension = format === 'webp' ? 'webp' : 
                    format === 'png' ? 'png' : 'jpg';
  const newName = file.name.replace(/\.[^.]+$/, `.${extension}`);
  return new File([blob], newName, { type: blob.type });
};

/**
 * Generate an optimized Supabase Storage URL with WebP transformation
 * Uses Supabase's built-in image transformation API
 */
export const getSupabaseTransformUrl = (
  bucketName: string,
  filePath: string,
  options: TransformOptions = {}
): string => {
  const { 
    width, 
    height, 
    quality = 80, 
    resize = 'contain',
    format = 'webp' // Default to WebP
  } = options;

  const params = new URLSearchParams();
  
  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  params.append('quality', quality.toString());
  params.append('resize', resize);
  if (format !== 'origin') params.append('format', format);

  return `${STORAGE_URL}/render/image/public/${bucketName}/${filePath}?${params.toString()}`;
};

/**
 * Get optimized image URL with automatic WebP conversion
 * Supports both Supabase URLs and external URLs
 */
export const getOptimizedImageUrl = (
  url: string,
  width: number,
  quality: number = 80
): string => {
  if (!url) return '';

  // Check if it's a Supabase storage URL
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    // Extract bucket and path from the URL
    const match = url.match(/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
    if (match) {
      const [, bucket, path] = match;
      return getSupabaseTransformUrl(bucket, path, { 
        width, 
        quality,
        format: 'webp'
      });
    }
  }

  // For URLs that already have render endpoint, ensure WebP format
  if (url.includes('supabase.co/storage/v1/render/')) {
    const baseUrl = url.split('?')[0];
    const params = new URLSearchParams();
    params.append('width', width.toString());
    params.append('quality', quality.toString());
    params.append('resize', 'contain');
    params.append('format', 'webp');
    return `${baseUrl}?${params.toString()}`;
  }

  // For other URLs, return as-is
  return url;
};

/**
 * Generate srcset for responsive images with WebP format
 */
export const generateSrcSet = (url: string, sizes: number[]): string => {
  if (!url) return '';
  
  return sizes
    .map(size => `${getOptimizedImageUrl(url, size)} ${size}w`)
    .join(', ');
};

/**
 * Default responsive sizes for srcset
 */
export const defaultSrcSetSizes = [320, 480, 640, 768, 1024, 1280, 1536, 1920];

/**
 * Preset configurations for different use cases - all with WebP
 */
export const imagePresets = {
  thumbnail: { width: 150, height: 150, quality: 60, format: 'webp' as const },
  card: { width: 400, height: 300, quality: 75, format: 'webp' as const },
  main: { width: 800, height: 600, quality: 80, format: 'webp' as const },
  lightbox: { width: 1920, height: 1080, quality: 90, format: 'webp' as const },
  full: { width: 1920, height: 1920, quality: 85, format: 'webp' as const }
} as const;

/**
 * Upload image with automatic WebP compression
 */
export const uploadOptimizedImage = async (
  supabase: any,
  file: File,
  bucketName: string,
  filePath: string,
  compressionOptions?: ImageCompressionOptions
): Promise<{ url: string; error: Error | null }> => {
  try {
    // Compress the image to WebP before upload
    const compressedFile = await compressImageToFile(file, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.85,
      format: 'webp', // Default to WebP for best compression
      ...compressionOptions
    });

    // Update file path to use .webp extension
    const webpFilePath = filePath.replace(/\.[^.]+$/, '.webp');

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(webpFilePath, compressedFile, {
        cacheControl: '31536000', // 1 year cache
        upsert: true,
        contentType: 'image/webp'
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(webpFilePath);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading optimized image:', error);
    return { url: '', error: error as Error };
  }
};

/**
 * Convert image URL to WebP format using Supabase transform
 * Works for any Supabase storage image
 */
export const toWebP = (url: string, width?: number): string => {
  return getOptimizedImageUrl(url, width || 1920, 80);
};
