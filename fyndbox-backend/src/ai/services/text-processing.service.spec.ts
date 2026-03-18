import { Test, TestingModule } from '@nestjs/testing';
import { DICTIONARY_CONFIG } from '../config/nlp-dictionary.config';
import { AiPersistenceService } from './ai-persistence.service';
import { TextParsingService } from './text-parsing.service';
import { TextProcessingService } from './text-processing.service';
import { ValidationService } from './validation.service';

describe('TextProcessingService', () => {
    let service: TextProcessingService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TextProcessingService,
                TextParsingService,
                ValidationService,
                AiPersistenceService,
            ],
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

    describe('heavyNormalization', () => {
        const heavyNorm = (input: string) => {
            const { normalizedText } = service.lightNormalization(input);
            const parsed = service.parseExtraction(normalizedText);
            return service.heavyNormalization(parsed);
        };

        it('should convert entity names to Title Case', () => {
            const result = heavyNorm('create storage garage with box winter clothes');
            expect(result.storageName).toBe('Garage');
            expect(result.boxes[0].name).toMatch(/^[A-Z]/);
        });

        it('should preserve storage acronyms during heavy normalization', () => {
            const result = heavyNorm('Ad storage SZABIST and boxs for BSCS papers');
            expect(result.storageName).toBe('SZABIST');
            expect(result.boxes[0].name).toBe('BSCS Papers');
        });

        it('should preserve numbered box names without singularizing the family label', () => {
            const result = heavyNorm('remove 2 pumpy from box shoes 1 in storage stylo mall');
            expect(result.boxes[0].name).toBe('Shoes 1');
        });

        it('should map synonyms to canonical names', () => {
            const parsed = { storageName: 'garage', boxes: [{ name: 'car stuff', quantity: null, description: null }], items: [] };
            const result = service.heavyNormalization(parsed);
            expect(result.boxes[0].name).toBe('Car Care');
        });
    });

    describe('generateConfirmationSummary', () => {
        it('should generate summary for storage only', () => {
            const data = { storageName: 'Garage', storageDescription: 'Main Warehouse', boxes: [], items: [] };
            const summary = service.generateConfirmationSummary(data);
            expect(summary).toContain('Storage: Garage');
            expect(summary).toContain('Main Warehouse');
            expect(summary).toContain('Confirm?');
        });

        it('should generate summary with boxes and items', () => {
            const data = {
                storageName: 'Garage',
                storageDescription: null,
                boxes: [
                    { name: 'Tools', clientRef: 'b1' },
                    { name: 'Winter', clientRef: 'b2' },
                ],
                items: [
                    { name: 'Hammer', quantity: 2, boxClientRef: 'b1' },
                    { name: 'Scarf', quantity: 1, boxClientRef: 'b2' },
                ],
            };
            const summary = service.generateConfirmationSummary(data);
            expect(summary).toContain('Storage: Garage');
            expect(summary).toContain('Boxes: Tools, Winter');
            expect(summary).toContain('Hammer (x2) -> Tools');
            expect(summary).toContain('Scarf (x1) -> Winter');
        });

        it('should handle empty data gracefully', () => {
            const data = { storageName: null, boxes: [], items: [] };
            const summary = service.generateConfirmationSummary(data);
            expect(summary).toContain('Ready to save:');
            expect(summary).toContain('Confirm?');
        });
    });
});
