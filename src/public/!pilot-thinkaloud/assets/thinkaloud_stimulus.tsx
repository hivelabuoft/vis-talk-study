// src/public/my-study/assets/PngChartPhase.tsx
import React, { useMemo, useState, useEffect } from 'react';

type ChartPhaseParams = {
  imagePath?: string | null; // path under /public or full URL
};

type Props = {
  parameters?: ChartPhaseParams;
};

function normalizeImageSrc(imagePath: string): string {
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  if (imagePath.startsWith('/')) return imagePath;
  return `/${imagePath}`;
}

export default function PngChartPhase({ parameters }: Props) {
  const imagePath = parameters?.imagePath ?? '';
  const [imgError, setImgError] = useState<string | null>(null);

  const src = useMemo(() => {
    if (!imagePath) return '';
    return normalizeImageSrc(imagePath);
  }, [imagePath]);

  useEffect(() => {
    setImgError(null);
  }, [src]);

  if (!src) {
    // Render nothing if not configured (keeps the page clean)
    return null;
  }

  return (
    <div style={{
      width: '80%', height: '80%', margin: 0, padding: 0,
    }}
    >
      <img
        src={src}
        alt=""
        style={{
          display: 'block',
          maxWidth: '100%',
          objectFit: 'contain',
          marginBottom: 10,
        }}
        onError={() => setImgError(`Could not load image: ${src}`)}
      />
      {/* If you truly want *only* the image, delete the block below */}
      {imgError ? (
        <div style={{ padding: 8, fontSize: 12, opacity: 0.7 }}>{imgError}</div>
      ) : null}
    </div>
  );
}
