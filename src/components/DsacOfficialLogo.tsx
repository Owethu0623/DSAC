import React from 'react';
import dsacLogo from '../assets/images/dsac_official_logo_1789660825303.jpg';

interface DsacOfficialLogoProps {
  className?: string;
  variant?: 'banner' | 'lockup' | 'compact' | 'icon-only';
  height?: number;
  lightText?: boolean;
}

export const DsacOfficialLogo: React.FC<DsacOfficialLogoProps> = ({
  className = '',
  variant = 'lockup',
  height,
  lightText = true,
}) => {
  if (variant === 'banner') {
    return (
      <div className={`flex items-center gap-3 select-none ${className}`}>
        <div className="bg-white rounded-xl p-1.5 border border-emerald-800/40 shadow-sm flex items-center justify-center shrink-0">
          <img
            src={dsacLogo}
            alt="Department of Sport, Arts and Culture Republic of South Africa"
            className="h-10 sm:h-12 w-auto max-w-[200px] sm:max-w-[240px] object-contain block"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black text-xs sm:text-sm tracking-wide uppercase font-['Cabinet_Grotesk'] ${
                lightText ? 'text-white' : 'text-slate-900'
              }`}
            >
              DSAC REPO
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-400 text-emerald-950 uppercase tracking-wider">
              PFMA
            </span>
          </div>
          <span
            className={`text-[10px] font-medium leading-tight truncate ${
              lightText ? 'text-emerald-300' : 'text-slate-600'
            }`}
          >
            Statutory Public Entities &amp; NPO Oversight
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 select-none ${className}`}>
        <div className="bg-white rounded-lg p-1 border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0">
          <img
            src={dsacLogo}
            alt="DSAC Logo"
            className="h-7 w-auto max-w-[130px] object-contain block"
            referrerPolicy="no-referrer"
          />
        </div>
        <span
          className={`font-black text-xs uppercase tracking-wider ${
            lightText ? 'text-white' : 'text-slate-900'
          }`}
        >
          REPO
        </span>
      </div>
    );
  }

  if (variant === 'icon-only') {
    return (
      <div
        className={`bg-white rounded-lg p-1 border border-emerald-800/40 shadow-xs flex items-center justify-center shrink-0 ${className}`}
      >
        <img
          src={dsacLogo}
          alt="DSAC Official Logo"
          style={height ? { height: `${height}px` } : undefined}
          className={height ? 'w-auto object-contain block' : 'h-8 sm:h-9 w-auto max-w-[150px] object-contain block'}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Default 'lockup' variant: clean, professional, high-contrast
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="bg-white rounded-xl p-1.5 border border-emerald-800/40 shadow-sm flex items-center justify-center shrink-0">
        <img
          src={dsacLogo}
          alt="Department of Sport, Arts and Culture Republic of South Africa"
          style={height ? { height: `${height}px` } : undefined}
          className={height ? 'w-auto object-contain block' : 'h-8 sm:h-9 w-auto max-w-[170px] object-contain block'}
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-black text-xs tracking-wider uppercase font-['Cabinet_Grotesk'] ${
              lightText ? 'text-white' : 'text-slate-900'
            }`}
          >
            DSAC REPO
          </span>
          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400 text-emerald-950 uppercase tracking-wider">
            PFMA
          </span>
        </div>
        <span
          className={`text-[10px] font-medium leading-tight truncate ${
            lightText ? 'text-emerald-300/90' : 'text-slate-500'
          }`}
        >
          Entities Oversight System
        </span>
      </div>
    </div>
  );
};
