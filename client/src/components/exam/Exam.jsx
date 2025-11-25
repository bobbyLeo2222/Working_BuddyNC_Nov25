import React from 'react';
import MathText from '../MathText.jsx';

const AiHelper = ({ q, getExplanation, aiAssistance, submitted }) => {
  const assistance = aiAssistance[q.id] || {};

  const handleGetExplanation = (event) => {
    event.preventDefault();
    getExplanation(q);
  };

  const renderSpinner = () => (
    <svg className="h-4 w-4 animate-spin text-[#333333]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  return (
    <div className="w-full">
      {submitted && q.type === 'mcq' && (
        <div className="my-1 flex items-center justify-start gap-2 sm:justify-end">
          <button
            onClick={handleGetExplanation}
            disabled={assistance.isExplanationLoading}
            className="flex items-center gap-1 rounded-full bg-[#A0E7E5] px-3 py-1 text-xs font-semibold text-[#333333] transition hover:bg-[#7BD8D5] disabled:opacity-50"
          >
            {assistance.isExplanationLoading ? renderSpinner() : '✨'}
            <span>Explain</span>
          </button>
        </div>
      )}

      {assistance.error && (
        <div className="mt-2 rounded-2xl border border-[#FFB6C1]/60 bg-[#FFB6C1]/20 p-2 text-sm text-[#333333]">
          {assistance.error}
        </div>
      )}

      {assistance.explanation && submitted && (
        <div className="mt-2 rounded-2xl border border-[#A0E7E5]/60 bg-[#A0E7E5]/20 p-3 text-sm text-[#333333]">
          <p className="whitespace-pre-wrap">{assistance.explanation}</p>
        </div>
      )}
    </div>
  );
};


export const MCQ = ({ q, qNumber, onAnswer, userAnswer, submitted, getExplanation, aiAssistance }) => {
  const normalise = (value) =>
    typeof value === 'string' ? value.trim().toLowerCase() : String(value).trim().toLowerCase();
  return (
    <div className="mb-6 last:mb-0">
      <p className="mb-1 text-base font-medium text-[#333333] sm:text-lg">
        <span className="font-bold">{qNumber}.</span>{' '}
        <MathText text={q.question} />
      </p>

      <AiHelper q={q} getExplanation={getExplanation} aiAssistance={aiAssistance} submitted={submitted} />

      <div className="space-y-2 mt-2">
        {q.options.map((option, index) => {
          const isSelected = userAnswer === option;
          const matchesCorrect = Array.isArray(q.answer)
            ? q.answer.some((ans) => normalise(ans) === normalise(option))
            : normalise(option) === normalise(q.answer);

          let optionClass =
            'w-full text-left rounded-2xl border border-[#E5E5E5] px-4 py-3 text-[#333333] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A0E7E5]/60';

          if (!submitted) {
            optionClass += isSelected
              ? ' border-[#A0E7E5] bg-[#A0E7E5]/20'
              : ' hover:border-[#A0E7E5] hover:bg-[#A0E7E5]/15';
          } else {
            if (matchesCorrect) {
              optionClass += ' border-[#34C759] bg-[#34C759]/15 text-[#0B6C2F] font-semibold';
            } else if (isSelected) {
              optionClass += ' border-[#FF4D4F] bg-[#FF4D4F]/15 text-[#7A1120]';
            } else {
              optionClass += ' text-[#9E9E9E]';
            }
            optionClass += ' cursor-not-allowed';
          }

          return (
            <button
              key={index}
              disabled={submitted}
              onClick={() => onAnswer(q.id, option)}
              className={optionClass}
            >
              <span className="text-sm font-medium sm:text-base">
                ({index + 1}) <MathText text={option} />
              </span>
              {submitted && matchesCorrect && <span className="ml-3 text-lg">✅</span>}
              {submitted && isSelected && !matchesCorrect && <span className="ml-3 text-lg">❌</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const TextAreaQuestion = ({ q, qNumber, onAnswer, userAnswer, submitted, feedback, isMarking }) => {
    const evaluation = feedback[q.id];
    let feedbackColor = 'bg-[#F2F2F2] border-[#E5E5E5] text-[#333333]';
    if (evaluation) {
        if (evaluation.toLowerCase().startsWith('correct')) {
            feedbackColor = 'bg-[#34C759]/15 border-[#34C759] text-[#0B6C2F]';
        } else if (evaluation.toLowerCase().startsWith('incorrect')) {
            feedbackColor = 'bg-[#FF4D4F]/15 border-[#FF4D4F] text-[#7A1120]';
        } else if (evaluation.toLowerCase().startsWith('partially correct')) {
            feedbackColor = 'bg-[#F2F2F2] border-[#E5E5E5] text-[#333333]';
        }
    }

    return (
        <div className="mb-6 last:mb-0">
            <p className="mb-1 text-base font-medium text-[#333333] sm:text-lg">
                <span className="font-bold">{qNumber}.</span>{' '}
                <MathText text={q.question} />
            </p>
            {q.prompt && (
                <p className="my-2 text-sm text-[#9E9E9E] sm:text-base">
                    Use the prompt:{' '}
                    <span className="font-semibold">
                        <MathText text={q.prompt} />
                    </span>
                </p>
            )}
            <textarea
                value={userAnswer || ''}
                onChange={(e) => onAnswer(q.id, e.target.value)}
                disabled={submitted}
                rows="3"
                className="w-full rounded-2xl border border-[#E5E5E5] p-2 focus:border-[#A0E7E5] focus:outline-none focus:ring-4 focus:ring-[#A0E7E5]/40"
            />
            {submitted && (
                <div className={`mt-2 p-3 rounded-lg transition-colors duration-500 ${feedbackColor}`}>
                    {isMarking && !evaluation && (
                            <p className="flex items-center">
                            <svg className="-ml-1 mr-3 h-5 w-5 animate-spin text-[#333333]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Marking with AI...
                        </p>
                    )}
                    {evaluation && (
                        <div>
                            <p><span className="font-bold">AI Feedback:</span> {evaluation}</p>
                            <p className="mt-2 border-t border-[#E5E5E5]/40 pt-2 text-xs text-[#9E9E9E]">
                                <MathText text={q.answer} />
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


export const PassageRenderer = ({ passage, questions, onAnswer, userAnswers, submitted, wordBank, feedback, isMarking }) => {
    if (!passage) return null;
    
    const parts = passage.split(/(<u>.*?<\/u>|\(\d+\)___|\[[^\]]+\])/g).filter(Boolean);
    let qIndex = 0;

    const resolveEvaluation = (questionId) => {
        if (!submitted) {
            return { message: null, tone: 'neutral' };
        }
        const raw = feedback?.[questionId] || '';
        const normalised = raw.toLowerCase();
        if (normalised.startsWith('correct')) {
            return { message: raw, tone: 'correct' };
        }
        if (normalised.startsWith('partially correct')) {
            return { message: raw, tone: 'partial' };
        }
        if (normalised.startsWith('incorrect')) {
            return { message: raw, tone: 'incorrect' };
        }
        if (isMarking) {
            return { message: 'Marking…', tone: 'neutral' };
        }
        return { message: raw || null, tone: 'neutral' };
    };

    const decorateInputClass = (baseClass, tone) => {
        if (!submitted) {
            return baseClass;
        }
        switch (tone) {
            case 'correct':
                return `${baseClass} border-[#34C759] bg-[#34C759]/15 text-[#0B6C2F]`;
            case 'incorrect':
                return `${baseClass} border-[#FF4D4F] bg-[#FF4D4F]/15 text-[#7A1120]`;
            case 'partial':
                return `${baseClass} border-[#FACC15] bg-[#FEF3C7] text-[#92400E]`;
            default:
                return `${baseClass} border-[#E5E5E5]`;
        }
    };

    const renderEvaluation = (message, tone) => {
        if (!message) return null;
        let colorClass = 'text-[#9E9E9E]';
        if (tone === 'correct') {
            colorClass = 'text-[#0B6C2F]';
        } else if (tone === 'incorrect') {
            colorClass = 'text-[#7A1120]';
        } else if (tone === 'partial') {
            colorClass = 'text-[#92400E]';
        }
        return <span className={`mt-1 text-xs font-semibold ${colorClass}`}>{message}</span>;
    };

    return (
        <div className="text-[#333333] leading-relaxed whitespace-pre-wrap">
            {parts.map((part, i) => {
                const question = questions[qIndex];
                if (!question) {
                    return (
                        <span key={i}>
                            <MathText text={part} />
                        </span>
                    );
                }

                if (part.startsWith('<u>')) {
                    const underlinedText = part.replace(/<\/?u>/g, '');

                    if (question.type === 'text_input') {
                        qIndex++;
                        const { message, tone } = resolveEvaluation(question.id);
                        return (
                        <span key={i} className="inline-flex flex-col items-center mx-1 my-1">
                                <span className="underline">
                                    <MathText text={question.original} />
                                </span>
                                <input
                                    type="text"
                                    value={userAnswers[question.id] || ''}
                                    onChange={(e) => onAnswer(question.id, e.target.value)}
                                    disabled={submitted}
                                    className={decorateInputClass('mt-2 w-full max-w-[10rem] rounded-md border p-2 text-center text-sm transition-colors duration-200', tone)}
                                    placeholder={`(${question.id})`}
                                />
                                {renderEvaluation(message, tone)}
                            </span>
                        );
                    }

                    qIndex++;
                    return (
                        <span key={i} className="inline-flex flex-col items-center mx-1">
                            <span className="underline">
                                <MathText text={underlinedText} />
                            </span>
                            <span className="text-xs font-semibold mt-1">({question.id})</span>
                        </span>
                    );
                } else if (part.match(/\(\d+\)___/)) {
                     qIndex++;
                     if(question.type === 'dropdown') {
                         return (
                            <span key={i} className="inline-block mx-1">
                              <span className="font-bold">({question.id})</span>
                               <select value={userAnswers[question.id] || ''} onChange={(e) => onAnswer(question.id, e.target.value)} disabled={submitted} className="rounded-md border p-1 text-sm">
                                    <option value="" disabled>Select...</option>
                                    {wordBank.map(word => <option key={word} value={word}>{word}</option>)}
                                </select>
                            </span>
                         );
                    } else if (question.type === 'mcq') {
                        const { message, tone } = resolveEvaluation(question.id);
                        return (
                            <span key={i} className="mx-1 my-1 inline-flex flex-col items-center">
                                <span className="font-bold">({question.id})</span>
                                <div
                                    className={decorateInputClass('mt-2 flex w-full max-w-[7rem] items-center justify-center rounded-md border bg-white px-2 py-1 text-center text-sm text-[#333333] transition-colors duration-200', tone)}
                                    role="textbox"
                                    aria-readonly="true"
                                    tabIndex={-1}
                                >
                                    {userAnswers[question.id] ? (
                                        <span className="font-medium">
                                            <MathText text={userAnswers[question.id]} />
                                        </span>
                                    ) : (
                                        <span className="text-[#9E9E9E]">({question.id})</span>
                                    )}
                                </div>
                                {renderEvaluation(message, tone)}
                            </span>
                        );
                    } else {
                        const { message, tone } = resolveEvaluation(question.id);
                        return (
                            <span key={i} className="inline-flex flex-col items-center mx-1 my-1">
                                <span className="font-bold">({question.id})</span>
                                <input
                                    type="text"
                                    value={userAnswers[question.id] || ''}
                                    onChange={(e) => onAnswer(question.id, e.target.value)}
                                    disabled={submitted}
                                    className={decorateInputClass('w-full max-w-[7rem] rounded-md border p-1 text-center text-sm transition-colors duration-200', tone)}
                                />
                                {renderEvaluation(message, tone)}
                            </span>
                        );
                    }
                } else if (part.startsWith('[') && part.endsWith(']')) {
                    const rawText = part.slice(1, -1);
                    const currentQuestion = questions[qIndex];

                    if (!currentQuestion) {
                        return (
                            <span key={i}>
                                <MathText text={part} />
                            </span>
                        );
                    }

                    qIndex++;
                    const displayText = currentQuestion.original || rawText;
                    const { message, tone } = resolveEvaluation(currentQuestion.id);

                    if (currentQuestion.type === 'mcq') {
                        return (
                            <span key={i} className="mx-1 my-2 inline-flex min-w-[120px] flex-col items-center">
                                <span className="rounded-md bg-[#F5F5F5] px-2 py-1 text-sm font-medium text-[#555555]">
                                    <MathText text={displayText} />
                                </span>
                                <div
                                    className={decorateInputClass('mt-2 flex w-full max-w-[12rem] items-center justify-center rounded-md border bg-white px-3 py-2 text-center text-sm text-[#333333] transition-colors duration-200', tone)}
                                    role="textbox"
                                    aria-readonly="true"
                                    tabIndex={-1}
                                >
                                    {userAnswers[currentQuestion.id] ? (
                                        <span className="font-medium">
                                            <MathText text={userAnswers[currentQuestion.id]} />
                                        </span>
                                    ) : (
                                        <span className="text-[#9E9E9E]">({currentQuestion.id})</span>
                                    )}
                                </div>
                                {renderEvaluation(message, tone)}
                            </span>
                        );
                    }

                    return (
                        <span key={i} className="inline-flex flex-col items-center mx-1 my-2 min-w-[120px]">
                            <span className="rounded-md bg-[#F5F5F5] px-2 py-1 text-sm font-medium text-[#555555]">
                                <MathText text={displayText} />
                            </span>
                            <input
                                type="text"
                                value={userAnswers[currentQuestion.id] || ''}
                                onChange={(e) => onAnswer(currentQuestion.id, e.target.value)}
                                disabled={submitted}
                                className={decorateInputClass('mt-2 w-full max-w-[12rem] rounded-md border bg-white px-3 py-2 text-center text-sm transition-colors duration-200 focus:border-[#A0E7E5] focus:outline-none focus:ring-4 focus:ring-[#A0E7E5]/40', tone)}
                                placeholder={`(${currentQuestion.id})`}
                                aria-label={`Answer for question ${currentQuestion.id}`}
                            />
                            {renderEvaluation(message, tone)}
                        </span>
                    );
                }
                return (
                    <span key={i}>
                        <MathText text={part} />
                    </span>
                );
            })}
        </div>
    );
};

export const VisualTextSection = ({ section }) => {
    if (!section?.passage) {
        return null;
    }

    const rawPassage = section.passage.trim();
    const hasHtml = /<\/?[a-z][\s\S]*>/i.test(rawPassage);

    if (hasHtml) {
        return (
            <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden">
                <div
                    className="p-6 text-[#333333] leading-relaxed space-y-4"
                    dangerouslySetInnerHTML={{ __html: rawPassage }}
                />
            </div>
        );
    }

    const paragraphs = rawPassage
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

    return (
        <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 text-[#333333] leading-relaxed space-y-4">
                {paragraphs.map((paragraph, index) => (
                    <p
                        key={index}
                        dangerouslySetInnerHTML={{ __html: paragraph.replace(/\n/g, '<br />') }}
                    />
                ))}
            </div>
        </div>
    );
};
