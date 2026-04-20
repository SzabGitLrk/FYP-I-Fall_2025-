export interface SmartAssistBox {
  clientRef: string;
  description?: string | null;
  name: string;
  quantity?: number | null;
}

export interface SmartAssistClarificationOption {
  kind: 'box' | 'bulk-all' | 'action';
  label: string;
  prompt: string;
}

export interface SmartAssistItem {
  boxClientRef: string | null;
  description?: string | null;
  name: string;
  orphaned?: boolean;
  quantity: number;
}

export interface ProcessTextClassification {
  clarification: string | null;
  clarificationKind?: string | null;
  clarificationOptions?: SmartAssistClarificationOption[];
  confidence: number;
  expandedBoxes?: Array<{
    expandedNames: string[];
    originalName: string;
    quantity: number;
  }> | null;
  intent: string | null;
  isValid: boolean;
  scope: {
    affectsBoxes: boolean;
    affectsItems: boolean;
    affectsStorage: boolean;
  };
  shouldFallToLLM: boolean;
  suggestions: string[];
}

export interface ProcessTextParsedData {
  ambiguous: boolean;
  boxDescription?: string | null;
  boxName?: string | null;
  boxQuantity?: number | null;
  boxes: SmartAssistBox[];
  confidence?: number;
  confirmation?: string | null;
  expandedBoxes?: Array<{
    expandedNames: string[];
    originalName: string;
    quantity: number;
  }> | null;
  extractedWordCount?: number;
  intent: string | null;
  items: SmartAssistItem[];
  meta?: {
    mappingStrategy?: 'direct' | 'sequential';
  };
  rawIntents?: string[];
  storageDescription?: string | null;
  storageName: string | null;
  suggestions?: string[];
  totalWords?: number;
}

export interface ProcessTextRequest {
  text: string;
}

export interface ProcessVoiceResult {
  rawTranscript: string;
  transcript: string;
}

export interface ProcessTextResult {
  parsedData: ProcessTextParsedData | null;
  classified: ProcessTextClassification | null;
  fallbackToLLM: boolean;
  confidence: number | null;
  rawInput: string;
  llmBackup: string;
  meta: {
    processedAt: string;
    processingTimeMs: number;
    inputLength: number;
  };
}

export interface ConfirmAiResultRequest {
  parsedData: unknown;
  confirmed: boolean;
}

export interface ConfirmAiResult {
  persisted: boolean;
  message: string;
  storageId?: string | null;
  boxIds?: Record<string, string>;
  itemIds?: string[];
  warnings?: string[];
}
