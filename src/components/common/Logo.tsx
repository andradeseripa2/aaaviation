import React from 'react';
import logoRetPng from '../../assets/logoret.png';
import logoQuaPng from '../../assets/logoqua.png';
import logoRetWebp from '../../assets/logoret.webp';
import logoQuaWebp from '../../assets/logoqua.webp';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'compact' | 'badge' | 'monochrome' | 'white' | 'header' | 'icon' | 'banner';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Universal Brand Logo component utilizing Alexandre Andrade's authentic brand logos.
 * - `logoret.webp / logoret.png` (Horizontal/Rectangular): Primary Logo for Top Banner, Header and Footer.
 * - `logoqua.webp / logoqua.png` (Square): Emblem/Badge for circular/square badges and avatar slots.
 */
export const Logo: React.FC<LogoProps> = ({
  className = '',
  variant = 'header',
  size = 'md'
}) => {
  // 1. Top Navbar Header (Left corner) - Rectangular Logo
  if (variant === 'header') {
    return (
      <div className={`inline-flex items-center select-none shrink-0 transition-transform duration-200 group-hover:opacity-95 ${className}`}>
        <picture>
          <source srcSet={logoRetWebp || '/logoret.webp'} type="image/webp" />
          <img
            src={logoRetPng || '/logoret.png'}
            alt="Alexandre Andrade Aviation"
            width={180}
            height={48}
            className="h-10 sm:h-12 w-auto object-contain max-h-12 drop-shadow-2xs select-none aspect-[180/48]"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </picture>
      </div>
    );
  }

  // 2. Large Centered Brand Banner (Top of page) - Prominent Rectangular Logo
  if (variant === 'banner') {
    return (
      <div className={`inline-flex items-center justify-center select-none transition-transform duration-300 group-hover:scale-[1.015] py-2 ${className}`}>
        <picture>
          <source srcSet={logoRetWebp || '/logoret.webp'} type="image/webp" />
          <img
            src={logoRetPng || '/logoret.png'}
            alt="Alexandre Andrade Aviation"
            width={720}
            height={190}
            className="h-28 sm:h-36 md:h-44 lg:h-52 xl:h-60 w-auto max-w-[92vw] md:max-w-2xl lg:max-w-3xl object-contain drop-shadow-sm select-none aspect-[720/190]"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </picture>
      </div>
    );
  }

  // 3. Authority / Hero Badge - Square Emblem Logo
  if (variant === 'badge' || variant === 'icon') {
    return (
      <div className={`relative inline-flex items-center justify-center p-2 rounded-2xl select-none ${className}`}>
        <picture>
          <source srcSet={logoQuaWebp || '/logoqua.webp'} type="image/webp" />
          <img
            src={logoQuaPng || '/logoqua.png'}
            alt="Alexandre Andrade Aviation Emblem"
            width={80}
            height={80}
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-xl select-none drop-shadow-xs aspect-square"
            loading="eager"
            decoding="async"
          />
        </picture>
      </div>
    );
  }

  // 4. Compact / Footer / Monochrome / White
  const heightClass = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-11',
    lg: 'h-12 sm:h-14',
    xl: 'h-16 sm:h-20',
  }[size];

  const sizeDimensions = {
    sm: { width: 130, height: 36, aspect: 'aspect-[130/36]' },
    md: { width: 160, height: 44, aspect: 'aspect-[160/44]' },
    lg: { width: 200, height: 56, aspect: 'aspect-[200/56]' },
    xl: { width: 260, height: 72, aspect: 'aspect-[260/72]' },
  }[size];

  return (
    <div className={`inline-flex items-center select-none shrink-0 ${className}`}>
      <picture>
        <source srcSet={logoRetWebp || '/logoret.webp'} type="image/webp" />
        <img
          src={logoRetPng || '/logoret.png'}
          alt="Alexandre Andrade Aviation"
          width={sizeDimensions.width}
          height={sizeDimensions.height}
          className={`${heightClass} ${sizeDimensions.aspect} w-auto object-contain select-none`}
          loading="lazy"
          decoding="async"
        />
      </picture>
    </div>
  );
};
