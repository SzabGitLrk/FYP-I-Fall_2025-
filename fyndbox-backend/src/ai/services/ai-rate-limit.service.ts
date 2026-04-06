import { Injectable } from '@nestjs/common';

type RateLimitDecision = {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
};

@Injectable()
export class AiRateLimitService {
    // Keep lightweight in-memory buckets for the current backend instance.
    private readonly requestBuckets = new Map<string, number[]>();
    private readonly tokenBuckets = new Map<string, Array<{ timestamp: number; tokens: number }>>();
    private readonly textWindowMs = this.getEnvNumber('AI_TEXT_RATE_LIMIT_WINDOW_MS', 60_000);
    private readonly textMaxRequests = this.getEnvNumber('AI_TEXT_RATE_LIMIT_MAX_REQUESTS', 20);
    private readonly llmWindowMs = this.getEnvNumber('AI_LLM_RATE_LIMIT_WINDOW_MS', 60_000);
    private readonly llmMaxRequests = this.getEnvNumber('AI_LLM_RATE_LIMIT_MAX_REQUESTS', 10);
    private readonly llmMaxTokensPerRequest = this.getEnvNumber('AI_LLM_MAX_TOKENS_PER_REQUEST', 500);
    private readonly llmMaxTokensPerMinute = this.getEnvNumber('AI_LLM_MAX_TOKENS_PER_MINUTE', 5_000);

    // Protect the public text endpoint from bursts.
    consumeTextRequest(identityKey: string): RateLimitDecision {
        return this.consumeBucket('ai-text', identityKey, this.textMaxRequests, this.textWindowMs);
    }

    // Keep the paid LLM fallback on a tighter budget than the main text route.
    consumeLlmFallback(identityKey: string): RateLimitDecision {
        return this.consumeBucket('ai-llm-fallback', identityKey, this.llmMaxRequests, this.llmWindowMs);
    }

    // Reserve a token budget before the model call so one user cannot burn credits quickly.
    consumeLlmTokenBudget(identityKey: string, estimatedTokens: number): RateLimitDecision {
        const requestedTokens = Math.max(1, Math.floor(estimatedTokens));

        if (requestedTokens > this.llmMaxTokensPerRequest) {
            return {
                allowed: false,
                remaining: 0,
                retryAfterSeconds: Math.max(1, Math.ceil(this.llmWindowMs / 1000)),
            };
        }

        const now = Date.now();
        const bucketKey = `ai-llm-tokens:${this.normalizeIdentityKey(identityKey)}`;
        const tokenEntries = this.tokenBuckets.get(bucketKey) || [];
        const activeEntries = tokenEntries.filter((entry) => entry.timestamp > now - this.llmWindowMs);
        const usedTokens = activeEntries.reduce((sum, entry) => sum + entry.tokens, 0);

        if (usedTokens + requestedTokens > this.llmMaxTokensPerMinute) {
            const retryAfterMs = Math.max(0, activeEntries[0]?.timestamp + this.llmWindowMs - now);
            this.tokenBuckets.set(bucketKey, activeEntries);

            return {
                allowed: false,
                remaining: Math.max(0, this.llmMaxTokensPerMinute - usedTokens),
                retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
            };
        }

        activeEntries.push({ timestamp: now, tokens: requestedTokens });
        this.tokenBuckets.set(bucketKey, activeEntries);

        return {
            allowed: true,
            remaining: Math.max(0, this.llmMaxTokensPerMinute - (usedTokens + requestedTokens)),
            retryAfterSeconds: 0,
        };
    }

    // Reuse the per-request cap as the model output ceiling for predictable billing.
    getLlmMaxTokensPerRequest(): number {
        return this.llmMaxTokensPerRequest;
    }

    private consumeBucket(
        bucketName: string,
        identityKey: string,
        maxRequests: number,
        windowMs: number,
    ): RateLimitDecision {
        const now = Date.now();
        const bucketKey = `${bucketName}:${this.normalizeIdentityKey(identityKey)}`;
        const timestamps = this.requestBuckets.get(bucketKey) || [];
        const activeTimestamps = timestamps.filter((timestamp) => timestamp > now - windowMs);

        if (activeTimestamps.length >= maxRequests) {
            const retryAfterMs = Math.max(0, activeTimestamps[0] + windowMs - now);
            this.requestBuckets.set(bucketKey, activeTimestamps);

            return {
                allowed: false,
                remaining: 0,
                retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
            };
        }

        activeTimestamps.push(now);
        this.requestBuckets.set(bucketKey, activeTimestamps);

        return {
            allowed: true,
            remaining: Math.max(0, maxRequests - activeTimestamps.length),
            retryAfterSeconds: 0,
        };
    }

    private normalizeIdentityKey(identityKey: string): string {
        return identityKey.trim().toLowerCase() || 'anonymous';
    }

    private getEnvNumber(name: string, fallback: number): number {
        const value = Number(process.env[name]);

        if (!Number.isFinite(value) || value <= 0) {
            return fallback;
        }

        return Math.floor(value);
    }
}
