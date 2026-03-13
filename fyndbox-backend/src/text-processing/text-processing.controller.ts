import {
    Controller,
    Post,
    Body,
    HttpStatus,
    HttpCode,
    UseGuards,
    Request,
    Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TextProcessingService } from './text-processing.service';
import { ApiResponse } from '@fyndbox/shared/types/api-response';

/**
 * Maximum allowed input length to prevent DoS attacks
 */
const MAX_INPUT_LENGTH = 500;

/**
 * Data Transfer Object for text processing request
 */
export class ProcessTextDto {
    /** The user's raw text input to process */
    text: string;
}

/**
 * TextProcessingController - Handles text processing HTTP endpoints
 * 
 * Provides an endpoint to process natural language commands from users.
 * The service parses the text to extract:
 * - Intent (create, add, update, remove)
 * - Storage name
 * - Boxes
 * - Items
 * 
 * Endpoints:
 * POST /text-process - Process user text input
 */
@Controller('text-process')
export class TextProcessingController {
    // Logger for debugging and monitoring
    private readonly logger = new Logger(TextProcessingController.name);

    // Inject the text processing service
    constructor(private readonly textProcessingService: TextProcessingService) {}

    /**
     * Process user text input and extract entities
     * 
     * @param req - Request object containing user info (from JWT auth)
     * @param processTextDto - DTO containing the text to process
     * @returns Parsed result with intent, entities, and confirmation
     */
    @Post()
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard('jwt'))
    async processText(
        @Request() req: any,
        @Body() processTextDto: ProcessTextDto,
    ): Promise<ApiResponse<any>> {
        const userId = req.user?.userId;
        const startTime = Date.now();

        try {
            // ============================================
            // STEP 1: Input Validation
            // ============================================
            
            // Check if text exists
            if (!processTextDto.text || processTextDto.text.trim().length === 0) {
                this.logger.warn(`Empty input from user ${userId}`);
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    success: false,
                    message: 'Text input is required. Please enter an instruction.',
                    data: null,
                };
            }

            // Check max length to prevent DoS
            if (processTextDto.text.length > MAX_INPUT_LENGTH) {
                this.logger.warn(`Input too long from user ${userId}: ${processTextDto.text.length} chars`);
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    success: false,
                    message: `Input too long. Maximum ${MAX_INPUT_LENGTH} characters allowed.`,
                    data: null,
                };
            }

            // Sanitize input - remove potentially harmful characters
            const sanitizedText = this.sanitizeInput(processTextDto.text);
            if (sanitizedText !== processTextDto.text) {
                this.logger.debug(`Input sanitized for user ${userId}`);
            }

            // ============================================
            // STEP 2: Validate with TextProcessingService
            // ============================================
            
            // Validate input meets minimum requirements
            const validation = this.textProcessingService.validateInput(sanitizedText);
            if (!validation.isValid) {
                this.logger.debug(`Validation failed: ${validation.message}`);
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    success: false,
                    message: validation.message || undefined,
                    data: null,
                };
            }

            // ============================================
            // STEP 3: Fetch existing context from DB
            // ============================================
            
            // Get user's existing context (storages, boxes, items) for validation
            // This helps with suggestions like "already exists"
            let existingContext;
            try {
                existingContext = await this.textProcessingService.getExistingContext(userId);
            } catch (error) {
                this.logger.warn(`Failed to fetch context: ${error.message}`);
                existingContext = undefined;
            }

            // ============================================
            // STEP 4: Process the text
            // ============================================
            
            // Process the text through the full pipeline
            const result = this.textProcessingService.processInput(
                sanitizedText,
                existingContext,
            );

            // ============================================
            // STEP 4: Log results for debugging
            // ============================================
            
            const duration = Date.now() - startTime;
            this.logger.log(
                `Processed "${sanitizedText.substring(0, 50)}..." ` +
                `| Intent: ${result.data?.intent || 'none'} ` +
                `| Success: ${result.success} ` +
                `| Duration: ${duration}ms ` +
                `| User: ${userId}`
            );

            // ============================================
            // STEP 5: Return response
            // ============================================
            
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
                    // Add metadata for debugging
                    _meta: {
                        processedAt: new Date().toISOString(),
                        processingTimeMs: duration,
                        inputLength: sanitizedText.length,
                    },
                },
            };

        } catch (error) {
            // ============================================
            // ERROR HANDLING
            // ============================================
            
            const duration = Date.now() - startTime;
            this.logger.error(
                `Error processing text from user ${userId}: ${error.message}`,
                error.stack
            );

            return {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                success: false,
                message: 'Something went wrong while processing your request. Please try again.',
                data: null,
            };
        }
    }

    /**
     * Sanitize user input to remove potentially harmful characters
     * @param input - Raw user input
     * @returns Sanitized input
     */
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

    /**
     * Confirm and persist processed data to database
     * Called after user confirms the parsed result
     * 
     * @param req - Request object containing user info
     * @param confirmDto - DTO containing the processed data to persist
     * @returns Success message with saved IDs
     */
    @Post('confirm')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard('jwt'))
    async confirmAndPersist(
        @Request() req: any,
        @Body() confirmDto: { data?: any; parsedData?: any },
    ): Promise<ApiResponse<any>> {
        const userId = req.user?.userId;

        try {
            const parsedData = confirmDto.parsedData ?? confirmDto.data;

            // Validate data exists
            if (!parsedData) {
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    success: false,
                    message: 'No data provided for persistence',
                    data: null,
                };
            }

            // Persist to database using the service
            const result = await this.textProcessingService.persistToDatabase(
                parsedData,
                userId,
            );

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
                `Error persisting data for user ${userId}: ${error.message}`,
                error.stack
            );

            return {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                success: false,
                message: 'Failed to save data. Please try again.',
                data: null,
            };
        }
    }
}
