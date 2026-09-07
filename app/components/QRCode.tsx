"use client";

import { QRCodeSVG } from "qrcode.react";

type QRCodeProps = {
  value: string;
};

export default function QRCode({ value }: QRCodeProps) {
  return (
    <div className="inline-flex rounded-xl bg-white p-4 shadow-sm">
      <QRCodeSVG
        value={value}
        size={220}
        level="H"
        includeMargin
      />
    </div>
  );
}