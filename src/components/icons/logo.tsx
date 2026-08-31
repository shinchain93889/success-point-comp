import React from 'react';
import Image from 'next/image';

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export default function Logo({ className = '', ...props }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`} {...props}>
      <Image
        src="/img/logosp.jpeg"
        alt="Success Point Logo"
        width={36}
        height={36}
        className="w-9 h-9 object-contain rounded-lg shadow-sm shrink-0"
      />
      <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-amber-600 via-amber-500 to-blue-600 bg-clip-text text-transparent uppercase">
        SUCCESS POINT COMPUTER SCHOOL
      </span>
    </div>
  );
}
