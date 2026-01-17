import { useState, useEffect, useCallback } from "react";

interface ImageValidationResult {
  url: string;
  isValid: boolean;
  isLoading: boolean;
}

export const useImageValidation = (imageUrls: string[]) => {
  const [validationResults, setValidationResults] = useState<Map<string, ImageValidationResult>>(new Map());

  const validateImage = useCallback((url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Check if the image has valid dimensions
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      };
      img.onerror = () => resolve(false);
      // Add cache buster to force fresh load
      img.src = url + (url.includes('?') ? '&' : '?') + '_v=' + Date.now();
    });
  }, []);

  const validateAllImages = useCallback(async () => {
    const results = new Map<string, ImageValidationResult>();
    
    // Mark all as loading initially
    imageUrls.forEach(url => {
      results.set(url, { url, isValid: true, isLoading: true });
    });
    setValidationResults(new Map(results));

    // Validate each image
    await Promise.all(
      imageUrls.map(async (url) => {
        const isValid = await validateImage(url);
        results.set(url, { url, isValid, isLoading: false });
        setValidationResults(new Map(results));
      })
    );
  }, [imageUrls, validateImage]);

  useEffect(() => {
    if (imageUrls.length > 0) {
      validateAllImages();
    } else {
      setValidationResults(new Map());
    }
  }, [imageUrls, validateAllImages]);

  const getInvalidImages = useCallback(() => {
    return Array.from(validationResults.values())
      .filter(result => !result.isLoading && !result.isValid)
      .map(result => result.url);
  }, [validationResults]);

  const isImageValid = useCallback((url: string) => {
    const result = validationResults.get(url);
    return result ? result.isValid : true;
  }, [validationResults]);

  const isImageLoading = useCallback((url: string) => {
    const result = validationResults.get(url);
    return result ? result.isLoading : false;
  }, [validationResults]);

  const revalidate = useCallback(() => {
    validateAllImages();
  }, [validateAllImages]);

  return {
    validationResults,
    getInvalidImages,
    isImageValid,
    isImageLoading,
    revalidate,
    hasInvalidImages: getInvalidImages().length > 0,
    invalidCount: getInvalidImages().length,
  };
};
