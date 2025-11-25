import mongoose from 'mongoose';
import Paper from '../models/Paper.js';
import { paperIndex, paperLoaders } from '../../client/src/data/papers/index.js';
import { paperQuestionSupport } from '../../client/src/data/papers/support.js';

const STATIC_PAPER_CACHE_VERSION = 1;
const staticPaperCache = new Map();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildCaseInsensitiveExact = (value) => new RegExp(`^${escapeRegex(value)}$`, 'i');

const isDatabaseReady = () => mongoose.connection?.readyState === 1;

const getExamType = (paperId) => {
  if (typeof paperId !== 'string') return 'paper';
  if (paperId.toLowerCase().includes('prelim')) return 'prelim';
  if (paperId.toLowerCase().includes('practice')) return 'practice';
  return 'paper';
};

const calculateQuestionCount = (sections) => {
  if (!Array.isArray(sections)) return 0;
  return sections.reduce((total, section) => {
    const count = Array.isArray(section?.questions) ? section.questions.length : 0;
    return total + count;
  }, 0);
};

const topicHints = {
  Grammar: () =>
    [
      'Check the helper words right before and after the blank to decide the tense, pronoun, or verb form that keeps the sentence correct.',
      "For example, when you meet a phrase like 'has ___ the work', you must supply a past participle such as 'completed' or 'finished'.",
    ].join(' '),
  Vocabulary: () =>
    [
      'Underline the context clues around the blank - do they describe a feeling, an action, or a quality - and match an option that fits that clue.',
      "For instance, if the text says 'Although it was raining, the children stayed ___', the contrast hints at a positive mood word like 'cheerful'.",
    ].join(' '),
  'Reading & Viewing': () =>
    [
      'Highlight the keywords from the question, then scan the passage for the same or similar phrases so you can quote the exact evidence.',
      "If the question asks for 'the reason the trip was cancelled', reread the sentence before and after that phrase in the text to confirm the stated reason.",
    ].join(' '),
  'Writing & Representing': () =>
    [
      'Keep the original idea but reshape it so it flows naturally with the opening words you are told to use.',
      "For example, turn 'It was raining but they played' into 'Despite the rain, they continued playing' so the meaning stays the same while the structure follows the prompt.",
    ].join(' '),
  'Numbers & Algebra': () =>
    [
      'Translate the story into number sentences step by step before calculating.',
      'Line up like terms, keep track of units, and check whether you should be finding one unit, the total, or the difference.',
    ].join(' '),
  'Fractions & Decimals': () =>
    [
      'Rewrite the values with common denominators or as decimals so they are easy to compare.',
      'Keep the operation order clear and simplify fractions at each stage to avoid arithmetic slips.',
    ].join(' '),
  'Ratio & Percentage': () =>
    [
      'Express the quantities in the same base unit first, then use the part-whole relationship to find one unit before scaling up.',
      'For percentage problems, convert the percent to a fraction/decimal and relate it back to the original amount.',
    ].join(' '),
  'Measurement & Geometry': () =>
    [
      'Sketch the diagram and label every given length, angle, or unit.',
      'Check whether you should convert measurements before applying the relevant area, perimeter, or angle relationships.',
    ].join(' '),
  'Data & Graphs': () =>
    [
      'Read the axis labels and keys carefully before comparing values.',
      'Identify whether the question needs a difference, total, or ratio and trace those figures directly from the chart or table.',
    ].join(' '),
  'Problem Solving': () =>
    [
      'Underline the facts given, note what is being asked, and decide which heuristics (e.g. draw a table, find one unit, work backwards) fit best.',
      'Break the scenario into smaller steps and write the number sentence for each stage before executing the calculations.',
    ].join(' '),
};

const topicExplanations = {
  Grammar: (answer) => `The option '${answer}' keeps the sentence grammatically correct in this context.`,
  Vocabulary: (answer) => `The word '${answer}' best matches the meaning suggested by the surrounding context.`,
  'Reading & Viewing': (answer) => `The response highlights the detail stated in the passage that answers the question: ${answer}.`,
  'Writing & Representing': (answer) => `This rewriting preserves the original meaning while following the required structure: ${answer}.`,
  'Numbers & Algebra': (answer) => `Applying the stated relationships leads directly to ${answer} once the correct number sentence is formed.`,
  'Fractions & Decimals': (answer) => `After expressing all values with common bases, the computation simplifies to ${answer}.`,
  'Ratio & Percentage': (answer) => `Finding one unit (or 100%) and scaling accordingly gives the final value ${answer}.`,
  'Measurement & Geometry': (answer) => `Marking the diagram and using the relevant formula or angle fact produces ${answer}.`,
  'Data & Graphs': (answer) => `Reading the exact figures from the graph/table and combining them as required yields ${answer}.`,
  'Problem Solving': (answer) => `Breaking the scenario into smaller steps and linking each statement to an equation results in ${answer}.`,
};

const buildSupport = (paperId, section, question) => {
  const explicit = paperQuestionSupport?.[paperId]?.[question.id];
  if (explicit && explicit.hint && explicit.explanation) {
    return explicit;
  }

  const topic = question.topic || section?.title || 'General';
  const languageTopics = new Set(['Grammar', 'Vocabulary', 'Reading & Viewing', 'Writing & Representing', 'Language Editing']);
  const mathTopics = new Set([
    'Numbers & Algebra',
    'Fractions & Decimals',
    'Ratio & Percentage',
    'Measurement & Geometry',
    'Geometry & Measurement',
    'Data & Graphs',
    'Problem Solving',
  ]);
  const hintBuilder = topicHints[topic];
  const hint =
    typeof hintBuilder === 'function'
      ? hintBuilder(question)
      : hintBuilder ||
        (languageTopics.has(topic)
          ? [
              'Reread the sentence around the blank to spot clue words like linking verbs, contrast markers, or descriptive phrases before choosing an answer.',
              "For a phrase such as 'has ___ the task' or 'even though it was ___', let those helper words guide which form or meaning fits best.",
            ].join(' ')
          : [
              'List the information given, convert everything into consistent units, and write the number sentence before computing.',
              'After each step, check that the result still answers what the question is asking for.',
            ].join(' '));

  if (question.type === 'open_ended') {
    const explanation = languageTopics.has(topic)
      ? `A good response should include the key ideas the passage mentioned: ${question.answer}.`
      : `Show the working that links the given values to your final statement. One acceptable answer is ${question.answer}.`;
    return { hint, explanation };
  }

  const explanationBuilder = topicExplanations[topic];
  const explanation = explanationBuilder
    ? explanationBuilder(question.answer)
    : languageTopics.has(topic)
      ? `The choice '${question.answer}' best fits the context and addresses the concept being assessed.`
      : `Carrying out the correct sequence of operations leads to '${question.answer}', which satisfies all the given conditions.`;

  return { hint, explanation };
};

const enrichSections = (paperId, sections = []) => {
  return sections.map((section) => {
    const questions = Array.isArray(section?.questions)
      ? section.questions.map((question) => {
          const support = buildSupport(paperId, section, question);
          return {
            ...question,
            hint: support.hint,
            explanation: support.explanation,
          };
        })
      : section?.questions;

    return {
      ...section,
      questions,
    };
  });
};

const cloneSections = (sections) => {
  if (!Array.isArray(sections)) return [];
  return sections.map((section) => ({
    ...section,
    questions: Array.isArray(section.questions)
      ? section.questions.map((question) => ({ ...question }))
      : section.questions,
  }));
};

const buildSummary = (paperMeta, exam, sections) => {
  const title = typeof exam?.title === 'string' ? exam.title : paperMeta.title ?? paperMeta.id;
  const booklet = typeof exam?.booklet === 'string' ? exam.booklet : null;
  const questionCount = calculateQuestionCount(sections);

  return {
    id: paperMeta.id,
    paperId: paperMeta.id,
    level: paperMeta.level,
    subject: paperMeta.subject,
    year: paperMeta.year,
    school: paperMeta.school,
    examType: getExamType(paperMeta.id),
    title,
    booklet,
    questionCount,
    metadata: {
      ...paperMeta,
      title: typeof exam?.title === 'string' ? exam.title : undefined,
      booklet: typeof exam?.booklet === 'string' ? exam.booklet : undefined,
      questionCount,
    },
  };
};

const loadStaticPaper = async (paperId) => {
  const cacheKeyBase = typeof paperId === 'string' ? paperId.toLowerCase() : '';
  const cacheKey = `${cacheKeyBase}::v${STATIC_PAPER_CACHE_VERSION}`;
  const cached = staticPaperCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const meta = paperIndex.find((paper) => paper.id.toLowerCase() === cacheKeyBase);
  if (!meta) {
    const error = new Error('Paper not found');
    error.status = 404;
    throw error;
  }

  const loader = paperLoaders[meta.id];
  if (typeof loader !== 'function') {
    const error = new Error(`No loader registered for paper ${meta.id}`);
    error.status = 404;
    throw error;
  }

  const module = await loader();
  const exam = module?.default ?? module?.exam;
  if (!exam) {
    const error = new Error(`Loader for ${meta.id} did not return an exam object`);
    error.status = 500;
    throw error;
  }

  const sections = Array.isArray(exam.sections) ? enrichSections(meta.id, exam.sections) : [];
  const summary = buildSummary(meta, exam, sections);

  const payload = {
    summary,
    exam: {
      id: typeof exam.id === 'string' ? exam.id : meta.id,
      title: summary.title,
      booklet: summary.booklet,
      sections,
    },
  };

  staticPaperCache.set(cacheKey, payload);
  return payload;
};

const sortSummaries = (a, b) => {
  if (a.year !== b.year) {
    return b.year - a.year;
  }

  const levelCompare = String(a.level).localeCompare(String(b.level), undefined, { sensitivity: 'base' });
  if (levelCompare !== 0) return levelCompare;

  const subjectCompare = String(a.subject).localeCompare(String(b.subject), undefined, { sensitivity: 'base' });
  if (subjectCompare !== 0) return subjectCompare;

  const schoolCompare = String(a.school).localeCompare(String(b.school), undefined, { sensitivity: 'base' });
  if (schoolCompare !== 0) return schoolCompare;

  return String(a.title).localeCompare(String(b.title), undefined, { sensitivity: 'base' });
};

const listStaticPapers = async ({ filters = {}, includeContent = false } = {}) => {
  const levelFilter = typeof filters.level === 'string' ? filters.level.toLowerCase() : null;
  const subjectFilter = typeof filters.subject === 'string' ? filters.subject.toLowerCase() : null;
  const examTypeFilter = typeof filters.examType === 'string' ? filters.examType.toLowerCase() : null;
  const yearFilter = Number.isFinite(filters.year) ? filters.year : null;

  const results = [];

  for (const paperMeta of paperIndex) {
    if (levelFilter && paperMeta.level.toLowerCase() !== levelFilter) continue;
    if (subjectFilter && paperMeta.subject.toLowerCase() !== subjectFilter) continue;
    if (yearFilter !== null && paperMeta.year !== yearFilter) continue;

    const metaExamType = getExamType(paperMeta.id).toLowerCase();
    if (examTypeFilter && metaExamType !== examTypeFilter) continue;

    // eslint-disable-next-line no-await-in-loop
    const { summary, exam } = await loadStaticPaper(paperMeta.id);
    if (includeContent) {
      results.push({
        ...summary,
        sections: cloneSections(exam.sections),
      });
    } else {
      results.push({ ...summary });
    }
  }

  results.sort(sortSummaries);
  return results;
};

const getStaticPaperById = async (paperId) => {
  const normalisedId = typeof paperId === 'string' ? paperId.toLowerCase() : '';
  const { summary, exam } = await loadStaticPaper(normalisedId);

  return {
    paper: {
      ...summary,
      sections: cloneSections(exam.sections),
    },
    exam: {
      ...exam,
      sections: cloneSections(exam.sections),
    },
  };
};

const buildDatabaseQuery = (filters = {}) => {
  const query = {};

  if (filters.level) {
    query.level = buildCaseInsensitiveExact(filters.level);
  }

  if (filters.subject) {
    query.subject = buildCaseInsensitiveExact(filters.subject);
  }

  if (filters.examType) {
    query.examType = buildCaseInsensitiveExact(filters.examType);
  }

  if (Number.isFinite(filters.year)) {
    query.year = filters.year;
  }

  return query;
};

export const findPapers = async ({ filters = {}, includeContent = false } = {}) => {
  if (isDatabaseReady()) {
    try {
      const query = buildDatabaseQuery(filters);
      const papers = await Paper.find(query)
        .sort({ year: -1, level: 1, subject: 1, school: 1 })
        .exec();

      if (Array.isArray(papers) && papers.length > 0) {
        return papers.map((paper) => paper.toSummary({ includeContent }));
      }
    } catch (error) {
      console.warn('Database lookup failed, falling back to static paper data', error);
    }
  }

  return listStaticPapers({ filters, includeContent });
};

export const findPaperById = async (paperId) => {
  if (!paperId) return null;

  if (isDatabaseReady()) {
    try {
      const paper = await Paper.findOne({ paperId: buildCaseInsensitiveExact(paperId) }).exec();
      if (paper) {
        return {
          paper: paper.toSummary({ includeContent: true }),
          exam: paper.toExam(),
        };
      }
    } catch (error) {
      console.warn(`Database lookup failed for paper ${paperId}, falling back to static data`, error);
    }
  }

  try {
    return await getStaticPaperById(paperId);
  } catch (error) {
    if (!error.status) {
      error.status = 500;
    }
    throw error;
  }
};

export default {
  findPapers,
  findPaperById,
};
