import React from 'react';

export function Stat({
  title,
  value,
  caption,
}: {
  title: string;
  value: string | number;
  caption?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {title}
      </div>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
      {caption && (
        <div className="text-[11px] text-gray-500 mt-0.5">{caption}</div>
      )}
    </div>
  );
}
