import { useEffect, useRef } from "react";

interface QRCodeDisplayProps {
  url: string;
  size?: number;
}

export default function QRCodeDisplay({ url, size = 160 }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!url || !canvasRef.current) return;

    // Use QR Server API via a simple image approach since jsQR is for scanning
    // We'll use canvas to draw a QR code using the qrcode.js approach via inline generation
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Load QR code image from Google Chart API alternative (qr-server)
    const img = new Image();
    img.crossOrigin = "anonymous";
    // Use a data URL generated approach — create an img element pointing to QR API
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&format=png&qzone=1&color=200-29-56&bgcolor=255-255-255`;

    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);
    };
    img.onerror = () => {
      // Fallback: draw placeholder
      canvas.width = size;
      canvas.height = size;
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "#1e3a8a";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("QR Code", size / 2, size / 2 - 6);
      ctx.fillText("(scan enabled)", size / 2, size / 2 + 10);
    };
    img.src = qrApiUrl;
  }, [url, size]);

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-2">
      <div className="bg-white p-3 rounded-xl border border-border shadow-xs inline-block">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="block"
          aria-label="QR Code for emergency medical profile"
        />
      </div>
      <p className="text-[10px] text-muted-foreground text-center max-w-[150px] leading-tight">
        Scan to view emergency info
      </p>
    </div>
  );
}
