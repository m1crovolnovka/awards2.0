import { useEffect, useState } from 'react';
import { fetchImageObjectUrl } from '../api/client';

export function AuthImage({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    void (async () => {
      objectUrl = await fetchImageObjectUrl(src);
      if (active) setUrl(objectUrl);
    })();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!url) {
    return <div className={`auth-image-fallback ${className || ''}`} aria-label={alt} />;
  }

  return <img src={url} alt={alt} className={className} />;
}
