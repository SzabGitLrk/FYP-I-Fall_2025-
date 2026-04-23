import { Injectable, Logger } from '@nestjs/common';
import { AiRateLimitService } from './ai-rate-limit.service';

type ExistingContext = {
    storages?: Array<{ id?: string; name?: string; description?: string | null }>;
    boxes?: Array<{ id?: string; name?: string; storageId?: string }>;
    items?: Array<{ id?: string; name?: string; quantity?: number; boxId?: string }>;
} | null | undefined;

type LlmFallbackRequest = {
    rawInput: string;
    llmBackup: string;
    identityKey?: string;
    existingContext?: ExistingContext;
    classified?: any;
};

type LlmFallbackResult = {
    success: boolean;
    message: string;
    parsedData: any | null;
    classified: any | null;
    confidence: number | null;
    rateLimited?: boolean;
    retryAfterSeconds?: number;
    rawResponse?: any;
};

type StructuredFallbackPayload = {
    intent?: string | null;
    storageName?: string | null;
    storageDescription?: string | null;
    boxName?: string | null;
    boxDescription?: string | null;
    boxQuantity?: number | null;
    boxes?: Array<{
        name?: string | null;
        description?: string | null;
        quantity?: number | null;
    }>;
    items?: Array<{
        name?: string | null;
        description?: string | null;
        quantity?: number | null;
        boxName?: string | null;
        replicatePerExpandedBox?: boolean | null;
    }>;
    expandedBoxes?: Array<{
        originalName?: string | null;
        normalizedOriginalName?: string | null;
        expandedNames?: string[];
    }> | null;
    confirmation?: string | null;
    suggestions?: string[];
    ambiguous?: boolean;
    confidence?: number | null;
    meta?: {
        mappingStrategy?: 'direct' | 'sequential';
    } | null;
};

type LlmProviderConfig = {
    apiKey: string;
    baseUrl: string;
    modelName: string;
    providerName: string;
    responseMimeType: string;
    temperature: number;
    thinkingBudget: number;
};

@Injectable()
export class LlmFallbackService {
    private readonly logger = new Logger(LlmFallbackService.name);
    // Keep provider settings centralized so model swaps do not require flow changes.
    private readonly llmProviderConfig: LlmProviderConfig = {
        apiKey: process.env.LLM_FALLBACK_API_KEY
            || process.env.GEMINI_API_KEY
            || '',
        baseUrl: process.env.LLM_FALLBACK_BASE_URL
            || 'https://generativelanguage.googleapis.com/v1beta/models',
        modelName: process.env.LLM_FALLBACK_MODEL
            || process.env.GEMINI_MODEL
            || 'gemini-2.5-flash',
        providerName: process.env.LLM_FALLBACK_PROVIDER || 'google',
        responseMimeType: 'application/json',
        temperature: 0.1,
        // Gemini 2.5 Flash spends tokens on hidden thinking by default, which can truncate JSON output.
        thinkingBudget: Number(process.env.LLM_FALLBACK_THINKING_BUDGET || '0'),
    };
    private readonly fallbackConfirmationMessage =
        'LLM fallback resolved this request. Please review the generated details before saving.';

    constructor(
        private readonly aiRateLimitService: AiRateLimitService,
    ) {}

    // Public entry point for rule-engine fallbacks.
    async resolveTextFallback(request: LlmFallbackRequest): Promise<LlmFallbackResult> {
        if (!this.llmProviderConfig.apiKey) {
            return {
                success: false,
                message: 'LLM fallback is not configured.',
                parsedData: null,
                classified: null,
                confidence: null,
            };
        }

        const identityKey = request.identityKey || 'anonymous';
        const decision = this.aiRateLimitService.consumeLlmFallback(identityKey);

        if (!decision.allowed) {
            return {
                success: false,
                message: `LLM fallback limit reached. Please wait ${decision.retryAfterSeconds} seconds before trying again.`,
                parsedData: null,
                classified: null,
                confidence: null,
                rateLimited: true,
                retryAfterSeconds: decision.retryAfterSeconds,
            };
        }

        // Reserve the configured response budget before the outbound model call.
        const prompt = this.buildStructuredFallbackPrompt(request);
        const tokenDecision = this.aiRateLimitService.consumeLlmTokenBudget(
            identityKey,
            this.aiRateLimitService.getLlmMaxTokensPerRequest(),
        );

        if (!tokenDecision.allowed) {
            return {
                success: false,
                message: `LLM fallback token budget reached. Please wait ${tokenDecision.retryAfterSeconds} seconds before trying again.`,
                parsedData: null,
                classified: null,
                confidence: null,
                rateLimited: true,
                retryAfterSeconds: tokenDecision.retryAfterSeconds,
            };
        }

        try {
            const payload = await this.runStructuredFallbackChain(prompt);
            const fallbackOutput = await this.buildPersistableFallbackOutput(
                payload,
                request,
                identityKey,
            );
            const parsedData = fallbackOutput.parsedData;

            if (!this.hasPersistableData(parsedData)) {
                return {
                    success: false,
                    message: 'LLM fallback could not extract enough structured data to save.',
                    parsedData: null,
                    classified: null,
                    confidence: fallbackOutput.payload.confidence ?? null,
                    rawResponse: fallbackOutput.payload,
                };
            }

            const classified = this.buildFallbackClassification(parsedData, request.classified);

            return {
                success: true,
                message: parsedData.confirmation || this.fallbackConfirmationMessage,
                parsedData,
                classified,
                confidence: parsedData.confidence ?? classified.confidence ?? null,
                rawResponse: fallbackOutput.payload,
            };
        } catch (error) {
            const fallbackErrorMessage = this.buildFallbackErrorMessage(error);
            this.logger.error(
                `${this.llmProviderConfig.providerName} fallback failed: ${(error as Error).message}`,
                (error as Error).stack,
            );

            return {
                success: false,
                message: fallbackErrorMessage,
                parsedData: null,
                classified: null,
                confidence: null,
            };
        }
    }

    private async buildPersistableFallbackOutput(
        initialPayload: StructuredFallbackPayload,
        request: LlmFallbackRequest,
        identityKey: string,
    ): Promise<{ parsedData: any | null; payload: StructuredFallbackPayload }> {
        const initialParsedData = this.normalizeStructuredPayload(
            initialPayload,
            request.classified,
        );

        if (this.hasPersistableData(initialParsedData)) {
            return {
                parsedData: initialParsedData,
                payload: initialPayload,
            };
        }

        this.logger.warn(
            'Initial LLM payload lacked persistable structure, attempting one repair pass.',
        );

        const repairedPayload = await this.attemptStructuredPayloadRepair(
            request,
            initialPayload,
            identityKey,
        );

        if (!repairedPayload) {
            return {
                parsedData: null,
                payload: initialPayload,
            };
        }

        const repairedParsedData = this.normalizeStructuredPayload(
            repairedPayload,
            request.classified,
        );

        if (this.hasPersistableData(repairedParsedData)) {
            return {
                parsedData: repairedParsedData,
                payload: repairedPayload,
            };
        }

        return {
            parsedData: null,
            payload: repairedPayload,
        };
    }

    private async attemptStructuredPayloadRepair(
        request: LlmFallbackRequest,
        initialPayload: StructuredFallbackPayload,
        identityKey: string,
    ): Promise<StructuredFallbackPayload | null> {
        const tokenDecision = this.aiRateLimitService.consumeLlmTokenBudget(
            identityKey,
            this.aiRateLimitService.getLlmMaxTokensPerRequest(),
        );

        if (!tokenDecision.allowed) {
            this.logger.warn(
                'Skipping LLM repair pass because the token budget is exhausted.',
            );
            return null;
        }

        try {
            return await this.runStructuredFallbackChain(
                this.buildStructuredRepairPrompt(request, initialPayload),
            );
        } catch (error) {
            this.logger.warn(
                `Repair pass failed after insufficient structure. ${(error as Error).message}`,
            );
            return null;
        }
    }

    // Run the prompt -> model call -> JSON parse chain in one place.
    private async runStructuredFallbackChain(prompt: string): Promise<StructuredFallbackPayload> {
        try {
            // First try strict JSON mode for the cleanest machine-readable response.
            const modelResponse = await this.executeStructuredModelCall(
                prompt,
                this.llmProviderConfig.responseMimeType,
            );
            return this.parseStructuredModelOutput(modelResponse);
        } catch (error) {
            this.logger.warn(
                `Structured JSON mode failed, retrying plain text parsing. ${(error as Error).message}`,
            );

            // Some provider/model combinations are more stable with plain text + manual JSON parsing.
            const retryResponse = await this.executeStructuredModelCall(prompt, 'text/plain');
            return this.parseStructuredModelOutput(retryResponse);
        }
    }

    private async executeStructuredModelCall(
        prompt: string,
        responseMimeType: string,
    ): Promise<any> {
        const response = await fetch(
            this.buildModelRequestUrl(),
            {
                method: 'POST',
                headers: this.buildModelRequestHeaders(),
                body: JSON.stringify(this.buildModelRequestBody(prompt, responseMimeType)),
            },
        );

        if (!response.ok) {
            const responseBody = await response.text();
            throw new Error(`${this.llmProviderConfig.providerName} API error ${response.status}: ${responseBody}`);
        }

        return response.json();
    }

    private buildStructuredFallbackPrompt(request: LlmFallbackRequest): string {
        const context = this.buildExistingContextSummary(request.existingContext);
        const previousIntent = request.classified?.intent ?? 'unknown';

        return [
            'You are the structured JSON fallback parser for the FyndBox smart-add workflow.',
            'Convert the user instruction into a strict JSON object only. Do not include markdown or commentary.',
            'Use only these intent values: "create", "increment", "decrement", "update", or null.',
            'Return data that can be persisted into storage -> boxes -> items.',
            'Never invent unsupported fields, markdown, or prose outside the JSON response.',
            'Prefer null over guessing when a field is truly missing.',
            'If an item belongs to a box, put that box name inside item.boxName.',
            'In retail or bookstore requests, named sections or departments like "comic section", "book section", or "fiction section" should usually be treated as boxes inside the storage/store.',
            'If the user creates a store and says they can put a category there, infer that category or section as the box when it is clearly the container for later items.',
            'If the user describes repeated numbered boxes, return expandedBoxes with expandedNames and set meta.mappingStrategy to "sequential".',
            'Keep quantities as positive integers.',
            'If you make an assumption, mention it briefly inside confirmation.',
            'If you are unsure, still return the best structured guess, keep ambiguous=true, and add a short confirmation message.',
            'JSON shape:',
            JSON.stringify(this.buildStructuredResponseShape(), null, 2),
            `Previous rule-based intent guess: ${previousIntent}`,
            `User input: ${request.rawInput}`,
            `Normalized backup: ${request.llmBackup}`,
            `Existing context summary: ${context}`,
        ].join('\n');
    }

    private buildStructuredRepairPrompt(
        request: LlmFallbackRequest,
        initialPayload: StructuredFallbackPayload,
    ): string {
        const context = this.buildExistingContextSummary(request.existingContext);

        return [
            'You are repairing a failed structured JSON extraction for the FyndBox smart-add workflow.',
            'The previous model response did not include enough persistable structure.',
            'Return strict JSON only. Do not include markdown or commentary.',
            'Recover as much concrete structure as possible from the original instruction and the previous JSON.',
            'For retail or bookstore requests, map named sections or departments like "comic section", "book section", or "fiction section" to boxes inside the storage/store.',
            'If the instruction implies repeated numbered boxes, return explicit boxes entries and expandedBoxes.',
            'If items belong in every expanded box, either duplicate the item with explicit boxName values or set replicatePerExpandedBox=true.',
            'Do not return empty boxes and items arrays when the user clearly named containers or items.',
            'JSON shape:',
            JSON.stringify(this.buildStructuredResponseShape(), null, 2),
            `Original user input: ${request.rawInput}`,
            `Normalized backup: ${request.llmBackup}`,
            `Existing context summary: ${context}`,
            'Previous insufficient JSON:',
            JSON.stringify(initialPayload, null, 2),
        ].join('\n');
    }

    private buildStructuredResponseShape(): Record<string, unknown> {
        return {
            intent: 'create | increment | decrement | update | null',
            storageName: 'string | null',
            storageDescription: 'string | null',
            boxName: 'string | null',
            boxDescription: 'string | null',
            boxQuantity: 'number | null',
            boxes: [
                {
                    name: 'string',
                    description: 'string | null',
                    quantity: 'number | null',
                },
            ],
            items: [
                {
                    name: 'string',
                    description: 'string | null',
                    quantity: 'number | null',
                    boxName: 'string | null',
                    replicatePerExpandedBox: 'boolean | null',
                },
            ],
            expandedBoxes: [
                {
                    originalName: 'string',
                    normalizedOriginalName: 'string | null',
                    expandedNames: ['string'],
                },
            ],
            confirmation: 'string | null',
            suggestions: ['string'],
            ambiguous: false,
            confidence: 0.0,
            meta: {
                mappingStrategy: 'direct | sequential',
            },
        };
    }

    private buildModelRequestUrl(): string {
        return `${this.llmProviderConfig.baseUrl}/${this.llmProviderConfig.modelName}:generateContent?key=${this.llmProviderConfig.apiKey}`;
    }

    private buildModelRequestHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Google supports x-goog-api-key and it avoids putting secrets into request logs.
        if (this.llmProviderConfig.providerName.toLowerCase() === 'google') {
            headers['x-goog-api-key'] = this.llmProviderConfig.apiKey;
        }

        return headers;
    }

    private buildModelRequestBody(prompt: string, responseMimeType: string): Record<string, unknown> {
        return {
            contents: [
                {
                    parts: [
                        {
                            text: prompt,
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: this.llmProviderConfig.temperature,
                // Cap model output so fallback responses stay small and predictable in cost.
                maxOutputTokens: this.aiRateLimitService.getLlmMaxTokensPerRequest(),
                responseMimeType,
                // Force deterministic structured output instead of letting hidden reasoning consume the token budget.
                thinkingConfig: {
                    thinkingBudget: this.llmProviderConfig.thinkingBudget,
                },
            },
        };
    }

    private buildExistingContextSummary(existingContext?: ExistingContext): string {
        if (!existingContext) {
            return 'No existing user context was available.';
        }

        const storageNames = (existingContext.storages || [])
            .map((entry) => entry.name)
            .filter((entry): entry is string => !!entry)
            .slice(0, 10);
        const boxNames = (existingContext.boxes || [])
            .map((entry) => entry.name)
            .filter((entry): entry is string => !!entry)
            .slice(0, 15);
        const itemNames = (existingContext.items || [])
            .map((entry) => entry.name)
            .filter((entry): entry is string => !!entry)
            .slice(0, 20);

        return [
            `storages=${storageNames.length ? storageNames.join(', ') : 'none'}`,
            `boxes=${boxNames.length ? boxNames.join(', ') : 'none'}`,
            `items=${itemNames.length ? itemNames.join(', ') : 'none'}`,
        ].join(' | ');
    }

    private parseStructuredModelOutput(payload: any): StructuredFallbackPayload {
        const responseText = this.extractModelResponseText(payload);

        if (!responseText) {
            throw new Error(`${this.llmProviderConfig.providerName} returned an empty response.`);
        }

        return this.parseModelJson(responseText);
    }

    private extractModelResponseText(payload: any): string {
        return payload?.candidates?.[0]?.content?.parts
            ?.map((part: any) => part?.text || '')
            .join('')
            .trim();
    }

    private parseModelJson(responseText: string): StructuredFallbackPayload {
        const cleanedResponse = responseText
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/\s*```$/i, '')
            .trim();

        return JSON.parse(cleanedResponse) as StructuredFallbackPayload;
    }

    private normalizeStructuredPayload(payload: StructuredFallbackPayload, existingClassification?: any): any {
        const normalizedBoxes = this.normalizeBoxes(payload);
        const normalizedExpandedBoxes = this.normalizeExpandedBoxes(payload, normalizedBoxes);
        const normalizedItems = this.normalizeItems(payload, normalizedBoxes);
        const normalizedIntent = this.normalizeIntent(payload.intent, existingClassification?.intent);

        // Return workflow-shaped data so rule-based and LLM flows share the same downstream validation/prep path.
        return {
            ambiguous: Boolean(payload.ambiguous),
            boxDescription: this.toOptionalString(payload.boxDescription),
            boxName: this.toOptionalString(payload.boxName ?? normalizedBoxes[0]?.name ?? null),
            boxQuantity: this.toNullableQuantity(payload.boxQuantity),
            boxes: normalizedBoxes,
            confidence: this.normalizeConfidence(payload.confidence, existingClassification?.confidence),
            confirmation: this.toOptionalString(payload.confirmation) || this.fallbackConfirmationMessage,
            expandedBoxes: normalizedExpandedBoxes,
            extractedWordCount: 1,
            intent: normalizedIntent,
            items: normalizedItems,
            meta: {
                mappingStrategy: normalizedExpandedBoxes?.length ? 'sequential' : (payload.meta?.mappingStrategy || 'direct'),
                resolutionSource: 'llm-fallback',
                fallbackModel: this.llmProviderConfig.modelName,
                resolvedAt: new Date().toISOString(),
            },
            rawIntents: normalizedIntent ? [normalizedIntent] : [],
            storageDescription: this.toOptionalString(payload.storageDescription),
            storageName: this.toOptionalString(payload.storageName),
            suggestions: Array.isArray(payload.suggestions) ? payload.suggestions.filter(Boolean) : [],
            totalWords: 1,
        };
    }

    private normalizeBoxes(payload: StructuredFallbackPayload): Array<{
        clientRef: string;
        description: string | null;
        name: string;
        quantity: number | null;
    }> {
        const rawBoxes = Array.isArray(payload.boxes) ? payload.boxes : [];
        const baseBoxes = rawBoxes
            .map((box, index) => ({
                clientRef: `llm-box-${index + 1}`,
                description: this.toOptionalString(box.description),
                name: this.toOptionalString(box.name),
                quantity: this.toNullableQuantity(box.quantity),
            }))
            .filter((box): box is {
                clientRef: string;
                description: string | null;
                name: string;
                quantity: number | null;
            } => Boolean(box.name));

        if (baseBoxes.length > 0) {
            return baseBoxes;
        }

        // Some responses only describe expanded boxes; turn those into concrete boxes directly.
        const expandedNameBoxes = this.deriveBoxesFromExpandedNames(payload);
        if (expandedNameBoxes.length > 0) {
            return expandedNameBoxes;
        }

        // Some responses attach box names only on items; recover those boxes so persistence still works.
        const itemReferencedBoxes = this.deriveBoxesFromItemBoxNames(payload);
        if (itemReferencedBoxes.length > 0) {
            return itemReferencedBoxes;
        }

        const fallbackBoxName = this.toOptionalString(payload.boxName);
        if (!fallbackBoxName) {
            return [];
        }

        return [
            {
                clientRef: 'llm-box-1',
                description: this.toOptionalString(payload.boxDescription),
                name: fallbackBoxName,
                quantity: this.toNullableQuantity(payload.boxQuantity),
            },
        ];
    }

    private deriveBoxesFromExpandedNames(payload: StructuredFallbackPayload): Array<{
        clientRef: string;
        description: string | null;
        name: string;
        quantity: number | null;
    }> {
        const derivedBoxes: Array<{
            clientRef: string;
            description: string | null;
            name: string;
            quantity: number | null;
        }> = [];
        let boxIndex = 1;

        (Array.isArray(payload.expandedBoxes) ? payload.expandedBoxes : []).forEach((entry) => {
            (Array.isArray(entry.expandedNames) ? entry.expandedNames : []).forEach((expandedName) => {
                const cleanedName = this.toOptionalString(expandedName);
                if (!cleanedName) {
                    return;
                }

                derivedBoxes.push({
                    clientRef: `llm-box-${boxIndex++}`,
                    description: this.toOptionalString(payload.boxDescription),
                    name: cleanedName,
                    quantity: null,
                });
            });
        });

        return derivedBoxes;
    }

    private deriveBoxesFromItemBoxNames(payload: StructuredFallbackPayload): Array<{
        clientRef: string;
        description: string | null;
        name: string;
        quantity: number | null;
    }> {
        const seenKeys = new Set<string>();
        const derivedBoxes: Array<{
            clientRef: string;
            description: string | null;
            name: string;
            quantity: number | null;
        }> = [];

        (Array.isArray(payload.items) ? payload.items : []).forEach((item) => {
            const boxName = this.toOptionalString(item.boxName);
            if (!boxName) {
                return;
            }

            const lookupKey = this.normalizeLookupKey(boxName);
            if (seenKeys.has(lookupKey)) {
                return;
            }

            seenKeys.add(lookupKey);
            derivedBoxes.push({
                clientRef: `llm-box-${derivedBoxes.length + 1}`,
                description: null,
                name: boxName,
                quantity: null,
            });
        });

        return derivedBoxes;
    }

    private normalizeExpandedBoxes(
        payload: StructuredFallbackPayload,
        normalizedBoxes: Array<{ name: string }>,
    ): Array<{ originalName: string; normalizedOriginalName?: string; expandedNames: string[] }> | null {
        if (Array.isArray(payload.expandedBoxes) && payload.expandedBoxes.length > 0) {
            const cleaned: Array<{
                expandedNames: string[];
                normalizedOriginalName?: string;
                originalName: string;
            }> = [];

            payload.expandedBoxes.forEach((entry) => {
                const originalName = this.toOptionalString(entry.originalName);
                const normalizedOriginalName = this.toOptionalString(entry.normalizedOriginalName) || undefined;
                const expandedNames = Array.isArray(entry.expandedNames)
                    ? entry.expandedNames
                        .map((name) => this.toOptionalString(name))
                        .filter((name): name is string => Boolean(name))
                    : [];

                if (!originalName || expandedNames.length <= 1) {
                    return;
                }

                cleaned.push({
                    expandedNames,
                    normalizedOriginalName,
                    originalName,
                });
            });

            return cleaned.length > 0 ? cleaned : null;
        }

        const derived = normalizedBoxes
            .filter((box) => (box as any).quantity && (box as any).quantity! > 1)
            .map((box: any) => ({
                originalName: box.name,
                expandedNames: Array.from(
                    { length: box.quantity },
                    (_, index) => `${box.name} ${index + 1}`,
                ),
            }));

        return derived.length > 0 ? derived : null;
    }

    private normalizeItems(
        payload: StructuredFallbackPayload,
        boxes: Array<{ clientRef: string; name: string }>,
    ): Array<{
        boxClientRef: string | null;
        description: string | null;
        name: string;
        orphaned?: boolean;
        quantity: number;
        replicatePerExpandedBox?: boolean;
    }> {
        const boxRefByName = new Map(
            boxes.map((box) => [this.normalizeLookupKey(box.name), box.clientRef]),
        );
        const expandedFamilyRefs = this.buildExpandedFamilyRefMap(payload, boxes);

        const normalizedItems: Array<{
            boxClientRef: string | null;
            description: string | null;
            name: string;
            orphaned?: boolean;
            quantity: number;
            replicatePerExpandedBox?: boolean;
        }> = [];

        (Array.isArray(payload.items) ? payload.items : []).forEach((item) => {
            const itemName = this.toOptionalString(item.name);
            if (!itemName) {
                return;
            }

            const explicitBoxName = this.toOptionalString(item.boxName ?? payload.boxName);
            const lookupKey = explicitBoxName
                ? this.normalizeLookupKey(explicitBoxName)
                : null;
            const directBoxClientRef = lookupKey
                ? boxRefByName.get(lookupKey) || null
                : null;
            const familyRefs = lookupKey
                ? expandedFamilyRefs.get(lookupKey) || []
                : [];
            const baseItem = {
                description: this.toOptionalString(item.description),
                name: itemName,
                quantity: this.toNullableQuantity(item.quantity) ?? 1,
                replicatePerExpandedBox: Boolean(item.replicatePerExpandedBox),
            };

            if (directBoxClientRef) {
                normalizedItems.push({
                    ...baseItem,
                    boxClientRef: directBoxClientRef,
                    orphaned: false,
                });
                return;
            }

            if (familyRefs.length > 0) {
                if (item.replicatePerExpandedBox || familyRefs.length === 1) {
                    familyRefs.forEach((boxClientRef) => {
                        normalizedItems.push({
                            ...baseItem,
                            boxClientRef,
                            orphaned: false,
                        });
                    });
                    return;
                }

                normalizedItems.push({
                    ...baseItem,
                    boxClientRef: familyRefs[0],
                    orphaned: false,
                });
                return;
            }

            // When the model omits explicit box names but marks "in each", spread the item to all boxes.
            if (!explicitBoxName && item.replicatePerExpandedBox && boxes.length > 1) {
                boxes.forEach((box) => {
                    normalizedItems.push({
                        ...baseItem,
                        boxClientRef: box.clientRef,
                        orphaned: false,
                    });
                });
                return;
            }

            const fallbackBoxClientRef = boxes[0]?.clientRef || null;
            normalizedItems.push({
                ...baseItem,
                boxClientRef: fallbackBoxClientRef,
                orphaned: !fallbackBoxClientRef,
            });
        });

        return normalizedItems.filter((item): item is {
            boxClientRef: string | null;
            description: string | null;
            name: string;
            orphaned?: boolean;
            quantity: number;
            replicatePerExpandedBox?: boolean;
        } => Boolean(item.name));
    }

    private buildExpandedFamilyRefMap(
        payload: StructuredFallbackPayload,
        boxes: Array<{ clientRef: string; name: string }>,
    ): Map<string, string[]> {
        const boxRefByName = new Map(
            boxes.map((box) => [this.normalizeLookupKey(box.name), box.clientRef]),
        );
        const familyRefs = new Map<string, string[]>();

        (Array.isArray(payload.expandedBoxes) ? payload.expandedBoxes : []).forEach((entry) => {
            const expandedRefs = (Array.isArray(entry.expandedNames) ? entry.expandedNames : [])
                .map((expandedName) => this.toOptionalString(expandedName))
                .filter((expandedName): expandedName is string => Boolean(expandedName))
                .map((expandedName) => boxRefByName.get(this.normalizeLookupKey(expandedName)))
                .filter((boxClientRef): boxClientRef is string => Boolean(boxClientRef));

            if (expandedRefs.length === 0) {
                return;
            }

            const originalName = this.toOptionalString(entry.originalName);
            if (originalName) {
                familyRefs.set(this.normalizeLookupKey(originalName), expandedRefs);
            }

            const normalizedOriginalName = this.toOptionalString(entry.normalizedOriginalName);
            if (normalizedOriginalName) {
                familyRefs.set(this.normalizeLookupKey(normalizedOriginalName), expandedRefs);
            }
        });

        return familyRefs;
    }

    private buildFallbackClassification(parsedData: any, existingClassification?: any): any {
        return {
            clarification: parsedData.confirmation || null,
            clarificationKind: parsedData.ambiguous ? 'review' : null,
            clarificationOptions: [],
            confidence: parsedData.confidence ?? existingClassification?.confidence ?? 0.55,
            expandedBoxes: parsedData.expandedBoxes ?? null,
            intent: parsedData.intent ?? existingClassification?.intent ?? null,
            isValid: true,
            scope: {
                affectsBoxes: (parsedData.boxes || []).length > 0,
                affectsItems: (parsedData.items || []).length > 0,
                affectsStorage: Boolean(parsedData.storageName),
            },
            shouldFallToLLM: false,
            suggestions: parsedData.suggestions ?? [],
        };
    }

    private hasPersistableData(parsedData: any): boolean {
        return Boolean(
            parsedData?.storageName
            || parsedData?.boxName
            || parsedData?.boxes?.length
            || parsedData?.items?.length,
        );
    }

    private getPersistenceBlockingMessage(parsedData: any): string | null {
        const boxes = Array.isArray(parsedData?.boxes) ? parsedData.boxes : [];
        const items = Array.isArray(parsedData?.items) ? parsedData.items : [];

        if ((boxes.length > 0 || items.length > 0) && !parsedData?.storageName) {
            return this.buildMissingStorageMessage(parsedData);
        }

        if (items.length > 0 && boxes.length === 0) {
            return this.buildMissingBoxMessage(parsedData);
        }

        const knownBoxRefs = new Set(
            boxes
                .map((box: any) => this.toOptionalString(box?.clientRef))
                .filter((clientRef: string | null): clientRef is string => Boolean(clientRef)),
        );
        const unmappedItem = items.find((item: any) =>
            item?.boxClientRef && !knownBoxRefs.has(item.boxClientRef),
        );

        if (unmappedItem?.name) {
            return `Please review the generated box assignment for '${this.toTitleCase(unmappedItem.name)}' before saving.`;
        }

        return null;
    }

    private buildMissingStorageMessage(parsedData: any): string {
        const targets = [
            ...(Array.isArray(parsedData?.boxes) ? parsedData.boxes : []).map((box: any) => box?.name),
            ...(Array.isArray(parsedData?.items) ? parsedData.items : []).map((item: any) => item?.name),
        ]
            .map((entry: unknown) => this.toOptionalString(entry))
            .filter((entry: string | null): entry is string => Boolean(entry))
            .map((entry: string) => `'${this.toTitleCase(entry)}'`);

        if (targets.length === 0) {
            return 'Please specify the storage before saving boxes or items.';
        }

        return `Please specify the storage for ${this.joinHumanList(Array.from(new Set(targets)))} before saving.`;
    }

    private buildMissingBoxMessage(parsedData: any): string {
        const itemTargets = (Array.isArray(parsedData?.items) ? parsedData.items : [])
            .map((item: any) => this.toOptionalString(item?.name))
            .filter((entry: string | null): entry is string => Boolean(entry))
            .map((entry: string) => `'${this.toTitleCase(entry)}'`);
        const storageLabel = parsedData?.storageName
            ? ` in storage '${this.toTitleCase(parsedData.storageName)}'`
            : '';

        if (itemTargets.length === 0) {
            return `Please specify a box${storageLabel} before saving items.`;
        }

        return `Please specify a box${storageLabel} for ${this.joinHumanList(Array.from(new Set(itemTargets)))} before saving.`;
    }

    private normalizeIntent(value: string | null | undefined, fallbackIntent?: string | null): string | null {
        const normalizedValue = this.toOptionalString(value)?.toLowerCase();

        if (normalizedValue && ['create', 'increment', 'decrement', 'update'].includes(normalizedValue)) {
            return normalizedValue;
        }

        return fallbackIntent || 'create';
    }

    private normalizeConfidence(value?: number | null, fallbackValue?: number | null): number {
        const candidate = typeof value === 'number' ? value : fallbackValue;
        if (typeof candidate !== 'number' || Number.isNaN(candidate)) {
            return 0.55;
        }

        return Math.max(0, Math.min(candidate, 1));
    }

    private toOptionalString(value: unknown): string | null {
        if (typeof value !== 'string') {
            return null;
        }

        const trimmed = value.trim().replace(/\s+/g, ' ');
        return trimmed.length > 0 ? trimmed : null;
    }

    private toNullableQuantity(value: unknown): number | null {
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
            return Math.floor(value);
        }

        if (typeof value === 'string') {
            const parsed = Number(value);
            if (Number.isFinite(parsed) && parsed > 0) {
                return Math.floor(parsed);
            }
        }

        return null;
    }

    private normalizeLookupKey(value: string): string {
        return value.trim().toLowerCase().replace(/\s+/g, ' ');
    }

    private joinHumanList(values: string[]): string {
        if (values.length <= 1) {
            return values[0] || '';
        }

        if (values.length === 2) {
            return `${values[0]} and ${values[1]}`;
        }

        return `${values.slice(0, -1).join(', ')}, and ${values[values.length - 1]}`;
    }

    private toTitleCase(value: string): string {
        return value.split(/\s+/).map((word) => {
            if (word.length >= 2 && word === word.toUpperCase() && /^[A-Z]+$/.test(word)) {
                return word;
            }
            if (/\d/.test(word)) {
                return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');
    }

    private buildFallbackErrorMessage(error: unknown): string {
        const defaultMessage =
            'LLM fallback is temporarily unavailable. Please review the instruction manually.';

        if (process.env.NODE_ENV === 'production') {
            return defaultMessage;
        }

        const errorMessage = error instanceof Error ? error.message : '';
        return errorMessage
            ? `${defaultMessage} (${errorMessage})`
            : defaultMessage;
    }
}
