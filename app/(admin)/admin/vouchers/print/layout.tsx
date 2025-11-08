// app/(admin)/admin/vouchers/print/layout.tsx
export default function PrintLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ✅ No navbar, no sidebar, only the print content
  return <>{children}</>
}
