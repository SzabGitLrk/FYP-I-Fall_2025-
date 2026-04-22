/**
 * Marine ImageNet classes — cleaned to only genuine aquatic/marine species.
 * Removed all birds, dogs, and non-marine objects that were incorrectly included.
 */
export const MARINE_IMAGENET_CLASSES = [
  // Sharks
  'great white shark', 'white shark', 'man-eater',
  'tiger shark', 'hammerhead', 'hammerhead shark',
  'whale shark', 'nurse shark', 'bull shark', 'basking shark',

  // Rays
  'electric ray', 'crampfish', 'numbfish', 'torpedo',
  'stingray', 'manta ray', 'eagle ray',

  // Bony fish
  'goldfish', 'tench', 'barracouta', 'coho', 'coho salmon',
  'rock beauty', 'anemone fish', 'clownfish',
  'sturgeon', 'gar', 'lionfish', 'puffer', 'pufferfish',
  'eel', 'moray', 'grouper', 'snapper', 'tuna', 'mackerel',
  'flounder', 'sole', 'halibut', 'cod', 'herring', 'sardine',
  'anchovy', 'barracuda', 'swordfish', 'marlin', 'sailfish',
  'triggerfish', 'parrotfish', 'wrasse', 'damselfish',
  'angelfish', 'butterflyfish', 'surgeonfish', 'tang',

  // Invertebrates
  'jellyfish', 'sea anemone', 'brain coral', 'coral reef', 'coral',
  'sea slug', 'nudibranch', 'chiton', 'chambered nautilus', 'nautilus',
  'conch', 'starfish', 'sea star', 'brittle star',
  'Dungeness crab', 'rock crab', 'fiddler crab', 'king crab',
  'hermit crab', 'isopod', 'horseshoe crab', 'blue crab', 'mud crab',
  'American lobster', 'spiny lobster', 'crayfish',
  'octopus', 'squid', 'cuttlefish',
  'sea urchin', 'sea cucumber', 'sea slug',
  'shrimp', 'prawn', 'krill',
  'mussel', 'oyster', 'clam', 'scallop',

  // Marine mammals
  'grey whale', 'gray whale', 'killer whale', 'orca', 'humpback whale',
  'blue whale', 'sperm whale', 'minke whale', 'right whale',
  'dugong', 'manatee', 'sea lion', 'seal', 'fur seal', 'walrus',
  'dolphin', 'bottlenose dolphin', 'spinner dolphin', 'porpoise',

  // Reptiles
  'sea turtle', 'leatherback turtle', 'green turtle', 'hawksbill turtle',
  'loggerhead turtle', 'flatback turtle', 'sea snake',

  // Seahorse
  'seahorse', 'sea horse',

  // Other marine
  'penguin', 'king penguin', 'pelican', 'albatross',
  'sea lion', 'dugong',
];

/**
 * Check if a MobileNet prediction is a fish or marine species.
 * Uses the cleaned marine-only class list + keyword fallback.
 * @param {string} className - The class name from MobileNet
 * @returns {boolean}
 */
export function isFishCategory(className) {
  const lowerClass = className.toLowerCase();

  // Direct match against cleaned marine classes
  if (MARINE_IMAGENET_CLASSES.some(cat => lowerClass.includes(cat.toLowerCase()))) {
    return true;
  }

  // Keyword fallback for classes not explicitly listed
  const marineKeywords = [
    'fish', 'shark', 'ray', 'whale', 'dolphin', 'seal',
    'jellyfish', 'coral', 'crab', 'lobster', 'octopus', 'squid',
    'starfish', 'seahorse', 'marine', 'aquatic', 'turtle',
    'eel', 'tuna', 'salmon', 'shrimp', 'prawn', 'nautilus',
    'anemone', 'urchin', 'barnacle', 'mussel', 'oyster',
  ];

  return marineKeywords.some(keyword => lowerClass.includes(keyword));
}
