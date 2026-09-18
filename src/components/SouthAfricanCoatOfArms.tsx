import React from 'react';
import dsacLogo from '../assets/images/dsac_official_logo_1789660825303.jpg';

interface SouthAfricanCoatOfArmsProps {
  className?: string;
  size?: number;
  variant?: 'full-color' | 'gold' | 'monochrome-white' | 'monochrome-green';
}

/**
 * High-fidelity vector rendition of the National Coat of Arms of the Republic of South Africa.
 * Motto: !KE E: /XARRA //KE (Khoisan for "Diverse People Unite" or "Unity in Diversity")
 * Features: Rising sun, Secretary bird with outstretched wings, Protea flower,
 * Spear and Knobkierie, Shield with Khoisan human figures, Elephant tusks, and Ears of wheat.
 */
export const SouthAfricanCoatOfArms: React.FC<SouthAfricanCoatOfArmsProps> = ({
  className = '',
  size = 40,
  variant = 'full-color',
}) => {
  const isWhite = variant === 'monochrome-white';
  const isGold = variant === 'gold';
  const isGreen = variant === 'monochrome-green';

  const goldColor = isWhite ? '#FFFFFF' : isGreen ? '#064e3b' : isGold ? '#F59E0B' : '#E5A823';
  const greenColor = isWhite ? '#FFFFFF' : isGreen ? '#064e3b' : '#007749';
  const redColor = isWhite ? '#FFFFFF' : isGreen ? '#064e3b' : isGold ? '#D97706' : '#DE3831';
  const darkColor = isWhite ? '#FFFFFF' : isGreen ? '#064e3b' : '#1e293b';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="National Coat of Arms of South Africa"
    >
      {/* 1. Rising Sun Crest (Top) */}
      <circle cx="60" cy="22" r="7" fill={goldColor} />
      {/* Sun rays */}
      <path
        d="M60 7 L60 13 M47 11 L51 16 M73 11 L69 16 M37 20 L43 22 M83 20 L77 22"
        stroke={goldColor}
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* 2. Secretary Bird Wings (Upper Arch) */}
      <path
        d="M28 32 C38 24, 52 28, 60 35 C68 28, 82 24, 92 32 C82 35, 72 38, 60 46 C48 38, 38 35, 28 32 Z"
        fill={goldColor}
        stroke={greenColor}
        strokeWidth="1.2"
      />
      {/* Bird Head & Beak */}
      <path
        d="M58 29 Q60 25 62 29 Q60 33 58 29 Z"
        fill={redColor}
      />

      {/* 3. Protea Flower Motif (Under wings) */}
      <path
        d="M52 42 C54 38, 60 36, 60 36 C60 36, 66 38, 68 42 C64 44, 56 44, 52 42 Z"
        fill={redColor}
      />
      <path
        d="M48 44 C52 40, 60 42, 60 42 C60 42, 68 40, 72 44 C67 47, 53 47, 48 44 Z"
        fill={greenColor}
      />

      {/* 4. Elephant Tusks (Flanking curved tusks) */}
      {/* Left Tusk */}
      <path
        d="M26 40 C20 54, 22 75, 34 88 C31 76, 31 58, 33 46 Z"
        fill={goldColor}
        stroke={darkColor}
        strokeWidth="1"
      />
      {/* Right Tusk */}
      <path
        d="M94 40 C100 54, 98 75, 86 88 C89 76, 89 58, 87 46 Z"
        fill={goldColor}
        stroke={darkColor}
        strokeWidth="1"
      />

      {/* 5. Ears of Wheat (Inside tusks) */}
      <g fill={goldColor} opacity="0.9">
        <ellipse cx="36" cy="52" rx="2" ry="4" transform="rotate(-20 36 52)" />
        <ellipse cx="37" cy="62" rx="2" ry="4" transform="rotate(-15 37 62)" />
        <ellipse cx="40" cy="72" rx="2" ry="4" transform="rotate(-10 40 72)" />
        <ellipse cx="84" cy="52" rx="2" ry="4" transform="rotate(20 84 52)" />
        <ellipse cx="83" cy="62" rx="2" ry="4" transform="rotate(15 83 62)" />
        <ellipse cx="80" cy="72" rx="2" ry="4" transform="rotate(10 80 72)" />
      </g>

      {/* 6. Central Shield */}
      <path
        d="M44 48 Q60 46 76 48 C76 68, 68 84, 60 92 C52 84, 44 68, 44 48 Z"
        fill="#F59E0B"
        stroke={darkColor}
        strokeWidth="1.8"
      />

      {/* Shield Inner Rim */}
      <path
        d="M48 51 Q60 49 72 51 C72 67, 66 79, 60 86 C54 79, 48 67, 48 51 Z"
        fill="#FEF3C7"
      />

      {/* Khoisan Human Figures (Greeting / Hands Clasped in Center) */}
      {/* Left Figure */}
      <circle cx="55" cy="59" r="2.5" fill={redColor} />
      <path
        d="M55 62 L55 74 M55 65 L51 70 M55 66 L60 67 M55 74 L52 80 M55 74 L57 80"
        stroke={redColor}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Right Figure */}
      <circle cx="65" cy="59" r="2.5" fill={redColor} />
      <path
        d="M65 62 L65 74 M65 65 L69 70 M65 66 L60 67 M65 74 L68 80 M65 74 L63 80"
        stroke={redColor}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Clasped Hands Point */}
      <circle cx="60" cy="67" r="1.5" fill={goldColor} />

      {/* 7. Crossed Spear & Knobkierie (Recumbent under shield) */}
      {/* Spear blade and shaft */}
      <line x1="28" y1="96" x2="92" y2="84" stroke={darkColor} strokeWidth="2.2" strokeLinecap="round" />
      <polygon points="90,84 96,83 93,87" fill={redColor} />
      {/* Knobkierie club and shaft */}
      <line x1="28" y1="84" x2="92" y2="96" stroke={darkColor} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="28" cy="84" r="4.5" fill={goldColor} stroke={darkColor} strokeWidth="1" />

      {/* 8. Green Ribbon Scroll at Base */}
      <path
        d="M24 100 C40 95, 80 95, 96 100 L93 107 C78 102, 42 102, 27 107 Z"
        fill={greenColor}
        stroke={darkColor}
        strokeWidth="1"
      />

      {/* National Motto Micro-Text on Ribbon */}
      <text
        x="60"
        y="104.5"
        textAnchor="middle"
        fill={goldColor}
        fontSize="5"
        fontWeight="bold"
        fontFamily="sans-serif"
        letterSpacing="1"
      >
        !KE E: /XARRA //KE
      </text>
    </svg>
  );
};

interface DsacOfficialLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'compact';
}

/**
 * Official DSAC Government Branding Lockup Component
 * Combines the high-resolution corporate identity asset and authentic Coat of Arms.
 */
export const DsacOfficialLogo: React.FC<DsacOfficialLogoProps> = ({
  className = '',
  variant = 'light',
}) => {
  const isDark = variant === 'dark';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Coat of Arms Image Asset with SVG fallback */}
      <div className="relative shrink-0 flex items-center justify-center">
        <img
          src={dsacLogo}
          alt="Department of Sport, Arts and Culture"
          className="h-11 w-auto max-w-[140px] object-contain rounded drop-shadow-xs"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // If image fails or on custom backgrounds, fallback to vector SVG
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'block';
          }}
        />
        <div style={{ display: 'none' }}>
          <SouthAfricanCoatOfArms size={44} variant={isDark ? 'monochrome-white' : 'full-color'} />
        </div>
      </div>

      {/* Official Government Typographic Standard */}
      <div className={`border-l pl-3 leading-tight ${isDark ? 'border-emerald-700/60' : 'border-slate-300'}`}>
        <div className={`text-xs font-black tracking-tight ${isDark ? 'text-emerald-300' : 'text-[#007749]'}`}>
          sport, arts & culture
        </div>
        <div className={`text-[10px] font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          <span className="font-bold">Department:</span> Sport, Arts and Culture
        </div>
        <div className={`text-[9px] font-bold tracking-widest uppercase ${isDark ? 'text-emerald-400' : 'text-slate-800'}`}>
          REPUBLIC OF SOUTH AFRICA
        </div>
      </div>
    </div>
  );
};
