// app/superadmin/layout.tsx

import SuperadminLayoutClient from "@/components/layout/superadmin/SuperadminLayoutClient";

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return <SuperadminLayoutClient>{children}</SuperadminLayoutClient>
}
