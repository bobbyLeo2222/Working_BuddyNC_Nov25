const tips = [
  'Believe in the work you put in today—small efforts stack into big wins.',
  'Progress loves consistency: show up, even if it’s for ten focused minutes.',
  'Every question grows your confidence; embrace mistakes as stepping stones.',
  'Break challenges into mini goals and celebrate each one you conquer.',
  'Curiosity fuels mastery; ask why and explore beyond the answer key.',
  'Learning thrives on reflection—pause to notice what’s improving.',
  'Your future self is cheering for the time you invest right now.',
  'Practice is a playground for your brain—experiment and enjoy the process.',
  'Swap “I can’t yet” for “I’m learning how”; language shapes momentum.',
  'Momentum beats motivation: start small and let action create energy.',
  'Study in focused bursts, then let your mind breathe—you’ll retain more.',
  'Rewrite notes in your own words to spark deeper understanding.',
  'Turn errors into insight by explaining the correct step aloud.',
  'Mix subjects during revision to keep your mind sharp and engaged.',
  'Visualise success vividly; your brain loves a clear destination.',
  'Teach a concept to a friend (or imaginary buddy) to reveal gaps.',
  'Switch environments occasionally—fresh spaces boost focus.',
  'Schedule tiny rewards after tasks to make discipline feel good.',
  'Ask “what did I learn?” at the end of every session for clarity.',
  'Create cheat sheets—compress knowledge to make it memorable.',
  'Hydrate and move; an energised body keeps your brain alert.',
  'Use colour thoughtfully: highlight only key ideas to avoid overwhelm.',
  'Study with purpose: know why each topic matters to your goals.',
  'Rotate subjects weekly to build balanced strength across the board.',
  'Set a daily intention—one skill, one habit, one question to solve.',
  'Start with a warm-up question to get your mind in gear quickly.',
  'Revisit tricky problems after a break; fresh eyes spot new paths.',
  'Pair visuals with text—diagrams and mind maps anchor memory.',
  'Capture “aha!” moments in a wins journal to revisit before exams.',
  'End sessions by planning the first step for tomorrow’s study.',
  'Remember: mastery is momentum. Keep moving, and the summit appears.'
];

export const getMotivationalTip = (date = new Date()) => {
  const day = date.getDate();
  return tips[(day - 1) % tips.length];
};

export default tips;
