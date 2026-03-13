import { Test, TestingModule } from '@nestjs/testing';
import { TextProcessingService } from './text-processing.service';
import { DICTIONARY_CONFIG } from './dictionary.config';

describe('TextProcessingService', () => {
    let service: TextProcessingService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TextProcessingService],
        }).compile();

        service = module.get<TextProcessingService>(TextProcessingService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('dictionary hygiene', () => {
        const getOverlap = (left: string[], right: string[]) => {
            const leftSet = new Set(left.map((entry) => entry.toLowerCase()));
            const rightSet = new Set(right.map((entry) => entry.toLowerCase()));
            return [...leftSet].filter((entry) => rightSet.has(entry)).sort();
        };

        it('should avoid risky overlaps between storage and box dictionaries', () => {
            expect(
                getOverlap(
                    DICTIONARY_CONFIG.ENTITIES.STORAGE,
                    DICTIONARY_CONFIG.ENTITIES.BOX,
                ),
            ).toEqual([]);
        });

        it('should avoid risky overlaps between box and item dictionaries', () => {
            expect(
                getOverlap(
                    DICTIONARY_CONFIG.ENTITIES.BOX,
                    DICTIONARY_CONFIG.ENTITIES.ITEM,
                ),
            ).toEqual([]);
        });

        it('should avoid risky overlaps between containment and description dictionaries', () => {
            expect(
                getOverlap(
                    DICTIONARY_CONFIG.CONTAINMENT_KEYS,
                    DICTIONARY_CONFIG.DESCRIPTION_KEYS,
                ),
            ).toEqual([]);
        });
    });

    describe('lightNormalization', () => {
        it('should trim whitespace', () => {
            const input = '  hello world  ';
            const { normalizedText } = service.lightNormalization(input);
            expect(normalizedText).toBe('hello world');
        });

        it('should remove invisible characters', () => {
            const input = 'hello\u200Bworld';
            const { normalizedText } = service.lightNormalization(input);
            expect(normalizedText).toBe('helloworld');
        });

        it('should collapse multiple spaces', () => {
            const input = 'hello    world';
            const { normalizedText } = service.lightNormalization(input);
            expect(normalizedText).toBe('hello world');
        });

        it('should handle acronyms and lowercase other letters', () => {
            const input = 'NASA is in the USA and it is great';
            const { normalizedText } = service.lightNormalization(input);
            expect(normalizedText).toBe('NASA is in the USA and it is great');
        });

        it('should handle only one Capital to lowercase along with other words', () => {
            const input = 'A is IN the USA and it IS A great';
            const { normalizedText } = service.lightNormalization(input);
            expect(normalizedText).toBe('a is in the usa and it is a great');
        });

        it('should remove stop words from the dictionary first', () => {
            const input = 'Hi Please add NASA to the map, kindly and thank you sorry hello';
            const { normalizedText } = service.lightNormalization(input);
            expect(normalizedText).toBe('add NASA to the map, and');
        });

        it('should handle complex case and stop word scenarios', () => {
            const input = 'KINDLY pack the GPU in the BOX, THANKS';
            const { normalizedText } = service.lightNormalization(input);
            expect(normalizedText).toBe('pack the gpu in the box,');
        });

        it('should remove expanded greeting and courtesy stop words', () => {
            const input = 'Good morning dear pls register storage Garage thankyou';
            const { normalizedText } = service.lightNormalization(input);
            expect(normalizedText).toBe('register storage garage');
        });

        it('should correct typos in commands and entities', () => {
            const input = 'Creat a new boxs';
            const { normalizedText } = service.lightNormalization(input);
            expect(normalizedText).toBe('create a new boxes');
        });

        it('should correct transposed storage keywords like vualt to vault', () => {
            const input = 'add a vualt named ABC containing lockers: three clothes 7 shirts each and two watches 5 rolex each';
            const { normalizedText } = service.lightNormalization(input);
            expect(normalizedText).toContain('vault');
            expect(normalizedText).not.toContain('vualt');
        });

        it('should not rewrite toys to toss during spell-check', () => {
            const input = 'Create storage Play Room with box Toys containing toy cars';
            const { normalizedText } = service.lightNormalization(input);
            expect(normalizedText).toContain('toys');
            expect(normalizedText).not.toContain('toss');
        });

        it('should not rewrite big to bag during spell-check in item descriptions', () => {
            const input = 'set up storage Garage add box Tools including 15 Hammers with description Big steel hammers';
            const { normalizedText } = service.lightNormalization(input);
            expect(normalizedText).toContain('big steel hammers');
            expect(normalizedText).not.toContain('bag steel hammers');
        });

        it('should not rewrite toys to toss during spell-check', () => {
            const input = 'Create storage Play Room with box Toys containing toy cars';
            const { normalizedText } = service.lightNormalization(input);
            expect(normalizedText).toContain('toys');
            expect(normalizedText).not.toContain('toss');
        });

        it('should handle typos and acronyms together', () => {
            const input = 'Ad itms to the USA boxs';
            const { normalizedText } = service.lightNormalization(input);
            expect(normalizedText).toBe('add items to the USA boxes');
        });

        it('should correct structural words outside the old small keyword list', () => {
            const input = 'Create storage Garage with descrption Main Warehouse and box calld Tools contaning Hammer';
            const { normalizedText } = service.lightNormalization(input);
            expect(normalizedText).toBe(
                'create storage garage with description main warehouse and box called tools containing hammer',
            );
        });

        it('should not rewrite user names toward risky dictionary nouns', () => {
            const input = 'Create storage Garage with box Tools containing Hammer';
            const { normalizedText } = service.lightNormalization(input);
            expect(normalizedText).toContain('hammer');
            expect(normalizedText).not.toContain('hamper');
        });

        it('should convert written numbers to digits', () => {
            const input = 'Create three boxes and two items';
            const { normalizedText } = service.lightNormalization(input);
            expect(normalizedText).toBe('create 3 boxes and 2 items');
        });

        it('should handle custom word-to-number mappings (dozen, pair)', () => {
            const input = 'Add a dozen items and a pair of boxes';
            const { normalizedText } = service.lightNormalization(input);
            expect(normalizedText).toBe('add a 12 items and a 2 of boxes');
        });

        it('should store and return backup for LLM', () => {
            const input = 'Please Create three boxs';
            const result = service.lightNormalization(input);
            expect(result.llmBackup).toBe(result.normalizedText);
            expect(result.normalizedText).toBe('create 3 boxes');
        });

        it('should detect shouting and normalize to lowercase before acronym rules', () => {
            const input = 'CREATE BOXES';
            const { normalizedText } = service.lightNormalization(input);
            expect(normalizedText).toBe('create boxes');
        });

        it('should preserve uppercase acronyms inside otherwise normalized input', () => {
            const input = 'Ad storage SZABIST and boxs for BSCS papers';
            const { normalizedText } = service.lightNormalization(input);
            expect(normalizedText).toBe('add storage SZABIST and boxes for BSCS papers');
        });

        it('should protect prepositions (for, to) and words like "a" from numeric conversion', () => {
            const testInputs = [
                { input: 'Move this for me', expected: 'move this for me' },
                { input: 'Go to the box', expected: 'go to the box' },
                { input: 'I have a box', expected: 'i have a box' },
            ];

            testInputs.forEach(({ input, expected }) => {
                const { normalizedText } = service.lightNormalization(input);
                expect(normalizedText).toBe(expected);
            });
        });

        it('should return empty objects for null/undefined', () => {
            expect(service.lightNormalization(null as any)).toEqual({ normalizedText: '', llmBackup: '', typoCount: 0 });
            expect(service.lightNormalization(undefined as any)).toEqual({ normalizedText: '', llmBackup: '', typoCount: 0 });
        });
    });

    describe('Phase 2 & 4: parseExtraction Multi-Entity', () => {
        const testCases = [
            {
                input: "setup a new room Office",
                expected: {
                    intent: 'create', storageName: 'office', storageDescription: null,
                    boxes: [], items: [],
                    boxName: null, boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "put items in storage Garage",
                expected: {
                    intent: 'increment', storageName: 'garage', storageDescription: null,
                    boxes: [], items: [],
                    boxName: null, boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "Create storage Garage with description Main Warehouse",
                expected: {
                    intent: 'create', storageName: 'garage', storageDescription: 'main warehouse',
                    boxes: [], items: [],
                    boxName: null, boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "Box 1: Tools (Heavy)",
                expected: {
                    intent: null, storageName: null, storageDescription: null,
                    boxes: [{ name: 'tools', quantity: null, description: 'heavy', clientRef: 'b1' }],
                    items: [],
                    boxName: 'tools', boxQuantity: null, boxDescription: 'heavy', ambiguous: false
                }
            },
            {
                input: "3 Boxes for Winter (Clothes)",
                expected: {
                    intent: null, storageName: null, storageDescription: null,
                    boxes: [{ name: 'winter', quantity: 3, description: 'clothes', clientRef: 'b1' }],
                    items: [],
                    boxName: 'winter', boxQuantity: 3, boxDescription: 'clothes', ambiguous: false
                }
            },
            {
                input: "Create storage Garage with Box Tools containing Hammer and Wrench, and Box Winter containing Scarf and Coat.",
                expected: {
                    intent: 'create', storageName: 'garage', storageDescription: null,
                    boxes: [
                        { name: 'tools', quantity: null, description: null, clientRef: 'b1' },
                        { name: 'winter', quantity: null, description: null, clientRef: 'b2' }
                    ],
                    items: [
                        { name: 'hammer', quantity: 1, description: null, boxClientRef: 'b1', orphaned: false },
                        { name: 'wrench', quantity: 1, description: null, boxClientRef: 'b1', orphaned: false },
                        { name: 'scarf', quantity: 1, description: null, boxClientRef: 'b2', orphaned: false },
                        { name: 'coat', quantity: 1, description: null, boxClientRef: 'b2', orphaned: false }
                    ],
                    boxName: 'tools', boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "Create storage Garage with boxes Tools and Winter with item Hammer and Scarf",
                expected: {
                    intent: 'create', storageName: 'garage', storageDescription: null,
                    boxes: [
                        { name: 'tools', quantity: null, description: null, clientRef: 'b1' },
                        { name: 'winter', quantity: null, description: null, clientRef: 'b2' }
                    ],
                    items: [
                        { name: 'hammer', quantity: 1, description: null, boxClientRef: 'b1', orphaned: false },
                        { name: 'scarf', quantity: 1, description: null, boxClientRef: 'b2', orphaned: false }
                    ],
                    boxName: 'tools', boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "Box A and Box B with item 1 and 2",
                expected: {
                    intent: null, storageName: null, storageDescription: null,
                    boxes: [
                        { name: 'a', quantity: null, description: null, clientRef: 'b1' },
                        { name: 'b', quantity: null, description: null, clientRef: 'b2' }
                    ],
                    items: [
                        { name: '1', quantity: 1, description: null, boxClientRef: 'b1', orphaned: false },
                        { name: '2', quantity: 1, description: null, boxClientRef: 'b2', orphaned: false }
                    ],
                    boxName: 'a', boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "In kitchen in fridge add a dozen of eggs",
                expected: {
                    intent: 'create', storageName: 'kitchen', storageDescription: null,
                    boxes: [
                        { name: 'fridge', quantity: null, description: null, clientRef: 'b1' },
                    ],
                    items: [
                        { name: 'eggs', quantity: 12, description: null, boxClientRef: 'b1', orphaned: false },
                    ],
                    boxName: 'fridge', boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "In Larkana store add a box for shirts in which put 5 black shirts",
                expected: {
                    intent: 'create', storageName: 'larkana store', storageDescription: null,
                    boxes: [
                        { name: 'shirts', quantity: null, description: null, clientRef: 'b1' },
                    ],
                    items: [
                        { name: 'black shirts', quantity: 5, description: null, boxClientRef: 'b1', orphaned: false },
                    ],
                    boxName: 'shirts', boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "In Szabist university larkana add a box for BSCS papers in which put 100 of cs1A and 50 of cs1B thank you",
                expected: {
                    intent: 'create', storageName: 'szabist university larkana', storageDescription: null,
                    boxes: [
                        { name: 'BSCS papers', quantity: null, description: null, clientRef: 'b1' },
                    ],
                    items: [
                        { name: 'cs1A', quantity: 100, description: null, boxClientRef: 'b1', orphaned: false },
                        { name: 'cs1B', quantity: 50, description: null, boxClientRef: 'b1', orphaned: false },
                    ],
                    boxName: 'BSCS papers', boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "In Szabist university larkana put a box for BSCS papers with details Mid term papers in which put 100 of cs1A papers and 50 of CS1B papers",
                expected: {
                    intent: 'create', storageName: 'szabist university larkana', storageDescription: null,
                    boxes: [
                        { name: 'BSCS papers', quantity: null, description: 'mid term papers', clientRef: 'b1' },
                    ],
                    items: [
                        { name: 'cs1A papers', quantity: 100, description: null, boxClientRef: 'b1', orphaned: false },
                        { name: 'CS1B papers', quantity: 50, description: null, boxClientRef: 'b1', orphaned: false },
                    ],
                    boxName: 'BSCS papers', boxQuantity: null, boxDescription: 'mid term papers', ambiguous: false
                }
            },
            {
                input: "Create storage Garage with details Main Warehouse and 2 boxes Tools (Heavy) and Winter (Clothes) with items 3 Hammers (rusted) and 2 Screwdrivers",
                expected: {
                    intent: 'create', storageName: 'garage', storageDescription: 'main warehouse',
                    boxes: [
                        { name: 'tools', quantity: 2, description: 'heavy', clientRef: 'b1' },
                        { name: 'winter', quantity: null, description: 'clothes', clientRef: 'b2' }
                    ],
                    items: [
                        { name: 'hammers', quantity: 3, description: 'rusted', boxClientRef: 'b1', orphaned: false },
                        { name: 'screwdrivers', quantity: 2, description: null, boxClientRef: 'b2', orphaned: false }
                    ],
                    boxName: 'tools', boxQuantity: 2, boxDescription: 'heavy', ambiguous: false
                }
            },
            {
                input: "Create storage Garage with box Tools containing Hammer containing rusted head",
                expected: {
                    intent: 'create', storageName: 'garage', storageDescription: null,
                    boxes: [{ name: 'tools', quantity: null, description: null, clientRef: 'b1' }],
                    items: [{ name: 'hammer', quantity: 1, description: 'rusted head', boxClientRef: 'b1', orphaned: false }],
                    boxName: 'tools', boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "set up storage Garage add box Tools including 15 Hammers with description Big steel hammers",
                expected: {
                    intent: 'create', storageName: 'garage', storageDescription: null,
                    boxes: [{ name: 'tools', quantity: null, description: null, clientRef: 'b1' }],
                    items: [{ name: 'hammers', quantity: 15, description: 'big steel hammers', boxClientRef: 'b1', orphaned: false }],
                    boxName: 'tools', boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "Create storage Garage with descrption Main Warehouse and box calld Tools contaning Hammers 10",
                expected: {
                    intent: 'create', storageName: 'garage', storageDescription: 'main warehouse',
                    boxes: [{ name: 'tools', quantity: null, description: null, clientRef: 'b1' }],
                    items: [{ name: 'hammers', quantity: 10, description: null, boxClientRef: 'b1', orphaned: false }],
                    boxName: 'tools', boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "Hammer in Box Tools in Storage Garage",
                expected: {
                    intent: null, storageName: 'garage', storageDescription: null,
                    boxes: [{ name: 'tools', quantity: null, description: null, clientRef: 'b1' }],
                    items: [{ name: 'hammer', quantity: 1, description: null, boxClientRef: 'b1', orphaned: false }],
                    boxName: 'tools', boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "2 items in Box 1",
                expected: {
                    intent: null, storageName: null, storageDescription: null,
                    boxes: [{ name: '1', quantity: null, description: null, clientRef: 'b1' }],
                    items: [{ name: 'items', quantity: 2, description: null, boxClientRef: 'b1', orphaned: false }],
                    boxName: '1', boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "in Larkana store add a box named shirts put 5 black shirts in it",
                expected: {
                    intent: 'create', storageName: 'larkana store', storageDescription: null,
                    boxes: [{ name: 'shirts', quantity: null, description: null, clientRef: 'b1' }],
                    items: [
                        { name: 'black shirts', quantity: 5, description: null, boxClientRef: 'b1', orphaned: false }
                    ],
                    boxName: 'shirts', boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "Create a box called Tools. Then add 5 hammers to it.",
                expected: {
                    intent: 'create', storageName: null, storageDescription: null,
                    boxes: [{ name: 'tools', quantity: null, description: null, clientRef: 'b1' }],
                    items: [
                        { name: 'hammers', quantity: 5, description: null, boxClientRef: 'b1', orphaned: false }
                    ],
                    boxName: 'tools', boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "create storage for my tools",
                expected: {
                    intent: 'create', storageName: 'my tools', storageDescription: null,
                    boxes: [], items: [],
                    boxName: null, boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "register a cabinet Accessories containing boxes: clothes and watches items: 7 shirts and 5 rolex",
                expected: {
                    intent: 'create', storageName: 'accessories', storageDescription: null,
                    boxes: [
                        { name: 'clothes', quantity: null, description: null, clientRef: 'b1' },
                        { name: 'watches', quantity: null, description: null, clientRef: 'b2' }
                    ],
                    items: [
                        { name: 'shirts', quantity: 7, description: null, boxClientRef: 'b1', orphaned: false },
                        { name: 'rolex', quantity: 5, description: null, boxClientRef: 'b2', orphaned: false }
                    ],
                    boxName: 'clothes', boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "register a cabinet Accessories containing locker: clothes and watches",
                expected: {
                    intent: 'create', storageName: 'accessories', storageDescription: null,
                    boxes: [
                        { name: 'clothes', quantity: null, description: null, clientRef: 'b1' },
                        { name: 'watches', quantity: null, description: null, clientRef: 'b2' }
                    ],
                    items: [],
                    boxName: 'clothes', boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "add a vualt named ABC containing lockers: three clothes 7 shirts each and two watches 5 rolex each",
                expected: {
                    intent: 'create', storageName: 'ABC', storageDescription: null,
                    boxes: [
                        { name: 'clothes', quantity: 3, description: null, clientRef: 'b1' },
                        { name: 'watches', quantity: 2, description: null, clientRef: 'b2' }
                    ],
                    items: [
                        {
                            name: 'shirts',
                            quantity: 7,
                            description: null,
                            boxClientRef: 'b1',
                            orphaned: false,
                            replicatePerExpandedBox: true,
                        },
                        {
                            name: 'rolex',
                            quantity: 5,
                            description: null,
                            boxClientRef: 'b2',
                            orphaned: false,
                            replicatePerExpandedBox: true,
                        }
                    ],
                    boxName: 'clothes', boxQuantity: 3, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "add a vualt named ABC containing lockers: three clothes items: 10 shirts in each",
                expected: {
                    intent: 'create', storageName: 'ABC', storageDescription: null,
                    boxes: [
                        { name: 'clothes', quantity: 3, description: null, clientRef: 'b1' }
                    ],
                    items: [
                        {
                            name: 'shirts',
                            quantity: 10,
                            description: null,
                            boxClientRef: 'b1',
                            orphaned: false,
                            replicatePerExpandedBox: true,
                        }
                    ],
                    boxName: 'clothes', boxQuantity: 3, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "add a vualt named ABC located xyz road containing lockers: three clothes items: 10 shirts each",
                expected: {
                    intent: 'create', storageName: 'ABC', storageDescription: 'xyz road',
                    boxes: [
                        { name: 'clothes', quantity: 3, description: null, clientRef: 'b1' }
                    ],
                    items: [
                        {
                            name: 'shirts',
                            quantity: 10,
                            description: null,
                            boxClientRef: 'b1',
                            orphaned: false,
                            replicatePerExpandedBox: true,
                        }
                    ],
                    boxName: 'clothes', boxQuantity: 3, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "register a cabinet Accessories containing closet: clothes and watches items: 10 shirts and rolex 2",
                expected: {
                    intent: 'create', storageName: 'accessories', storageDescription: null,
                    boxes: [
                        { name: 'clothes', quantity: null, description: null, clientRef: 'b1' },
                        { name: 'watches', quantity: null, description: null, clientRef: 'b2' }
                    ],
                    items: [
                        { name: 'shirts', quantity: 10, description: null, boxClientRef: 'b1', orphaned: false },
                        { name: 'rolex', quantity: 2, description: null, boxClientRef: 'b2', orphaned: false }
                    ],
                    boxName: 'clothes', boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "create storage A with 5 boxes of B each has 10 items of C",
                expected: {
                    intent: 'create', storageName: 'a', storageDescription: null,
                    boxes: [
                        { name: 'b', quantity: 5, description: null, clientRef: 'b1' }
                    ],
                    items: [
                        {
                            name: 'c',
                            quantity: 10,
                            description: null,
                            boxClientRef: 'b1',
                            orphaned: false,
                            replicatePerExpandedBox: true,
                        }
                    ],
                    boxName: 'b', boxQuantity: 5, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "create storage A located main room with 5 boxes of B each has 10 items of C",
                expected: {
                    intent: 'create', storageName: 'a', storageDescription: 'main room',
                    boxes: [
                        { name: 'b', quantity: 5, description: null, clientRef: 'b1' }
                    ],
                    items: [
                        {
                            name: 'c',
                            quantity: 10,
                            description: null,
                            boxClientRef: 'b1',
                            orphaned: false,
                            replicatePerExpandedBox: true,
                        }
                    ],
                    boxName: 'b', boxQuantity: 5, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "create storage A with 5 boxes of B each has items 10 of C",
                expected: {
                    intent: 'create', storageName: 'a', storageDescription: null,
                    boxes: [
                        { name: 'b', quantity: 5, description: null, clientRef: 'b1' }
                    ],
                    items: [
                        {
                            name: 'c',
                            quantity: 10,
                            description: null,
                            boxClientRef: 'b1',
                            orphaned: false,
                            replicatePerExpandedBox: true,
                        }
                    ],
                    boxName: 'b', boxQuantity: 5, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "Create storage Stylo Mall with 3 boxes of shoes with ten pumpy in each",
                expected: {
                    intent: 'create', storageName: 'stylo mall', storageDescription: null,
                    boxes: [
                        { name: 'shoes', quantity: 3, description: null, clientRef: 'b1' }
                    ],
                    items: [
                        {
                            name: 'pumpy',
                            quantity: 10,
                            description: null,
                            boxClientRef: 'b1',
                            orphaned: false,
                            replicatePerExpandedBox: true,
                        }
                    ],
                    boxName: 'shoes', boxQuantity: 3, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "Create storage Warehouse and setup boxes Alpha and Beta with items 4 Forklift and 6 Pallet Jack.",
                expected: {
                    intent: 'create', storageName: 'warehouse', storageDescription: null,
                    boxes: [
                        { name: 'alpha', quantity: null, description: null, clientRef: 'b1' },
                        { name: 'beta', quantity: null, description: null, clientRef: 'b2' }
                    ],
                    items: [
                        {
                            name: 'forklift',
                            quantity: 4,
                            description: null,
                            boxClientRef: 'b1',
                            orphaned: false,
                            explicitQuantity: true,
                        },
                        {
                            name: 'pallet jack',
                            quantity: 6,
                            description: null,
                            boxClientRef: 'b2',
                            orphaned: false,
                            explicitQuantity: true,
                        }
                    ],
                    boxName: 'alpha', boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "register a cabinet Accessories located xyz road containing lockers: three clothes described as winter wear items: 10 shirts marked as cotton each",
                expected: {
                    intent: 'create', storageName: 'accessories', storageDescription: 'xyz road',
                    boxes: [
                        { name: 'clothes', quantity: 3, description: 'winter wear', clientRef: 'b1' }
                    ],
                    items: [
                        {
                            name: 'shirts',
                            quantity: 10,
                            description: 'cotton',
                            boxClientRef: 'b1',
                            orphaned: false,
                            replicatePerExpandedBox: true,
                        }
                    ],
                    boxName: 'clothes', boxQuantity: 3, boxDescription: 'winter wear', ambiguous: false
                }
            },
            {
                input: "register a cabinet Accessories containing wardrobe: clothes and watches goods: 10 shirts and rolex 2",
                expected: {
                    intent: 'create', storageName: 'accessories', storageDescription: null,
                    boxes: [
                        { name: 'clothes', quantity: null, description: null, clientRef: 'b1' },
                        { name: 'watches', quantity: null, description: null, clientRef: 'b2' }
                    ],
                    items: [
                        { name: 'shirts', quantity: 10, description: null, boxClientRef: 'b1', orphaned: false },
                        { name: 'rolex', quantity: 2, description: null, boxClientRef: 'b2', orphaned: false }
                    ],
                    boxName: 'clothes', boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "In building in kitchen and fridge add eggs",
                expected: {
                    intent: 'create', storageName: 'building', storageDescription: null,
                    boxes: [
                        { name: 'kitchen', quantity: null, description: null, clientRef: 'b1' },
                        { name: 'fridge', quantity: null, description: null, clientRef: 'b2' }
                    ],
                    items: [
                        { name: 'eggs', quantity: 1, description: null, boxClientRef: 'b2', orphaned: false }
                    ],
                    boxName: 'kitchen', boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "create storage Garage in which add boxes Tools and Winter",
                expected: {
                    intent: 'create', storageName: 'garage', storageDescription: null,
                    boxes: [
                        { name: 'tools', quantity: null, description: null, clientRef: 'b1' },
                        { name: 'winter', quantity: null, description: null, clientRef: 'b2' }
                    ],
                    items: [],
                    boxName: 'tools', boxQuantity: null, boxDescription: null, ambiguous: false
                }
            },
            {
                input: "add 3 to box winter",
                expected: {
                    intent: 'increment', storageName: null, storageDescription: null,
                    boxes: [{ name: 'winter', quantity: null, description: null, clientRef: 'b1' }],
                    items: [
                        { name: 'items', quantity: 3, description: null, boxClientRef: 'b1', orphaned: false }
                    ],
                    boxName: 'winter', boxQuantity: null, boxDescription: null, ambiguous: false
                }
            }
        ];

        testCases.forEach(({ input, expected }) => {
            it(`should correctly parse: "${input}"`, () => {
                const { normalizedText } = service.lightNormalization(input);
                const result = service.parseExtraction(normalizedText);
                const { rawIntents, totalWords, extractedWordCount, meta, ...phase2Result } = result;
                expect(phase2Result).toMatchObject(expected);
            });
        });
    });

    describe('Phase 4: heavyNormalization', () => {
        const heavyNorm = (input: string) => {
            const { normalizedText } = service.lightNormalization(input);
            const parsed = service.parseExtraction(normalizedText);
            return service.heavyNormalization(parsed);
        };

        it('should convert entity names to Title Case', () => {
            const result = heavyNorm("create storage garage with box winter clothes");
            expect(result.storageName).toBe('Garage');
            expect(result.boxes[0].name).toMatch(/^[A-Z]/);
        });

        it('should preserve acronyms in Title Case', () => {
            const result = heavyNorm("create storage NASA lab with box LED lights");
            expect(result.storageName).toContain('NASA');
        });

        it('should preserve storage acronyms during heavy normalization', () => {
            const result = heavyNorm('Ad storage SZABIST and boxs for BSCS papers');
            expect(result.storageName).toBe('SZABIST');
            expect(result.boxes[0].name).toBe('BSCS Papers');
        });

        it('should preserve natural plural labels that should not be singularized', () => {
            const result = heavyNorm("create storage Garage with box tools");
            expect(result.boxes[0].name).toBe('Tools');
        });

        it('should handle irregular plurals (knives → knife)', () => {
            const result = heavyNorm("create storage Warehouse with box knives");
            expect(result.boxes[0].name).toBe('Knife');
        });

        it('should handle items plural to singular', () => {
            const result = heavyNorm("in Garage in tools add hammers");
            expect(result.items[0].name).toBe('Hammer');
        });

        it('should preserve other common plural labels like papers and clothes', () => {
            const result = heavyNorm("create storage SZABIST with box BSCS papers and box winter clothes");
            expect(result.boxes[0].name).toBe('BSCS Papers');
            expect(result.boxes[1].name).toBe('Winter Clothes');
        });

        it('should map synonyms to canonical names (car stuff → Car Care)', () => {
            const parsed = { storageName: 'garage', boxes: [{ name: 'car stuff', quantity: null, description: null }], items: [] };
            const result = service.heavyNormalization(parsed);
            expect(result.boxes[0].name).toBe('Car Care');
        });

        it('should map synonym kitchen stuff → Kitchen Supplies', () => {
            const parsed = { storageName: 'home', boxes: [{ name: 'kitchen stuff', quantity: null, description: null }], items: [] };
            const result = service.heavyNormalization(parsed);
            expect(result.boxes[0].name).toBe('Kitchen Supplies');
        });

        it('should Title Case descriptions', () => {
            const result = heavyNorm("Create storage Garage with description main warehouse area");
            if (result.storageDescription) {
                expect(result.storageDescription).toBe('Main Warehouse Area');
            }
        });

        it('should normalize a complex input end-to-end', () => {
            const result = heavyNorm("create storage my garage with box tools and items 3 hammers");
            expect(result.storageName).toMatch(/^[A-Z]/);
            if (result.items.length > 0) {
                expect(result.items[0].name).toBe('Hammer');
            }
        });
    });

    describe('Phase 3: intentClassification', () => {
        const classify = (input: string, existingContext?: { storages: string[], boxes: string[], items: string[] }) => {
            const { normalizedText, typoCount } = service.lightNormalization(input);
            const parsed = service.parseExtraction(normalizedText);
            return service.intentClassification(parsed, existingContext, typoCount);
        };

        it('should reject null input', () => {
            const result = service.validateInput(null);
            expect(result.isValid).toBe(false);
            expect(result.message).toContain('Please enter an instruction');
        });

        it('should reject short input (< 3 words)', () => {
            const result = service.validateInput('create box');
            expect(result.isValid).toBe(false);
            expect(result.message).toContain('Please clarify your instruction');
        });

        it('should treat stop-word-only input as too short after cleanup', () => {
            const result = service.validateInput('hi kindly please thanks thank you sorry hello');
            expect(result.isValid).toBe(false);
            expect(result.message).toContain('Please clarify your instruction');
        });

        it('should accept valid input (>= 3 words)', () => {
            const result = service.validateInput('create storage Garage');
            expect(result.isValid).toBe(true);
            expect(result.message).toBeNull();
        });

        it('should pass through a single valid intent with storage', () => {
            const result = classify("create storage Garage");
            expect(result.intent).toBe('create');
            expect(result.isValid).toBe(true);
            expect(result.clarification).toBeNull();
            expect(result.scope.affectsStorage).toBe(true);
        });

        it('should abort on conflicting intents (create + delete)', () => {
            const result = classify("create a box Tools and delete item Hammer");
            expect(result.isValid).toBe(false);
            expect(result.intent).toBeNull();
            expect(result.clarification).toBe('Please provide one instruction at a time.');
        });

        it('should ask for intent when entities found but no intent', () => {
            const result = classify("Box 1: Tools (Heavy)");
            expect(result.isValid).toBe(false);
            expect(result.intent).toBeNull();
            expect(result.clarification).toBe("Please specify the intent and storage for box 'tools'.");
            expect(result.shouldFallToLLM).toBe(false);
        });

        it('should fall to LLM for missing intent or storage when some words remain unrecognized', () => {
            const result = service.intentClassification({
                intent: null,
                rawIntents: [],
                storageName: null,
                boxes: [{ name: 'tools' }],
                items: [],
                totalWords: 4,
                extractedWordCount: 3,
            });
            expect(result.isValid).toBe(false);
            expect(result.clarification).toBe("Please specify the intent and storage for box 'tools'.");
            expect(result.shouldFallToLLM).toBe(true);
        });

        it('should confirm DELETE + quantity as a decrement when the item exists', () => {
            const result = classify("remove 2 hammer from box Tools in storage Garage", {
                storages: [{ id: 'storage-1', name: 'Garage' }] as any,
                boxes: [{ id: 'box-1', name: 'Tools', storageId: 'storage-1' }] as any,
                items: [{ id: 'item-1', name: 'Hammer', quantity: 5, boxId: 'box-1' }] as any,
            });
            expect(result.isValid).toBe(true);
            expect(result.intent).toBe('decrement');
            expect(result.confirmation).toBe(
                "Deletion is not supported. Decrease 'Hammer' from 5 to 3?",
            );
            expect(result.shouldFallToLLM).toBe(false);
        });

        it('should reject DELETE + entity (no quantity) as unsupported', () => {
            const result = classify("delete storage my Garage");
            expect(result.isValid).toBe(false);
            expect(result.clarification).toBe('Deletion is not supported in this version.');
        });

        it('should confirm DELETE + quantity down to zero when requested removal exceeds available quantity', () => {
            const result = classify("remove 5 hammer from box Tools in storage Garage", {
                storages: [{ id: 'storage-1', name: 'Garage' }] as any,
                boxes: [{ id: 'box-1', name: 'Tools', storageId: 'storage-1' }] as any,
                items: [{ id: 'item-1', name: 'Hammer', quantity: 3, boxId: 'box-1' }] as any,
            });
            expect(result.isValid).toBe(true);
            expect(result.confirmation).toBe(
                "Deletion is not supported. Decrease 'Hammer' from 3 to 0?",
            );
        });

        it('should report item not found on DELETE with context', () => {
            const result = classify("remove 5 hammer from box Tools in storage Garage", {
                storages: [{ id: 'storage-1', name: 'Garage' }] as any,
                boxes: [{ id: 'box-1', name: 'Tools', storageId: 'storage-1' }] as any,
                items: []
            });
            expect(result.isValid).toBe(false);
            expect(result.clarification).toContain('was not found');
            expect(result.shouldFallToLLM).toBe(false);
        });

        it('should require storage when boxes/items exist', () => {
            const result = classify("Create a box called Tools. Then add 5 hammers to it.");
            expect(result.isValid).toBe(false);
            expect(result.clarification).toContain('Please specify the storage');
            expect(result.shouldFallToLLM).toBe(true);
        });

        it('should expand multi-box with auto-naming and confirmation', () => {
            const result = classify("Create storage Garage with 3 boxes Tools");
            expect(result.isValid).toBe(true);
            expect(result.confirmation).toContain('3 boxes');
            expect(result.confirmation).toContain('Tools 1');
            expect(result.confirmation).toContain('Tools 3');
            expect(result.expandedBoxes).toBeTruthy();
            expect(result.expandedBoxes[0].expandedNames).toEqual(['Tools 1', 'Tools 2', 'Tools 3']);
        });

        it('should reject more than 10 boxes per command', () => {
            const result = classify("Create storage Garage with 15 boxes Tools");
            expect(result.isValid).toBe(false);
            expect(result.clarification).toContain('Only 10 boxes can be created at a time');
            expect(result.clarification).toContain('15');
        });

        it('should suggest update when creating existing storage', () => {
            const result = classify("create storage Garage", {
                storages: ['Garage'], boxes: [], items: []
            });
            expect(result.isValid).toBe(true);
            expect(result.suggestions.length).toBe(1);
            expect(result.suggestions[0]).toContain("already exists");
        });

        it('should require confirmation with simple existing quantity details', () => {
            const result = classify("Create storage Garage with box Tools containing five more Hammer", {
                storages: [{ id: 'storage-1', name: 'Garage' }] as any,
                boxes: [{ id: 'box-1', name: 'Tools', storageId: 'storage-1' }] as any,
                items: [{ id: 'item-1', name: 'Hammer', quantity: 2, boxId: 'box-1' }] as any,
            });
            expect(result.isValid).toBe(true);
            expect(result.confirmation).toBe(
                'Hammer exists in Garage/Tools (Qty: 2). Add 5 more? (New Total: 7)',
            );
        });

        it('should mention both the specific quantity update and new additions in create confirmation', () => {
            const result = classify(
                "establish garage known as winter clothes with box shirts has 5 tea shirts and box wearables filled with scarf",
                {
                    storages: [{ id: 'storage-1', name: 'Winter Clothes' }] as any,
                    boxes: [{ id: 'box-1', name: 'Shirts', storageId: 'storage-1' }] as any,
                    items: [{ id: 'item-1', name: 'Tea Shirt', quantity: 3, boxId: 'box-1' }] as any,
                },
            );
            expect(result.isValid).toBe(true);
            expect(result.confirmation).toContain(
                'Tea Shirt exists in Winter Clothes/Shirts (Qty: 3). Add 5 more? (New Total: 8)',
            );
            expect(result.confirmation).toContain(
                "New box 'Wearable' will be created.",
            );
            expect(result.confirmation).toContain(
                "New item 'Scarf' (x1) will be added to 'Wearable'.",
            );
        });

        it('should not require confirmation for plain create reuse without a quantity change', () => {
            const result = classify("Create storage Szabist university larkana with box BSCS papers", {
                storages: [{ id: 'storage-1', name: 'Szabist university larkana' }] as any,
                boxes: [{ id: 'box-1', name: 'BSCS papers', storageId: 'storage-1' }] as any,
                items: [],
            });
            expect(result.isValid).toBe(true);
            expect(result.confirmation).toBeNull();
        });

        it('should confirm when create reuses an existing storage but changes its description', () => {
            const result = classify("Create storage Garage with description main warehouse", {
                storages: [{ id: 'storage-1', name: 'Garage', description: 'Old warehouse' }] as any,
                boxes: [],
                items: [],
            });
            expect(result.isValid).toBe(true);
            expect(result.confirmation).toBe(
                "Storage 'Garage' already exists. Update description to 'Main Warehouse'?",
            );
        });

        it('should resolve update plus add-item wording to update instead of falling to LLM', () => {
            const result = classify("update storage Garage with box screw add items 5 long screws", {
                storages: [{ id: 'storage-1', name: 'Garage' }] as any,
                boxes: [{ id: 'box-1', name: 'Screw', storageId: 'storage-1' }] as any,
                items: [],
            });
            expect(result.intent).toBe('update');
            expect(result.isValid).toBe(true);
            expect(result.shouldFallToLLM).toBe(false);
            expect(result.confidence).toBeGreaterThan(0.5);
        });

        it('should not suggest reuse for box and item names that only exist in other storages', () => {
            const result = classify(
                "register a cabinet Accessories containing boxes: clothes and watches items: 7 shirts and 5 rolex",
                {
                    storages: [{ id: 'storage-1', name: 'Garage' }] as any,
                    boxes: [
                        { id: 'box-1', name: 'Clothes', storageId: 'storage-1' },
                        { id: 'box-2', name: 'Watches', storageId: 'storage-1' },
                    ] as any,
                    items: [
                        { id: 'item-1', name: 'Shirts', quantity: 7, boxId: 'box-1' },
                        { id: 'item-2', name: 'Rolex', quantity: 5, boxId: 'box-2' },
                    ] as any,
                },
            );

            expect(result.isValid).toBe(true);
            expect(result.confirmation).toBeNull();
            expect(result.suggestions).toHaveLength(0);
        });

        it('should not require reuse confirmation for first-time grouped create with trailing item quantity syntax', () => {
            const result = classify(
                "register a cabinet Accessories containing box: clothes and watches items: 10 shirts and rolex 2",
                {
                    storages: [{ id: 'storage-1', name: 'Garage' }] as any,
                    boxes: [
                        { id: 'box-1', name: 'Clothes', storageId: 'storage-1' },
                        { id: 'box-2', name: 'Watches', storageId: 'storage-1' },
                    ] as any,
                    items: [
                        { id: 'item-1', name: 'Shirts', quantity: 10, boxId: 'box-1' },
                        { id: 'item-2', name: 'Rolex', quantity: 2, boxId: 'box-2' },
                    ] as any,
                },
            );

            expect(result.isValid).toBe(true);
            expect(result.confirmation).toBeNull();
            expect(result.suggestions).toHaveLength(0);
        });

        it('should confirm all expanded box names for grouped locker input', () => {
            const result = classify(
                "register a cabinet Accessories containing locker: three clothes and two watches",
            );
            expect(result.isValid).toBe(true);
            expect(result.confirmation).toBe(
                'You are about to create 5 boxes (Clothes 1, Clothes 2, Clothes 3, Watches 1, Watches 2). Confirm?',
            );
        });

        it('should confirm all expanded box names for generic each-has multi-box input', () => {
            const result = classify(
                "create storage A with 5 boxes of B each has 10 items of C",
            );
            expect(result.isValid).toBe(true);
            expect(result.confirmation).toBe(
                "You are about to create 5 boxes (B 1, B 2, B 3, B 4, B 5) with 'C' (x10) in each 'B' box. Confirm?",
            );
        });

        it('should include repeated item quantities in grouped multi-box confirmation', () => {
            const result = classify(
                "add a vualt named ABC containing lockers: three clothes items: 10 shirts in each",
            );
            expect(result.isValid).toBe(true);
            expect(result.confirmation).toBe(
                "You are about to create 3 boxes (Clothes 1, Clothes 2, Clothes 3) with 'Shirt' (x10) in each 'Clothes' box. Confirm?",
            );
        });

        it('should confirm quantified boxes created with the with-in-each form', () => {
            const result = classify(
                "Create storage Stylo Mall with 3 boxes of shoes with ten pumpy in each",
            );
            expect(result.isValid).toBe(true);
            expect(result.confirmation).toBe(
                "You are about to create 3 boxes (Shoes 1, Shoes 2, Shoes 3) with 'Pumpy' (x10) in each 'Shoes' box. Confirm?",
            );
        });

        it('should detect fuzzy ambiguity (Levenshtein distance = 1)', () => {
            const result = classify("update storage Garag", {
                storages: ['Garage', 'Garden'], boxes: [], items: []
            });
            expect(result.suggestions.some((s: string) => s.includes('Ambiguous'))).toBe(true);
        });

        it('should reject more than two pre-intent in location levels', () => {
            const result = classify("In building in kitchen in fridge add eggs");
            expect(result.isValid).toBe(false);
            expect(result.clarification).toContain("Example: 'In Kitchen in Fridge add dozen eggs'");
        });

        it('should return error for empty/no-input', () => {
            const parsed = service.parseExtraction('');
            const result = service.intentClassification(parsed);
            expect(result.isValid).toBe(false);
            expect(result.clarification).toContain('Could not understand');
        });

        it('should have high confidence for clean, complete input', () => {
            const result = classify("create storage Garage");
            expect(result.confidence).toBeGreaterThan(0.7);
            expect(result.shouldFallToLLM).toBe(false);
        });

        it('should penalize typos in confidence score', () => {
            const result = classify("creat storag Garage");
            expect(result.confidence).toBeLessThan(1.0);
        });

        it('should set confidence = 0 when missing critical keys (no storage)', () => {
            const parsed = {
                intent: 'create', storageName: null, rawIntents: ['create'],
                boxes: [], items: [],
                totalWords: 3, extractedWordCount: 3,
            };
            const result = service.intentClassification(parsed, undefined, 0);
            expect(result.confidence).toBe(0);
            expect(result.shouldFallToLLM).toBe(true);
        });

        it('should fall to LLM when confidence <= 0.7', () => {
            const { normalizedText, typoCount } = service.lightNormalization("creat storag Garage foo bar baz qux xyz");
            const parsed = service.parseExtraction(normalizedText);
            const result = service.intentClassification(parsed, undefined, typoCount);
            expect(result.shouldFallToLLM).toBeDefined();
        });
    });

    describe('processInput (Full Pipeline Orchestrator)', () => {
        it('should process valid input through full pipeline', () => {
            const result = service.processInput("create storage Garage with box Tools");
            expect(result.success).toBe(true);
            expect(result.fallbackToLLM).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.message).toContain('Confirm?');
        });

        it('should fall to LLM when confidence is low', () => {
            const result = service.processInput("xyz abc things maybe do something with it idk");
            expect(result.success).toBe(false);
            expect(result.fallbackToLLM).toBe(true);
            expect(result.message).toContain('fall to LLM');
        });

        it('should return direct clarification when storage is the only missing field and all words were understood', () => {
            const result = service.processInput("add 5 hammers to box Tools");
            expect(result.success).toBe(false);
            expect(result.fallbackToLLM).toBe(false);
            expect(result.message).toBe("Please specify the storage for 'tools' and 'hammers'.");
        });

        it('should return direct clarification when the box is missing but the storage is clear', () => {
            const result = service.processInput("put items in storage Garage");
            expect(result.success).toBe(false);
            expect(result.fallbackToLLM).toBe(false);
            expect(result.message).toBe("Please specify a box in storage 'Garage'.");
        });

        it('should return direct clarification when a placeholder quantity target is missing storage', () => {
            const result = service.processInput("add 3 to box winter");
            expect(result.success).toBe(false);
            expect(result.fallbackToLLM).toBe(false);
            expect(result.message).toBe("Please specify the storage for 'winter'.");
        });

        it('should fall to LLM for conversational prompts that get absorbed into fake entity names', () => {
            const result = service.processInput(
                "can you please create a storage for my cars I want them to organize so I can easily find",
            );
            expect(result.success).toBe(false);
            expect(result.fallbackToLLM).toBe(true);
            expect(result.message).toContain('fall to LLM');
        });

        it('should return the max-box clarification instead of LLM fallback', () => {
            const result = service.processInput("Create storage Garage with 15 boxes Tools");
            expect(result.success).toBe(false);
            expect(result.fallbackToLLM).toBe(false);
            expect(result.message).toContain('Only 10 boxes can be created at a time');
            expect(result.message).toContain('15');
        });

        it('should fall to LLM when a structured each pattern is missing required numbers', () => {
            const result = service.processInput(
                "create storage A with 5 boxes of B each has items of C",
            );
            expect(result.success).toBe(false);
            expect(result.fallbackToLLM).toBe(true);
            expect(result.message).toContain('fall to LLM');
        });

        it('should process with-in-each quantified box prompts without falling to LLM', () => {
            const result = service.processInput(
                "Create storage Stylo Mall with 3 boxes of shoes with ten pumpy in each",
            );
            expect(result.success).toBe(true);
            expect(result.fallbackToLLM).toBe(false);
            expect(result.message).toContain('Confirm?');
        });

        it('should process update prompts with add-item wording without falling to LLM', () => {
            const result = service.processInput(
                "update storage Garage with box screw add items 5 long screws",
                {
                    storages: [{ id: 'storage-1', name: 'Garage' }],
                    boxes: [{ id: 'box-1', name: 'Screw', storageId: 'storage-1' }],
                    items: [],
                },
            );
            expect(result.success).toBe(true);
            expect(result.fallbackToLLM).toBe(false);
            expect(result.data.intent).toBe('update');
            expect(result.message).toContain('Storage: Garage');
            expect(result.message).toContain('Long Screw (x5)');
        });

        it('should process delete-style quantity changes with a confirmation instead of manual review', () => {
            const result = service.processInput(
                "remove 2 hammer from box Tools in storage Garage",
                {
                    storages: [{ id: 'storage-1', name: 'Garage' }],
                    boxes: [{ id: 'box-1', name: 'Tools', storageId: 'storage-1' }],
                    items: [{ id: 'item-1', name: 'Hammer', quantity: 5, boxId: 'box-1' }],
                },
            );
            expect(result.success).toBe(true);
            expect(result.fallbackToLLM).toBe(false);
            expect(result.data.intent).toBe('decrement');
            expect(result.data.confirmation).toBe(
                "Deletion is not supported. Decrease 'Hammer' from 5 to 3?",
            );
        });

        it('should return direct clarification for deterministic invalid requests', () => {
            const result = service.processInput("delete storage Garage");
            expect(result.success).toBe(false);
            expect(result.fallbackToLLM).toBe(false);
            expect(result.message).toContain('Deletion is not supported');
        });
    });
});
