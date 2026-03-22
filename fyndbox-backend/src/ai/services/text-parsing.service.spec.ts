import { Test, TestingModule } from '@nestjs/testing';
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

  describe('Phase 2 & 4: parseExtraction Multi-Entity', () => {
    const testCases = [
      {
        input: 'setup a new room Office',
        expected: {
          intent: 'create',
          storageName: 'office',
          storageDescription: null,
          boxes: [],
          items: [],
          boxName: null,
          boxQuantity: null,
          boxDescription: null,
          ambiguous: false,
        },
      },
      {
        input: 'put items in storage Garage',
        expected: {
          intent: 'increment',
          storageName: 'garage',
          storageDescription: null,
          boxes: [],
          items: [],
          boxName: null,
          boxQuantity: null,
          boxDescription: null,
          ambiguous: false,
        },
      },
      {
        input: 'Create storage Garage with description Main Warehouse',
        expected: {
          intent: 'create',
          storageName: 'garage',
          storageDescription: 'main warehouse',
          boxes: [],
          items: [],
          boxName: null,
          boxQuantity: null,
          boxDescription: null,
          ambiguous: false,
        },
      },
      {
        input: 'Box 1: Tools (Heavy)',
        expected: {
          intent: null,
          storageName: null,
          storageDescription: null,
          boxes: [
            {
              name: 'tools',
              quantity: null,
              description: 'heavy',
              clientRef: 'b1',
            },
          ],
          items: [],
          boxName: 'tools',
          boxQuantity: null,
          boxDescription: 'heavy',
          ambiguous: false,
        },
      },
      {
        input: '3 Boxes for Winter (Clothes)',
        expected: {
          intent: null,
          storageName: null,
          storageDescription: null,
          boxes: [
            {
              name: 'winter',
              quantity: 3,
              description: 'clothes',
              clientRef: 'b1',
            },
          ],
          items: [],
          boxName: 'winter',
          boxQuantity: 3,
          boxDescription: 'clothes',
          ambiguous: false,
        },
      },
      {
        input:
          'Create storage Garage with Box Tools containing Hammer and Wrench, and Box Winter containing Scarf and Coat.',
        expected: {
          intent: 'create',
          storageName: 'garage',
          storageDescription: null,
          boxes: [
            {
              name: 'tools',
              quantity: null,
              description: null,
              clientRef: 'b1',
            },
            {
              name: 'winter',
              quantity: null,
              description: null,
              clientRef: 'b2',
            },
          ],
          items: [
            {
              name: 'hammer',
              quantity: 1,
              description: null,
              boxClientRef: 'b1',
              orphaned: false,
            },
            {
              name: 'wrench',
              quantity: 1,
              description: null,
              boxClientRef: 'b1',
              orphaned: false,
            },
            {
              name: 'scarf',
              quantity: 1,
              description: null,
              boxClientRef: 'b2',
              orphaned: false,
            },
            {
              name: 'coat',
              quantity: 1,
              description: null,
              boxClientRef: 'b2',
              orphaned: false,
            },
          ],
          boxName: 'tools',
          boxQuantity: null,
          boxDescription: null,
          ambiguous: false,
        },
      },
      {
        input:
          'Create storage Garage with boxes Tools and Winter with item Hammer and Scarf',
        expected: {
          intent: 'create',
          storageName: 'garage',
          storageDescription: null,
          boxes: [
            {
              name: 'tools',
              quantity: null,
              description: null,
              clientRef: 'b1',
            },
            {
              name: 'winter',
              quantity: null,
              description: null,
              clientRef: 'b2',
            },
          ],
          items: [
            {
              name: 'hammer',
              quantity: 1,
              description: null,
              boxClientRef: 'b1',
              orphaned: false,
            },
            {
              name: 'scarf',
              quantity: 1,
              description: null,
              boxClientRef: 'b2',
              orphaned: false,
            },
          ],
          boxName: 'tools',
          boxQuantity: null,
          boxDescription: null,
          ambiguous: false,
        },
      },
      {
        input:
          'update a cabinet Accessories containing closet: clothes and watches items: 10 shirts and rolex 2',
        expected: {
          intent: 'update',
          storageName: 'accessories',
          storageDescription: null,
          boxes: [
            {
              name: 'clothes',
              quantity: null,
              description: null,
              clientRef: 'b1',
            },
            {
              name: 'watches',
              quantity: null,
              description: null,
              clientRef: 'b2',
            },
          ],
          items: [
            {
              name: 'shirts',
              quantity: 10,
              description: null,
              boxClientRef: 'b1',
              orphaned: false,
            },
            {
              name: 'rolex',
              quantity: 2,
              description: null,
              boxClientRef: 'b2',
              orphaned: false,
            },
          ],
          boxName: 'clothes',
          boxQuantity: null,
          boxDescription: null,
          ambiguous: false,
        },
      },
      {
        input: 'update storage X containing A: X and Y items: 10 abc and xyz 2',
        expected: {
          intent: 'update',
          storageName: 'x',
          storageDescription: null,
          boxes: [
            { name: 'x', quantity: null, description: null, clientRef: 'b1' },
            { name: 'y', quantity: null, description: null, clientRef: 'b2' },
          ],
          items: [
            {
              name: 'abc',
              quantity: 10,
              description: null,
              boxClientRef: 'b1',
              orphaned: false,
            },
            {
              name: 'xyz',
              quantity: 2,
              description: null,
              boxClientRef: 'b2',
              orphaned: false,
            },
          ],
          boxName: 'x',
          boxQuantity: null,
          boxDescription: null,
          ambiguous: false,
        },
      },
      {
        input: 'Box A and Box B with item 1 and 2',
        expected: {
          intent: null,
          storageName: null,
          storageDescription: null,
          boxes: [
            { name: 'a', quantity: null, description: null, clientRef: 'b1' },
            { name: 'b', quantity: null, description: null, clientRef: 'b2' },
          ],
          items: [
            {
              name: '1',
              quantity: 1,
              description: null,
              boxClientRef: 'b1',
              orphaned: false,
            },
            {
              name: '2',
              quantity: 1,
              description: null,
              boxClientRef: 'b2',
              orphaned: false,
            },
          ],
          boxName: 'a',
          boxQuantity: null,
          boxDescription: null,
          ambiguous: false,
        },
      },
      {
        input: 'In kitchen in fridge add a dozen of eggs',
        expected: {
          intent: 'create',
          storageName: 'kitchen',
          storageDescription: null,
          boxes: [
            {
              name: 'fridge',
              quantity: null,
              description: null,
              clientRef: 'b1',
            },
          ],
          items: [
            {
              name: 'eggs',
              quantity: 12,
              description: null,
              boxClientRef: 'b1',
              orphaned: false,
            },
          ],
          boxName: 'fridge',
          boxQuantity: null,
          boxDescription: null,
          ambiguous: false,
        },
      },
      {
        input:
          'Create storage Garage with details Main Warehouse and 2 boxes Tools (Heavy) and Winter (Clothes) with items 3 Hammers (rusted) and 2 Screwdrivers',
        expected: {
          intent: 'create',
          storageName: 'garage',
          storageDescription: 'main warehouse',
          boxes: [
            {
              name: 'tools',
              quantity: 2,
              description: 'heavy',
              clientRef: 'b1',
            },
            {
              name: 'winter',
              quantity: null,
              description: 'clothes',
              clientRef: 'b2',
            },
          ],
          items: [
            {
              name: 'hammers',
              quantity: 3,
              description: 'rusted',
              boxClientRef: 'b1',
              orphaned: false,
            },
            {
              name: 'screwdrivers',
              quantity: 2,
              description: null,
              boxClientRef: 'b2',
              orphaned: false,
            },
          ],
          boxName: 'tools',
          boxQuantity: 2,
          boxDescription: 'heavy',
          ambiguous: false,
        },
      },
      {
        input:
          'Create storage Garage with box Tools containing Hammer containing rusted head',
        expected: {
          intent: 'create',
          storageName: 'garage',
          storageDescription: null,
          boxes: [
            {
              name: 'tools',
              quantity: null,
              description: null,
              clientRef: 'b1',
            },
          ],
          items: [
            {
              name: 'hammer',
              quantity: 1,
              description: 'rusted head',
              boxClientRef: 'b1',
              orphaned: false,
            },
          ],
          boxName: 'tools',
          boxQuantity: null,
          boxDescription: null,
          ambiguous: false,
        },
      },
      {
        input:
          'set up storage Garage add box Tools including 15 Hammers with description Big steel hammers',
        expected: {
          intent: 'create',
          storageName: 'garage',
          storageDescription: null,
          boxes: [
            {
              name: 'tools',
              quantity: null,
              description: null,
              clientRef: 'b1',
            },
          ],
          items: [
            {
              name: 'hammers',
              quantity: 15,
              description: 'big steel hammers',
              boxClientRef: 'b1',
              orphaned: false,
            },
          ],
          boxName: 'tools',
          boxQuantity: null,
          boxDescription: null,
          ambiguous: false,
        },
      },
      {
        input:
          'Create storage Garage with descrption Main Warehouse and box calld Tools contaning Hammers 10',
        expected: {
          intent: 'create',
          storageName: 'garage',
          storageDescription: 'main warehouse',
          boxes: [
            {
              name: 'tools',
              quantity: null,
              description: null,
              clientRef: 'b1',
            },
          ],
          items: [
            {
              name: 'hammers',
              quantity: 10,
              description: null,
              boxClientRef: 'b1',
              orphaned: false,
            },
          ],
          boxName: 'tools',
          boxQuantity: null,
          boxDescription: null,
          ambiguous: false,
        },
      },
      {
        input: 'Hammer in Box Tools in Storage Garage',
        expected: {
          intent: null,
          storageName: 'garage',
          storageDescription: null,
          boxes: [
            {
              name: 'tools',
              quantity: null,
              description: null,
              clientRef: 'b1',
            },
          ],
          items: [
            {
              name: 'hammer',
              quantity: 1,
              description: null,
              boxClientRef: 'b1',
              orphaned: false,
            },
          ],
          boxName: 'tools',
          boxQuantity: null,
          boxDescription: null,
          ambiguous: false,
        },
      },
      {
        input: '2 items in Box 1',
        expected: {
          intent: null,
          storageName: null,
          storageDescription: null,
          boxes: [
            { name: '1', quantity: null, description: null, clientRef: 'b1' },
          ],
          items: [
            {
              name: 'items',
              quantity: 2,
              description: null,
              boxClientRef: 'b1',
              orphaned: false,
            },
          ],
          boxName: '1',
          boxQuantity: null,
          boxDescription: null,
          ambiguous: false,
        },
      },
      {
        input: 'Create a box called Tools. Then add 5 hammers to it.',
        expected: {
          intent: 'create',
          storageName: null,
          storageDescription: null,
          boxes: [
            {
              name: 'tools',
              quantity: null,
              description: null,
              clientRef: 'b1',
            },
          ],
          items: [
            {
              name: 'hammers',
              quantity: 5,
              description: null,
              boxClientRef: 'b1',
              orphaned: false,
            },
          ],
          boxName: 'tools',
          boxQuantity: null,
          boxDescription: null,
          ambiguous: false,
        },
      },
      {
        input: 'create storage for my tools',
        expected: {
          intent: 'create',
          storageName: 'my tools',
          storageDescription: null,
          boxes: [],
          items: [],
          boxName: null,
          boxQuantity: null,
          boxDescription: null,
          ambiguous: false,
        },
      },
    ];

    testCases.forEach(({ input, expected }) => {
      it(`should correctly parse: "${input}"`, () => {
        const { normalizedText } = service.lightNormalization(input);
        const result = service.parseExtraction(normalizedText);

        const phase2Result = { ...result };
        delete phase2Result.rawIntents;
        delete phase2Result.totalWords;
        delete phase2Result.extractedWordCount;
        delete phase2Result.meta;

        expect(phase2Result).toMatchObject(expected);
      });
    });

    it('should preserve exact numbered box references', () => {
      const { normalizedText } = service.lightNormalization(
        'remove 2 pumpy from box shoes 1 in storage stylo mall',
      );
      const result = service.parseExtraction(normalizedText);

      expect(result.intent).toBe('decrement');
      expect(result.storageName).toBe('stylo mall');
      expect(result.boxes).toMatchObject([
        { name: 'shoes 1', clientRef: 'b1' },
      ]);
      expect(result.items).toMatchObject([
        { name: 'pumpy', quantity: 2, boxClientRef: 'b1' },
      ]);
      expect(result.meta?.boxFamilySelector).toBeNull();
    });

    it('should parse explicit all-family selectors for numbered boxes', () => {
      const { normalizedText } = service.lightNormalization(
        'remove 2 pumpy from all shoes boxes in storage stylo mall',
      );
      const result = service.parseExtraction(normalizedText);

      expect(result.intent).toBe('decrement');
      expect(result.storageName).toBe('stylo mall');
      expect(result.boxes).toMatchObject([{ name: 'shoes', clientRef: 'b1' }]);
      expect(result.items).toMatchObject([
        { name: 'pumpy', quantity: 2, boxClientRef: 'b1' },
      ]);
      expect(result.meta?.boxFamilySelector).toBe('all');
      expect(result.meta?.boxFamilyName).toBe('shoes');
    });

    it('should parse explicit each-family selectors for numbered boxes', () => {
      const { normalizedText } = service.lightNormalization(
        'remove 2 pumpy from each shoes box in storage stylo mall',
      );
      const result = service.parseExtraction(normalizedText);

      expect(result.intent).toBe('decrement');
      expect(result.storageName).toBe('stylo mall');
      expect(result.boxes).toMatchObject([{ name: 'shoes', clientRef: 'b1' }]);
      expect(result.items).toMatchObject([
        { name: 'pumpy', quantity: 2, boxClientRef: 'b1' },
      ]);
      expect(result.meta?.boxFamilySelector).toBe('each');
      expect(result.meta?.boxFamilyName).toBe('shoes');
    });

    it('should parse add-more prompts as item-plus-box instead of creating a box named more', () => {
      const { normalizedText } = service.lightNormalization(
        'add more to box shoes 2 in storage stylo mall',
      );
      const result = service.parseExtraction(normalizedText);

      expect(result.intent).toBe('increment');
      expect(result.storageName).toBe('stylo mall');
      expect(result.boxes).toMatchObject([
        { name: 'shoes 2', clientRef: 'b1' },
      ]);
      expect(result.items).toMatchObject([
        { name: 'more', quantity: 1, boxClientRef: 'b1' },
      ]);
    });

    it('should parse add-more item names before a target box', () => {
      const { normalizedText } = service.lightNormalization(
        'add more pumpy to box shoes 2 in storage stylo mall',
      );
      const result = service.parseExtraction(normalizedText);

      expect(result.intent).toBe('increment');
      expect(result.storageName).toBe('stylo mall');
      expect(result.boxes).toMatchObject([
        { name: 'shoes 2', clientRef: 'b1' },
      ]);
      expect(result.items).toMatchObject([
        { name: 'pumpy', quantity: 1, boxClientRef: 'b1' },
      ]);
    });
  });
});
