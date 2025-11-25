const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const EXPLICIT_MODEL = import.meta.env.VITE_GEMINI_MODEL;
const MODEL_CANDIDATES = EXPLICIT_MODEL
  ? [EXPLICIT_MODEL]
  : [
      'models/gemini-2.5-flash',
      'models/gemini-2.5-flash-lite-preview-06-17',
      'models/gemini-2.5-pro-preview-06-05',
      'models/gemini-2.0-flash-thinking-exp'
    ];
const API_BASE_URL = import.meta.env.VITE_GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
const MAX_RETRIES = 4; // total attempts = MAX_RETRIES + 1
const RETRY_DELAY_MS = 1_000;
let hasLoggedMissingKey = false;

function ensureApiKey() {
  if (!GEMINI_API_KEY) {
    throw new Error('AI service key is not configured. Set VITE_GEMINI_API_KEY in your environment.');
  }
}

function sleep(durationMs) {
  return new Promise((resolve) => setTimeout(resolve, durationMs));
}

async function callModelWithRetries(model, prompt) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ]
        })
      });

      if (!response.ok) {
        const rawBody = await response.text();
        let parsedMessage = rawBody;
        try {
          const parsed = JSON.parse(rawBody);
          parsedMessage = parsed?.error?.message || rawBody;
        } catch (parseError) {
          // Ignore JSON parse errors and use raw body instead.
        }

        const error = new Error(`AI request failed: ${response.status} ${response.statusText} - ${parsedMessage}`);
        error.status = response.status;
        error.model = model;
        throw error;
      }

      const data = await response.json();
      const candidates = data?.candidates ?? [];
      const firstCandidate = candidates.find((candidate) => !candidate.finishReason || candidate.finishReason === 'STOP');
      const text = firstCandidate?.content?.parts?.map((part) => part.text ?? '').join(' ').trim();

      if (!text) {
        const error = new Error('The AI service returned an empty response.');
        error.model = model;
        throw error;
      }

      return text;
    } catch (error) {
      lastError = error;
      const status = error.status;
      const shouldRetry =
        attempt < MAX_RETRIES &&
        ((status && status >= 500 && status < 600) || status === 429);
      if (!shouldRetry) {
        break;
      }

      const backoffDelay = RETRY_DELAY_MS * Math.pow(2, attempt);
      await sleep(backoffDelay);
    }
  }

  throw lastError || new Error('AI request failed for an unknown reason.');
}

async function generateGeminiContent(prompt) {
  ensureApiKey();

  const triedModels = [];
  let lastError;

  for (const model of MODEL_CANDIDATES) {
    triedModels.push(model);
    try {
      return await callModelWithRetries(model, prompt);
    } catch (error) {
      lastError = error;
      const status = error.status;
      const message = String(error.message || '').toLowerCase();
      const notSupported = status === 404 || message.includes('not found') || message.includes('not supported');
      const shouldTryNextModel = !EXPLICIT_MODEL && notSupported;

      if (!shouldTryNextModel) {
        break;
      }
    }
  }

  if (lastError) {
    const summary = new Error(
      `AI request failed after trying models: ${triedModels.join(', ')}. Last error: ${lastError.message}`
    );
    summary.status = lastError.status;
    summary.cause = lastError;
    summary.triedModels = triedModels;
    throw summary;
  }

  throw new Error('AI request failed for an unknown reason.');
}

export async function fetchHint(question) {
  const prompt = [
    'You are an experienced primary school English teacher.',
    'Provide a short, encouraging hint that guides the student towards the answer without giving it away.',
    'Call out the exact rule, strategy, or clue the student should focus on so the hint feels concrete rather than generic.',
    'If a tiny example (such as a sample phrase or number) will clarify the idea, include it in the hint.',
    `Question: ${question.question}`,
    question.options ? `Options: ${question.options.join(', ')}` : '',
    question.wordBank ? `Word bank: ${question.wordBank.join(', ')}` : '',
    'Keep the hint within two sentences and avoid vague encouragement.'
  ]
    .filter(Boolean)
    .join('\n');

  return generateGeminiContent(prompt);
}

export async function fetchExplanation(question) {
  const prompt = [
    'You are an experienced primary school English teacher.',
    'Explain why the correct answer is right in a friendly, concise way.',
    'Name the specific concept or wording that makes the correct answer work, and briefly mention why the common wrong idea would fail if relevant.',
    'Add a short example or mini breakdown when it helps the student see the rule in action.',
    `Question: ${question.question}`,
    question.options ? `Options: ${question.options.join(', ')}` : '',
    `Correct answer: ${question.answer}`,
    'Limit the explanation to three sentences and avoid vague statements.'
  ]
    .filter(Boolean)
    .join('\n');

  return generateGeminiContent(prompt);
}

export async function gradeOpenEndedQuestion(question, studentAnswer) {
  const normaliseFreeText = (text) =>
    typeof text === 'string'
      ? text
          .toLowerCase()
          .replace(/[^a-z0-9\s]/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      : '';

  const buildFallbackFeedback = () => {
    const expectedRaw = typeof question?.answer === 'string' ? question.answer.trim() : '';
    const expectedNormalised = normaliseFreeText(expectedRaw);
    const studentNormalised = normaliseFreeText(studentAnswer);

    if (!studentNormalised) {
      return 'No answer provided. Encourage the student to attempt the question.';
    }

    if (!expectedNormalised) {
      return 'Response recorded. Review this question with your teacher for detailed feedback.';
    }

    if (
      studentNormalised === expectedNormalised ||
      studentNormalised.includes(expectedNormalised) ||
      expectedNormalised.includes(studentNormalised)
    ) {
      return 'Correct – Your response captures all of the key ideas from the model answer.';
    }

    const expectedTokens = expectedNormalised.split(' ').filter((token) => token.length > 2);
    if (expectedTokens.length === 0) {
      return `Response recorded. Compare your answer with the model solution: ${expectedRaw}`;
    }

    const studentTokens = new Set(studentNormalised.split(' ').filter((token) => token.length > 2));
    const matches = expectedTokens.reduce((count, token) => (studentTokens.has(token) ? count + 1 : count), 0);
    const matchRatio = matches / expectedTokens.length;

    if (matchRatio >= 0.75) {
      return 'Correct – Your explanation includes the critical details expected in the model answer.';
    }

    if (matchRatio >= 0.45) {
      return `Partially correct – You hit some important points, but be sure to mention: ${expectedRaw}`;
    }

    return `Incorrect – Revisit the passage and include the key idea: ${expectedRaw}`;
  };

  if (!studentAnswer) {
    return 'No answer provided. Encourage the student to attempt the question.';
  }

  const fallbackFeedback = buildFallbackFeedback();
  const sectionTitle = typeof question?.sectionTitle === 'string' ? question.sectionTitle.trim() : '';
  const instructions = typeof question?.sectionInstructions === 'string' ? question.sectionInstructions.trim() : '';
  const passageSnippet = typeof question?.passageSnippet === 'string' ? question.passageSnippet.trim() : '';
  const wordBank = Array.isArray(question?.wordBank) ? question.wordBank.filter((entry) => typeof entry === 'string' && entry.trim()).map((entry) => entry.trim()) : [];

  const questionContext = (() => {
    if (typeof question?.question === 'string' && question.question.trim()) {
      return question.question.trim();
    }
    if (typeof question?.prompt === 'string' && question.prompt.trim()) {
      return question.prompt.trim();
    }
    if (typeof question?.original === 'string' && question.original.trim()) {
      return `Correct the highlighted word "${question.original.trim()}" from the passage.`;
    }
    if (sectionTitle) {
      return `Provide the correct response for blank ${question.id ?? ''} in the "${sectionTitle}" section.`;
    }
    return `Provide the correct response for blank ${question.id ?? ''}.`;
  })();

  const prompt = [
    'You are marking a Primary 6 English comprehension open-ended question.',
    'Assess the student answer strictly but constructively.',
    sectionTitle ? `Section: ${sectionTitle}` : null,
    instructions ? `Instructions: ${instructions}` : null,
    `Question: ${questionContext}`,
    passageSnippet ? `Passage excerpt: ${passageSnippet}` : null,
    wordBank.length > 0 ? `Word bank: ${wordBank.join(', ')}` : null,
    `Model answer: ${question.answer}`,
    `Student answer: ${studentAnswer}`,
    'Start your feedback with one of the following labels: Correct, Partially correct, or Incorrect.',
    'After the label, provide a brief justification (max three sentences).'
  ]
    .filter(Boolean)
    .join('\n');

  try {
    return await generateGeminiContent(prompt);
  } catch (error) {
    const message = String(error?.message || '');
    if (message.includes('AI service key is not configured')) {
      if (!hasLoggedMissingKey) {
        console.warn(
          'Open-ended grading is falling back to the built-in heuristic because VITE_GEMINI_API_KEY is not set.'
        );
        hasLoggedMissingKey = true;
      }
    } else {
      console.error('Falling back to heuristic open-ended grading due to AI error:', error);
    }
    return fallbackFeedback;
  }
}
