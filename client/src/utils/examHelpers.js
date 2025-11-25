/**
 * @typedef {Object} ExamQuestion
 * @property {number|string} id
 * @property {'mcq'|'dropdown'|'text_input'|'textarea'|'open_ended'} type
 * @property {string} question
 * @property {Array<string>} [options]
 * @property {string|string[]} [answer]
 */

/**
 * @typedef {Object} ExamSection
 * @property {string} title
 * @property {string} instructions
 * @property {Array<ExamQuestion>} questions
 * @property {boolean} [isVisual]
 * @property {string} [passage]
 * @property {Array<string>} [wordBank]
 */

/**
 * @typedef {Object} Exam
 * @property {string} id
 * @property {string} title
 * @property {string} [booklet]
 * @property {Array<ExamSection>} sections
 */

export const getAllQuestions = (exam) =>
  exam?.sections?.flatMap((section) => section.questions || []) ?? [];

export const getAutoGradedQuestions = (exam) =>
  getAllQuestions(exam).filter((question) =>
    question.type === 'mcq' ||
    question.type === 'dropdown'
  );

export const getOpenEndedQuestions = (exam) =>
  getAllQuestions(exam).filter((question) =>
    question.type === 'text_input' ||
    question.type === 'textarea' ||
    question.type === 'open_ended'
  );

export const getTotalAutoGradedQuestions = (exam) => getAutoGradedQuestions(exam).length;
