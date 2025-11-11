import React from "react";

interface ProofileLogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export default function ProofileLogo({ 
  size = 32, 
  showWordmark = true,
  className = "" 
}: ProofileLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Shield Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Windows Security Shield Shape */}
        <path
          d="M50 5 L90 20 L90 45 Q90 75 50 95 Q10 75 10 45 L10 20 Z"
          fill="#10B981"
          className="drop-shadow-lg"
        />
        
        {/* Checkmark */}
        <path
          d="M35 50 L45 60 L65 35"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      {/* Wordmark */}
      {showWordmark && (
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          Proofile
        </span>
      )}
    </div>
  );
}

// Icon-only variant for favicons, app icons
export function ProofileIcon({ size = 32 }: { size?: number }) {
  return <ProofileLogo size={size} showWordmark={false} />;
}

// Monochrome variant for print/special uses
export function ProofileLogoMono({ 
  size = 32, 
  showWordmark = true,
  color = "currentColor" 
}: ProofileLogoProps & { color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M50 5 L90 20 L90 45 Q90 75 50 95 Q10 75 10 45 L10 20 Z"
          fill={color}
        />
        <path
          d="M35 50 L45 60 L65 35"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {showWordmark && (
        <span className="text-2xl font-bold" style={{ color }}>
          Proofile
        </span>
      )}
    </div>
  );
}
