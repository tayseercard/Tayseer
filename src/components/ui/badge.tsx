import React from 'react';

export function Badge({
  children,
  kind = 'gray',
}: {
  children: React.ReactNode;
  kind?: 'gray' | 'green' | 'rose' | 'amber' | 'blue';
}) {
  const colors: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700 ring-gray-200',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    rose: 'bg-rose-50 text-rose-700 ring-rose-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 font-medium ${colors[kind]}`}
    >
      {children}
    </span>
  );
}
