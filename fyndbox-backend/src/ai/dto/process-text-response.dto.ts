export type ProcessTextResponseDto = {
  parsedData: any | null;
  classified: any | null;
  fallbackToLLM: boolean;
  confidence: number | null;
  rawInput: string;
  llmBackup: string;
  meta: {
    processedAt: string;
    processingTimeMs: number;
    inputLength: number;
  };
};
