import { Test, TestingModule } from '@nestjs/testing';
import { TextProcessingService } from '../../service/text-processing/text-processing.service';
import { LightNormalizationService } from '../../service/text-processing/text-processing-services/light-normalization.service';
import { TextParsingService } from '../../service/text-processing/text-processing-services/text-parsing.service';
import { ValidationService } from '../../service/text-processing/text-processing-services/validation.service';
import { HeavyNormalizationService } from '../../service/text-processing/text-processing-services/heavy-normalization.service';
import { DatabaseStorageService } from '../../service/text-processing/text-processing-services/database-storage.service';
import { AcknowledgementService } from '../../service/text-processing/text-processing-services/acknowledgement.service';

describe('TextProcessingService', () => {
    let service: TextProcessingService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TextProcessingService,
                LightNormalizationService,
                TextParsingService,
                ValidationService,
                HeavyNormalizationService,
                DatabaseStorageService,
                AcknowledgementService,
            ],
        }).compile();

        service = module.get<TextProcessingService>(TextProcessingService);
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
});
