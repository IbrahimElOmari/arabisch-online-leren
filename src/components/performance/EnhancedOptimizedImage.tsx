import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  aspectRatio?: string;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  loading = 'lazy',
  priority = false,
  quality = 80,
  format = 'auto',
  aspectRatio,
  fallback = '/placeholder.svg',
  className,
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [isVisible, setIsVisible] = useState(!loading || loading === 'eager');

  // Generate optimized source URLs
  const generateSources = (baseSrc: string) => {
    const sources = [];
    
    if (format === 'auto' || format === 'avif') {
      sources.push({
        srcSet: generateSrcSet(baseSrc, 'avif'),
        type: 'image/avif'
      });
    }
    
    if (format === 'auto' || format === 'webp') {
      sources.push({
        srcSet: generateSrcSet(baseSrc, 'webp'),
        type: 'image/webp'
      });
    }
    
    return sources;
  };

  const generateSrcSet = (baseSrc: string, imageFormat: string) => {
    if (!width) return baseSrc;
    
    const densities = [1, 2];
    return densities.map(density => {
      const scaledWidth = width * density;
      return `${optimizeImageUrl(baseSrc, scaledWidth, undefined, imageFormat)} ${density}x`;
    }).join(', ');
  };

  const optimizeImageUrl = (url: string, w?: number, h?: number, fmt?: string) => {
    try {
      // For Supabase storage URLs, add transformation parameters
      if (url.includes('supabase.co/storage')) {
        const urlObj = new URL(url);
        if (w) urlObj.searchParams.set('width', w.toString());
        if (h) urlObj.searchParams.set('height', h.toString());
        if (quality !== 80) urlObj.searchParams.set('quality', quality.toString());
        if (fmt && fmt !== 'auto') urlObj.searchParams.set('format', fmt);
        return urlObj.toString();
      }
      
      // For other URLs, return as-is (could add other CDN logic here)
      return url;
    } catch {
      return url;
    }
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager' || priority) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { 
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [loading, priority]);

  // Set source when visible
  useEffect(() => {
    if (isVisible && !currentSrc) {
      setCurrentSrc(optimizeImageUrl(src, width, height));
    }
  }, [isVisible, src, width, height, currentSrc]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setCurrentSrc(fallback);
    onError?.();
  };

  const sources = generateSources(src);
  const sizes = width ? `(max-width: 768px) 100vw, (max-width: 1024px) 50vw, ${width}px` : undefined;

  // Container styles for aspect ratio and CLS prevention
  const containerStyle: React.CSSProperties = {
    ...(aspectRatio && { aspectRatio }),
    ...(width && height && !aspectRatio && {
      aspectRatio: `${width} / ${height}`
    })
  };

  const imgClasses = cn(
    'transition-opacity duration-300',
    !isLoaded && 'opacity-0',
    isLoaded && 'opacity-100',
    hasError && 'opacity-50',
    className
  );

  return (
    <div 
      className="relative overflow-hidden"
      style={containerStyle}
    >
      {/* Loading placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      {/* Optimized picture element */}
      {isVisible && (
        <picture>
          {sources.map((source, index) => (
            <source 
              key={index}
              srcSet={source.srcSet} 
              type={source.type}
              sizes={sizes}
            />
          ))}
          <img
            ref={imgRef}
            src={currentSrc}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className={imgClasses}
            onLoad={handleLoad}
            onError={handleError}
            {...props}
          />
        </picture>
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-sm">Image failed to load</span>
        </div>
      )}
    </div>
  );
};

// Hook for preloading critical images
export const useImagePreloader = () => {
  const preloadImage = (src: string, options?: { width?: number; height?: number; format?: string }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    
    if (options?.format === 'webp') {
      link.type = 'image/webp';
    } else if (options?.format === 'avif') {
      link.type = 'image/avif';
    }
    
    link.href = src;
    document.head.appendChild(link);
  };

  return { preloadImage };
};