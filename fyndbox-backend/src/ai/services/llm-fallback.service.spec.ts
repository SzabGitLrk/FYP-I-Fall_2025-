import { Test, TestingModule } from '@nestjs/testing';
import { AiRateLimitService } from './ai-rate-limit.service';
import { LlmFallbackService } from './llm-fallback.service';

type LlmFallbackServiceSpecContract = LlmFallbackService & {
    resolveTextFallback: (request: {
        rawInput: string;
        llmBackup: string;
        existingContext?: any;
        classified?: any;
    }) => Promise<any>;
};

describe('LlmFallbackService', () => {
    let service: LlmFallbackServiceSpecContract;
    let aiRateLimitService: AiRateLimitService;
    const originalFetch = global.fetch;
    const originalApiKey = process.env.LLM_FALLBACK_API_KEY;
    const originalBaseUrl = process.env.LLM_FALLBACK_BASE_URL;
    const originalModel = process.env.LLM_FALLBACK_MODEL;
    const originalProvider = process.env.LLM_FALLBACK_PROVIDER;
    const originalThinkingBudget = process.env.LLM_FALLBACK_THINKING_BUDGET;
    const originalMaxTokensPerRequest = process.env.AI_LLM_MAX_TOKENS_PER_REQUEST;
    const originalMaxTokensPerMinute = process.env.AI_LLM_MAX_TOKENS_PER_MINUTE;

    beforeEach(async () => {
        process.env.LLM_FALLBACK_API_KEY = 'test-llm-fallback-api-key';
        process.env.LLM_FALLBACK_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
        process.env.LLM_FALLBACK_MODEL = 'gemini-2.5-flash';
        process.env.LLM_FALLBACK_PROVIDER = 'google';
        process.env.LLM_FALLBACK_THINKING_BUDGET = '0';
        process.env.AI_LLM_MAX_TOKENS_PER_REQUEST = '500';
        process.env.AI_LLM_MAX_TOKENS_PER_MINUTE = '5000';

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AiRateLimitService,
                LlmFallbackService,
            ],
        }).compile();

        // Cast to the explicit spec contract so editor caches pick up the public fallback method.
        service = module.get(LlmFallbackService) as LlmFallbackServiceSpecContract;
        aiRateLimitService = module.get(AiRateLimitService);
    });

    afterEach(() => {
        global.fetch = originalFetch;
        process.env.LLM_FALLBACK_API_KEY = originalApiKey;
        process.env.LLM_FALLBACK_BASE_URL = originalBaseUrl;
        process.env.LLM_FALLBACK_MODEL = originalModel;
        process.env.LLM_FALLBACK_PROVIDER = originalProvider;
        process.env.LLM_FALLBACK_THINKING_BUDGET = originalThinkingBudget;
        process.env.AI_LLM_MAX_TOKENS_PER_REQUEST = originalMaxTokensPerRequest;
        process.env.AI_LLM_MAX_TOKENS_PER_MINUTE = originalMaxTokensPerMinute;
        jest.restoreAllMocks();
    });

    it('should normalize Gemini JSON into workflow-ready parsed data', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [
                    {
                        content: {
                            parts: [
                                {
                                    text: JSON.stringify({
                                        intent: 'increment',
                                        storageName: 'garage',
                                        boxes: [
                                            {
                                                name: 'tools',
                                                description: null,
                                                quantity: null,
                                            },
                                        ],
                                        items: [
                                            {
                                                name: 'hammer',
                                                quantity: 2,
                                                boxName: 'tools',
                                            },
                                        ],
                                        confirmation: 'Please review before saving.',
                                        confidence: 0.78,
                                        ambiguous: false,
                                    }),
                                },
                            ],
                        },
                    },
                ],
            }),
        } as any);

        const result = await service.resolveTextFallback({
            rawInput: 'add 2 hammers to tools box in garage',
            llmBackup: 'add 2 hammers to tools box in garage',
        });

        expect(result.success).toBe(true);
        expect(result.parsedData.intent).toBe('increment');
        expect(result.parsedData.storageName).toBe('garage');
        expect(result.parsedData.boxes[0].clientRef).toBe('llm-box-1');
        expect(result.parsedData.items[0].boxClientRef).toBe('llm-box-1');
        expect(result.parsedData.meta.resolutionSource).toBe('llm-fallback');
        expect(result.classified.shouldFallToLLM).toBe(false);
    });

    it('should derive sequential expansions from numbered box quantities', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [
                    {
                        content: {
                            parts: [
                                {
                                    text: JSON.stringify({
                                        intent: 'create',
                                        storageName: 'attic',
                                        boxes: [
                                            {
                                                name: 'winter box',
                                                quantity: 2,
                                            },
                                        ],
                                        items: [
                                            {
                                                name: 'scarf',
                                                quantity: 3,
                                                boxName: 'winter box',
                                                replicatePerExpandedBox: true,
                                            },
                                        ],
                                        confidence: 0.69,
                                    }),
                                },
                            ],
                        },
                    },
                ],
            }),
        } as any);

        const result = await service.resolveTextFallback({
            rawInput: 'create attic with 2 winter boxes each having 3 scarves',
            llmBackup: 'create attic with 2 winter boxes each having 3 scarves',
        });

        expect(result.success).toBe(true);
        expect(result.parsedData.expandedBoxes).toEqual([
            {
                originalName: 'winter box',
                expandedNames: ['winter box 1', 'winter box 2'],
            },
        ]);
        expect(result.parsedData.boxes.map((box: any) => box.name)).toEqual([
            'winter box',
        ]);
        expect(result.parsedData.boxes[0].quantity).toBe(2);
        expect(result.parsedData.items).toHaveLength(1);
        expect(result.parsedData.items[0].replicatePerExpandedBox).toBe(true);
    });

    it('should recover boxes from expandedBoxes when the model omits boxes', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [
                    {
                        content: {
                            parts: [
                                {
                                    text: JSON.stringify({
                                        intent: 'create',
                                        storageName: 'records room',
                                        boxes: [],
                                        items: [
                                            {
                                                name: 'receipt',
                                                quantity: 20,
                                                boxName: 'archive carton',
                                                replicatePerExpandedBox: true,
                                            },
                                        ],
                                        expandedBoxes: [
                                            {
                                                originalName: 'archive cartons',
                                                normalizedOriginalName: 'archive carton',
                                                expandedNames: ['archive carton 1', 'archive carton 2'],
                                            },
                                        ],
                                        confidence: 0.81,
                                    }),
                                },
                            ],
                        },
                    },
                ],
            }),
        } as any);

        const result = await service.resolveTextFallback({
            rawInput: 'register two archive cartons and put twenty receipts in each',
            llmBackup: 'register two archive cartons and put twenty receipts in each',
        });

        expect(result.success).toBe(true);
        expect(result.parsedData.boxes.map((box: any) => box.name)).toEqual([
            'archive carton 1',
            'archive carton 2',
        ]);
        expect(result.parsedData.items).toHaveLength(2);
    });

    it('should recover boxes from item box names when the model omits boxes', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [
                    {
                        content: {
                            parts: [
                                {
                                    text: JSON.stringify({
                                        intent: 'increment',
                                        storageName: 'garage',
                                        boxes: [],
                                        items: [
                                            {
                                                name: 'hammer',
                                                quantity: 2,
                                                boxName: 'tools',
                                            },
                                        ],
                                        confidence: 0.77,
                                    }),
                                },
                            ],
                        },
                    },
                ],
            }),
        } as any);

        const result = await service.resolveTextFallback({
            rawInput: 'add 2 hammers to tools in garage',
            llmBackup: 'add 2 hammers to tools in garage',
        });

        expect(result.success).toBe(true);
        expect(result.parsedData.boxes[0].name).toBe('tools');
        expect(result.parsedData.items[0].boxClientRef).toBe('llm-box-1');
    });

    it('should return extracted data even when storage is missing so shared validation can handle it later', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [
                    {
                        content: {
                            parts: [
                                {
                                    text: JSON.stringify({
                                        intent: 'create',
                                        storageName: null,
                                        boxes: [
                                            { name: 'archive carton 1' },
                                            { name: 'archive carton 2' },
                                        ],
                                        items: [
                                            {
                                                name: 'receipt',
                                                quantity: 20,
                                                boxName: 'archive carton 1',
                                            },
                                            {
                                                name: 'receipt',
                                                quantity: 20,
                                                boxName: 'archive carton 2',
                                            },
                                        ],
                                        confidence: 0.88,
                                    }),
                                },
                            ],
                        },
                    },
                ],
            }),
        } as any);

        const result = await service.resolveTextFallback({
            rawInput: 'Please register two archive cartons for invoices and place twenty receipts in each',
            llmBackup: 'Please register two archive cartons for invoices and place twenty receipts in each',
        });

        expect(result.success).toBe(true);
        expect(result.parsedData.storageName).toBeNull();
        expect(result.parsedData.boxes).toHaveLength(2);
        expect(result.parsedData.items).toHaveLength(2);
    });

    it('should parse fenced json responses from the model', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [
                    {
                        content: {
                            parts: [
                                {
                                    text: `\`\`\`json
${JSON.stringify({
    intent: 'update',
    storageName: 'shed',
    boxName: 'garden',
    items: [],
    confirmation: 'Check the guessed box before saving.',
    confidence: 0.66,
})}
\`\`\``,
                                },
                            ],
                        },
                    },
                ],
            }),
        } as any);

        const result = await service.resolveTextFallback({
            rawInput: 'update the garden box in shed',
            llmBackup: 'update the garden box in shed',
        });

        expect(result.success).toBe(true);
        expect(result.parsedData.storageName).toBe('shed');
        expect(result.parsedData.boxes[0].name).toBe('garden');
    });

    it('should retry with plain text parsing when strict json mode fails', async () => {
        global.fetch = jest
            .fn()
            .mockResolvedValueOnce({
                ok: false,
                status: 400,
                text: async () => 'responseMimeType not supported',
            } as any)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [
                        {
                            content: {
                                parts: [
                                    {
                                        text: JSON.stringify({
                                            intent: 'create',
                                            storageName: 'office',
                                            boxes: [{ name: 'archive', quantity: 2 }],
                                            items: [
                                                {
                                                    name: 'receipt',
                                                    quantity: 20,
                                                    boxName: 'archive',
                                                    replicatePerExpandedBox: true,
                                                },
                                            ],
                                            confidence: 0.72,
                                        }),
                                    },
                                ],
                            },
                        },
                    ],
                }),
            } as any);

        const result = await service.resolveTextFallback({
            rawInput: 'register two archive cartons for invoices and place twenty receipts in each',
            llmBackup: 'register two archive cartons for invoices and place twenty receipts in each',
        });

        expect(result.success).toBe(true);
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(result.parsedData.boxes.map((box: any) => box.name)).toEqual([
            'archive',
        ]);
        expect(result.parsedData.boxes[0].quantity).toBe(2);
        expect(result.parsedData.items).toHaveLength(1);
    });

    it('should fail gracefully when the model returns no persistable data', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [
                    {
                        content: {
                            parts: [
                                {
                                    text: JSON.stringify({
                                        intent: 'update',
                                        storageName: null,
                                        boxes: [],
                                        items: [],
                                        confidence: 0.2,
                                    }),
                                },
                            ],
                        },
                    },
                ],
            }),
        } as any);

        const result = await service.resolveTextFallback({
            rawInput: 'do something maybe',
            llmBackup: 'do something maybe',
        });

        expect(result.success).toBe(false);
        expect(result.parsedData).toBeNull();
        expect(result.message).toContain('could not extract enough structured data');
    });

    it('should repair an insufficient first payload with one additional model pass', async () => {
        global.fetch = jest
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [
                        {
                            content: {
                                parts: [
                                    {
                                    text: JSON.stringify({
                                        intent: 'create',
                                        storageName: null,
                                        boxes: [],
                                        items: [],
                                        confirmation: 'User wants archive cartons for receipts.',
                                            confidence: 0.31,
                                        }),
                                    },
                                ],
                            },
                        },
                    ],
                }),
            } as any)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    candidates: [
                        {
                            content: {
                                parts: [
                                    {
                                    text: JSON.stringify({
                                        intent: 'create',
                                        storageName: 'records room',
                                        boxes: [
                                            { name: 'archive carton', quantity: 2 },
                                        ],
                                            items: [
                                                {
                                                    name: 'receipt',
                                                    quantity: 20,
                                                    boxName: 'archive carton',
                                                    replicatePerExpandedBox: true,
                                                },
                                            ],
                                            confidence: 0.84,
                                        }),
                                    },
                                ],
                            },
                        },
                    ],
                }),
            } as any);

        const result = await service.resolveTextFallback({
            rawInput: 'Please register two archive cartons for invoices and place twenty receipts in each',
            llmBackup: 'Please register two archive cartons for invoices and place twenty receipts in each',
            identityKey: 'user-456',
        });

        expect(result.success).toBe(true);
        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(result.parsedData.boxes.map((box: any) => box.name)).toEqual([
            'archive carton',
        ]);
        expect(result.parsedData.boxes[0].quantity).toBe(2);
        expect(result.parsedData.items).toHaveLength(1);
        expect(result.parsedData.items[0].replicatePerExpandedBox).toBe(true);
    });

    it('should stop before calling the model when the llm request limit is hit', async () => {
        jest.spyOn(aiRateLimitService, 'consumeLlmFallback').mockReturnValue({
            allowed: false,
            remaining: 0,
            retryAfterSeconds: 12,
        });
        global.fetch = jest.fn();

        const result = await service.resolveTextFallback({
            rawInput: 'add 1 hammer to tools',
            llmBackup: 'add 1 hammer to tools',
            identityKey: 'user-123',
        });

        expect(result.success).toBe(false);
        expect(result.rateLimited).toBe(true);
        expect(result.message).toContain('12');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should stop before calling the model when the llm token budget is exhausted', async () => {
        jest.spyOn(aiRateLimitService, 'consumeLlmFallback').mockReturnValue({
            allowed: true,
            remaining: 9,
            retryAfterSeconds: 0,
        });
        jest.spyOn(aiRateLimitService, 'consumeLlmTokenBudget').mockReturnValue({
            allowed: false,
            remaining: 0,
            retryAfterSeconds: 9,
        });
        global.fetch = jest.fn();

        const result = await service.resolveTextFallback({
            rawInput: 'add 1 hammer to tools',
            llmBackup: 'add 1 hammer to tools',
            identityKey: 'user-123',
        });

        expect(result.success).toBe(false);
        expect(result.rateLimited).toBe(true);
        expect(result.message).toContain('token budget');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return a safe failure when the provider request fails', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 429,
            text: async () => 'quota exceeded',
        } as any);

        const result = await service.resolveTextFallback({
            rawInput: 'add 2 hammers to tools box in garage',
            llmBackup: 'add 2 hammers to tools box in garage',
        });

        expect(result.success).toBe(false);
        expect(result.message).toContain('temporarily unavailable');
    });
});
