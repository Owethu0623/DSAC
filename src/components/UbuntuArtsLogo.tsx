import React from 'react';

interface UbuntuArtsLogoProps {
  className?: string;
  size?: number;
}

/**
 * Authentic Ubuntu Arts NPO Logo Mark
 * Features theatrical comedy and tragedy drama masks in royal amber gold and deep indigo blue.
 */
export const UbuntuArtsLogo: React.FC<UbuntuArtsLogoProps> = ({
  className = '',
  size = 40,
}) => {
  return (
    <div className={`relative shrink-0 flex items-center justify-center ${className}`}>
      <img
        src="/src/assets/images/ubuntu_arts_logo_1789660838385.jpg"
        alt="Ubuntu Arts NPO Logo"
        style={{ width: size, height: size }}
        className="rounded-lg object-contain shadow-xs border border-slate-200"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = 'block';
        }}
      />
      {/* Crisp vector fallback */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'none' }}
        className="rounded-lg border border-indigo-200 bg-white"
      >
        {/* Background pill/soft rounded */}
        <rect width="100" height="100" rx="20" fill="#F8FAFC" />
        
        {/* Left Mask (Tragedy - Blue) */}
        <g transform="translate(15, 20) rotate(-10)">
          <path
            d="M10 15 C10 5, 45 5, 45 15 C45 35, 40 50, 27 55 C15 50, 10 35, 10 15 Z"
            fill="#3730A3"
            stroke="#1E1B4B"
            strokeWidth="2"
          />
          {/* Eyes - sad downward tilt */}
          <ellipse cx="22" cy="22" rx="4" ry="2.5" fill="#E0E7FF" transform="rotate(-15 22 22)" />
          <ellipse cx="34" cy="22" rx="4" ry="2.5" fill="#E0E7FF" transform="rotate(15 34 22)" />
          {/* Mouth - downturned arc */}
          <path d="M21 42 Q28 35 35 42" stroke="#E0E7FF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </g>

        {/* Right Mask (Comedy - Gold/Amber) */}
        <g transform="translate(42, 28) rotate(12)">
          <path
            d="M10 15 C10 5, 45 5, 45 15 C45 35, 40 50, 27 55 C15 50, 10 35, 10 15 Z"
            fill="#F59E0B"
            stroke="#B45309"
            strokeWidth="2"
          />
          {/* Eyes - smiling upward curves */}
          <path d="M19 22 Q23 17 27 22" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M31 22 Q35 17 39 22" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Mouth - big smiling open grin */}
          <path
            d="M20 35 Q29 48 38 35 Z"
            fill="#78350F"
          />
          {/* Tongue/smile accent */}
          <path d="M24 39 Q29 45 34 39" stroke="#FEF3C7" strokeWidth="1.5" fill="none" />
        </g>
      </svg>
    </div>
  );
};
