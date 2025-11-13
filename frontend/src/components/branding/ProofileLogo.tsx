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
      {/* Shield with Person Silhouette */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shield outline */}
        <path
          d="M50 10 L80 20 L80 50 Q80 70 50 90 Q20 70 20 50 L20 20 Z"
          fill="#10B981"
          stroke="#059669"
          strokeWidth="2"
          className="drop-shadow-lg"
        />
        
        {/* Person silhouette - head */}
        <circle cx="50" cy="35" r="9" fill="white" opacity="0.95"/>
        
        {/* Person silhouette - body */}
        <path
          d="M50 46 Q37 46 33 58 L33 66 L67 66 L67 58 Q63 46 50 46 Z"
          fill="white"
          opacity="0.95"
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
        {/* Shield */}
        <path
          d="M50 10 L80 20 L80 50 Q80 70 50 90 Q20 70 20 50 L20 20 Z"
          fill={color}
        />
        {/* Person - head */}
        <circle cx="50" cy="35" r="9" fill="white" opacity="0.95"/>
        {/* Person - body */}
        <path
          d="M50 46 Q37 46 33 58 L33 66 L67 66 L67 58 Q63 46 50 46 Z"
          fill="white"
          opacity="0.95"
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
