import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AiRateLimitService } from './ai-rate-limit.service';
import { AiPersistenceService } from './ai-persistence.service';
import { TextProcessingService } from './text-processing.service';
import { ProcessTextResponseDto } from '../dto/process-text-response.dto';

type ExistingContext = {
  storages?: Array<{ id?: string; name?: string; description?: string | null }>;
  boxes?: Array<{ id?: string; name?: string; storageId?: string }>;
  items?: Array<{ id?: string; name?: string; quantity?: number; boxId?: string }>;
} | null | undefined;

type LlmProviderConfig = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
  providerName: string;
  temperature: number;
};

@Injectable()
export class ImageProcessingService {
  private readonly logger = new Logger(ImageProcessingService.name);
  private readonly llmProviderConfig: LlmProviderConfig = {
    apiKey: process.env.VISION_API_KEY || process.env.GEMINI_API_KEY || '',
    baseUrl: process.env.VISION_BASE_URL || process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/models',
    modelName: process.env.VISION_MODEL || process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    providerName: process.env.VISION_PROVIDER || 'google',
    temperature: 0.1,
  };

  constructor(
    private readonly aiRateLimitService: AiRateLimitService,
    private readonly aiPersistenceService: AiPersistenceService,
    private readonly textProcessingService: TextProcessingService,
  ) {}

  async processImageRequest(userId: string, file?: Express.Multer.File): Promise<ProcessTextResponseDto> {
    const startTime = Date.now();

    if (!file) {
      throw new BadRequestException('Please provide an image before saving.');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('The uploaded file must be an image.');
    }

    if (!this.llmProviderConfig.apiKey) {
      throw new BadRequestException('Vision AI is not configured on the server.');
    }

    const decision = this.aiRateLimitService.consumeLlmFallback(userId);
    if (!decision.allowed) {
      throw new BadRequestException(`Vision AI rate limit reached. Please wait ${decision.retryAfterSeconds} seconds.`);
    }

    let existingContext;
    try {
      existingContext = await this.aiPersistenceService.getExistingContext(userId);
    } catch (error) {
      this.logger.warn(`Failed to fetch context for vision processing: ${(error as Error).message}`);
      existingContext = undefined;
    }

    try {
      const prompt = this.buildVisionPrompt(existingContext);
      const jsonOutput = await this.executeVisionModelCall(prompt, file);
      
      const parsedData = this.normalizeModelOutput(jsonOutput);
      const classified = this.textProcessingService.intentClassification(parsedData, existingContext, 0);
      
      const prepared = this.aiPersistenceService.prepareNormalizedDataForPersistence(
        parsedData,
        classified.expandedBoxes,
      );

      prepared.intent = 'update'; // Image review should let users confirm current quantities for existing items.
      prepared.expandedBoxes = classified.expandedBoxes;
      prepared.suggestions = classified.suggestions;
      prepared.confidence = classified.confidence;
      prepared.meta = {
        workflowSource: 'vision-ai',
        resolvedAt: new Date().toISOString(),
      };
      this.applyExistingItemQuantities(prepared, existingContext);

      const persistenceBlockingMessage = this.aiPersistenceService.validatePersistencePrerequisites(prepared);
      if (persistenceBlockingMessage) {
        throw new BadRequestException(persistenceBlockingMessage);
      }

      prepared.confirmation = this.textProcessingService.generateConfirmationSummary(prepared);

      const duration = Date.now() - startTime;
      
      return {
        parsedData: prepared,
        classified,
        fallbackToLLM: false,
        confidence: prepared.confidence || 1,
        rawInput: 'Image Upload',
        llmBackup: 'Image Upload',
        meta: {
          processedAt: new Date().toISOString(),
          processingTimeMs: duration,
          inputLength: file.size,
        },
      };
    } catch (error) {
      this.logger.error(`Vision processing failed: ${(error as Error).message}`, (error as Error).stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to process the image. Please try a different photo.');
    }
  }

  private buildVisionPrompt(existingContext?: ExistingContext): string {
    const contextStr = this.buildExistingContextSummary(existingContext);

    return [
      'You are a Vision AI for the FyndBox inventory system.',
      'Analyze the provided image and identify all distinct objects.',
      'Ignore any living things like dogs, cats, or people. Only process inanimate objects.',
      "For each object, you must map it into the user's inventory hierarchy: Storage -> Box -> Item.",
      "You must check the user's existing inventory context provided below. If a suitable Storage, Box, or Item already exists, use its exact name.",
      'If it does not exist, invent a logical name for the new Storage, Box, or Item.',
      'Return the data strictly as JSON. Do not include markdown formatting.',
      'JSON Shape: { "storageName": "string", "boxes": [{ "name": "string", "items": [{ "name": "string", "quantity": number, "description": "string" }] }] }',
      'Note: Flatten the items array so it matches the expected downstream format where each item has a boxName.',
      'Correct JSON Shape to return: { "storageName": "string", "boxes": [{ "name": "string" }], "items": [{ "name": "string", "quantity": number, "boxName": "string" }] }',
      `Existing Context: ${contextStr}`,
    ].join('\n');
  }

  private buildExistingContextSummary(existingContext?: ExistingContext): string {
    if (!existingContext) return 'No existing user context available.';
    
    const storageNames = (existingContext.storages || []).map(s => s.name).filter(Boolean);
    const boxNames = (existingContext.boxes || []).map(b => b.name).filter(Boolean);
    const itemNames = (existingContext.items || []).map(i => i.name).filter(Boolean);

    return `Storages: ${storageNames.join(', ')} | Boxes: ${boxNames.join(', ')} | Items: ${itemNames.join(', ')}`;
  }

  private async executeVisionModelCall(prompt: string, file: Express.Multer.File): Promise<any> {
    const url = `${this.llmProviderConfig.baseUrl}/${this.llmProviderConfig.modelName}:generateContent?key=${this.llmProviderConfig.apiKey}`;
    
    const base64Data = file.buffer.toString('base64');
    
    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: file.mimetype,
                data: base64Data,
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: this.llmProviderConfig.temperature,
        responseMimeType: 'application/json',
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Vision API error ${response.status}: ${errText}`);
    }

    const payload = await response.json();
    const responseText = payload?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    const cleanedText = responseText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    
    return JSON.parse(cleanedText);
  }

  private normalizeModelOutput(payload: any): any {
    const boxes = (payload.boxes || []).map((b: any, index: number) => ({
      clientRef: `vision-box-${index}`,
      name: b.name || 'Unsorted',
    }));

    const items = (payload.items || []).map((i: any) => {
      const box = boxes.find((b: any) => b.name === i.boxName) || boxes[0];
      return {
        name: i.name,
        quantity: i.quantity || 1,
        description: i.description || null,
        boxClientRef: box ? box.clientRef : null,
      };
    });

    return {
      intent: 'update',
      storageName: payload.storageName || 'Vision Storage',
      boxes,
      items,
      confidence: 0.9,
    };
  }

  private applyExistingItemQuantities(
    normalizedData: any,
    existingContext?: ExistingContext,
  ): void {
    if (!existingContext?.boxes?.length || !existingContext?.items?.length) {
      return;
    }

    const storageName = typeof normalizedData?.storageName === 'string'
      ? normalizedData.storageName
      : null;
    const matchedStorage = storageName
      ? (existingContext.storages || []).find(
          (storage) =>
            this.normalizeLookupName(storage?.name) ===
            this.normalizeLookupName(storageName),
        )
      : null;

    const scopedBoxes = matchedStorage?.id
      ? (existingContext.boxes || []).filter(
          (box) => box?.storageId === matchedStorage.id,
        )
      : (existingContext.boxes || []);

    normalizedData.items = (normalizedData.items || []).map((item: any) => {
      const targetBoxName = this.getBoxNameForItem(normalizedData, item.boxClientRef);
      const matchedBox = targetBoxName
        ? scopedBoxes.find(
            (box) =>
              this.normalizeLookupName(box?.name) ===
              this.normalizeLookupName(targetBoxName),
          )
        : null;

      const existingItem = matchedBox
        ? (existingContext.items || []).find(
            (candidate) =>
              candidate?.boxId === matchedBox.id &&
              this.normalizeLookupName(candidate?.name) ===
                this.normalizeLookupName(item?.name),
          )
        : null;

      const detectedQuantity = item?.quantity || 1;
      if (!existingItem) {
        return {
          ...item,
          detectedQuantity,
          explicitQuantity: true,
        };
      }

      const currentQuantity = existingItem.quantity ?? 0;
      return {
        ...item,
        currentQuantity,
        detectedQuantity,
        explicitQuantity: true,
        quantity: currentQuantity,
      };
    });
  }

  private getBoxNameForItem(
    normalizedData: any,
    boxClientRef?: string | null,
  ): string | null {
    if (!boxClientRef) {
      return null;
    }

    const box = normalizedData.boxes?.find(
      (entry: any) => entry.clientRef === boxClientRef,
    );
    return box?.name ?? null;
  }

  private normalizeLookupName(value: string | null | undefined): string {
    return (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }
}
