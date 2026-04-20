/**
 * Dictionary Configuration for Text Processing Service
 *
 * This file contains all the dictionaries used for parsing and understanding
 * user input. Each category can be extended by adding more synonyms.
 *
 * ============================================================
 * UNDERSTANDING THE DICTIONARIES
 * ============================================================
 *
 * 1. PROTECTED_WORDS (Line ~115)
 *    These are common English words that should NEVER be spell-checked.
 *    Why? Because they're always valid and shouldn't be "corrected".
 *    Example: "the" → if we spell-checked this, it might become "teh" (wrong!)
 *    Used in: service/text-processing.service.ts line 59 - applySpellCheck()
 *
 * 2. CONTAINMENT_KEYS (Line ~95)
 *    Words that indicate something is INSIDE something else.
 *    Used to link items to their containing box.
 *    Example: "box Tools containing Hammer" - "containing" tells us Hammer is in Tools
 *    Used in: service/text-processing.service.ts line 123 - parseExtraction()
 *
 * 3. CONNECTORS (Line ~85)
 *    Words that link a name to an entity.
 *    Example: "storage named Garage" - "named" connects "Garage" to "storage"
 *
 * 4. DESCRIPTION_KEYS (Line ~105)
 *    Words that introduce additional details/descriptions.
 *    Example: "box Tools with description Heavy" - "with" introduces the description
 *
 * 5. STOP_WORDS (Line ~129)
 *    Courtesy/filler words removed before normalization and early validation.
 *    Example: "hi please add box" -> "add box"
 *
 * 6. NON_SINGULARIZABLE_WORDS (Line ~145)
 *    Words that should keep their plural/common label form during heavy normalization.
 *    Example: "tools" should stay "Tools", not become "Tool".
 *
 * 7. SPELLCHECK_EXCLUDED_WORDS (Line ~160)
 *    Dictionary words we intentionally do NOT auto-correct to.
 *    Why? These are often valid user-defined names like "Garage", "Tools", or "Archive".
 *    Used in: service/text-processing.service.ts spell-check candidate generation
 *
 * 8. CUSTOM_NUMBER_MAP (Line ~175)
 *    Words that convert to numbers.
 *    Example: "add dozen items" → "add 12 items"
 *
 * ============================================================
 * EXAMPLE PARSING
 * ============================================================
 *
 * Input: "Create storage Garage with box Tools containing Hammer"
 *
 * - "Create" → INTENT (CREATE) from INTENTS.CREATE
 * - "storage" → ENTITY from ENTITIES.STORAGE
 * - "Garage" → the name of the storage
 * - "with" → DESCRIPTION_KEYS (introduces description) OR CONNECTOR
 * - "box" → ENTITY from ENTITIES.BOX
 * - "Tools" → the name of the box
 * - "containing" → CONTAINMENT_KEYS (links item to box)
 * - "Hammer" → ITEM (goes inside Tools box)
 */

export const DICTIONARY_CONFIG = {
  /**
   * INTENTS - Words that indicate the user's intended action
   * Each key represents an intent type with multiple synonyms
   */

  INTENTS: {
    /** Create a new storage, box, or item */
    CREATE: [
      'create',
      'setup',
      'make',
      'new',
      'build',
      'establish',
      'add new',
      'produce',
      'generate',
      'initiate',
      'register',
      'organize',
      'prepare',
      'construct',
      'design',
      'install',
      'deploy',
      'start',
      'open',
      'launch',
      'found',
      'set up',
      'get',
      'acquire',
      'purchase',
      'buy',
      'rent',
    ],
    /** Add/increment items or boxes */

    INCREMENT: [
      'add',
      'put',
      'insert',
      'append',
      'plus',
      'enter',
      'place',
      'store',
      'keep',
      'save',
      'deposit',
      'pack',
      'fill',
      'load',
      'stock',
      'stocking',
      'include',
      'throw in',
      'toss in',
      'drop in',
      'slip in',
      'push',
      'shove',
      'slide',
      'fit',
      'arrange',
      'position',
      'lay',
      'set',
      'place in',
      'put in',
      'drop',
      'park',
      'situate',
      'lodging',
      'house',
      'accommodate',
    ],
    /** Remove/decrement items */
    DECREMENT: [
      'remove',
      'throw',
      'takeout',
      'delete',
      'discard',
      'minus',
      'take',
      'clear',
      'empty',
      'drop',
      'pull',
      'extract',
      'withdraw',
      'dispose',
      'trash',
      'sell',
      'donate',
      'eject',
      'expel',
      'oust',
      'banish',
      'exile',
      'dismiss',
      'release',
      'free',
      'liberate',
      'unload',
      'unpack',
      'deduct',
      'subtract',
      'cut',
      'slash',
      'reduce',
      'diminish',
      'decrease',
    ],
    /** Update/modify existing items */
    UPDATE: [
      'update',
      'edit',
      'change',
      'modify',
      'alter',
      'revise',
      'rename',
      'retitle',
      'adjust',
      'correct',
      'fix',
      'amend',
      'refresh',
      'upgrade',
      'rearrange',
      'reorganize',
      'move',
      'relocate',
      'shift',
      'transfer',
      'swap',
      'exchange',
      'substitute',
      'replace',
      'renew',
      'restructure',
      'redesign',
      'rebuild',
    ],
  },

  /**
   * ENTITIES - Types of objects in the system
   * STORAGE: Where boxes are kept
   * BOX: Containers that hold items
   * ITEM: Individual things stored in boxes
   */
  ENTITIES: {
    /** Storage locations - places where boxes are stored */
    STORAGE: [
      'storage',
      'room',
      'area',
      'space',
      'warehouse',
      'zone',
      'store',
      'shop',
      'cabinet',
      'cupboard',
      'attic',
      'basement',
      'garage',
      'shed',
      'depot',
      'repository',
      'vault',
      'stockroom',
      'stockpile',
      'hoard',
      'pod',
      'unit',
      'chamber',
      'hall',
      'building',
      'facility',
      'premises',
      'location',
      'place',
      'spot',
      'house',
      'home',
      'office',
      'godown',
      'storehouse',
      'lodge',
      'quarters',
      'residence',
      'dwelling',
      'flat',
      'apartment',
      'suite',
      'floor',
      'level',
      'section',
      'sector',
      'division',
      'wing',
      'farm',
      'barn',
      'stable',
      'coop',
      'pen',
      'enclosure',
      'yard',
    ],
    /** Box types - containers for items */
    BOX: [
      'boxes',
      'box',
      'bin',
      'crate',
      'container',
      'carton',
      'drawer',
      'shelf',
      'case',
      'trunk',
      'chest',
      'tub',
      'bucket',
      'bag',
      'sack',
      'pouch',
      'basket',
      'hamper',
      'tote',
      'organizer',
      'compartment',
      'tray',
      'locker',
      'closet',
      'wardrobe',
      'storage box',
      'plastic container',
      'cardboard',
      'archive box',
      'archive',
      'file box',
      'banker box',
      'toolbox',
      'supply cabinet',
      'supply closet',
      'rack',
      'cubby',
      'cubbyhole',
      'safe',
      'strongbox',
      'cashbox',
      'kit',
      'pack',
      'bundle',
      'wrap',
      'envelope',
      'packet',
      'parcel',
      'package',
    ],
    /** Item types - things that go inside boxes */
    ITEM: [
      'items',
      'item',
      'object',
      'thing',
      'article',
      'stuff',
      'goods',
      'products',
      'merchandise',
      'supplies',
      'materials',
      'equipment',
      'gear',
      'tools',
      'utensils',
      'possessions',
      'belongings',
      'assets',
      'inventory',
      'stock',
      'collection',
      'set',
      'components',
      'parts',
      'pieces',
      'elements',
      'contents',
      'cargo',
      'freight',
      'load',
      'shipment',
      'consignment',
    ],
  },

  /**
   * CONNECTORS - Words that link names to entities
   * Used to identify when a name is being assigned to something
   *
   * Example: "storage named Garage" → "named" connects "Garage" to "storage"
   * Example: "box called Tools" → "called" connects "Tools" to "box"
   */
  CONNECTORS: [
    'named',
    'name',
    'called',
    'label',
    'labeled',
    'marked',
    'titled',
    'known as',
    'known',
    'in',
    'as',
    'for',
    'under',
    'with name',
    'titled as',
    'designated',
    'referenced',
    'identified as',
    'termed',
    'dubbed',
    'christened',
    'alias',
    'renamed',
    'labeled as',
    'styled',
    'tagged',
    'badged',
    'branded',
    'nicknamed',
    'sized',
    'dimensioned',
    'measured',
  ],

  /**
   * CONTAINMENT_KEYS - Words that indicate items are inside something
   * Used to link items to their containing box
   *
   * WHY NEEDED? To know which items go in which box.
   * Example: "box Tools containing Hammer"
   *   → "containing" tells us Hammer belongs in Tools box
   * Example: "box Winter filled with Clothes"
   *   → "filled with" tells us Clothes belong in Winter box
   *
   * Used in: parseExtraction() to detect when we're describing box contents
   */
  CONTAINMENT_KEYS: [
    'containing',
    'including',
    'like',
    'with item',
    'with items',
    'has',
    'holds',
    'containing items',
    'filled with',
    'packed with',
    'stuffed with',
    'loaded with',
    'stocked with',
    'filled',
    'packed',
    'holding',
    'including items',
    'comprising',
    'consisting of',
    'containing item',
    'storing',
    'keeping',
    'housing',
    'accommodating',
    'full of',
    'full of items',
    'full of things',
    'full of stuff',
    'stuffed',
    'jam packed',
    'crowded',
    'crammed',
    'loaded',
    'having',
  ],

  /**
   * DESCRIPTION_KEYS - Words that introduce descriptions
   * Used to capture additional details about entities
   *
   * WHY NEEDED? To capture extra info about storage/box/item.
   * Example: "storage Garage with description Main warehouse"
   *   → "with" introduces the description "Main warehouse"
   * Example: "box Tools having details Heavy items inside"
   *   → "having" introduces the description
   */
  DESCRIPTION_KEYS: [
    'details',
    'note',
    'desc',
    'meaning',
    'description',
    'with',
    'note that',
    'description is',
    'details are',
    'marked as',
    'described as',
    'info',
    'information',
    'remarks',
    'comments',
    'observations',
    'specifications',
    'about',
    'regarding',
    'concerning',
    'pertaining to',
    'relating to',
    'consisting',
    'featuring',
    'located',
  ],

  /**
   * STOP_WORDS - Courtesy/filler words removed before processing
   */
  STOP_WORDS: [
    'please',
    'kindly',
    'pls',
    'plz',
    'thank you',
    'thanks',
    'thankyou',
    'many thanks',
    'hi',
    'hello',
    'hey',
    'greetings',
    'good morning',
    'good afternoon',
    'good evening',
    'sorry',
    'dear',
    'please',
    'very much',
  ],

  /**
   * NON_SINGULARIZABLE_WORDS - Words that should keep their plural/common form
   */
  NON_SINGULARIZABLE_WORDS: [
    'tools',
    'supplies',
    'papers',
    'clothes',
    'goods',
    'belongings',
    'contents',
    'scissors',
    'glasses',
    'series',
    'species',
    'accessories',
  ],

  /**
   * SPELLCHECK_EXCLUDED_WORDS - Dictionary words we should not correct toward
   * These tend to be used as real storage, box, or item names by users.
   */
  SPELLCHECK_EXCLUDED_WORDS: [
    'garage',
    'office',
    'home',
    'house',
    'archive',
    'hamper',
    'toolbox',
    'cabinet',
    'closet',
    'drawer',
    'locker',
    'wardrobe',
    'shelf',
    'rack',
    'tray',
    'basket',
    'tools',
    'gear',
    'equipment',
    'supplies',
    'materials',
    'inventory',
    'stock',
    'collection',
    'contents',
    'cargo',
    'load',
    'kit',
    'toy',
    'toys',
    'bundle',
    'package',
    'parcel',
  ],

  /**
   * PROTECTED_WORDS - Words that should NOT be spell-checked
   * Common English words that are always valid
   *
   * WHY NEEDED? To prevent false spell-check "corrections".
   *
   * Example WITHOUT protection:
   *   Input: "add items to the box"
   *   Spell-check might incorrectly "fix" words:
   *   - "teh" → "the" (wrong! "the" was already correct)
   *   - "ad" → "add" (wrong! "add" was already correct)
   *
   * Example WITH protection:
   *   Input: "add items to the box"
   *   Protected words ("add", "to", "the") are skipped:
   *   - "add" → kept as "add" ✓
   *   - "to" → kept as "to" ✓
   *   - "the" → kept as "the" ✓
   *
   * Used in: applySpellCheck() at line 59
   */
  PROTECTED_WORDS: [
    // Articles
    'and',
    'the',
    'is',
    'in',
    'to',
    'for',
    'with',
    'on',
    'at',
    'by',
    'an',
    'a',
    'it',
    'my',
    'new',
    'map',
    'of',
    'or',
    'but',
    'not',
    'big',
    // Common verbs
    'be',
    'are',
    'was',
    'were',
    'been',
    'being',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'must',
    'shall',
    'can',
    'need',
    'get',
    'got',
    'go',
    'goes',
    'went',
    // Pronouns
    'this',
    'that',
    'these',
    'those',
    'i',
    'you',
    'he',
    'she',
    'we',
    'they',
    'me',
    'him',
    'her',
    'us',
    'them',
    // Prepositions
    'from',
    'into',
    'out',
    'up',
    'down',
    'over',
    'under',
    'again',
    'once',
    'about',
    'after',
    'before',
    'behind',
    'below',
    'above',
    'across',
    'along',
    'among',
    'around',
    'between',
    'during',
    'through',
    'until',
    // Others
    'all',
    'any',
    'both',
    'each',
    'few',
    'more',
    'most',
    'other',
    'some',
    'such',
    'no',
    'nor',
    'only',
    'own',
    'same',
    'so',
    'than',
    'too',
    'very',
  ],

  /**
   * CUSTOM_NUMBER_MAP - Words that map to numeric values
   * Used to convert written numbers to digits (beyond what words-to-numbers handles)
   *
   * Note: Numbers 1-10 are already handled by the words-to-numbers library
   * This handles: groupings, fractions, large numbers, compound phrases
   *
   * Example: "add dozen items" → "add 12 items"
   * Example: "add couple of boxes" → "add 2 of boxes"
   */
  CUSTOM_NUMBER_MAP: {
    // Common groupings (not handled by words-to-numbers)
    dozen: 12,
    pair: 2,
    couple: 2,
    score: 20,
    gross: 144,

    // Compound phrases
    'half dozen': 6,
    'half a dozen': 6,
    'a pair': 2,
    'a couple': 2,

    // Ordinal-like (for quantities)
    once: 1,
    twice: 2,
    thrice: 3,

    // Informal
    single: 1,
    double: 2,
    triple: 3,
    quadruple: 4,
  },

  /**
   * PHRASE_ALIASES - Common phrase mappings to standard forms
   * Used to normalize user input to recognized patterns
   *
   * WHY NEEDED? Users may use different phrasing that means the same thing.
   * Example: "new storage" → "create storage"
   * Example: "put in box" → "add to box"
   *
   * The service will replace these phrases before processing
   */
  PHRASE_ALIASES: {
    // Storage aliases
    'new storage': 'create storage',
    'new room': 'create storage',
    'new area': 'create storage',
    'add storage': 'create storage',
    'make storage': 'create storage',
    'setup storage': 'create storage',

    // Box aliases
    'new box': 'create box',
    'add box': 'create box',
    'make box': 'create box',
    'put in box': 'add to box',
    'place in box': 'add to box',

    // Item aliases
    'new item': 'add item',
    'buy item': 'add item',
    'get item': 'add item',

    // Action aliases
    'get rid of': 'remove',
    'throw away': 'remove',
    'throw out': 'remove',
    'get rid': 'remove',
    'do away': 'remove',
    'wipe out': 'remove',

    // Location aliases
    'in the': 'in',
    'into the': 'in',
    'inside the': 'in',
    inside: 'in',

    // Quantity aliases
    'a couple': '2',
    'a pair': '2',
    'couple of': '2',
    'pair of': '2',
    several: '3',
    few: '2',
    many: '5',
    'lots of': '5',
    bunch: '3',
    handful: '2',
  },
};

/**
 * Type definition for the dictionary configuration
 */
export type DictionaryConfig = typeof DICTIONARY_CONFIG;
