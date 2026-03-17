import { Test, TestingModule } from '@nestjs/testing';
import { TextProcessingService } from '../../service/text-processing/text-processing.service';
import { LightNormalizationService } from '../../service/text-processing/text-processing-services/light-normalization.service';
import { TextParsingService } from '../../service/text-processing/text-processing-services/text-parsing.service';
import { ValidationService } from '../../service/text-processing/text-processing-services/validation.service';
import { HeavyNormalizationService } from '../../service/text-processing/text-processing-services/heavy-normalization.service';
import { DatabaseStorageService } from '../../service/text-processing/text-processing-services/database-storage.service';
import { AcknowledgementService } from '../../service/text-processing/text-processing-services/acknowledgement.service';

describe('Phase 7: User Acknowledgment', () => {
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
    });

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
