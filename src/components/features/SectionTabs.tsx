import React from 'react';

interface SectionTabsProps {
  tabs: { id: string; label: string; count?: number | string }[];
  active: string;
  onChange: (id: string) => void;
}

/** Sub-tab bar used inside a primary DSAC section. Shared so every section looks and behaves the same. */
export const SectionTabs: React.FC<SectionTabsProps> = ({ tabs, active, onChange }) => (
  <div className="px-4 sm:px-6 pt-4 shrink-0">
    <div role="tablist" className="inline-flex flex-wrap items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
      {tabs.map(tab => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              isActive ? 'bg-[#044332] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 rounded-full font-black ${isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-700'}`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);
