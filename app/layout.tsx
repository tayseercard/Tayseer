import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

/* ======= Fonts ======= */
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

/* ======= Metadata ======= */
export const metadata: Metadata = {
  title: 'tayseer',
  description: 'Gift. Reward. Redeem. tayseer vouchers made simple.',
  manifest: '/manifest.webmanifest',
  themeColor: '#0A0A0C',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
};

/* ======= Viewport ======= */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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
      className={`${geistSans.variable} ${geistMono.variable} scroll-smooth`}
      style={{
        colorScheme: 'dark light',
      }}
    >
      <body
        className="min-h-[100svh] antialiased bg-[#0A0A0C] text-white selection:bg-white/20"
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

        <div className="min-h-screen flex flex-col">{children}</div>
      </body>
    </html>
  );
}
