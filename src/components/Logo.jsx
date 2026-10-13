import React from 'react';

export default function Logo({ size = 34, className = '' }) {
  return (
    <div 
      className={`relative flex items-center justify-center rounded-2xl p-1.5 bg-gradient-to-br from-slate-900 via-[#0d1527] to-[#070a13] border border-blue-500/30 shadow-md shadow-blue-900/30 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Ícone Original do LouveScale (Cruz estilizada com ondas de louvor) */}
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="w-full h-full text-blue-500"
      >
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    </div>
  );
}