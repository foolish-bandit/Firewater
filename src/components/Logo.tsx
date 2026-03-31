import React from 'react';

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 340"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="FIREWATER Logo"
    >
      {/* Glass body - left side */}
      <path strokeWidth="7" d="M70,310 C60,310 55,304 55,296 C55,278 44,252 36,228 C24,196 22,168 32,140 C42,116 54,100 60,82 L64,68" />
      {/* Glass body - right side */}
      <path strokeWidth="7" d="M130,310 C140,310 145,304 145,296 C145,278 156,252 164,228 C176,196 178,168 168,140 C158,116 146,100 140,82 L136,68" />
      {/* Base */}
      <line strokeWidth="7" x1="70" y1="310" x2="130" y2="310" />
      {/* Hand wrapping around lower bowl */}
      <path strokeWidth="5.5" d="M160,256 C142,236 110,226 70,240" />
      <path strokeWidth="5.5" d="M164,242 C146,222 110,212 62,228" />
      <path strokeWidth="5.5" d="M168,228 C150,208 112,200 56,216" />
      <path strokeWidth="5" d="M166,214 C150,196 114,188 56,202" />
      {/* Steam / flame */}
      <path strokeWidth="6" d="M132,68 C138,48 126,32 134,14 C136,8 130,2 124,8" />
      <path strokeWidth="5" d="M128,22 C122,12 126,6 122,0" />
    </svg>
  );
}
