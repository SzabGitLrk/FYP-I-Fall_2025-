import { Test, TestingModule } from '@nestjs/testing';
import { TextProcessingService } from './text-processing.service';
import { DataSource } from 'typeorm';

describe('Phase 5: Database Persistence', () => {
    let service: TextProcessingService;
    let mockQueryRunner: any;
    let mockDataSource: Partial<DataSource>;

    beforeEach(async () => {
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
                create: jest.fn((entity, data) => ({ ...data, id: `mock-${entity}-id` })),
                save: jest.fn((entity, data) => Promise.resolve({ ...data, id: data.id || `saved-${entity}-id` })),
            },
        };

        mockDataSource = {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TextProcessingService,
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();

        service = module.get<TextProcessingService>(TextProcessingService);
    });

    // --- generateConfirmationSummary ---
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
            expect(summary).toContain('Hammer (x2) → Tools');
            expect(summary).toContain('Scarf (x1) → Winter');
        });

        it('should handle empty data gracefully', () => {
            const data = { storageName: null, boxes: [], items: [] };
            const summary = service.generateConfirmationSummary(data);
            expect(summary).toContain('Ready to save:');
            expect(summary).toContain('Confirm?');
        });

        it('should replicate per-box items across each expanded box', () => {
            const parsed = service.parseExtraction(
                service.lightNormalization(
                    'register a cabinet Accessories containing locker: three clothes 7 shirts each and two watches 5 rolex each',
                ).normalizedText,
            );
            const classified = service.intentClassification(parsed);
            const normalized = service.heavyNormalization(parsed);
            const prepared = (service as any).prepareNormalizedDataForPersistence(
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
            expect(prepared.items.filter((item: any) => item.name === 'Shirt')).toHaveLength(3);
            expect(prepared.items.filter((item: any) => item.name === 'Rolex')).toHaveLength(2);
            expect(prepared.items.every((item: any) => item.quantity === (item.name === 'Shirt' ? 7 : 5))).toBe(true);
        });

        it('should replicate generic each-has items across every expanded box', () => {
            const parsed = service.parseExtraction(
                service.lightNormalization(
                    'create storage A with 5 boxes of B each has 10 items of C',
                ).normalizedText,
            );
            const classified = service.intentClassification(parsed);
            const normalized = service.heavyNormalization(parsed);
            const prepared = (service as any).prepareNormalizedDataForPersistence(
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
            expect(prepared.items.every((item: any) => item.quantity === 10)).toBe(true);
        });

        it('should replicate grouped item-section quantities across every expanded box when using "in each"', () => {
            const parsed = service.parseExtraction(
                service.lightNormalization(
                    'add a vualt named ABC containing lockers: three clothes items: 10 shirts in each',
                ).normalizedText,
            );
            const classified = service.intentClassification(parsed);
            const normalized = service.heavyNormalization(parsed);
            const prepared = (service as any).prepareNormalizedDataForPersistence(
                { ...normalized, intent: classified.intent, meta: normalized.meta },
                classified.expandedBoxes,
            );

            expect(prepared.boxes.map((box: any) => box.name)).toEqual([
                'Clothes 1',
                'Clothes 2',
                'Clothes 3',
            ]);
            expect(prepared.items).toHaveLength(3);
            expect(prepared.items.every((item: any) => item.name === 'Shirt')).toBe(true);
            expect(prepared.items.every((item: any) => item.quantity === 10)).toBe(true);
        });
    });

    // --- persistToDatabase ---
    describe('persistToDatabase', () => {
        it('should create new storage when not found', async () => {
            mockQueryRunner.manager.find.mockResolvedValueOnce([]); // storage not found

            const data = { storageName: 'Garage', storageDescription: 'Main', boxes: [], items: [] };
            const result = await service.persistToDatabase(data, 'user-123');

            expect(result.success).toBe(true);
            expect(mockQueryRunner.manager.create).toHaveBeenCalledWith('Storage', expect.objectContaining({ name: 'Garage', userId: 'user-123' }));
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
            expect(mockQueryRunner.release).toHaveBeenCalled();
        });

        it('should reuse existing storage when found', async () => {
            mockQueryRunner.manager.find.mockResolvedValueOnce([{ id: 'existing-storage-id', name: 'Garage' }]);

            const data = { storageName: 'Garage', boxes: [], items: [] };
            const result = await service.persistToDatabase(data, 'user-123');

            expect(result.success).toBe(true);
            expect(result.ids.storageId).toBe('existing-storage-id');
            // Should NOT call create for storage
            expect(mockQueryRunner.manager.create).not.toHaveBeenCalledWith('Storage', expect.anything());
        });

        it('should update an existing storage description when intent is update', async () => {
            mockQueryRunner.manager.find.mockResolvedValueOnce([
                { id: 'existing-storage-id', name: 'Garage', description: 'Old warehouse' },
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
            expect(result.message).toBe("Storage 'Garage' already exists. Updated the description.");
        });

        it('should update an existing storage description during create when a new description is provided', async () => {
            mockQueryRunner.manager.find.mockResolvedValueOnce([
                { id: 'existing-storage-id', name: 'Garage', description: 'Old warehouse' },
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
            expect(result.message).toBe("Storage 'Garage' already exists. Updated the description.");
        });

        it('should return a no-change message for update when nothing changed on the storage', async () => {
            mockQueryRunner.manager.find.mockResolvedValueOnce([
                { id: 'existing-storage-id', name: 'Garage', description: 'Main warehouse' },
            ]);

            const data = {
                intent: 'update',
                storageName: 'Garage',
                boxes: [],
                items: [],
            };
            const result = await service.persistToDatabase(data, 'user-123');

            expect(result.success).toBe(true);
            expect(result.message).toBe("No changes needed. Storage 'Garage' is already up to date.");
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
                items: [{ name: 'Hammer', quantity: 2, description: null, boxClientRef: 'b1' }],
            };

            const result = await service.persistToDatabase(data, 'user-123');

            expect(result.success).toBe(true);
            expect(mockQueryRunner.manager.create).toHaveBeenCalledWith('Storage', expect.anything());
            expect(mockQueryRunner.manager.create).toHaveBeenCalledWith('Box', expect.objectContaining({ name: 'Tools' }));
            expect(mockQueryRunner.manager.create).toHaveBeenCalledWith('Item', expect.objectContaining({ name: 'Hammer', quantity: 2 }));
            expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        });

        it('should rollback on error', async () => {
            mockQueryRunner.manager.find.mockRejectedValue(new Error('DB connection failed'));

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
            expect(mockQueryRunner.manager.save).toHaveBeenCalledWith('Item', expect.objectContaining({ quantity: 5 }));
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
                items: [{ name: 'Hammer', quantity: 5, explicitQuantity: true, boxClientRef: 'b1' }],
            };

            const result = await service.persistToDatabase(data, 'user-123');

            expect(result.success).toBe(true);
            expect(mockQueryRunner.manager.save).toHaveBeenCalledWith('Item', expect.objectContaining({ quantity: 8 }));
        });

        it('should not change quantity when create references an existing item without explicit quantity or description', async () => {
            mockQueryRunner.manager.find
                .mockResolvedValueOnce([{ id: 'storage-1', name: 'Garage' }])
                .mockResolvedValueOnce([{ id: 'box-1', name: 'Tools' }])
                .mockResolvedValueOnce([{ id: 'item-1', name: 'Hammer', quantity: 3, description: null }]);

            const data = {
                intent: 'create',
                storageName: 'Garage',
                boxes: [{ name: 'Tools', clientRef: 'b1' }],
                items: [{ name: 'Hammer', quantity: 1, explicitQuantity: false, boxClientRef: 'b1' }],
            };

            const result = await service.persistToDatabase(data, 'user-123');

            expect(result.success).toBe(true);
            expect(mockQueryRunner.manager.save).not.toHaveBeenCalledWith('Item', expect.objectContaining({ quantity: 4 }));
            expect(result.message).toContain("already contains 'Hammer'");
            expect(result.message).toContain('No changes needed.');
        });

        it('should return a no-change message for update when boxes and items already match', async () => {
            mockQueryRunner.manager.find
                .mockResolvedValueOnce([{ id: 'storage-1', name: 'Winter Clothes', description: null }])
                .mockResolvedValueOnce([{ id: 'box-1', name: 'Shirt' }])
                .mockResolvedValueOnce([{ id: 'box-2', name: 'Wearable' }])
                .mockResolvedValueOnce([{ id: 'item-1', name: 'Tea Shirt', quantity: 1, description: null }])
                .mockResolvedValueOnce([{ id: 'item-2', name: 'Scarf', quantity: 1, description: null }]);

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
                .mockResolvedValueOnce([{ id: 'storage-1', name: 'Garage', description: null }])
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
                .mockResolvedValueOnce([{ id: 'item-1', name: 'Hammer', quantity: 10 }]);

            const data = {
                intent: 'decrement',
                storageName: 'Garage',
                boxes: [{ name: 'Tools', clientRef: 'b1' }],
                items: [{ name: 'Hammer', quantity: 3, boxClientRef: 'b1' }],
            };

            const result = await service.persistToDatabase(data, 'user-123');

            expect(result.success).toBe(true);
            // 10 - 3 = 7
            expect(mockQueryRunner.manager.save).toHaveBeenCalledWith('Item', expect.objectContaining({ quantity: 7 }));
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
            expect(mockQueryRunner.manager.save).toHaveBeenCalledWith('Item', expect.objectContaining({ quantity: 0 }));
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
                .mockResolvedValueOnce([{ id: 'item-1', name: 'Hammer', quantity: 3, description: 'Old desc' }]);

            const data = {
                intent: 'update',
                storageName: 'Garage',
                boxes: [{ name: 'Tools', clientRef: 'b1' }],
                items: [{ name: 'Hammer', quantity: 7, description: 'New heavy-duty', boxClientRef: 'b1' }],
            };

            const result = await service.persistToDatabase(data, 'user-123');

            expect(result.success).toBe(true);
            expect(mockQueryRunner.manager.save).toHaveBeenCalledWith('Item', expect.objectContaining({
                description: 'New heavy-duty',
                quantity: 7,
            }));
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
                (call: any[]) => call[0] === 'Box'
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
                .mockResolvedValueOnce([{ id: 'storage-1', name: 'Szabist University Larkana' }])
                .mockResolvedValueOnce([{ id: 'box-1', name: 'BSCS Papers' }])
                .mockResolvedValueOnce([{ id: 'item-1', name: 'CS1A', quantity: 100 }]);

            const data = {
                intent: 'create',
                storageName: 'Szabist university larkana',
                boxes: [{ name: 'Bscs papers', clientRef: 'b1' }],
                items: [{ name: 'cs1A', quantity: 10, explicitQuantity: true, boxClientRef: 'b1' }],
            };

            const result = await service.persistToDatabase(data, 'user-123');

            expect(result.success).toBe(true);
            expect(mockQueryRunner.manager.create).not.toHaveBeenCalledWith('Storage', expect.anything());
            expect(mockQueryRunner.manager.create).not.toHaveBeenCalledWith('Box', expect.anything());
            expect(mockQueryRunner.manager.create).not.toHaveBeenCalledWith('Item', expect.anything());
            expect(mockQueryRunner.manager.save).toHaveBeenCalledWith('Item', expect.objectContaining({ quantity: 110 }));
        });

        it('should return error when DataSource is not available', async () => {
            // Create service without DataSource
            const module = await Test.createTestingModule({
                providers: [TextProcessingService],
            }).compile();
            const serviceNoDb = module.get<TextProcessingService>(TextProcessingService);

            const result = await serviceNoDb.persistToDatabase({}, 'user-123');
            expect(result.success).toBe(false);
            expect(result.message).toContain('Database connection not available');
        });
    });

    // --- Phase 7: Smart Acknowledgment ---
    describe('generateSmartAcknowledgment', () => {
        it('should ack CREATE new storage', () => {
            const data = { intent: 'create', storageName: 'Garage', boxes: [], items: [] };
            const actionLog = { storageAction: 'created' as const, boxActions: [], itemActions: [] };
            const msg = service.generateSmartAcknowledgment(data, actionLog);
            expect(msg).toContain("Created new storage 'Garage'");
        });

        it('should combine created storage and single created box into one sentence', () => {
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
            const msg = service.generateSmartAcknowledgment(data, actionLog);
            expect(msg).toBe("Created new storage 'Garage' and box 'Tools'.");
        });

        it('should ack CREATE existing storage (already exists)', () => {
            const data = { intent: 'create', storageName: 'Garage', boxes: [], items: [] };
            const actionLog = { storageAction: 'found' as const, boxActions: [], itemActions: [] };
            const msg = service.generateSmartAcknowledgment(data, actionLog);
            expect(msg).toBe("Storage 'Garage' already exists. No changes needed.");
        });

        it('should ack storage description updates explicitly', () => {
            const data = { intent: 'update', storageName: 'Garage', storageDescription: 'Main Warehouse', boxes: [], items: [] };
            const actionLog = {
                storageAction: 'found' as const,
                storageDescriptionUpdated: true,
                boxActions: [],
                itemActions: [],
            };
            const msg = service.generateSmartAcknowledgment(data, actionLog);
            expect(msg).toBe("Storage 'Garage' already exists. Updated the description.");
        });

        it('should ack UPDATE no-op on an existing storage', () => {
            const data = { intent: 'update', storageName: 'Garage', boxes: [], items: [] };
            const actionLog = {
                storageAction: 'found' as const,
                boxActions: [],
                itemActions: [],
            };
            const msg = service.generateSmartAcknowledgment(data, actionLog);
            expect(msg).toBe("No changes needed. Storage 'Garage' is already up to date.");
        });

        it('should ack UPDATE no-op with existing boxes and items', () => {
            const data = {
                intent: 'update',
                storageName: 'Winter Clothes',
                boxes: [
                    { name: 'Shirt', clientRef: 'b1' },
                    { name: 'Wearable', clientRef: 'b2' },
                ],
            };
            const actionLog = {
                storageAction: 'found' as const,
                boxActions: [
                    { name: 'Shirt', action: 'found' as const, items: [] },
                    { name: 'Wearable', action: 'found' as const, items: [] },
                ],
                itemActions: [
                    { name: 'Tea Shirt', action: 'unchanged', oldQty: 1, newQty: 1, boxClientRef: 'b1' },
                    { name: 'Scarf', action: 'unchanged', oldQty: 1, newQty: 1, boxClientRef: 'b2' },
                ],
            };
            const msg = service.generateSmartAcknowledgment(data, actionLog);
            expect(msg).toBe(
                "Storage 'Winter Clothes' already exists. Box 'Shirt' already contains 'Tea Shirt'. Box 'Wearable' already contains 'Scarf'. No changes needed.",
            );
        });

        it('should ack CREATE unchanged item as already existing content', () => {
            const data = {
                intent: 'create',
                storageName: 'Garage',
                boxes: [{ name: 'Tools', clientRef: 'b1' }],
            };
            const actionLog = {
                storageAction: 'found' as const,
                boxActions: [{ name: 'Tools', action: 'found' as const, items: [] }],
                itemActions: [{ name: 'Hammer', action: 'unchanged', oldQty: 3, newQty: 3, boxClientRef: 'b1' }],
            };
            const msg = service.generateSmartAcknowledgment(data, actionLog);
            expect(msg).toContain("Storage 'Garage' already exists");
            expect(msg).toContain("Box 'Tools' already contains 'Hammer'");
            expect(msg).toContain('No changes needed.');
        });

        it('should ack CREATE repeated existing boxes without calling them updated', () => {
            const data = {
                intent: 'create',
                storageName: 'Garage',
                boxes: [
                    { name: 'Tools', clientRef: 'b1' },
                    { name: 'Winter', clientRef: 'b2' },
                ],
            };
            const actionLog = {
                storageAction: 'found' as const,
                boxActions: [
                    { name: 'Tools', action: 'found' as const, items: [] },
                    { name: 'Winter', action: 'found' as const, items: [] },
                ],
                itemActions: [],
            };
            const msg = service.generateSmartAcknowledgment(data, actionLog);
            expect(msg).toBe("Storage 'Garage' already exists. Boxes 'Tools' and 'Winter' already exist. No changes needed.");
        });

        it('should ack CREATE with mixed existing and new content explicitly', () => {
            const data = {
                intent: 'create',
                storageName: 'Winter Clothes',
                boxes: [
                    { name: 'Shirt', clientRef: 'b1' },
                    { name: 'Wearable', clientRef: 'b2' },
                ],
            };
            const actionLog = {
                storageAction: 'found' as const,
                boxActions: [
                    { name: 'Shirt', action: 'found' as const, items: [] },
                    { name: 'Wearable', action: 'created' as const, items: [] },
                ],
                itemActions: [
                    { name: 'Tea Shirt', action: 'unchanged', oldQty: 3, newQty: 3, boxClientRef: 'b1' },
                    { name: 'Scarf', action: 'created', newQty: 1, boxClientRef: 'b2' },
                ],
            };
            const msg = service.generateSmartAcknowledgment(data, actionLog);
            expect(msg).toContain("Storage 'Winter Clothes' already exists");
            expect(msg).toContain("Box 'Shirt' already contains 'Tea Shirt'");
            expect(msg).toContain("Created box 'Wearable' with 'Scarf'");
        });

        it('should ack INCREMENT with item details', () => {
            const data = {
                intent: 'increment', storageName: 'Garage',
                boxes: [{ name: 'Tools', clientRef: 'b1' }],
            };
            const actionLog = {
                storageAction: 'found' as const,
                boxActions: [{ name: 'Tools', action: 'found' as const, items: [] }],
                itemActions: [{ name: 'Screws', action: 'incremented', oldQty: 3, newQty: 8, boxClientRef: 'b1' }],
            };
            const msg = service.generateSmartAcknowledgment(data, actionLog);
            expect(msg).toContain("Screws already exists in 'Tools'");
            expect(msg).toContain('Added 5 more');
            expect(msg).toContain('New total: 8');
        });

        it('should ack DECREMENT without using "Deleted"', () => {
            const data = {
                intent: 'decrement', storageName: 'Garage',
                boxes: [{ name: 'Tools', clientRef: 'b1' }],
            };
            const actionLog = {
                storageAction: 'found' as const,
                boxActions: [{ name: 'Tools', action: 'found' as const, items: [] }],
                itemActions: [{ name: 'Screws', action: 'decremented', oldQty: 10, newQty: 8, boxClientRef: 'b1' }],
            };
            const msg = service.generateSmartAcknowledgment(data, actionLog);
            expect(msg).toContain('Removed 2 Screws');
            expect(msg).toContain('Remaining: 8');
            expect(msg).not.toContain('Deleted');
            expect(msg).not.toContain('Quantity changed from');
        });

        it('should ack CREATE storage with boxes and items', () => {
            const data = {
                intent: 'create', storageName: 'Garage',
                boxes: [
                    { name: 'Tools', clientRef: 'b1' },
                    { name: 'Winter', clientRef: 'b2' },
                ],
            };
            const actionLog = {
                storageAction: 'created' as const,
                boxActions: [
                    { name: 'Tools', action: 'created' as const, items: [] },
                    { name: 'Winter', action: 'created' as const, items: [] },
                ],
                itemActions: [
                    { name: 'Hammer', action: 'created', newQty: 2, boxClientRef: 'b1' },
                    { name: 'Wrench', action: 'created', newQty: 1, boxClientRef: 'b1' },
                    { name: 'Scarf', action: 'created', newQty: 1, boxClientRef: 'b2' },
                ],
            };
            const msg = service.generateSmartAcknowledgment(data, actionLog);
            expect(msg).toContain("Created new storage 'Garage'");
            expect(msg).toContain("'Tools'");
            expect(msg).toContain("'Hammer'");
            expect(msg).toContain("'Scarf'");
        });

        it('should use sequential formula when meta.mappingStrategy is sequential', () => {
            const data = {
                intent: 'create', storageName: 'Garage',
                meta: { mappingStrategy: 'sequential' },
                boxes: [
                    { name: 'Tools', clientRef: 'b1' },
                    { name: 'Winter', clientRef: 'b2' },
                ],
            };
            const actionLog = {
                storageAction: 'created' as const,
                boxActions: [
                    { name: 'Tools', action: 'created' as const, items: [] },
                    { name: 'Winter', action: 'created' as const, items: [] },
                ],
                itemActions: [
                    { name: 'Hammer', action: 'created', newQty: 1, boxClientRef: 'b1' },
                    { name: 'Scarf', action: 'created', newQty: 1, boxClientRef: 'b2' },
                ],
            };
            const msg = service.generateSmartAcknowledgment(data, actionLog);
            expect(msg).toContain('2 boxes');
            expect(msg).toContain("'Tools' (with 'Hammer')");
            expect(msg).toContain("'Winter' (with 'Scarf')");
        });

        it('should include quantities in sequential acknowledgments', () => {
            const data = {
                intent: 'create', storageName: 'Accessory',
                meta: { mappingStrategy: 'sequential' },
                boxes: [
                    { name: 'Clothes', clientRef: 'b1' },
                    { name: 'Watch', clientRef: 'b2' },
                ],
            };
            const actionLog = {
                storageAction: 'created' as const,
                boxActions: [
                    { name: 'Clothes', action: 'created' as const, items: [] },
                    { name: 'Watch', action: 'created' as const, items: [] },
                ],
                itemActions: [
                    { name: 'Shirt', action: 'created', newQty: 7, boxClientRef: 'b1' },
                    { name: 'Rolex', action: 'created', newQty: 5, boxClientRef: 'b2' },
                ],
            };
            const msg = service.generateSmartAcknowledgment(data, actionLog);
            expect(msg).toContain("'Clothes' (with 'Shirt' (x7))");
            expect(msg).toContain("'Watch' (with 'Rolex' (x5))");
        });

        it('should include quantities for multi-word item names in sequential acknowledgments', () => {
            const data = {
                intent: 'create', storageName: 'Warehouse',
                meta: { mappingStrategy: 'sequential' },
                boxes: [
                    { name: 'Alpha', clientRef: 'b1' },
                    { name: 'Beta', clientRef: 'b2' },
                ],
            };
            const actionLog = {
                storageAction: 'created' as const,
                boxActions: [
                    { name: 'Alpha', action: 'created' as const, items: [] },
                    { name: 'Beta', action: 'created' as const, items: [] },
                ],
                itemActions: [
                    { name: 'Forklift', action: 'created', newQty: 4, boxClientRef: 'b1' },
                    { name: 'Pallet Jack', action: 'created', newQty: 6, boxClientRef: 'b2' },
                ],
            };
            const msg = service.generateSmartAcknowledgment(data, actionLog);
            expect(msg).toContain("'Alpha' (with 'Forklift' (x4))");
            expect(msg).toContain("'Beta' (with 'Pallet Jack' (x6))");
        });

        it('should condense repeated expanded boxes into a short grouped acknowledgment', () => {
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

            const msg = service.generateSmartAcknowledgment(data, actionLog);
            expect(msg).toBe("Created new storage 'Accessory' with 3 boxes of 'Clothes' x5 in each.");
        });

        it('should treat repeated sequential create instructions as no-op when nothing changes', () => {
            const data = {
                intent: 'create',
                storageName: 'Accessory',
                meta: { mappingStrategy: 'sequential' },
                boxes: [
                    { name: 'Clothes 1', clientRef: 'b1' },
                    { name: 'Clothes 2', clientRef: 'b2' },
                ],
            };
            const actionLog = {
                storageAction: 'found' as const,
                boxActions: [
                    { name: 'Clothes 1', action: 'found' as const, items: [] },
                    { name: 'Clothes 2', action: 'found' as const, items: [] },
                ],
                itemActions: [
                    { name: 'Shirt', action: 'unchanged', oldQty: 5, newQty: 5, boxClientRef: 'b1' },
                    { name: 'Shirt', action: 'unchanged', oldQty: 5, newQty: 5, boxClientRef: 'b2' },
                ],
            };

            const msg = service.generateSmartAcknowledgment(data, actionLog);
            expect(msg).toContain("Storage 'Accessory' already exists.");
            expect(msg).toContain("Box 'Clothes 1' already contains 'Shirt' (x5).");
            expect(msg).toContain("Box 'Clothes 2' already contains 'Shirt' (x5).");
            expect(msg).toContain('No changes needed.');
        });

        it('should combine multiple created boxes into one create acknowledgment', () => {
            const data = {
                intent: 'create',
                storageName: 'Accessory',
                boxes: [
                    { name: 'Clothes', clientRef: 'b1' },
                    { name: 'Watch', clientRef: 'b2' },
                ],
                items: [],
            };
            const actionLog = {
                storageAction: 'created' as const,
                boxActions: [
                    { name: 'Clothes', action: 'created' as const, items: [] },
                    { name: 'Watch', action: 'created' as const, items: [] },
                ],
                itemActions: [],
            };
            const msg = service.generateSmartAcknowledgment(data, actionLog);
            expect(msg).toBe("Created new storage 'Accessory' with boxes 'Clothes' and 'Watch'.");
        });

        it('should ack MODIFY intent', () => {
            const data = {
                intent: 'update', storageName: 'Garage',
                boxes: [{ name: 'Tools', clientRef: 'b1' }],
            };
            const actionLog = {
                storageAction: 'found' as const,
                boxActions: [{ name: 'Tools', action: 'found' as const, items: [] }],
                itemActions: [{ name: 'Hammer', action: 'modified', oldQty: 3, newQty: 7, boxClientRef: 'b1', quantityChanged: true }],
            };
            const msg = service.generateSmartAcknowledgment(data, actionLog);
            expect(msg).toContain("Storage 'Garage' already exists.");
            expect(msg).toContain("Hammer quantity changed from 3 to 7");
        });

        it('should ack UPDATE with newly added items in an existing box without saying the box was created', () => {
            const data = {
                intent: 'update',
                storageName: 'Garage',
                boxes: [{ name: 'Screw', clientRef: 'b1' }],
            };
            const actionLog = {
                storageAction: 'found' as const,
                boxActions: [{ name: 'Screw', action: 'found' as const, items: [] }],
                itemActions: [{ name: 'Long Screw', action: 'created', newQty: 5, boxClientRef: 'b1' }],
            };
            const msg = service.generateSmartAcknowledgment(data, actionLog);
            expect(msg).toBe("Storage 'Garage' already exists. Added 'Long Screw' (x5) to existing box 'Screw'.");
        });

        it('should return "No changes were made." for empty data', () => {
            const data = { intent: 'create' };
            const actionLog = { storageAction: null, boxActions: [], itemActions: [] };
            const msg = service.generateSmartAcknowledgment(data, actionLog);
            expect(msg).toBe('No changes were made.');
        });
    });
});
