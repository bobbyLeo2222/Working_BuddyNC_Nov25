import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDb from '../config/db.js';
import Paper from '../models/Paper.js';
import { paperIndex, paperLoaders } from '../../client/src/data/papers/index.js';
import { paperQuestionSupport } from '../../client/src/data/papers/support.js';

dotenv.config({ path: path.resolve(fileURLToPath(new URL('../.env', import.meta.url))) });

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
};

const topicExplanations = {
  Grammar: (answer) => `The option '${answer}' keeps the sentence grammatically correct in this context.`,
  Vocabulary: (answer) => `The word '${answer}' best matches the meaning suggested by the surrounding context.`,
  'Reading & Viewing': (answer) => `The response highlights the detail stated in the passage that answers the question: ${answer}.`,
  'Writing & Representing': (answer) => `This rewriting preserves the original meaning while following the required structure: ${answer}.`,
};

const buildSupport = (paperId, section, question) => {
  const explicit = paperQuestionSupport?.[paperId]?.[question.id];
  if (explicit && explicit.hint && explicit.explanation) {
    return explicit;
  }

  const topic = question.topic || section?.title || 'General';
  const hintBuilder = topicHints[topic];
  const hint =
    typeof hintBuilder === 'function'
      ? hintBuilder(question)
      : hintBuilder ||
        [
          'Reread the sentence around the blank to spot clue words like linking verbs, contrast markers, or descriptive phrases before choosing an answer.',
          "For a phrase such as 'has ___ the task' or 'even though it was ___', let those helper words guide which form or meaning fits best.",
        ].join(' ');

  if (question.type === 'open_ended') {
    const explanation = `A good response should include the key ideas the passage mentioned: ${question.answer}.`;
    return { hint, explanation };
  }

  const explanationBuilder = topicExplanations[topic];
  const explanation = explanationBuilder
    ? explanationBuilder(question.answer)
    : `The choice '${question.answer}' best fits the context and addresses the concept being assessed.`;

  return { hint, explanation };
};

const enrichSections = (paperId, sections = []) => {
  return sections.map((section) => {
    const questions = Array.isArray(section.questions)
      ? section.questions.map((question) => {
          const support = buildSupport(paperId, section, question);
          return {
            ...question,
            hint: support.hint,
            explanation: support.explanation,
          };
        })
      : section.questions;

    return {
      ...section,
      questions,
    };
  });
};

const importPapers = async () => {
  await connectDb();

  const results = {
    processed: 0,
    skipped: 0,
    created: 0,
    updated: 0,
    errors: [],
  };

  for (const paperMeta of paperIndex) {
    results.processed += 1;
    const loader = paperLoaders[paperMeta.id];
    if (typeof loader !== 'function') {
      results.skipped += 1;
      results.errors.push(`No loader registered for paper ${paperMeta.id}`);
      continue;
    }

    try {
      const module = await loader();
      const exam = module?.default ?? module?.exam;

      if (!exam) {
        results.skipped += 1;
        results.errors.push(`Loader for ${paperMeta.id} did not return an exam object`);
        continue;
      }

      const sections = Array.isArray(exam.sections) ? enrichSections(paperMeta.id, exam.sections) : [];
      const payload = {
        paperId: paperMeta.id,
        level: paperMeta.level,
        subject: paperMeta.subject,
        year: paperMeta.year,
        school: paperMeta.school,
        examType: getExamType(paperMeta.id),
        title: typeof exam.title === 'string' ? exam.title : paperMeta.title ?? paperMeta.id,
        booklet: typeof exam.booklet === 'string' ? exam.booklet : null,
        sections,
        metadata: {
          ...paperMeta,
          title: typeof exam.title === 'string' ? exam.title : undefined,
          booklet: typeof exam.booklet === 'string' ? exam.booklet : undefined,
          questionCount: calculateQuestionCount(sections),
        },
      };

      const existing = await Paper.findOne({ paperId: paperMeta.id }).exec();
      if (existing) {
        await Paper.updateOne({ _id: existing._id }, payload).exec();
        results.updated += 1;
      } else {
        await Paper.create(payload);
        results.created += 1;
      }
    } catch (error) {
      results.skipped += 1;
      results.errors.push(`Failed to import ${paperMeta.id}: ${error.message}`);
    }
  }

  return results;
};

const run = async () => {
  try {
    const results = await importPapers();
    console.log('Paper import complete:', results);
  } catch (error) {
    console.error('Paper import failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

run();
