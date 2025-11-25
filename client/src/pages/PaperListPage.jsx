import React from 'react';
import PageHeader from '../components/PageHeader.jsx';

const PaperListPage = ({ level, subject, papers = [], onSelectPaper, onBack, availablePaperIds = new Set() }) => {
  const vibe = `Primary ${level.slice(-1)} · ${subject}`;

  return (
    <div className="space-y-8">
      <PageHeader title={vibe} onBack={onBack} />
      {papers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#E5E5E5] bg-white p-6 text-center text-[#9E9E9E] sm:p-10">
          Coming soon
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {papers.map((paper) => {
            const isActive = availablePaperIds.has(paper.id);
            return (
              <button
                key={paper.id}
                type="button"
                onClick={() => (isActive ? onSelectPaper(paper.id) : null)}
                disabled={!isActive}
                className={`flex h-24 flex-col items-center justify-center rounded-3xl border border-[#E5E5E5] bg-white text-[#333333] transition hover:border-[#A0E7E5] hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-[#A0E7E5]/40 sm:h-32 ${
                  isActive ? '' : 'cursor-not-allowed opacity-60'
                }`}
              >
                <span className="text-sm font-medium">{paper.school}</span>
                <span className="text-xs text-[#9E9E9E]">{paper.year}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PaperListPage;
