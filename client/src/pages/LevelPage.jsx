import React from 'react';

const levels = ['P6', 'P5', 'P4'];

const LevelPage = ({ onSelectLevel, title = 'Level', subtitle = 'Pick a level to load papers.' }) => (
  <div className="space-y-10 sm:space-y-12">
    <section className="rounded-[32px] border border-[#E5E5E5] bg-white px-6 py-8 text-center sm:px-8 sm:py-10">
      <h1 className="text-3xl font-semibold text-[#333333] sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-[#9E9E9E] sm:text-base">{subtitle}</p>
    </section>

    <section className="grid gap-5 sm:grid-cols-3">
      {levels.map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => onSelectLevel(level)}
          className="flex h-28 flex-col items-center justify-center rounded-3xl border border-[#E5E5E5] bg-white text-[#333333] transition hover:border-[#A0E7E5] hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-[#A0E7E5]/40 sm:h-36"
        >
          <span className="text-2xl font-semibold sm:text-3xl">{level}</span>
        </button>
      ))}
    </section>
  </div>
);

export default LevelPage;
