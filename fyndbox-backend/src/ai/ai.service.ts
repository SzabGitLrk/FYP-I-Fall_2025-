import { Injectable } from '@nestjs/common';
import { ApiResponse } from '@fyndbox/shared/types/api-response';
import { ConfirmAiResultDto } from './dto/confirm-ai-result.dto';
import { ProcessTextDto, ProcessTextResponseDto } from './dto/process-text.dto';
import { AiPersistenceService } from './services/ai-persistence.service';
import { TextProcessingService } from './services/text-processing.service';

@Injectable()
export class AiService {
    constructor(
        private readonly textProcessingService: TextProcessingService,
        private readonly aiPersistenceService: AiPersistenceService,
    ) {}

    // Route text requests through the dedicated text-processing pipeline.
    processText(
        userId: string | undefined,
        processTextDto: ProcessTextDto,
    ): Promise<ApiResponse<ProcessTextResponseDto>> {
        return this.textProcessingService.processTextRequest(userId, processTextDto);
    }

    // Confirmation requests go straight to the persistence workflow.
    confirmResult(
        userId: string | undefined,
        confirmDto: ConfirmAiResultDto,
    ): Promise<ApiResponse<any>> {
        return this.aiPersistenceService.confirmAndPersistRequest(userId, confirmDto);
    }
}
