"use client";

import { QRCodeSVG } from "qrcode.react";

type QRCodeProps = {
  value: string;
};

export default function QRCode({ value }: QRCodeProps) {
  return (
    <div className="inline-flex rounded-xl bg-white p-6 shadow-sm">
      <QRCodeSVG
        value={value}
        size={300}
        level="M"
        marginSize={4}
      />
    </div>
  );
}