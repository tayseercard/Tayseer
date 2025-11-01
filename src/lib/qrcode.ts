import QRCode from 'qrcode';

export async function voucherToDataUrl(code: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'ttps://https://tayseer.vercel.app';
  const url = `${base}/v/${encodeURIComponent(code)}`;
  return QRCode.toDataURL(url, { margin: 1, scale: 6 });
}

export function voucherDeepLink(code: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'ttps://https://tayseer.vercel.app';
  return `${base}/v/${encodeURIComponent(code)}`;
}
