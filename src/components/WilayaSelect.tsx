// components/WilayaSelect.tsx
'use client';

import { WILAYAS } from "@/lib/algeria";

export default function WilayaSelect({
  value,
  onChange,
  required = false,
  className = '',
  placeholder = 'Select wilaya…',
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}) {
  return (
    <select
      className={`rounded-md border border-gray-200 bg-white/80 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200 shadow-sm ${className}`}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      required={required}
    >
      <option value="">{placeholder}</option>
      {WILAYAS.map((w) => (
        <option key={w.id} value={w.id}>
          {w.id.toString().padStart(2, '0')} — {w.name}
        </option>
      ))}
    </select>
  );
}
