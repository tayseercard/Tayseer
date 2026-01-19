import React from 'react';

export function Stat({
  title,
  value,
  caption,
  color,
  compact,
}: {
  title: string;
  value: string | number;
  caption?: string;
  color?: 'emerald' | 'amber' | 'rose' | 'sky' | 'indigo' | 'gray';
  compact?: boolean;
}) {
  const colors = {
    emerald: 'border-emerald-200 bg-emerald-50/50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50/50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50/50 text-rose-700',
    sky: 'border-sky-200 bg-sky-50/50 text-sky-700',
    indigo: 'border-indigo-200 bg-indigo-50/50 text-indigo-700',
    gray: 'border-gray-200 bg-white text-gray-900',
  };

  const colorClasses = color ? colors[color] : colors.gray;
  return (
    <div className={`rounded-xl border shadow-sm flex flex-col ${compact ? 'p-2.5 px-3' : 'p-4'} ${colorClasses}`}>
      <div className={`${compact ? 'text-[10px]' : 'text-xs'} font-medium text-gray-500 uppercase tracking-wide mb-0.5`}>
        {title}
      </div>
      <div className={`${compact ? 'text-base' : 'text-lg'} font-bold ${!color ? 'text-gray-900' : ''}`}>{value}</div>
      {caption && (
        <div className="text-[11px] text-gray-500 mt-0.5">{caption}</div>
      )}
    </div>
  );
}
