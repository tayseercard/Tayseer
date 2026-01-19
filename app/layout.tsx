import type { Metadata, Viewport } from 'next';
import './globals.css'
import { Toaster } from "sonner"



/* ======= Metadata ======= */
export const metadata = {
  title: 'Tayseer',
  description: 'Smart voucher system',
  manifest: '/manifest.json',
}

/* ======= Viewport ======= */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#059669',
};


/* ======= Root Layout ======= */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="scroll-smooth"
      style={{
        colorScheme: 'dark light',
      }}
    >
      <body
        className="min-h-[100svh] antialiased selection:bg-[#020035]/20"
        style={{
          // Safe-area insets for iPhones with notches
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          overscrollBehavior: 'none',
        }}
      >
        {/* 🌐 Optional: PWA updater or toast */}
        {/* <PWAUpdater /> */}

        <div className="flex flex-col">{children}</div>

        {/* 🌟 Global Toast System */}
        <Toaster
          position="top-right"
          richColors
          closeButton
          expand
        />
      </body>
    </html>
  );
}
