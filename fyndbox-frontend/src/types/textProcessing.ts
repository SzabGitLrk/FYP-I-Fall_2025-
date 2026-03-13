export interface SmartAddBox {
  clientRef: string;
  description?: string | null;
  name: string;
  quantity?: number | null;
}

export interface SmartAddItem {
  boxClientRef: string | null;
  description?: string | null;
  name: string;
  orphaned?: boolean;
  quantity: number;
}

export interface SmartAddParsedData {
  ambiguous: boolean;
  boxDescription?: string | null;
  boxName?: string | null;
  boxQuantity?: number | null;
  boxes: SmartAddBox[];
  confidence?: number;
  confirmation?: string | null;
  expandedBoxes?: Array<{
    expandedNames: string[];
    originalName: string;
    quantity: number;
  }> | null;
  extractedWordCount?: number;
  intent: string | null;
  items: SmartAddItem[];
  meta?: {
    mappingStrategy?: 'direct' | 'sequential';
  };
  rawIntents?: string[];
  storageDescription?: string | null;
  storageName: string | null;
  suggestions?: string[];
  totalWords?: number;
}

export interface SmartAddClassification {
  clarification: string | null;
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

export interface SmartAddProcessPayload {
  _meta: {
    inputLength: number;
    processedAt: string;
    processingTimeMs: number;
  };
  classified: SmartAddClassification | null;
  confidence: number | null;
  fallbackToLLM: boolean;
  llmBackup: string;
  parsedData: SmartAddParsedData | null;
  rawInput: string;
}

export interface SmartAddPersistPayload {
  ids?: {
    boxIds?: Record<string, string>;
    itemIds?: string[];
    storageId?: string;
  };
  message: string;
  success: boolean;
  warnings?: string[];
}
