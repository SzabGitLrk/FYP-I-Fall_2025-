import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AiPersistenceService } from './ai-persistence.service';
import { AiRateLimitService } from './ai-rate-limit.service';
import { LlmFallbackService } from './llm-fallback.service';
import { TextParsingService } from './text-parsing.service';
import { TextProcessingService } from './text-processing.service';
import { ValidationService } from './validation.service';

describe('Phase 5: Database Persistence', () => {
  let service: AiPersistenceService;
  let textProcessingService: TextProcessingService;
  let mockQueryRunner: any;
  let mockDataSource: Partial<DataSource>;

  beforeEach(async () => {
    let mockIdCounter = 0;
    let savedIdCounter = 0;
    // Mock QueryRunner with manager
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn((entity, data) => ({
          ...data,
          id: data.id ?? `mock-id-${++mockIdCounter}`,
        })),
        save: jest.fn((entity, data) =>
          Promise.resolve({
            ...data,
            id: data.id ?? `saved-id-${++savedIdCounter}`,
          }),
        ),
      },
    };

    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TextProcessingService,
        TextParsingService,
        ValidationService,
        AiPersistenceService,
        AiRateLimitService,
        LlmFallbackService,
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<AiPersistenceService>(AiPersistenceService);
    textProcessingService = module.get<TextProcessingService>(
      TextProcessingService,
    );
  });

  describe('prepareNormalizedDataForPersistence', () => {
    it('should replicate per-box items across each expanded box', () => {
      const parsed = textProcessingService.parseExtraction(
        textProcessingService.lightNormalization(
          'register a cabinet Accessories containing locker: three clothes 7 shirts each and two watches 5 rolex each',
        ).normalizedText,
      );
      const classified = textProcessingService.intentClassification(parsed);
      const normalized = textProcessingService.heavyNormalization(parsed);
      const prepared = service.prepareNormalizedDataForPersistence(
        { ...normalized, intent: classified.intent, meta: normalized.meta },
        classified.expandedBoxes,
      );

      expect(prepared.boxes.map((box: any) => box.name)).toEqual([
        'Clothes 1',
        'Clothes 2',
        'Clothes 3',
        'Watches 1',
        'Watches 2',
      ]);
      expect(
        prepared.items.filter((item: any) => item.name === 'Shirt'),
      ).toHaveLength(3);
      expect(
        prepared.items.filter((item: any) => item.name === 'Rolex'),
      ).toHaveLength(2);
      expect(
        prepared.items.every(
          (item: any) => item.quantity === (item.name === 'Shirt' ? 7 : 5),
        ),
      ).toBe(true);
    });

    it('should replicate generic each-has items across every expanded box', () => {
      const parsed = textProcessingService.parseExtraction(
        textProcessingService.lightNormalization(
          'create storage A with 5 boxes of B each has 10 items of C',
        ).normalizedText,
      );
      const classified = textProcessingService.intentClassification(parsed);
      const normalized = textProcessingService.heavyNormalization(parsed);
      const prepared = service.prepareNormalizedDataForPersistence(
        { ...normalized, intent: classified.intent, meta: normalized.meta },
        classified.expandedBoxes,
      );

      expect(prepared.boxes.map((box: any) => box.name)).toEqual([
        'B 1',
        'B 2',
        'B 3',
        'B 4',
        'B 5',
      ]);
      expect(prepared.items).toHaveLength(5);
      expect(prepared.items.every((item: any) => item.name === 'C')).toBe(true);
      expect(prepared.items.every((item: any) => item.quantity === 10)).toBe(
        true,
      );
    });

    it('should replicate grouped item-section quantities across every expanded box when using "in each"', () => {
      const parsed = textProcessingService.parseExtraction(
        textProcessingService.lightNormalization(
          'add a vualt named ABC containing lockers: three clothes items: 10 shirts in each',
        ).normalizedText,
      );
      const classified = textProcessingService.intentClassification(parsed);
      const normalized = textProcessingService.heavyNormalization(parsed);
      const prepared = service.prepareNormalizedDataForPersistence(
        { ...normalized, intent: classified.intent, meta: normalized.meta },
        classified.expandedBoxes,
      );

      expect(prepared.boxes.map((box: any) => box.name)).toEqual([
        'Clothes 1',
        'Clothes 2',
        'Clothes 3',
      ]);
      expect(prepared.items).toHaveLength(3);
      expect(prepared.items.every((item: any) => item.name === 'Shirt')).toBe(
        true,
      );
      expect(prepared.items.every((item: any) => item.quantity === 10)).toBe(
        true,
      );
    });
  });

  describe('persistToDatabase', () => {
    it('should create new storage when not found', async () => {
      mockQueryRunner.manager.find.mockResolvedValueOnce([]); // storage not found

      const data = {
        storageName: 'Garage',
        storageDescription: 'Main',
        boxes: [],
        items: [],
      };
      const result = await service.persistToDatabase(data, 'user-123');

      expect(result.success).toBe(true);
      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
        'Storage',
        expect.objectContaining({ name: 'Garage', userId: 'user-123' }),
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should reuse existing storage when found', async () => {
      mockQueryRunner.manager.find.mockResolvedValueOnce([
        { id: 'existing-storage-id', name: 'Garage' },
      ]);

      const data = { storageName: 'Garage', boxes: [], items: [] };
      const result = await service.persistToDatabase(data, 'user-123');

      expect(result.success).toBe(true);
      expect(result.ids.storageId).toBe('existing-storage-id');
      // Should NOT call create for storage
      expect(mockQueryRunner.manager.create).not.toHaveBeenCalledWith(
        'Storage',
        expect.anything(),
      );
    });

    it('should update an existing storage description when intent is update', async () => {
      mockQueryRunner.manager.find.mockResolvedValueOnce([
        {
          id: 'existing-storage-id',
          name: 'Garage',
          description: 'Old warehouse',
        },
      ]);

      const data = {
        intent: 'update',
        storageName: 'Garage',
        storageDescription: 'Main warehouse',
        boxes: [],
        items: [],
      };
      const result = await service.persistToDatabase(data, 'user-123');

      expect(result.success).toBe(true);
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        'Storage',
        expect.objectContaining({ description: 'Main warehouse' }),
      );
      expect(result.message).toBe(
        "Storage 'Garage' already exists. Updated the description.",
      );
    });

    it('should update an existing storage description during create when a new description is provided', async () => {
      mockQueryRunner.manager.find.mockResolvedValueOnce([
        {
          id: 'existing-storage-id',
          name: 'Garage',
          description: 'Old warehouse',
        },
      ]);

      const data = {
        intent: 'create',
        storageName: 'Garage',
        storageDescription: 'Main warehouse',
        boxes: [],
        items: [],
      };
      const result = await service.persistToDatabase(data, 'user-123');

      expect(result.success).toBe(true);
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        'Storage',
        expect.objectContaining({ description: 'Main warehouse' }),
      );
      expect(result.message).toBe(
        "Storage 'Garage' already exists. Updated the description.",
      );
    });

    it('should return a no-change message for update when nothing changed on the storage', async () => {
      mockQueryRunner.manager.find.mockResolvedValueOnce([
        {
          id: 'existing-storage-id',
          name: 'Garage',
          description: 'Main warehouse',
        },
      ]);

      const data = {
        intent: 'update',
        storageName: 'Garage',
        boxes: [],
        items: [],
      };
      const result = await service.persistToDatabase(data, 'user-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        "No changes needed. Storage 'Garage' is already up to date.",
      );
    });

    it('should create boxes and items in transaction', async () => {
      mockQueryRunner.manager.find
        .mockResolvedValueOnce([]) // storage
        .mockResolvedValueOnce([]) // box
        .mockResolvedValueOnce([]); // item

      const data = {
        intent: 'create',
        storageName: 'Garage',
        storageDescription: null,
        boxes: [{ name: 'Tools', clientRef: 'b1', description: null }],
        items: [
          {
            name: 'Hammer',
            quantity: 2,
            description: null,
            boxClientRef: 'b1',
          },
        ],
      };

      const result = await service.persistToDatabase(data, 'user-123');

      expect(result.success).toBe(true);
      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
        'Storage',
        expect.anything(),
      );
      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
        'Box',
        expect.objectContaining({ name: 'Tools' }),
      );
      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
        'Item',
        expect.objectContaining({ name: 'Hammer', quantity: 2 }),
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      mockQueryRunner.manager.find.mockRejectedValue(
        new Error('DB connection failed'),
      );

      const data = { storageName: 'Garage', boxes: [], items: [] };
      const result = await service.persistToDatabase(data, 'user-123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('No changes were saved');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should INCREMENT item quantity when item already exists', async () => {
      mockQueryRunner.manager.find
        .mockResolvedValueOnce([{ id: 'storage-1', name: 'Garage' }])
        .mockResolvedValueOnce([{ id: 'box-1', name: 'Tools' }])
        .mockResolvedValueOnce([{ id: 'item-1', name: 'Hammer', quantity: 3 }]);

      const data = {
        intent: 'increment',
        storageName: 'Garage',
        boxes: [{ name: 'Tools', clientRef: 'b1' }],
        items: [{ name: 'Hammer', quantity: 2, boxClientRef: 'b1' }],
      };

      const result = await service.persistToDatabase(data, 'user-123');

      expect(result.success).toBe(true);
      // 3 + 2 = 5
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        'Item',
        expect.objectContaining({ quantity: 5 }),
      );
    });

    it('should increment existing item quantity even when intent is create', async () => {
      mockQueryRunner.manager.find
        .mockResolvedValueOnce([{ id: 'storage-1', name: 'Garage' }])
        .mockResolvedValueOnce([{ id: 'box-1', name: 'Tools' }])
        .mockResolvedValueOnce([{ id: 'item-1', name: 'Hammer', quantity: 3 }]);

      const data = {
        intent: 'create',
        storageName: 'Garage',
        boxes: [{ name: 'Tools', clientRef: 'b1' }],
        items: [
          {
            name: 'Hammer',
            quantity: 5,
            explicitQuantity: true,
            boxClientRef: 'b1',
          },
        ],
      };

      const result = await service.persistToDatabase(data, 'user-123');

      expect(result.success).toBe(true);
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        'Item',
        expect.objectContaining({ quantity: 8 }),
      );
    });

    it('should not change quantity when create references an existing item without explicit quantity or description', async () => {
      mockQueryRunner.manager.find
        .mockResolvedValueOnce([{ id: 'storage-1', name: 'Garage' }])
        .mockResolvedValueOnce([{ id: 'box-1', name: 'Tools' }])
        .mockResolvedValueOnce([
          { id: 'item-1', name: 'Hammer', quantity: 3, description: null },
        ]);

      const data = {
        intent: 'create',
        storageName: 'Garage',
        boxes: [{ name: 'Tools', clientRef: 'b1' }],
        items: [
          {
            name: 'Hammer',
            quantity: 1,
            explicitQuantity: false,
            boxClientRef: 'b1',
          },
        ],
      };

      const result = await service.persistToDatabase(data, 'user-123');

      expect(result.success).toBe(true);
      expect(mockQueryRunner.manager.save).not.toHaveBeenCalledWith(
        'Item',
        expect.objectContaining({ quantity: 4 }),
      );
      expect(result.message).toContain("already contains 'Hammer'");
      expect(result.message).toContain('No changes needed.');
    });

    it('should return a no-change message for update when boxes and items already match', async () => {
      mockQueryRunner.manager.find
        .mockResolvedValueOnce([
          { id: 'storage-1', name: 'Winter Clothes', description: null },
        ])
        .mockResolvedValueOnce([{ id: 'box-1', name: 'Shirt' }])
        .mockResolvedValueOnce([{ id: 'box-2', name: 'Wearable' }])
        .mockResolvedValueOnce([
          { id: 'item-1', name: 'Tea Shirt', quantity: 1, description: null },
        ])
        .mockResolvedValueOnce([
          { id: 'item-2', name: 'Scarf', quantity: 1, description: null },
        ]);

      const data = {
        intent: 'update',
        storageName: 'Winter Clothes',
        boxes: [
          { name: 'Shirt', clientRef: 'b1' },
          { name: 'Wearable', clientRef: 'b2' },
        ],
        items: [
          { name: 'Tea Shirt', quantity: 1, boxClientRef: 'b1' },
          { name: 'Scarf', quantity: 1, boxClientRef: 'b2' },
        ],
      };

      const result = await service.persistToDatabase(data, 'user-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        "Storage 'Winter Clothes' already exists. Box 'Shirt' already contains 'Tea Shirt'. Box 'Wearable' already contains 'Scarf'. No changes needed.",
      );
      const itemSaveCalls = mockQueryRunner.manager.save.mock.calls.filter(
        (call: any[]) => call[0] === 'Item',
      );
      expect(itemSaveCalls).toHaveLength(0);
    });

    it('should mention only newly added items when update uses an existing box', async () => {
      mockQueryRunner.manager.find
        .mockResolvedValueOnce([
          { id: 'storage-1', name: 'Garage', description: null },
        ])
        .mockResolvedValueOnce([{ id: 'box-1', name: 'Screw' }])
        .mockResolvedValueOnce([]);

      const data = {
        intent: 'update',
        storageName: 'Garage',
        boxes: [{ name: 'Screw', clientRef: 'b1' }],
        items: [{ name: 'Long Screw', quantity: 5, boxClientRef: 'b1' }],
      };

      const result = await service.persistToDatabase(data, 'user-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        "Storage 'Garage' already exists. Added 'Long Screw' (x5) to existing box 'Screw'.",
      );
    });

    it('should DECREMENT item quantity (existing item)', async () => {
      mockQueryRunner.manager.find
        .mockResolvedValueOnce([{ id: 'storage-1', name: 'Garage' }])
        .mockResolvedValueOnce([{ id: 'box-1', name: 'Tools' }])
        .mockResolvedValueOnce([
          { id: 'item-1', name: 'Hammer', quantity: 10 },
        ]);

      const data = {
        intent: 'decrement',
        storageName: 'Garage',
        boxes: [{ name: 'Tools', clientRef: 'b1' }],
        items: [{ name: 'Hammer', quantity: 3, boxClientRef: 'b1' }],
      };

      const result = await service.persistToDatabase(data, 'user-123');

      expect(result.success).toBe(true);
      // 10 - 3 = 7
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        'Item',
        expect.objectContaining({ quantity: 7 }),
      );
    });

    it('should clamp to 0 and warn when DECREMENT exceeds available quantity', async () => {
      mockQueryRunner.manager.find
        .mockResolvedValueOnce([{ id: 'storage-1', name: 'Garage' }])
        .mockResolvedValueOnce([{ id: 'box-1', name: 'Tools' }])
        .mockResolvedValueOnce([{ id: 'item-1', name: 'Hammer', quantity: 2 }]);

      const data = {
        intent: 'decrement',
        storageName: 'Garage',
        boxes: [{ name: 'Tools', clientRef: 'b1' }],
        items: [{ name: 'Hammer', quantity: 5, boxClientRef: 'b1' }],
      };

      const result = await service.persistToDatabase(data, 'user-123');

      expect(result.success).toBe(true);
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        'Item',
        expect.objectContaining({ quantity: 0 }),
      );
      expect(result.warnings?.length).toBeGreaterThan(0);
      expect(result.message).toContain('Remaining: 0');
    });

    it('should ROLLBACK when DECREMENT targets a non-existent item', async () => {
      mockQueryRunner.manager.find
        .mockResolvedValueOnce([{ id: 'storage-1', name: 'Garage' }])
        .mockResolvedValueOnce([{ id: 'box-1', name: 'Tools' }])
        .mockResolvedValueOnce([]); // item NOT found

      const data = {
        intent: 'decrement',
        storageName: 'Garage',
        boxes: [{ name: 'Tools', clientRef: 'b1' }],
        items: [{ name: 'Hammer', quantity: 3, boxClientRef: 'b1' }],
      };

      const result = await service.persistToDatabase(data, 'user-123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
      expect(result.message).toContain('Cannot remove');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should MODIFY item description and quantity when intent is update', async () => {
      mockQueryRunner.manager.find
        .mockResolvedValueOnce([{ id: 'storage-1', name: 'Garage' }])
        .mockResolvedValueOnce([{ id: 'box-1', name: 'Tools' }])
        .mockResolvedValueOnce([
          {
            id: 'item-1',
            name: 'Hammer',
            quantity: 3,
            description: 'Old desc',
          },
        ]);

      const data = {
        intent: 'update',
        storageName: 'Garage',
        boxes: [{ name: 'Tools', clientRef: 'b1' }],
        items: [
          {
            name: 'Hammer',
            quantity: 7,
            description: 'New heavy-duty',
            boxClientRef: 'b1',
          },
        ],
      };

      const result = await service.persistToDatabase(data, 'user-123');

      expect(result.success).toBe(true);
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        'Item',
        expect.objectContaining({
          description: 'New heavy-duty',
          quantity: 7,
        }),
      );
    });

    it('should generate QR payload when creating a new box', async () => {
      mockQueryRunner.manager.find
        .mockResolvedValueOnce([]) // storage
        .mockResolvedValueOnce([]); // box

      const data = {
        storageName: 'Garage',
        boxes: [{ name: 'Tools', clientRef: 'b1', description: null }],
        items: [],
      };

      const result = await service.persistToDatabase(data, 'user-123');

      expect(result.success).toBe(true);
      // Box should be saved twice: once to create, once to add QR payload
      const boxSaveCalls = mockQueryRunner.manager.save.mock.calls.filter(
        (call: any[]) => call[0] === 'Box',
      );
      expect(boxSaveCalls.length).toBe(2);
      // Second save should have qrPayload set
      const qrPayload = boxSaveCalls[1][1].qrPayload;
      expect(qrPayload).toBeDefined();
      const parsed = JSON.parse(qrPayload);
      expect(parsed.name).toBe('Tools');
      expect(parsed.boxId).toBeDefined();
      expect(parsed.storageId).toBeDefined();
      expect(parsed.createdAt).toBeDefined();
    });

    it('should reuse existing storage, box, and item when names differ only by case', async () => {
      mockQueryRunner.manager.find
        .mockResolvedValueOnce([
          { id: 'storage-1', name: 'Szabist University Larkana' },
        ])
        .mockResolvedValueOnce([{ id: 'box-1', name: 'BSCS Papers' }])
        .mockResolvedValueOnce([{ id: 'item-1', name: 'CS1A', quantity: 100 }]);

      const data = {
        intent: 'create',
        storageName: 'Szabist university larkana',
        boxes: [{ name: 'Bscs papers', clientRef: 'b1' }],
        items: [
          {
            name: 'cs1A',
            quantity: 10,
            explicitQuantity: true,
            boxClientRef: 'b1',
          },
        ],
      };

      const result = await service.persistToDatabase(data, 'user-123');

      expect(result.success).toBe(true);
      expect(mockQueryRunner.manager.create).not.toHaveBeenCalledWith(
        'Storage',
        expect.anything(),
      );
      expect(mockQueryRunner.manager.create).not.toHaveBeenCalledWith(
        'Box',
        expect.anything(),
      );
      expect(mockQueryRunner.manager.create).not.toHaveBeenCalledWith(
        'Item',
        expect.anything(),
      );
      expect(mockQueryRunner.manager.save).toHaveBeenCalledWith(
        'Item',
        expect.objectContaining({ quantity: 110 }),
      );
    });

    it('should return error when DataSource is not available', async () => {
      // Create service without DataSource provider.
      const module = await Test.createTestingModule({
        providers: [
          TextProcessingService,
          TextParsingService,
          ValidationService,
          AiPersistenceService,
          AiRateLimitService,
          LlmFallbackService,
        ],
      }).compile();
      const serviceNoDb =
        module.get<AiPersistenceService>(AiPersistenceService);

      const result = await serviceNoDb.persistToDatabase({}, 'user-123');
      expect(result.success).toBe(false);
      expect(result.message).toContain('Database connection not available');
    });
  });

  describe('validatePersistencePrerequisites', () => {
    it('should reject boxes and items without a storage name', () => {
      expect(
        service.validatePersistencePrerequisites({
          storageName: null,
          boxes: [{ name: 'Archive Carton', clientRef: 'b1' }],
          items: [{ name: 'Receipt', quantity: 20, boxClientRef: 'b1' }],
        }),
      ).toBe('Please specify the storage before saving boxes or items.');
    });

    it('should reject items that cannot be mapped to a known box ref', () => {
      expect(
        service.validatePersistencePrerequisites({
          storageName: 'Records Room',
          boxes: [{ name: 'Archive Carton', clientRef: 'b1' }],
          items: [{ name: 'Receipt', quantity: 20, boxClientRef: 'missing-ref' }],
        }),
      ).toBe(
        "Please review the generated box assignment for 'Receipt' before saving.",
      );
    });
  });

  describe('generateSmartAcknowledgment', () => {
    it('should acknowledge a newly created storage', () => {
      const data = {
        intent: 'create',
        storageName: 'Garage',
        boxes: [],
        items: [],
      };
      const actionLog = {
        storageAction: 'created' as const,
        boxActions: [],
        itemActions: [],
      };
      expect(service.generateSmartAcknowledgment(data, actionLog)).toContain(
        "Created new storage 'Garage'",
      );
    });

    it('should combine created storage and a single created box', () => {
      const data = {
        intent: 'create',
        storageName: 'Garage',
        boxes: [{ name: 'Tools', clientRef: 'b1' }],
        items: [],
      };
      const actionLog = {
        storageAction: 'created' as const,
        boxActions: [{ name: 'Tools', action: 'created' as const, items: [] }],
        itemActions: [],
      };

      expect(service.generateSmartAcknowledgment(data, actionLog)).toBe(
        "Created new storage 'Garage' and box 'Tools'.",
      );
    });

    it('should call out storage description updates explicitly', () => {
      const data = {
        intent: 'update',
        storageName: 'Garage',
        boxes: [],
        items: [],
      };
      const actionLog = {
        storageAction: 'found' as const,
        storageDescriptionUpdated: true,
        boxActions: [],
        itemActions: [],
      };

      expect(service.generateSmartAcknowledgment(data, actionLog)).toBe(
        "Storage 'Garage' already exists. Updated the description.",
      );
    });

    it('should acknowledge incremental item additions with totals', () => {
      const data = {
        intent: 'increment',
        storageName: 'Garage',
        boxes: [{ name: 'Tools', clientRef: 'b1' }],
      };
      const actionLog = {
        storageAction: 'found' as const,
        boxActions: [{ name: 'Tools', action: 'found' as const, items: [] }],
        itemActions: [
          {
            name: 'Screws',
            action: 'incremented',
            oldQty: 3,
            newQty: 8,
            boxClientRef: 'b1',
          },
        ],
      };
      const message = service.generateSmartAcknowledgment(data, actionLog);

      expect(message).toContain("Screws already exists in 'Tools'");
      expect(message).toContain('Added 5 more');
      expect(message).toContain('New total: 8');
    });

    it('should describe decrements without saying delete', () => {
      const data = {
        intent: 'decrement',
        storageName: 'Garage',
        boxes: [{ name: 'Tools', clientRef: 'b1' }],
      };
      const actionLog = {
        storageAction: 'found' as const,
        boxActions: [{ name: 'Tools', action: 'found' as const, items: [] }],
        itemActions: [
          {
            name: 'Screws',
            action: 'decremented',
            oldQty: 10,
            newQty: 8,
            boxClientRef: 'b1',
          },
        ],
      };
      const message = service.generateSmartAcknowledgment(data, actionLog);

      expect(message).toContain('Removed 2 Screws');
      expect(message).toContain('Remaining: 8');
      expect(message).not.toContain('Deleted');
    });

    it('should condense repeated sequential boxes into a grouped acknowledgment', () => {
      const data = {
        intent: 'create',
        storageName: 'Accessory',
        meta: { mappingStrategy: 'sequential' },
        boxes: [
          { name: 'Clothes with 1', clientRef: 'b1' },
          { name: 'Clothes with 2', clientRef: 'b2' },
          { name: 'Clothes with 3', clientRef: 'b3' },
        ],
      };
      const actionLog = {
        storageAction: 'created' as const,
        boxActions: [
          { name: 'Clothes with 1', action: 'created' as const, items: [] },
          { name: 'Clothes with 2', action: 'created' as const, items: [] },
          { name: 'Clothes with 3', action: 'created' as const, items: [] },
        ],
        itemActions: [
          { name: 'Shirt', action: 'created', newQty: 5, boxClientRef: 'b1' },
          { name: 'Shirt', action: 'created', newQty: 5, boxClientRef: 'b2' },
          { name: 'Shirt', action: 'created', newQty: 5, boxClientRef: 'b3' },
        ],
      };

      expect(service.generateSmartAcknowledgment(data, actionLog)).toBe(
        "Created new storage 'Accessory' with 3 boxes of 'Clothes' x5 in each: Clothes with 1, Clothes with 2, Clothes with 3.",
      );
    });
  });
});
