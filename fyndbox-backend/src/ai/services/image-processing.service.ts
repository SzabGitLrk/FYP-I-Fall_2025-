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
      
      // Validate that the image contains specific items
      if (jsonOutput.hasSpecificItems === false) {
        const reason = jsonOutput.reason || 'This image does not contain specific items that can be stored in your inventory.';
        throw new BadRequestException(
          `Unable to process this image. ${reason} Please upload an image with specific items like tools, books, electronics, or other storable objects.`
        );
      }
      
      // Validate maximum 5 different boxes
      const itemCount = (jsonOutput.items || []).length;
      const uniqueBoxNames = new Set((jsonOutput.items || []).map((item: any) => item.boxName).filter(Boolean));
      const boxCount = uniqueBoxNames.size;
      
      if (boxCount > 5) {
        throw new BadRequestException(
          `This image contains items from too many different boxes (${boxCount} boxes detected). Please upload an image with items from 5 or fewer boxes for better organization. Try grouping related items together or splitting across multiple images.`
        );
      }
      
      // Validate that items array is not empty
      if (itemCount === 0) {
        this.logger.warn('Vision AI returned no items despite hasSpecificItems being true');
        throw new BadRequestException(
          'Unable to identify specific items in this image. Please try taking a clearer photo with better lighting and ensure items are clearly visible.'
        );
      }
      
      this.logger.debug(`Processing ${itemCount} items from ${boxCount} boxes`);
      
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
      'CRITICAL VALIDATION RULES:',
      '1. Ignore any living things like dogs, cats, people, or animals. Only process inanimate objects.',
      '2. Ignore generic scenes like buildings, sky, grass, earth, landscapes, nature, or empty spaces.',
      '3. Only process images that contain SPECIFIC, IDENTIFIABLE, STORABLE ITEMS (e.g., tools, books, electronics, furniture, clothing, food items, etc.).',
      '4. If the image contains ONLY people, animals, generic scenery, or no specific items, set "hasSpecificItems" to false.',
      '5. MAXIMUM 5 BOXES: Items should belong to maximum 5 different boxes. If items belong to more than 5 boxes, set "hasSpecificItems" to false with reason "too many boxes".',
      '6. You can identify any number of items as long as they belong to 5 or fewer boxes.',
      '',
      'IMPORTANT: You MUST identify and return ITEMS in the image. Each item must be listed in the items array.',
      '',
      "For each valid object, you must map it into the user's inventory hierarchy: Storage -> Box -> Item.",
      "- Storage: The location where items are stored (e.g., 'Kitchen', 'Garage', 'Office')",
      "- Box: A container or category within the storage (e.g., 'Appliances', 'Tools', 'Electronics')",
      "- Items: The actual objects you see in the image (e.g., 'Coffee Maker', 'Hammer', 'Laptop')",
      '',
      "You must check the user's existing inventory context provided below. If a suitable Storage, Box, or Item already exists, use its exact name.",
      'If it does not exist, invent a logical name for the new Storage, Box, or Item.',
      '',
      'REQUIRED OUTPUT FORMAT:',
      'Return the data strictly as JSON. Do not include markdown formatting.',
      'JSON Shape: { "hasSpecificItems": boolean, "reason": "string (only if hasSpecificItems is false)", "storageName": "string", "boxes": [{ "name": "string" }], "items": [{ "name": "string", "quantity": number, "boxName": "string" }] }',
      '',
      'EXAMPLE OUTPUT:',
      '{ "hasSpecificItems": true, "storageName": "Kitchen", "boxes": [{ "name": "Appliances" }], "items": [{ "name": "Coffee Maker", "quantity": 1, "boxName": "Appliances" }, { "name": "Toaster", "quantity": 1, "boxName": "Appliances" }] }',
      '',
      'IMPORTANT: Each item MUST have a boxName that matches one of the box names in the boxes array.',
      '',
      'If hasSpecificItems is false, provide a user-friendly reason explaining why (e.g., "This image only contains a person" or "This image shows a building without specific items" or "This image contains items from more than 5 boxes").',
      '',
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
    // If the AI determined there are no specific items, this should have been caught earlier
    // but we add a safety check here as well
    if (payload.hasSpecificItems === false) {
      throw new BadRequestException(
        payload.reason || 'This image does not contain specific items that can be stored.'
      );
    }

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
