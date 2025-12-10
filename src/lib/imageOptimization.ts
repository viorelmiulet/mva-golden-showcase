/**
 * Image optimization utilities for Supabase Storage
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
 * Compress an image file before upload
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
    format = 'jpeg'
  } = options;

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

        // Convert to blob
        const mimeType = format === 'webp' ? 'image/webp' : 
                         format === 'png' ? 'image/png' : 'image/jpeg';
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(blob.size / 1024).toFixed(1)}KB (${Math.round((1 - blob.size / file.size) * 100)}% reduction)`);
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          mimeType,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Compress an image file and return as a File object
 */
export const compressImageToFile = async (
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> => {
  const blob = await compressImage(file, options);
  const extension = options.format === 'webp' ? 'webp' : 
                    options.format === 'png' ? 'png' : 'jpg';
  const newName = file.name.replace(/\.[^.]+$/, `.${extension}`);
  return new File([blob], newName, { type: blob.type });
};

/**
 * Generate an optimized Supabase Storage URL with transformations
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
    format = 'webp'
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
 * Get optimized image URL with automatic sizing based on screen
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

  // For URLs that already have render endpoint, update params
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
 * Generate srcset for responsive images
 */
export const generateSrcSet = (url: string, sizes: number[]): string => {
  if (!url) return '';
  
  return sizes
    .map(size => `${getOptimizedImageUrl(url, size)} ${size}w`)
    .join(', ');
};

/**
 * Preset configurations for different use cases
 */
export const imagePresets = {
  thumbnail: { width: 150, height: 150, quality: 60 },
  card: { width: 400, height: 300, quality: 75 },
  main: { width: 800, height: 600, quality: 80 },
  lightbox: { width: 1920, height: 1080, quality: 90 },
  full: { width: 1920, height: 1920, quality: 85 }
} as const;

/**
 * Upload image with automatic compression
 */
export const uploadOptimizedImage = async (
  supabase: any,
  file: File,
  bucketName: string,
  filePath: string,
  compressionOptions?: ImageCompressionOptions
): Promise<{ url: string; error: Error | null }> => {
  try {
    // Compress the image before upload
    const compressedFile = await compressImageToFile(file, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.85,
      format: 'jpeg',
      ...compressionOptions
    });

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, compressedFile, {
        cacheControl: '31536000', // 1 year cache
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading optimized image:', error);
    return { url: '', error: error as Error };
  }
};
