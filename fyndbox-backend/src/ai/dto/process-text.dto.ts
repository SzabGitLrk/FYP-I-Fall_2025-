// DTOs for AI text processing requests and responses.
export class ProcessTextDto {
    text: string;
}

export type ProcessTextResponseDto = {
    parsedData: any | null;
    classified: any | null;
    fallbackToLLM: boolean;
    confidence: number | null;
    rawInput: string;
    llmBackup: string;
    _meta: {
        processedAt: string;
        processingTimeMs: number;
        inputLength: number;
    };
};
