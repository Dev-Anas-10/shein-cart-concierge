'use client';

import React, { useState, useEffect } from 'react';

const DEFAULT_FALLBACK =
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80';

interface SafeImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string;
  fallbackSrc?: string;
}

export function SafeImage({
  src,
  alt = 'Product',
  className = '',
  fallbackSrc = DEFAULT_FALLBACK,
  ...props
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (src) {
      setImgSrc(src);
      setHasError(false);
    }
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <img
      src={imgSrc || fallbackSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={handleError}
      className={className}
      {...props}
    />
  );
}
