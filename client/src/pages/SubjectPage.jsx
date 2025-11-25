import React from 'react';
import PageHeader from '../components/PageHeader.jsx';

const subjects = ['English', 'Maths'];

const SubjectPage = ({ level, onSelectSubject, onBack }) => (
  <div className="space-y-8">
    <PageHeader title={`Primary ${level.slice(-1)} · Subject`} onBack={onBack} />
    <div className="grid gap-4 sm:grid-cols-3">
      {subjects.map((subject) => (
        <button
          key={subject}
          type="button"
          onClick={() => onSelectSubject(subject)}
          className="flex h-24 flex-col items-center justify-center rounded-3xl border border-[#E5E5E5] bg-white text-[#333333] transition hover:border-[#A0E7E5] hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-[#A0E7E5]/40 sm:h-28"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-[#333333] sm:text-sm">{subject}</span>
        </button>
      ))}
    </div>
  </div>
);

export default SubjectPage;
