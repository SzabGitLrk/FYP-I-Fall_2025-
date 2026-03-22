import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiPersistenceService } from './services/ai-persistence.service';
import { ImageProcessingService } from './services/image-processing.service';
import { LlmFallbackService } from './services/llm-fallback.service';
import { TextParsingService } from './services/text-parsing.service';
import { TextProcessingService } from './services/text-processing.service';
import { ValidationService } from './services/validation.service';
import { VoiceProcessingService } from './services/voice-processing.service';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    AiPersistenceService,
    ImageProcessingService,
    LlmFallbackService,
    TextParsingService,
    TextProcessingService,
    ValidationService,
    VoiceProcessingService,
  ],
  exports: [AiService, AiPersistenceService, TextProcessingService],
})
export class AiModule {}
