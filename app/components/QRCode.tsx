
"use client";

import { QRCodeSVG } from "qrcode.react";

type QRCodeProps = {
  value: string;
  fileName?: string;
};

export default function QRCode({
  value,
  fileName = "menusasa-qr",
}: QRCodeProps) {
  function downloadQRCode() {
    const svg = document.getElementById("menusasa-qr-code");

    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 900;

      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(url);
        return;
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");

      link.href = pngUrl;
      link.download = `${fileName}.png`;
      link.click();

      URL.revokeObjectURL(url);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
    };

    image.src = url;
  }

  return (
    <div className="inline-flex flex-col items-center gap-4 rounded-xl bg-white p-6 shadow-sm">
      <QRCodeSVG
        id="menusasa-qr-code"
        value={value}
        size={300}
        level="M"
        marginSize={4}
      />

      <button
        type="button"
        onClick={downloadQRCode}
        className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white transition hover:opacity-80"
      >
        Download QR Code
      </button>
    </div>
  );
}
