'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from 'html5-qrcode';

type Props = {
  onScan: (text: string) => void;
  onClose: () => void;
  /** Optional: preferred camera deviceId */
  deviceId?: string | null;
};

export default function Scanner({ onScan, onClose, deviceId = null }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const divId = useRef(`qr-reader-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let stopped = false;

    async function start() {
      try {
        // Create container element
        const container = document.getElementById(divId.current);
        if (!container) return;

        // Create scanner
        const scanner = new Html5Qrcode(divId.current, /* verbose= */ false);
        scannerRef.current = scanner;

        // Choose camera (back camera if possible)
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          setError('No camera found');
          return;
        }

        const chosenId =
          deviceId ||
          cameras.find((c) => /back|rear/i.test(c.label))?.id ||
          cameras[0].id;

        const config: Html5QrcodeCameraScanConfig = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          // you can add torch/zoom if supported: remember to feature-detect first
        };

        // simple de-bounce so we don’t fire multiple times
        let lastScanAt = 0;
        await scanner.start(
          { deviceId: { exact: chosenId } },
          config,
          (decodedText /*, decodedResult*/) => {
            const now = Date.now();
            if (now - lastScanAt < 1200) return; // throttle
            lastScanAt = now;

            // stop immediately after a successful scan
            stop().finally(() => onScan(decodedText));
          },
          (_errMsg) => {
            // scan failure callback (ignore noisy frames)
          }
        );

        if (!stopped) setReady(true);
      } catch (e: any) {
        setError(e?.message || 'Failed to start camera');
      }
    }

    async function stop() {
      try {
        if (scannerRef.current && await scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        if (scannerRef.current) {
          await scannerRef.current.clear();
        }
      } catch {
        // ignore
      }
    }

    start();

    return () => {
      stopped = true;
      stop();
    };
  }, [deviceId, onScan]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Scan QR code</h3>
          <button onClick={onClose} className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50">
            Close
          </button>
        </div>

        <div
          id={divId.current}
          className="w-full aspect-square rounded-md overflow-hidden bg-black/5"
        />

        {!ready && !error && (
          <p className="mt-3 text-sm text-gray-600">Starting camera…</p>
        )}
        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}

        <p className="mt-3 text-xs text-gray-500">
          Tip: move closer and keep the code inside the square.
        </p>
      </div>
    </div>
  );
}
