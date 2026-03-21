import { Injectable } from '@nestjs/common';
import { ProcessTextRequestDto } from './dto/process-text-request.dto';
import { ProcessTextResponseDto } from './dto/process-text-response.dto';
import { AiPersistenceService } from './services/ai-persistence.service';
import { TextProcessingService } from './services/text-processing.service';
import { ConfirmAiResultRequestDto } from './dto/confirm-ai-result-request.dto';
import { ConfirmAiResultResponseDto } from './dto/confirm-ai-result-response.dto';

@Injectable()
export class AiService {
  constructor(
    private readonly textProcessingService: TextProcessingService,
    private readonly aiPersistenceService: AiPersistenceService,
  ) {}

  async processText(
    userId: string,
    processTextRequestDto: ProcessTextRequestDto,
  ): Promise<ProcessTextResponseDto> {
    return this.textProcessingService.processTextRequest(
      userId,
      processTextRequestDto,
    );
  }

  async confirmResult(
    userId: string,
    confirmAiResultRequestDto: ConfirmAiResultRequestDto,
  ): Promise<ConfirmAiResultResponseDto> {
    return this.aiPersistenceService.confirmAndPersistRequest(
      userId,
      confirmAiResultRequestDto,
    );
  }
}
