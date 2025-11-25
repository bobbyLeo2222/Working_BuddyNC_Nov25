export const paperIndex = [
  { id: '2024-p6-english-prelim-acsp', school: 'ACSP', year: 2024, subject: 'English', level: 'P6' },
  { id: '2024-p6-english-prelim-henry-park', school: 'Henry Park', year: 2024, subject: 'English', level: 'P6' },
  { id: '2024-p6-english-prelim-maris-stella', school: 'Maris Stella', year: 2024, subject: 'English', level: 'P6' },
  { id: '2024-p6-english-prelim-mgs', school: 'MGS', year: 2024, subject: 'English', level: 'P6' },
  { id: '2024-p6-english-prelim-raffles', school: 'Raffles Girls', year: 2024, subject: 'English', level: 'P6' },
  { id: '2024-p6-maths-prelim-raffles', school: 'Raffles Girls', year: 2024, subject: 'Maths', level: 'P6' }
];

export const paperIndexById = paperIndex.reduce((acc, paper) => {
  acc[paper.id] = paper;
  return acc;
}, {});

export const buildPaperKey = ({ level, subject, year, school }) => {
  const normalisedSubject = subject.toLowerCase();
  const normalisedLevel = level.toLowerCase();
  const normalisedSchool = school.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${year}-${normalisedLevel}-${normalisedSubject}-prelim-${normalisedSchool}`;
};

export const paperLoaders = {
  '2024-p6-english-prelim-raffles': () => import('./english/2024-p6-raffles.js'),
  '2024-p6-english-prelim-mgs': () => import('./english/2024-p6-mgs.js'),
  '2024-p6-english-prelim-maris-stella': () => import('./english/2024-p6-maris-stella.js'),
  '2024-p6-english-prelim-henry-park': () => import('./english/2024-p6-henry-park.js'),
  '2024-p6-english-prelim-acsp': () => import('./english/2024-p6-acsp.js'),
  '2024-p6-maths-prelim-raffles': () => import('./maths/2024-p6-maths-prelim-raffles.js'),
};
