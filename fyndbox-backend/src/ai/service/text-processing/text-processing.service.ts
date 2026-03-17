import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfirmTextProcessingDto, ProcessTextDto, ProcessTextResponseDto } from '../../dto/text-processing.dto';
import { LightNormalizationService } from './text-processing-services/light-normalization.service';
import { TextParsingService } from './text-processing-services/text-parsing.service';
import { ValidationService } from './text-processing-services/validation.service';
import { HeavyNormalizationService } from './text-processing-services/heavy-normalization.service';
import { DatabaseStorageService } from './text-processing-services/database-storage.service';
import { AcknowledgementService } from './text-processing-services/acknowledgement.service';
import { ApiResponse } from '@fyndbox/shared/types/api-response';

@Injectable()
export class TextProcessingService {
    private readonly logger = new Logger(TextProcessingService.name);
    private readonly maxInputLength = 500;

    constructor(
        private readonly lightNormalizationService: LightNormalizationService,
        private readonly textParsingService: TextParsingService,
        private readonly validationService: ValidationService,
        private readonly heavyNormalizationService: HeavyNormalizationService,
        private readonly databaseStorageService: DatabaseStorageService,
        private readonly acknowledgementService: AcknowledgementService,
    ) {}

    // Facade methods used by controllers and tests.
    lightNormalization(text: string): { normalizedText: string; llmBackup: string; typoCount: number } {
        return this.lightNormalizationService.lightNormalization(text);
    }

    parseExtraction(normalizedText: string): any {
        return this.textParsingService.parseExtraction(normalizedText);
    }

    heavyNormalization(parsedData: any): any {
        return this.heavyNormalizationService.heavyNormalization(parsedData);
    }

    validateInput(rawText: string | null | undefined): { isValid: boolean; message: string | null } {
        return this.validationService.validateInput(rawText);
    }

    intentClassification(parsedData: any, existingContext?: any, typoCount: number = 0): any {
        return this.validationService.intentClassification(parsedData, existingContext, typoCount);
    }

    addSynonym(synonym: string, canonical: string): void {
        this.heavyNormalizationService.addSynonym(synonym, canonical);
    }

    getSynonyms(): Record<string, string> {
        return this.heavyNormalizationService.getSynonyms();
    }

    async getExistingContext(userId: string): Promise<{
        storages: Array<{ id: string; name: string; description?: string | null }>;
        boxes: Array<{ id: string; name: string; storageId: string }>;
        items: Array<{ id: string; name: string; quantity: number; boxId: string }>;
    }> {
        return this.databaseStorageService.getExistingContext(userId);
    }

    generateConfirmationSummary(normalizedData: any): string {
        return this.acknowledgementService.generateConfirmationSummary(normalizedData);
    }

    generateSmartAcknowledgment(normalizedData: any, actionLog: any): string {
        return this.acknowledgementService.generateSmartAcknowledgment(normalizedData, actionLog);
    }

    prepareNormalizedDataForPersistence(
        normalizedData: any,
        expandedBoxes?: Array<{ originalName: string; normalizedOriginalName?: string; expandedNames: string[] }> | null,
    ): any {
        return this.databaseStorageService.prepareNormalizedDataForPersistence(normalizedData, expandedBoxes);
    }

    async persistToDatabase(normalizedData: any, userId: string): Promise<{ success: boolean; message: string; ids?: any; warnings?: string[] }> {
        return this.databaseStorageService.persistToDatabase(normalizedData, userId);
    }

    // Handle the full text-processing request flow.
    async processTextRequest(
        userId: string | undefined,
        processTextDto: ProcessTextDto,
    ): Promise<ApiResponse<ProcessTextResponseDto>> {
        const startTime = Date.now();

        try {
            // Step 1: Basic input checks.
            if (!processTextDto.text || processTextDto.text.trim().length === 0) {
                this.logger.warn(`Empty input from user ${userId}`);
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    success: false,
                    message: 'Text input is required. Please enter an instruction.',
                    data: undefined,
                };
            }

            if (processTextDto.text.length > this.maxInputLength) {
                this.logger.warn(`Input too long from user ${userId}: ${processTextDto.text.length} chars`);
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    success: false,
                    message: `Input too long. Maximum ${this.maxInputLength} characters allowed.`,
                    data: undefined,
                };
            }

            // Step 2: Sanitize input.
            const sanitizedText = this.sanitizeInput(processTextDto.text);
            if (sanitizedText !== processTextDto.text) {
                this.logger.debug(`Input sanitized for user ${userId}`);
            }

            // Step 3: Service-level validation.
            const validation = this.validateInput(sanitizedText);
            if (!validation.isValid) {
                this.logger.debug(`Validation failed: ${validation.message}`);
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    success: false,
                    message: validation.message || undefined,
                    data: undefined,
                };
            }

            // Step 4: Load context for intent decisions.
            let existingContext;
            if (userId) {
                try {
                    existingContext = await this.getExistingContext(userId);
                } catch (error) {
                    this.logger.warn(`Failed to fetch context: ${(error as Error).message}`);
                    existingContext = undefined;
                }
            }

            // Step 5: Process the text pipeline.
            const result = this.processInput(sanitizedText, existingContext);

            const duration = Date.now() - startTime;
            this.logger.log(
                `Processed "${sanitizedText.substring(0, 50)}..." ` +
                `| Intent: ${result.data?.intent || 'none'} ` +
                `| Success: ${result.success} ` +
                `| Duration: ${duration}ms ` +
                `| User: ${userId}`,
            );

            return {
                statusCode: HttpStatus.OK,
                success: result.success,
                message: result.message || (result.success ? 'Text processed successfully' : 'Processing failed'),
                data: {
                    parsedData: result.data ?? null,
                    classified: result.classified ?? null,
                    fallbackToLLM: result.fallbackToLLM ?? false,
                    confidence: result.confidence ?? result.classified?.confidence ?? null,
                    rawInput: result.rawInput ?? sanitizedText,
                    llmBackup: result.llmBackup ?? sanitizedText,
                    _meta: {
                        processedAt: new Date().toISOString(),
                        processingTimeMs: duration,
                        inputLength: sanitizedText.length,
                    },
                },
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error(
                `Error processing text from user ${userId}: ${(error as Error).message}`,
                (error as Error).stack,
            );

            return {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                success: false,
                message: 'Something went wrong while processing your request. Please try again.',
                data: undefined,
            };
        }
    }

    // Persist the confirmed payload and return a response.
    async confirmAndPersistRequest(
        userId: string | undefined,
        confirmDto: ConfirmTextProcessingDto,
    ): Promise<ApiResponse<any>> {
        try {
            const parsedData = confirmDto.parsedData ?? confirmDto.data;

            if (!parsedData) {
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    success: false,
                    message: 'No data provided for persistence',
                    data: null,
                };
            }

            // Require an explicit confirmation when a review step is present.
            if (parsedData.confirmation && !confirmDto.confirmed) {
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    success: false,
                    message: 'Please confirm this change before saving.',
                    data: null,
                };
            }

            const result = await this.persistToDatabase(parsedData, userId || '');

            if (result.success) {
                this.logger.log(`Data persisted successfully for user ${userId}`);
            } else {
                this.logger.warn(`Persistence failed: ${result.message}`);
            }

            return {
                statusCode: result.success ? HttpStatus.OK : HttpStatus.BAD_REQUEST,
                success: result.success,
                message: result.message,
                data: result,
            };
        } catch (error) {
            this.logger.error(
                `Error persisting data for user ${userId}: ${(error as Error).message}`,
                (error as Error).stack,
            );

            return {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                success: false,
                message: 'Failed to save data. Please try again.',
                data: null,
            };
        }
    }

    processInput(rawInput: string, existingContext?: any): any {
        // Phase 1: Light normalization
        const { normalizedText, llmBackup, typoCount } = this.lightNormalization(rawInput);

        // Phase 2: Parsing and extraction
        const parsed = this.parseExtraction(normalizedText);

        // Phase 3: Intent classification and validation
        const classified = this.intentClassification(parsed, existingContext, typoCount);

        if (!classified.isValid) {
            const clarification = classified.clarification || 'This instruction will fall to LLM for manual review.';
            const fallbackToLLM = typeof classified.shouldFallToLLM === 'boolean'
                ? classified.shouldFallToLLM
                : this.shouldFallbackInvalidClarificationToLLM(clarification);
            return {
                success: false,
                fallbackToLLM,
                message: fallbackToLLM
                    ? 'This instruction will fall to LLM for manual review.'
                    : clarification,
                classified,
            };
        }

        if (classified.shouldFallToLLM) {
            console.log(`[LLM Fallback] Confidence: ${classified.confidence} | Input: "${rawInput}" | Backup: "${llmBackup}"`);
            return {
                success: false,
                fallbackToLLM: true,
                confidence: classified.confidence,
                message: `This prompt needs manual review. Confidence: ${classified.confidence}`,
                rawInput,
                llmBackup,
                classified,
            };
        }

        // Phase 4: Heavy normalization
        const normalized = this.heavyNormalization(parsed);
        const prepared = this.prepareNormalizedDataForPersistence(
            normalized,
            classified.expandedBoxes,
        );
        prepared.intent = classified.intent;
        prepared.confirmation = classified.confirmation;
        prepared.expandedBoxes = classified.expandedBoxes;
        prepared.suggestions = classified.suggestions;
        prepared.confidence = classified.confidence;
        prepared.meta = { ...prepared.meta, ...parsed.meta };

        // Phase 5: Confirmation summary
        const confirmationSummary = this.generateConfirmationSummary(prepared);

        return {
            success: true,
            fallbackToLLM: false,
            message: confirmationSummary,
            data: prepared,
            classified,
        };
    }

    private shouldFallbackInvalidClarificationToLLM(clarification: string): boolean {
        const normalized = clarification.trim().toLowerCase();

        return [
            'which box should',
            'which storage should',
            "please specify what you'd like to do",
            'could not understand the instruction',
            'this instruction will fall to llm',
        ].some((pattern) => normalized.startsWith(pattern));
    }

    private sanitizeInput(input: string): string {
        return input
            // Remove null bytes
            .replace(/\0/g, '')
            // Remove vertical tab and form feed
            .replace(/[\v\f]/g, '')
            // Normalize multiple spaces to single space
            .replace(/\s+/g, ' ')
            // Trim leading/trailing whitespace
            .trim();
    }
}
