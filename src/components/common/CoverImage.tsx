import React, { useState, useEffect } from 'react';
import { resolveImageUrl, getAviationFallbackImage, getMediaDataUrl } from '../../services/mediaService';

interface CoverImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt: string;
  category?: string | null;
  fallbackCategory?: string | null;
  className?: string;
  priority?: boolean;
}

export const CoverImage: React.FC<CoverImageProps> = ({
  src,
  alt,
  category,
  fallbackCategory,
  className = '',
  priority = false,
  width = 800,
  height = 450,
  ...props
}) => {
  const targetCategory = category || fallbackCategory;
  const initialResolved = src ? resolveImageUrl(src, targetCategory) : getAviationFallbackImage(targetCategory);
  const [currentSrc, setCurrentSrc] = useState<string>(initialResolved);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasTriedFetch, setHasTriedFetch] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const initial = src ? resolveImageUrl(src, targetCategory) : getAviationFallbackImage(targetCategory);
    setCurrentSrc(initial);
    setIsLoaded(false);
    setHasTriedFetch(false);

    // If it's a media token/endpoint (/api/media/...) and not yet a data: or external http(s) URL in cache,
    // fetch asynchronously from IndexedDB / Firestore Cloud Database
    if (src && (src.startsWith('/api/media/') || src.startsWith('media:')) && !initial.startsWith('data:')) {
      getMediaDataUrl(src).then(dataUrl => {
        if (isMounted && dataUrl) {
          setCurrentSrc(dataUrl);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [src, targetCategory]);

  const handleError = () => {
    if (!hasTriedFetch && src && (src.startsWith('/api/media/') || src.startsWith('media:'))) {
      setHasTriedFetch(true);
      getMediaDataUrl(src).then(dataUrl => {
        if (dataUrl) {
          setCurrentSrc(dataUrl);
          return;
        }
        setCurrentSrc(getAviationFallbackImage(targetCategory));
      });
      return;
    }

    setCurrentSrc(getAviationFallbackImage(targetCategory));
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      onLoad={() => setIsLoaded(true)}
      onError={handleError}
      className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-90'}`}
      {...props}
    />
  );
};
