// DTO for text processing request.
export class ProcessTextDto {
    // The user's raw text input to process.
    text: string;
}

// DTO for confirm + persist request.
export class ConfirmTextProcessingDto {
    // Normalized or parsed payload to persist.
    data?: any;
    parsedData?: any;
    // Explicit confirmation to proceed with persistence.
    confirmed?: boolean;
}

// Response payload for text-processing.
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
