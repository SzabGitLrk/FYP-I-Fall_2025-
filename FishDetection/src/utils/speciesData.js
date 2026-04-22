/**
 * Species encyclopedia for the 10 custom-trained marine species.
 * Pakistan / Arabian Sea focused.
 */

export const SPECIES_DATA = [
  {
    id: 'crabs',
    modelLabel: 'Crabs',
    commonName: 'Crab',
    scientificName: 'Brachyura',
    category: 'invertebrate',
    habitat: 'Coastal waters, mangroves, and tidal flats of the Arabian Sea',
    description: 'Crabs are ten-legged crustaceans found abundantly along Pakistan\'s Makran coast and Karachi harbor. Mud crabs and blue crabs are commercially important species in the local fishing industry.',
    conservationStatus: 'Least Concern',
    funFacts: [
      'Crabs communicate by drumming or waving their claws',
      'They can regenerate lost limbs over several molting cycles',
      'Karachi\'s fish harbor is one of the largest crab trading hubs in South Asia'
    ]
  },
  {
    id: 'dolphin',
    modelLabel: 'Dolphin',
    commonName: 'Dolphin',
    scientificName: 'Delphinidae',
    category: 'mammal',
    habitat: 'Arabian Sea coastline and the Indus River system',
    description: 'Pakistan is home to the critically endangered Indus River Dolphin (Platanista minor), one of the world\'s rarest mammals. Marine dolphins are also commonly spotted along the Balochistan coast.',
    conservationStatus: 'Endangered',
    funFacts: [
      'The Indus River Dolphin is nearly blind and navigates entirely by echolocation',
      'Pakistan has a dedicated Indus Dolphin Reserve in Punjab',
      'Dolphins have been observed helping fishermen in Karachi by herding fish toward nets'
    ]
  },
  {
    id: 'jelly-fish',
    modelLabel: 'Jelly Fish',
    commonName: 'Jellyfish',
    scientificName: 'Scyphozoa',
    category: 'invertebrate',
    habitat: 'Open waters and coastal zones of the Arabian Sea',
    description: 'Jellyfish blooms are a common and growing phenomenon in the Arabian Sea, often clogging fishing nets and affecting the local fishing industry in Karachi and Gwadar.',
    conservationStatus: 'Not Evaluated',
    funFacts: [
      'Jellyfish have existed for over 500 million years — older than dinosaurs',
      'Arabian Sea jellyfish blooms have increased significantly due to warming waters',
      'They have no brain, heart, or bones — 95% of their body is water'
    ]
  },
  {
    id: 'octopus',
    modelLabel: 'Octopus',
    commonName: 'Octopus',
    scientificName: 'Octopoda',
    category: 'invertebrate',
    habitat: 'Rocky reefs and sandy bottoms of the Arabian Sea',
    description: 'Octopuses are caught commercially at Karachi Fish Harbour and are exported to international markets. They are highly intelligent creatures capable of problem-solving and camouflage.',
    conservationStatus: 'Least Concern',
    funFacts: [
      'Octopuses have three hearts and blue blood',
      'They can change color and texture in milliseconds to camouflage',
      'Karachi exports significant quantities of octopus to East Asian markets annually'
    ]
  },
  {
    id: 'sea-rays',
    modelLabel: 'Sea Rays',
    commonName: 'Sea Ray',
    scientificName: 'Batoidea',
    category: 'fish',
    habitat: 'Shallow coastal waters and open sea of the Arabian Sea',
    description: 'Manta rays and stingrays are frequently encountered in Pakistani waters. Manta rays are protected under Pakistani law, while stingrays are commonly caught as bycatch by local fishermen.',
    conservationStatus: 'Vulnerable',
    funFacts: [
      'Manta rays have the largest brain-to-body ratio of any fish',
      'They can leap completely out of the water',
      'Pakistan banned manta ray fishing in 2007 to protect declining populations'
    ]
  },
  {
    id: 'seahorse',
    modelLabel: 'Seahorse',
    commonName: 'Seahorse',
    scientificName: 'Hippocampus',
    category: 'fish',
    habitat: 'Seagrass beds and coral areas along the Makran coast',
    description: 'Seahorses are found in the seagrass meadows of Pakistan\'s coastline. They are illegally traded for use in traditional medicine, making them a conservation concern in the region.',
    conservationStatus: 'Vulnerable',
    funFacts: [
      'Male seahorses carry and give birth to the young',
      'They are the slowest fish in the ocean, moving at 1.5 meters per hour',
      'Seahorse trade is regulated under CITES, but illegal collection persists in Pakistan'
    ]
  },
  {
    id: 'sharks',
    modelLabel: 'Sharks',
    commonName: 'Shark',
    scientificName: 'Selachimorpha',
    category: 'shark',
    habitat: 'Arabian Sea, from shallow coastal waters to open ocean',
    description: 'Pakistan\'s waters host numerous shark species including the whale shark, hammerhead, and bull shark. Shark fishing is a significant part of the Karachi fishing industry, though many species are now threatened.',
    conservationStatus: 'Varies by species',
    funFacts: [
      'Pakistan is one of the top 10 shark-fishing nations in the world',
      'Whale sharks — the world\'s largest fish — are regularly spotted near Karachi',
      'Shark fins are exported from Karachi to Asian markets, raising conservation concerns'
    ]
  },
  {
    id: 'starfish',
    modelLabel: 'Starfish',
    commonName: 'Starfish',
    scientificName: 'Asteroidea',
    category: 'invertebrate',
    habitat: 'Rocky shores and coral reefs along the Makran coast',
    description: 'Starfish are found along Pakistan\'s Makran coastal belt and around the Astola Island marine protected area. They play a key role in maintaining the balance of reef ecosystems.',
    conservationStatus: 'Least Concern',
    funFacts: [
      'Starfish have no blood — they use seawater to pump nutrients through their bodies',
      'They can regenerate an entire body from a single arm',
      'Astola Island off Balochistan is a key habitat for starfish in Pakistani waters'
    ]
  },
  {
    id: 'turtle-tortoise',
    modelLabel: 'Turtle_Tortoise',
    commonName: 'Sea Turtle',
    scientificName: 'Cheloniidae',
    category: 'reptile',
    habitat: 'Nesting beaches of Balochistan and the Arabian Sea',
    description: 'Pakistan\'s Balochistan coast, particularly Astola Island and Sandspit beach near Karachi, are critical nesting sites for Green and Hawksbill sea turtles. WWF-Pakistan runs active conservation programs to protect nesting females and hatchlings.',
    conservationStatus: 'Endangered',
    funFacts: [
      'Sandspit beach in Karachi is one of the largest Green turtle nesting sites in the region',
      'Female sea turtles return to the exact beach where they were born to lay eggs',
      'WWF-Pakistan has protected over 1 million turtle eggs at Karachi nesting sites'
    ]
  },
  {
    id: 'whale',
    modelLabel: 'Whale',
    commonName: 'Whale',
    scientificName: 'Cetacea',
    category: 'mammal',
    habitat: 'Deep waters of the Arabian Sea',
    description: 'Several whale species including blue whales, sperm whales, and humpback whales migrate through the Arabian Sea. Pakistan has growing whale-watching tourism potential along its 1,000km coastline.',
    conservationStatus: 'Varies by species',
    funFacts: [
      'The Arabian Sea hosts a unique, year-round population of humpback whales',
      'Blue whales — the largest animals on Earth — pass through Pakistani waters during migration',
      'Whale strandings on Karachi beaches have increased, linked to ship strikes and noise pollution'
    ]
  },
];

/**
 * Explicit mapping from ImageNet class labels → our species IDs.
 * MobileNet returns multi-word ImageNet labels like "great white shark, white shark, man-eater".
 * String.includes() matching alone misses many valid detections.
 * This map covers every relevant ImageNet class for our 10 species.
 */
export const IMAGENET_TO_SPECIES_MAP = {
  // ── Sharks ──────────────────────────────────────────────────────────────
  'great white shark':  'sharks',
  'white shark':        'sharks',
  'man-eater':          'sharks',
  'tiger shark':        'sharks',
  'hammerhead':         'sharks',
  'hammerhead shark':   'sharks',
  'whale shark':        'sharks',
  'nurse shark':        'sharks',
  'bull shark':         'sharks',
  'basking shark':      'sharks',
  'lemon shark':        'sharks',
  'reef shark':         'sharks',
  'carpet shark':       'sharks',
  'wobbegong':          'sharks',

  // ── Sea Rays ─────────────────────────────────────────────────────────────
  'electric ray':       'sea-rays',
  'crampfish':          'sea-rays',
  'numbfish':           'sea-rays',
  'torpedo':            'sea-rays',
  'stingray':           'sea-rays',
  'manta ray':          'sea-rays',
  'eagle ray':          'sea-rays',
  'bat ray':            'sea-rays',
  'skate':              'sea-rays',
  'guitarfish':         'sea-rays',

  // ── Crabs ────────────────────────────────────────────────────────────────
  'dungeness crab':     'crabs',
  'rock crab':          'crabs',
  'fiddler crab':       'crabs',
  'king crab':          'crabs',
  'hermit crab':        'crabs',
  'isopod':             'crabs',
  'horseshoe crab':     'crabs',
  'blue crab':          'crabs',
  'mud crab':           'crabs',
  'spider crab':        'crabs',
  'snow crab':          'crabs',
  'shore crab':         'crabs',

  // ── Jellyfish ────────────────────────────────────────────────────────────
  'jellyfish':          'jelly-fish',
  'moon jellyfish':     'jelly-fish',
  'box jellyfish':      'jelly-fish',
  'lion\'s mane':       'jelly-fish',
  'sea nettle':         'jelly-fish',
  'portuguese man':     'jelly-fish',

  // ── Octopus ──────────────────────────────────────────────────────────────
  'octopus':            'octopus',
  'squid':              'octopus',
  'cuttlefish':         'octopus',
  'nautilus':           'octopus',
  'chambered nautilus': 'octopus',

  // ── Seahorse ─────────────────────────────────────────────────────────────
  'seahorse':           'seahorse',
  'sea horse':          'seahorse',
  'pipefish':           'seahorse',

  // ── Starfish ─────────────────────────────────────────────────────────────
  'starfish':           'starfish',
  'sea star':           'starfish',
  'brittle star':       'starfish',
  'sea anemone':        'starfish',
  'sea urchin':         'starfish',
  'sea cucumber':       'starfish',

  // ── Sea Turtle ───────────────────────────────────────────────────────────
  'sea turtle':         'turtle-tortoise',
  'leatherback turtle': 'turtle-tortoise',
  'green turtle':       'turtle-tortoise',
  'hawksbill turtle':   'turtle-tortoise',
  'loggerhead turtle':  'turtle-tortoise',
  'flatback turtle':    'turtle-tortoise',
  'loggerhead':         'turtle-tortoise',
  'hawksbill':          'turtle-tortoise',

  // ── Whale ────────────────────────────────────────────────────────────────
  'grey whale':         'whale',
  'gray whale':         'whale',
  'killer whale':       'whale',
  'orca':               'whale',
  'humpback whale':     'whale',
  'blue whale':         'whale',
  'sperm whale':        'whale',
  'minke whale':        'whale',
  'right whale':        'whale',
  'bowhead whale':      'whale',
  'beluga':             'whale',
  'narwhal':            'whale',

  // ── Dolphin ──────────────────────────────────────────────────────────────
  'dolphin':            'dolphin',
  'bottlenose dolphin': 'dolphin',
  'spinner dolphin':    'dolphin',
  'common dolphin':     'dolphin',
  'porpoise':           'dolphin',
  'dugong':             'dolphin',
  'manatee':            'dolphin',
};

export function getSpeciesById(id) {
  return SPECIES_DATA.find(s => s.id === id);
}

export function getSpeciesByModelLabel(label) {
  if (!label) return null;
  const l = label.toLowerCase();

  // 1. Explicit map — most reliable, covers all known ImageNet labels
  for (const [key, speciesId] of Object.entries(IMAGENET_TO_SPECIES_MAP)) {
    if (l.includes(key.toLowerCase())) {
      return SPECIES_DATA.find(s => s.id === speciesId) || null;
    }
  }

  // 2. Fallback: match against modelLabel and commonName
  return SPECIES_DATA.find(s =>
    s.modelLabel.toLowerCase() === l ||
    s.commonName.toLowerCase() === l ||
    s.commonName.toLowerCase().includes(l) ||
    l.includes(s.commonName.toLowerCase())
  ) || null;
}

export function getSpeciesByName(name) {
  const n = name.toLowerCase();
  return SPECIES_DATA.find(s =>
    s.commonName.toLowerCase().includes(n) ||
    n.includes(s.commonName.toLowerCase()) ||
    s.modelLabel.toLowerCase().includes(n)
  );
}

export function getSpeciesByCategory(category) {
  if (category === 'All' || !category) return SPECIES_DATA;
  return SPECIES_DATA.filter(s => s.category === category.toLowerCase());
}

export function searchSpecies(query) {
  if (!query) return SPECIES_DATA;
  const q = query.toLowerCase();
  return SPECIES_DATA.filter(s =>
    s.commonName.toLowerCase().includes(q) ||
    s.scientificName.toLowerCase().includes(q) ||
    s.modelLabel.toLowerCase().includes(q)
  );
}

export function getCategoryDisplayName(category) {
  const names = {
    shark: 'Sharks',
    fish: 'Fish',
    invertebrate: 'Invertebrates',
    coral: 'Coral',
    mammal: 'Mammals',
    reptile: 'Reptiles',
  };
  return names[category] || category;
}

export default SPECIES_DATA;
