const DICEBEAR_BASE = 'https://api.dicebear.com/8.x';
const DEFAULT_STYLE = 'adventurer';
export const DEFAULT_AVATAR_ID = 'dicebear-explorer-classic';

export const buildDiceBearUrl = ({ style = DEFAULT_STYLE, seed, options = {} }) => {
  const params = new URLSearchParams();
  if (seed) {
    params.set('seed', seed);
  }

  Object.entries(options).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry === undefined || entry === null) return;
        params.append(key, entry);
      });
      return;
    }
    params.set(key, value);
  });

  if (!params.has('radius')) {
    params.set('radius', '50');
  }

  return `${DICEBEAR_BASE}/${style}/svg?${params.toString()}`;
};

const baseAvatars = [
  {
    id: DEFAULT_AVATAR_ID,
    title: 'Explorer Classic',
    description: 'Friendly companion straight from DiceBear’s Adventurer studio.',
    seed: 'ExplorerClassic',
    style: DEFAULT_STYLE,
    accent: '#A0E7E5',
    cost: 0,
    options: {
      backgroundColor: 'ffffff',
      backgroundType: 'solid',
    },
  },
  {
    id: 'dicebear-sketch-ranger',
    title: 'Skylight Ranger',
    description: 'A bright explorer with confident energy.',
    seed: 'SkylightRanger',
    style: DEFAULT_STYLE,
    accent: '#FFB6C1',
    cost: 35,
    options: {
      backgroundColor: ['fde2e4'],
      backgroundType: 'gradientLinear',
      backgroundRotation: 45,
    },
  },
  {
    id: 'dicebear-ember-guardian',
    title: 'Ember Guardian',
    description: 'Bold colors for learners who like to stand out.',
    seed: 'EmberGuardian',
    style: DEFAULT_STYLE,
    accent: '#FFD166',
    cost: 40,
    options: {
      backgroundColor: ['fff1b6', 'ffd1dc'],
      backgroundType: 'gradientLinear',
      backgroundRotation: 120,
    },
  },
  {
    id: 'dicebear-mint-navigator',
    title: 'Mint Navigator',
    description: 'Calm focus with a minty glow.',
    seed: 'MintNavigator',
    style: DEFAULT_STYLE,
    accent: '#C7F9CC',
    cost: 30,
    options: {
      backgroundColor: ['c7f9cc', 'a0e7e5'],
      backgroundType: 'gradientLinear',
      backgroundRotation: 300,
    },
  },
  {
    id: 'dicebear-starry-scout',
    title: 'Starry Scout',
    description: 'Celestial-inspired buddy for dreamers.',
    seed: 'StarryScout',
    style: DEFAULT_STYLE,
    accent: '#B8B8FF',
    cost: 45,
    options: {
      backgroundColor: ['dcd6f7', 'f2f1ff'],
      backgroundType: 'gradientLinear',
      backgroundRotation: 0,
    },
  },
];

const accessoryDefinitions = [
  {
    id: 'dicebear-accessory-sunglasses',
    title: 'City Shades',
    description: 'Adds sleek sunglasses to any avatar.',
    cost: 18,
    accent: '#333333',
    previewSeed: 'CityShadesDemo',
    options: {
      accessories: ['sunglasses'],
      'accessories[]': ['sunglasses'],
      accessoriesProbability: 100,
    },
  },
  {
    id: 'dicebear-accessory-round',
    title: 'Round Glasses',
    description: 'Scholar-style rounded frames.',
    cost: 15,
    accent: '#7BD8D5',
    previewSeed: 'RoundGlassesDemo',
    options: {
      accessories: ['roundGlasses'],
      'accessories[]': ['roundGlasses'],
      accessoriesProbability: 100,
    },
  },
  {
    id: 'dicebear-accessory-face-mask',
    title: 'Explorer Mask',
    description: 'Protective face mask for futuristic vibes.',
    cost: 12,
    accent: '#9E9E9E',
    previewSeed: 'ExplorerMaskDemo',
    options: {
      accessories: ['faceMask'],
      'accessories[]': ['faceMask'],
      accessoriesProbability: 100,
    },
  },
  {
    id: 'dicebear-accessory-tiaras',
    title: 'Starlit Tiara',
    description: 'Sparkling gem headband for celebrations.',
    cost: 22,
    accent: '#FFB6C1',
    previewSeed: 'StarlitTiaraDemo',
    options: {
      accessories: ['flowers'],
      'accessories[]': ['flowers'],
      accessoriesProbability: 100,
    },
  },
  {
    id: 'dicebear-accessory-visor',
    title: 'Neon Visor',
    description: 'Retro visor glow for retro fans.',
    cost: 20,
    accent: '#A0E7E5',
    previewSeed: 'NeonVisorDemo',
    options: {
      accessories: ['eyepatch'],
      'accessories[]': ['eyepatch'],
      accessoriesProbability: 100,
    },
  },
];

export const avatarCatalog = baseAvatars.map((avatar) => ({
  ...avatar,
  previewUrl: buildDiceBearUrl({
    style: avatar.style,
    seed: avatar.seed,
    options: avatar.options,
  }),
}));

export const accessoryCatalog = accessoryDefinitions;

export const findAvatarById = (id) => {
  if (!id) return avatarCatalog[0];
  return avatarCatalog.find((avatar) => avatar.id === id) ?? avatarCatalog[0];
};

export const findAccessoryById = (id) => {
  if (!id) return null;
  return accessoryCatalog.find((item) => item.id === id) ?? null;
};
