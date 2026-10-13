import React from 'react';

export default function Logo({ size = 36, className = '' }) {
  return (
    <div 
      className={`relative flex items-center justify-center rounded-2xl p-1 bg-gradient-to-br from-slate-900 via-church-card to-church-dark border border-church-blue/30 shadow-md shadow-blue-900/30 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <rect x="18" y="44" width="7" height="24" rx="3.5" fill="#2563eb" />
        <rect x="32" y="34" width="7" height="42" rx="3.5" fill="#2563eb" />
        
        <rect x="46.5" y="20" width="7" height="60" rx="3.5" fill="#ffffff" />
        <rect x="37" y="35" width="26" height="7" rx="3.5" fill="#ffffff" />
        
        <rect x="61" y="34" width="7" height="42" rx="3.5" fill="#2563eb" />
        <rect x="75" y="44" width="7" height="24" rx="3.5" fill="#2563eb" />
      </svg>
    </div>
  );
}