import { Module } from '@nestjs/common';
import { TextProcessingService } from '../service/text-processing/text-processing.service';
import { TextProcessingController } from '../controllers/text-processing.controller';
import { LightNormalizationService } from '../service/text-processing/text-processing-services/light-normalization.service';
import { TextParsingService } from '../service/text-processing/text-processing-services/text-parsing.service';
import { ValidationService } from '../service/text-processing/text-processing-services/validation.service';
import { HeavyNormalizationService } from '../service/text-processing/text-processing-services/heavy-normalization.service';
import { DatabaseStorageService } from '../service/text-processing/text-processing-services/database-storage.service';
import { AcknowledgementService } from '../service/text-processing/text-processing-services/acknowledgement.service';

// Text processing module wiring.
@Module({
    // Register services used by the controller.
    providers: [
        TextProcessingService,
        LightNormalizationService,
        TextParsingService,
        ValidationService,
        HeavyNormalizationService,
        DatabaseStorageService,
        AcknowledgementService,
    ],
    // Export service for other modules.
    exports: [TextProcessingService],
    // Register HTTP controller(s).
    controllers: [TextProcessingController],
})
export class TextProcessingModule {}
