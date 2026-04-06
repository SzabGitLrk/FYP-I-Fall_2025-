import { AiRateLimitService } from './ai-rate-limit.service';

describe('AiRateLimitService', () => {
    const originalTextWindowMs = process.env.AI_TEXT_RATE_LIMIT_WINDOW_MS;
    const originalTextMaxRequests = process.env.AI_TEXT_RATE_LIMIT_MAX_REQUESTS;
    const originalLlmWindowMs = process.env.AI_LLM_RATE_LIMIT_WINDOW_MS;
    const originalLlmMaxRequests = process.env.AI_LLM_RATE_LIMIT_MAX_REQUESTS;
    const originalLlmMaxTokensPerRequest = process.env.AI_LLM_MAX_TOKENS_PER_REQUEST;
    const originalLlmMaxTokensPerMinute = process.env.AI_LLM_MAX_TOKENS_PER_MINUTE;

    beforeEach(() => {
        process.env.AI_TEXT_RATE_LIMIT_WINDOW_MS = '60000';
        process.env.AI_TEXT_RATE_LIMIT_MAX_REQUESTS = '2';
        process.env.AI_LLM_RATE_LIMIT_WINDOW_MS = '60000';
        process.env.AI_LLM_RATE_LIMIT_MAX_REQUESTS = '10';
        process.env.AI_LLM_MAX_TOKENS_PER_REQUEST = '500';
        process.env.AI_LLM_MAX_TOKENS_PER_MINUTE = '1000';
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-03-29T00:00:00.000Z'));
    });

    afterEach(() => {
        process.env.AI_TEXT_RATE_LIMIT_WINDOW_MS = originalTextWindowMs;
        process.env.AI_TEXT_RATE_LIMIT_MAX_REQUESTS = originalTextMaxRequests;
        process.env.AI_LLM_RATE_LIMIT_WINDOW_MS = originalLlmWindowMs;
        process.env.AI_LLM_RATE_LIMIT_MAX_REQUESTS = originalLlmMaxRequests;
        process.env.AI_LLM_MAX_TOKENS_PER_REQUEST = originalLlmMaxTokensPerRequest;
        process.env.AI_LLM_MAX_TOKENS_PER_MINUTE = originalLlmMaxTokensPerMinute;
        jest.useRealTimers();
    });

    it('should block text requests after the configured burst is reached', () => {
        const service = new AiRateLimitService();

        expect(service.consumeTextRequest('user-1').allowed).toBe(true);
        expect(service.consumeTextRequest('user-1').allowed).toBe(true);

        const blocked = service.consumeTextRequest('user-1');
        expect(blocked.allowed).toBe(false);
        expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('should keep llm fallback tighter than the main text route', () => {
        const service = new AiRateLimitService();

        for (let index = 0; index < 10; index++) {
            expect(service.consumeLlmFallback('user-1').allowed).toBe(true);
        }

        const blocked = service.consumeLlmFallback('user-1');
        expect(blocked.allowed).toBe(false);
    });

    it('should reject oversized llm token requests', () => {
        const service = new AiRateLimitService();

        const blocked = service.consumeLlmTokenBudget('user-1', 501);
        expect(blocked.allowed).toBe(false);
    });

    it('should stop llm token usage once the minute budget is exhausted', () => {
        const service = new AiRateLimitService();

        expect(service.consumeLlmTokenBudget('user-1', 500).allowed).toBe(true);
        expect(service.consumeLlmTokenBudget('user-1', 500).allowed).toBe(true);

        const blocked = service.consumeLlmTokenBudget('user-1', 1);
        expect(blocked.allowed).toBe(false);
    });
});
