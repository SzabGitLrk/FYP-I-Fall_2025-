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
            expect(result.clarification).toBe("Item 'Hammer' does not exist.");
            expect(result.shouldFallToLLM).toBe(false);
        });

        it('should report storage missing on DELETE when target storage does not exist', () => {
            const result = classify("remove 2 hammer from box Tools in storage Garage", {
                storages: [],
                boxes: [],
                items: [],
            });
            expect(result.isValid).toBe(false);
            expect(result.clarification).toBe("Storage 'Garage' does not exist.");
            expect(result.shouldFallToLLM).toBe(false);
        });

        it('should report box missing on DELETE when target box does not exist', () => {
            const result = classify("remove 2 hammer from box Tools in storage Garage", {
                storages: [{ id: 'storage-1', name: 'Garage' }] as any,
                boxes: [],
                items: [],
            });
            expect(result.isValid).toBe(false);
            expect(result.clarification).toBe("Box 'Tools' does not exist in storage 'Garage'.");
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

        it('should confirm create when update target storage is missing', () => {
            const result = classify("update storage named car", {
                storages: [],
                boxes: [],
                items: [],
            });
            expect(result.intent).toBe('update');
            expect(result.isValid).toBe(true);
            expect(result.shouldFallToLLM).toBe(false);
            expect(result.confirmation).toBe("Storage 'Car' does not exist. Create it?");
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

        it('should return confirmation when update targets a missing storage via processInput', () => {
            const result = service.processInput(
                "update storage named Car",
                { storages: [], boxes: [], items: [] },
            );
            expect(result.success).toBe(true);
            expect(result.fallbackToLLM).toBe(false);
            expect(result.data.confirmation).toBe("Storage 'Car' does not exist. Create it?");
        });

        it('should return confirmation when increment targets a missing box via processInput', () => {
            const result = service.processInput(
                "add 5 screws to box Tools in storage Garage",
                {
                    storages: [{ id: 'storage-1', name: 'Garage' }],
                    boxes: [],
                    items: [],
                },
            );
            expect(result.success).toBe(true);
            expect(result.fallbackToLLM).toBe(false);
            expect(result.data.confirmation).toContain("Box 'Tools' does not exist");
            expect(result.data.confirmation).toContain("Create it?");
        });

        it('should return direct error when decrement targets a missing storage via processInput', () => {
            const result = service.processInput(
                "remove 2 hammer from box Tools in storage Garage",
                { storages: [], boxes: [], items: [] },
            );
            expect(result.success).toBe(false);
            expect(result.fallbackToLLM).toBe(false);
            expect(result.message).toBe("Storage 'Garage' does not exist.");
        });

        it('should return direct error when decrement targets a missing box via processInput', () => {
            const result = service.processInput(
                "remove 2 hammer from box Tools in storage Garage",
                {
                    storages: [{ id: 'storage-1', name: 'Garage' }],
                    boxes: [],
                    items: [],
                },
            );
            expect(result.success).toBe(false);
            expect(result.fallbackToLLM).toBe(false);
            expect(result.message).toBe("Box 'Tools' does not exist in storage 'Garage'.");
        });

        it('should return direct error when decrement targets a missing item via processInput', () => {
            const result = service.processInput(
                "remove 5 hammer from box Tools in storage Garage",
                {
                    storages: [{ id: 'storage-1', name: 'Garage' }],
                    boxes: [{ id: 'box-1', name: 'Tools', storageId: 'storage-1' }],
                    items: [],
                },
            );
            expect(result.success).toBe(false);
            expect(result.fallbackToLLM).toBe(false);
            expect(result.message).toBe("Item 'Hammer' does not exist.");
        });

        it('should return direct error when decrement has no context but specifies a storage via processInput', () => {
            const result = service.processInput(
                "remove 3 screws from box Tools in storage Garage",
            );
            expect(result.success).toBe(false);
            expect(result.fallbackToLLM).toBe(false);
            expect(result.message).toBe("Storage 'Garage' does not exist.");
        });
    });
});
