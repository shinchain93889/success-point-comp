'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function CertificateQRCode({ value, size = 120, className = '' }: QRCodeProps) {
  return (
    <div className={`p-2 bg-white rounded-lg shadow-sm border border-slate-200 inline-block ${className}`}>
      <QRCodeSVG
        value={value}
        size={size}
        level="H"
        includeMargin={false}
        fgColor="#0f172a"
        bgColor="#ffffff"
      />
    </div>
  );
}
