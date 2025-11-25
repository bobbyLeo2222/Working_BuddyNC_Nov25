import React from 'react';

const PageHeader = ({ title, onBack, className = '' }) => (
  <header className={`mb-6 pt-4 ${className}`}>
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-[#E5E5E5] bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#9E9E9E] shadow-sm transition hover:border-[#FFB6C1] hover:text-[#333333] focus:outline-none focus:ring-4 focus:ring-[#A0E7E5]/30"
        >
          <span aria-hidden>&larr;</span>
          <span>Back</span>
        </button>
      )}
      <h1 className="text-2xl font-semibold leading-snug text-[#333333] sm:text-3xl">{title}</h1>
    </div>
  </header>
);

export default PageHeader;
