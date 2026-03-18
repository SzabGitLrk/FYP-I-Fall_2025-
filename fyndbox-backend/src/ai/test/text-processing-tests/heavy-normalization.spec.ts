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

        it('should preserve numbered box names without singularizing the family label', () => {
            const result = heavyNorm("remove 2 pumpy from box shoes 1 in storage stylo mall");
            expect(result.boxes[0].name).toBe('Shoes 1');
        });

        it('should handle irregular plurals (knives -> knife)', () => {
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

        it('should map synonyms to canonical names (car stuff -> Car Care)', () => {
            const parsed = { storageName: 'garage', boxes: [{ name: 'car stuff', quantity: null, description: null }], items: [] };
            const result = service.heavyNormalization(parsed);
            expect(result.boxes[0].name).toBe('Car Care');
        });

        it('should map synonym kitchen stuff -> Kitchen Supplies', () => {
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
});
