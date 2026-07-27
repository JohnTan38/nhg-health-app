'use client';

import Image from 'next/image';
import { useState } from 'react';
import styles from './LogoSlot.module.css';

export interface LogoSlotProps {
  src?: string;
  alt: string;
  fallback: string[];
}

export function LogoSlot({ src, alt, fallback }: LogoSlotProps) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <div className={styles.slot}>
        <Image
          src={src}
          alt={alt}
          width={332}
          height={212}
          className={styles.image}
          onError={() => setFailed(true)}
          priority
        />
      </div>
    );
  }

  return (
    <div className={styles.slot} role="img" aria-label={alt}>
      {fallback.map((line) => (
        <span key={line} className={styles.fallbackLine}>{line}</span>
      ))}
    </div>
  );
}
