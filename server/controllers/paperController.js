import { findPapers, findPaperById } from '../services/paperDataService.js';

const normaliseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'y'].includes(value.toLowerCase());
  }
  return false;
};

export const listPapers = async (req, res, next) => {
  try {
    const { level, subject, examType, year } = req.query;
    const includeContent = normaliseBoolean(req.query.includeContent);

    const filters = {
      level,
      subject,
      examType,
    };

    if (year) {
      const numericYear = Number(year);
      if (Number.isFinite(numericYear)) {
        filters.year = numericYear;
      }
    }

    const payload = await findPapers({ filters, includeContent });

    return res.json({ papers: payload, total: payload.length });
  } catch (error) {
    return next(error);
  }
};

export const getPaper = async (req, res, next) => {
  try {
    const { paperId } = req.params;
    if (!paperId) {
      return res.status(400).json({ message: 'paperId is required' });
    }

    const result = await findPaperById(paperId);
    if (!result) {
      return res.status(404).json({ message: 'Paper not found' });
    }

    return res.json(result);
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ message: error.message || 'Paper not found' });
    }
    return next(error);
  }
};

export default {
  listPapers,
  getPaper,
};
