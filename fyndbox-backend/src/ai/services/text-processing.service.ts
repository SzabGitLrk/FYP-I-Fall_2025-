import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as pluralize from 'pluralize';
import wordsToNumbers from 'words-to-numbers';
import { DICTIONARY_CONFIG } from '../config/nlp-dictionary.config';
import { ProcessTextRequestDto } from '../dto/process-text-request.dto';
import { ProcessTextResponseDto } from '../dto/process-text-response.dto';
import { AiPersistenceService } from './ai-persistence.service';
import { AiRateLimitService } from './ai-rate-limit.service';
import { LlmFallbackService } from './llm-fallback.service';
import { TextParsingService } from './text-parsing.service';
import { ValidationService } from './validation.service';

@Injectable()
export class TextProcessingService {
  private readonly logger = new Logger(TextProcessingService.name);
  private readonly maxInputLength = 500;
  private readonly DICTIONARY = DICTIONARY_CONFIG;
  private readonly PROTECTED_WORDS = DICTIONARY_CONFIG.PROTECTED_WORDS;
  private readonly STOP_WORDS = DICTIONARY_CONFIG.STOP_WORDS;
  private readonly CUSTOM_NUMBER_MAP = DICTIONARY_CONFIG.CUSTOM_NUMBER_MAP;
  private readonly NON_SINGULARIZABLE_WORDS = new Set(
    DICTIONARY_CONFIG.NON_SINGULARIZABLE_WORDS,
  );
  private readonly SPELLCHECK_EXCLUDED_WORDS = new Set(
    DICTIONARY_CONFIG.SPELLCHECK_EXCLUDED_WORDS,
  );
  private readonly DISABLED_PHRASE_ALIASES = new Set([
    'in the',
    'a couple',
    'a pair',
    'couple of',
    'pair of',
    'several',
    'few',
    'many',
    'lots of',
    'bunch',
    'handful',
  ]);
  private readonly SPELLCHECK_CANDIDATES = this.buildSpellCheckCandidates();

  private SYNONYM_MAP: Record<string, string> = {
    'car stuff': 'Car Care',
    'car things': 'Car Care',
    'auto supplies': 'Car Care',
    'cooking stuff': 'Kitchen Supplies',
    'kitchen stuff': 'Kitchen Supplies',
    'clothes stuff': 'Clothing',
    'clothing stuff': 'Clothing',
    'cleaning stuff': 'Cleaning Supplies',
    'clean supplies': 'Cleaning Supplies',
    'tech stuff': 'Electronics',
    'electronic stuff': 'Electronics',
    'office stuff': 'Office Supplies',
    'school stuff': 'School Supplies',
    'sports stuff': 'Sports Equipment',
    'garden stuff': 'Garden Supplies',
    'pet stuff': 'Pet Supplies',
    'toy stuff': 'Toys',
    'art stuff': 'Art Supplies',
    'bath stuff': 'Bathroom Supplies',
    'tool stuff': 'Tools',
  };

  constructor(
    private readonly textParsingService: TextParsingService,
    private readonly validationService: ValidationService,
    private readonly aiPersistenceService: AiPersistenceService,
    private readonly aiRateLimitService: AiRateLimitService,
    private readonly llmFallbackService: LlmFallbackService,
  ) {}

  lightNormalization(text: string): {
    normalizedText: string;
    llmBackup: string;
    typoCount: number;
  } {
    if (!text) return { normalizedText: '', llmBackup: '', typoCount: 0 };

    const input = this.isShouting(text)
      ? this.normalizeShoutingInput(text)
      : text;

    let cleaned = input
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim()
      .replace(/\s+/g, ' ');

    cleaned = this.removeStopWords(cleaned);
    cleaned = this.applyPhraseAliases(cleaned.trim().replace(/\s+/g, ' '));
    cleaned = this.convertWordsToNumbers(cleaned.trim().replace(/\s+/g, ' '));

    const tokens = cleaned.split(/(\b)/);
    let typoCount = 0;

    const result = tokens
      .map((token) => {
        if (!token.match(/^[a-zA-Z0-9]+$/)) return token;
        if (token.match(/^[A-Z]{3,}$/)) return token;

        const corrected = this.applySpellCheck(token);
        if (corrected !== token.toLowerCase() && corrected !== token) {
          typoCount++;
        }

        return corrected;
      })
      .join('')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      normalizedText: result,
      llmBackup: result,
      typoCount,
    };
  }

  parseExtraction(normalizedText: string): any {
    return this.textParsingService.parseExtraction(normalizedText);
  }

  heavyNormalization(parsedData: any): any {
    const result = { ...parsedData };

    const normalizeEntityName = (name: string): string => {
      const synonymResult = this.applySynonymMapping(name);
      const wasMapped = synonymResult !== name;
      const hasNumberedSuffix = /\b\d+\s*$/.test(synonymResult.trim());
      const singularized =
        wasMapped || hasNumberedSuffix
          ? synonymResult
          : this.toSingular(synonymResult);

      return this.toTitleCase(singularized);
    };

    if (result.storageName) {
      result.storageName = normalizeEntityName(result.storageName);
    }

    if (result.storageDescription) {
      result.storageDescription = this.toTitleCase(result.storageDescription);
    }

    if (result.boxes && result.boxes.length > 0) {
      result.boxes = result.boxes.map((box: any) => ({
        ...box,
        name: normalizeEntityName(box.name),
        description: box.description
          ? this.toTitleCase(box.description)
          : box.description,
      }));
    }

    if (result.boxName) {
      result.boxName = normalizeEntityName(result.boxName);
    }

    if (result.items && result.items.length > 0) {
      result.items = result.items.map((item: any) => ({
        ...item,
        name: normalizeEntityName(item.name),
        description: item.description
          ? this.toTitleCase(item.description)
          : item.description,
      }));
    }

    return result;
  }

  validateInput(rawText: string | null | undefined): {
    isValid: boolean;
    message: string | null;
    clarificationOptions?: any[];
  } {
    return this.validationService.validateInput(rawText);
  }

  intentClassification(
    parsedData: any,
    existingContext?: any,
    typoCount: number = 0,
  ): any {
    return this.validationService.intentClassification(
      parsedData,
      existingContext,
      typoCount,
    );
  }

  addSynonym(synonym: string, canonical: string): void {
    this.SYNONYM_MAP[synonym.toLowerCase()] = canonical;
  }

  getSynonyms(): Record<string, string> {
    return { ...this.SYNONYM_MAP };
  }

  generateConfirmationSummary(normalizedData: any): string {
    // Keep the review message short because the modal shows it directly.
    const parts: string[] = [];

    if (normalizedData.storageName) {
      parts.push(`storage '${normalizedData.storageName}'`);
    }

    if (normalizedData.boxes?.length > 0) {
      const boxNames = normalizedData.boxes.map((box: any) => `'${box.name}'`);
      parts.push(
        normalizedData.boxes.length === 1
          ? `box ${boxNames[0]}`
          : `boxes ${this.joinHumanList(boxNames)}`,
      );
    }

    if (normalizedData.items?.length > 0) {
      const itemDescriptions = normalizedData.items.map((item: any) => {
        const qty = item.quantity || 1;
        const boxRef = item.boxClientRef;
        const box = normalizedData.boxes?.find(
          (entry: any) => entry.clientRef === boxRef,
        );
        const boxName = box ? ` in '${box.name}'` : '';
        return `'${item.name}' (x${qty})${boxName}`;
      });
      parts.push(`items ${this.joinHumanList(itemDescriptions)}`);
    }

    if (parts.length === 0) {
      return 'Please confirm these changes.';
    }

    return `Please confirm these changes: ${parts.join('; ')}.`;
  }

  async processTextRequest(
    userId: string,
    processTextDto: ProcessTextRequestDto,
  ): Promise<ProcessTextResponseDto> {
    const startTime = Date.now();

    try {
      if (!processTextDto.text || processTextDto.text.trim().length === 0) {
        this.logger.warn(`Empty input from user ${userId}`);
        throw new BadRequestException(
          'Text input is required. Please enter an instruction.',
        );
      }

      if (processTextDto.text.length > this.maxInputLength) {
        this.logger.warn(
          `Input too long from user ${userId}: ${processTextDto.text.length} chars`,
        );
        throw new BadRequestException(
          `Input too long. Maximum ${this.maxInputLength} characters allowed.`,
        );
      }

      const sanitizedText = this.sanitizeInput(processTextDto.text);
      if (sanitizedText !== processTextDto.text) {
        this.logger.debug(`Input sanitized for user ${userId}`);
      }

      const validation = this.validateInput(sanitizedText);
      if (!validation.isValid) {
        if (validation.clarificationOptions?.length) {
          const duration = Date.now() - startTime;
          return {
            parsedData: null,
            classified: {
              intent: null,
              isValid: false,
              scope: {
                affectsStorage: sanitizedText.toLowerCase().includes('storage'),
                affectsBoxes: false,
                affectsItems: false,
              },
              clarification: validation.message,
              clarificationOptions: validation.clarificationOptions,
              suggestions: [],
              confidence: 0,
              shouldFallToLLM: false,
            },
            fallbackToLLM: false,
            confidence: 0,
            rawInput: sanitizedText,
            llmBackup: sanitizedText,
            meta: {
              processedAt: new Date().toISOString(),
              processingTimeMs: duration,
              inputLength: sanitizedText.length,
            },
          };
        }
        this.logger.debug(`Validation failed: ${validation.message}`);
        throw new BadRequestException(validation.message || 'Invalid input.');
      }

      let existingContext;
      try {
        existingContext =
          await this.aiPersistenceService.getExistingContext(userId);
      } catch (error) {
        this.logger.warn(
          `Failed to fetch context: ${(error as Error).message}`,
        );
        existingContext = undefined;
      }

      const textRateLimitDecision =
        this.aiRateLimitService.consumeTextRequest(userId);
      if (!textRateLimitDecision.allowed) {
        throw new BadRequestException(
          `Too many Smart Add requests. Please wait ${textRateLimitDecision.retryAfterSeconds} seconds before trying again.`,
        );
      }

      let result = this.processInput(sanitizedText, existingContext);
      if (result.fallbackToLLM) {
        // Re-enter the same downstream normalization/confirmation path after LLM extraction.
        const llmResult = await this.llmFallbackService.resolveTextFallback({
          rawInput: sanitizedText,
          llmBackup: result.llmBackup ?? sanitizedText,
          identityKey: userId,
          existingContext,
          classified: result.classified,
        });

        if (!llmResult.success || !llmResult.parsedData) {
          throw new BadRequestException(
            llmResult.message || 'LLM fallback could not process the request.',
          );
        }

        result = this.finalizeResolvedData(llmResult.parsedData, existingContext, {
          allowFallbackEscalation: false,
          fallbackClassified: llmResult.classified,
          fallbackConfidence: llmResult.confidence,
          fallbackToLLM: true,
          llmBackup: result.llmBackup ?? sanitizedText,
          rawInput: sanitizedText,
          requireReviewConfirmation: true,
        });
      }
      const duration = Date.now() - startTime;

      this.logger.log(
        `Processed "${sanitizedText.substring(0, 50)}..." ` +
          `| Intent: ${result.data?.intent || 'none'} ` +
          `| Success: ${result.success} ` +
          `| Duration: ${duration}ms ` +
          `| User: ${userId}`,
      );

      if (!result.success) {
        throw new BadRequestException(result.message || 'Processing failed.');
      }

      return {
        parsedData: result.data ?? null,
        classified: result.classified ?? null,
        fallbackToLLM: result.fallbackToLLM ?? false,
        confidence: result.confidence ?? result.classified?.confidence ?? null,
        rawInput: result.rawInput ?? sanitizedText,
        llmBackup: result.llmBackup ?? sanitizedText,
        meta: {
          processedAt: new Date().toISOString(),
          processingTimeMs: duration,
          inputLength: sanitizedText.length,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Error processing text from user ${userId}: ${(error as Error).message}`,
        (error as Error).stack,
      );

      throw new InternalServerErrorException(
        'Something went wrong while processing your request. Please try again.',
      );
    }
  }

  processInput(rawInput: string, existingContext?: any): any {
    const { normalizedText, llmBackup, typoCount } =
      this.lightNormalization(rawInput);

    const parsed = this.parseExtraction(normalizedText);
    return this.finalizeResolvedData(parsed, existingContext, {
      fallbackToLLM: false,
      llmBackup,
      rawInput,
      typoCount,
    });
  }

  // Shared downstream path so rule-based parsing and LLM extraction stay consistent after extraction.
  private finalizeResolvedData(
    parsedData: any,
    existingContext: any,
    options: {
      allowFallbackEscalation?: boolean;
      classified?: any;
      fallbackClassified?: any;
      fallbackConfidence?: number | null;
      fallbackToLLM: boolean;
      llmBackup: string;
      rawInput: string;
      requireReviewConfirmation?: boolean;
      typoCount?: number;
    },
  ): any {
    const classified = this.buildSharedClassification(
      parsedData,
      existingContext,
      options,
    );

    if (!classified.isValid) {
      const clarification =
        classified.clarification ||
        'This instruction will fall to LLM for manual review.';
      const fallbackToLLM =
        typeof classified.shouldFallToLLM === 'boolean'
          ? classified.shouldFallToLLM
          : this.shouldFallbackInvalidClarificationToLLM(clarification);

      return {
        success: false,
        fallbackToLLM:
          fallbackToLLM && options.allowFallbackEscalation !== false,
        message:
          fallbackToLLM && options.allowFallbackEscalation !== false
            ? 'This instruction will fall to LLM for manual review.'
            : clarification,
        classified,
        llmBackup: options.llmBackup,
        rawInput: options.rawInput,
      };
    }

    if (classified.shouldFallToLLM && options.allowFallbackEscalation !== false) {
      return {
        success: false,
        fallbackToLLM: true,
        confidence: classified.confidence,
        message:
          classified.clarification ||
          `This prompt needs manual review. Confidence: ${classified.confidence}`,
        classified,
        llmBackup: options.llmBackup,
        rawInput: options.rawInput,
      };
    }

    const parsedForPersistence = classified.resolvedParsedData || parsedData;
    const normalized = this.heavyNormalization(parsedForPersistence);
    const prepared =
      this.aiPersistenceService.prepareNormalizedDataForPersistence(
        normalized,
        classified.expandedBoxes,
      );

    prepared.intent = classified.intent;
    prepared.expandedBoxes = classified.expandedBoxes;
    prepared.suggestions = classified.suggestions;
    prepared.confidence = classified.confidence;
    prepared.meta = {
      ...prepared.meta,
      ...parsedForPersistence.meta,
      workflowSource: options.fallbackToLLM ? 'llm-fallback' : 'rule-based',
    };

    // Run the persistence guard here too so users get a clear review message before save.
    const persistenceBlockingMessage =
      this.aiPersistenceService.validatePersistencePrerequisites(prepared);
    if (persistenceBlockingMessage) {
      return {
        success: false,
        fallbackToLLM: false,
        message: persistenceBlockingMessage,
        classified,
        llmBackup: options.llmBackup,
        rawInput: options.rawInput,
      };
    }

    const confirmationSummary = this.generateConfirmationSummary(prepared);
    const modelReviewMessage = this.toOptionalString(parsedForPersistence.confirmation);

    prepared.confirmation =
      classified.confirmation ||
      (options.requireReviewConfirmation ? confirmationSummary : null) ||
      modelReviewMessage ||
      confirmationSummary;

    if (modelReviewMessage && modelReviewMessage !== prepared.confirmation) {
      prepared.meta = {
        ...prepared.meta,
        llmReviewMessage: modelReviewMessage,
      };
    }

    return {
      success: true,
      fallbackToLLM: options.fallbackToLLM,
      message: prepared.confirmation,
      data: prepared,
      classified,
      confidence: prepared.confidence ?? classified.confidence ?? null,
      llmBackup: options.llmBackup,
      rawInput: options.rawInput,
    };
  }

  private buildSharedClassification(
    parsedData: any,
    existingContext: any,
    options: {
      classified?: any;
      fallbackClassified?: any;
      fallbackConfidence?: number | null;
      typoCount?: number;
    },
  ): any {
    const classified =
      options.classified ||
      this.intentClassification(
        parsedData,
        existingContext,
        options.typoCount ?? 0,
      );

    const fallbackClassified = options.fallbackClassified || {};
    const mergedSuggestions = Array.from(
      new Set([
        ...(classified.suggestions || []),
        ...(fallbackClassified.suggestions || []),
      ]),
    );

    return {
      ...classified,
      clarification:
        classified.clarification ?? fallbackClassified.clarification ?? null,
      clarificationKind:
        classified.clarificationKind ??
        fallbackClassified.clarificationKind ??
        null,
      clarificationOptions:
        classified.clarificationOptions ??
        fallbackClassified.clarificationOptions ??
        [],
      confidence:
        typeof options.fallbackConfidence === 'number'
          ? Math.max(classified.confidence ?? 0, options.fallbackConfidence)
          : classified.confidence,
      expandedBoxes:
        classified.expandedBoxes ??
        fallbackClassified.expandedBoxes ??
        parsedData.expandedBoxes ??
        null,
      intent: classified.intent ?? fallbackClassified.intent ?? parsedData.intent,
      suggestions: mergedSuggestions,
    };
  }

  private removeStopWords(text: string): string {
    let result = text;
    const boundaryStopWords = new Set([
      'hi',
      'hello',
      'hey',
      'greetings',
      'good morning',
      'good afternoon',
      'good evening',
      'sorry',
    ]);

    const boundaryStopWordPhrases = [...boundaryStopWords]
      .filter((word) => word.includes(' '))
      .sort((a, b) => b.length - a.length);

    for (const stopWord of this.STOP_WORDS) {
      if (boundaryStopWords.has(stopWord)) continue;
      result = result.replace(new RegExp(`\\b${stopWord}\\b`, 'gi'), '');
    }

    for (const phrase of boundaryStopWordPhrases) {
      result = result
        .replace(new RegExp(`^\\s*${phrase}\\b\\s*`, 'i'), '')
        .replace(new RegExp(`\\b${phrase}\\s*$`, 'i'), '');
    }

    const tokens = result.trim().split(/\s+/).filter(Boolean);

    while (tokens.length > 2) {
      const firstToken = tokens[0]
        .replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '')
        .toLowerCase();
      if (!boundaryStopWords.has(firstToken)) break;
      tokens.shift();
    }

    while (tokens.length > 2) {
      const lastIndex = tokens.length - 1;
      const lastToken = tokens[lastIndex]
        .replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '')
        .toLowerCase();
      if (!boundaryStopWords.has(lastToken)) break;
      tokens.pop();
    }

    return tokens.join(' ').trim().replace(/\s+/g, ' ');
  }

  private getLevenshteinDistance(a: string, b: string): number {
    const matrix = Array.from({ length: a.length + 1 }, () =>
      Array(b.length + 1).fill(0),
    );

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 1; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );

        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
        }
      }
    }

    return matrix[a.length][b.length];
  }

  private buildSpellCheckCandidates(): string[] {
    const sources = [
      ...Object.values(this.DICTIONARY.INTENTS).flat(),
      ...Object.values(this.DICTIONARY.ENTITIES).flat(),
      ...this.DICTIONARY.CONNECTORS,
      ...this.DICTIONARY.CONTAINMENT_KEYS,
      ...this.DICTIONARY.DESCRIPTION_KEYS,
      ...Object.entries(this.DICTIONARY.PHRASE_ALIASES)
        .filter(([alias]) => !this.DISABLED_PHRASE_ALIASES.has(alias))
        .flatMap(([alias, replacement]) => [alias, replacement]),
    ];

    return Array.from(
      new Set(
        sources
          .flatMap((entry) => entry.toLowerCase().split(/\s+/))
          .filter((entry) => /^[a-z]+$/.test(entry))
          .filter((entry) => entry.length >= 2)
          .filter((entry) => !this.SPELLCHECK_EXCLUDED_WORDS.has(entry)),
      ),
    ).sort((a, b) => b.length - a.length);
  }

  private isEligibleSpellCheckMatch(word: string, candidate: string): boolean {
    const lengthDifference = Math.abs(word.length - candidate.length);
    if (lengthDifference > 1) return false;

    const distance = this.getLevenshteinDistance(word, candidate);
    if (distance > 1) return false;

    const isTransposition = this.isAdjacentTransposition(word, candidate);
    const sameEnding = word.slice(-1) === candidate.slice(-1);

    if (word.length <= 3) {
      return (
        candidate.charAt(0) === word.charAt(0) &&
        (sameEnding || lengthDifference === 1)
      );
    }

    const sharedPrefix = word.slice(0, 2) === candidate.slice(0, 2);
    if (!sharedPrefix && !isTransposition) return false;

    return isTransposition || sameEnding || lengthDifference === 1;
  }

  private applyPhraseAliases(text: string): string {
    let result = text;
    const aliases = Object.entries(this.DICTIONARY.PHRASE_ALIASES).sort(
      ([a], [b]) => b.length - a.length,
    );

    for (const [alias, replacement] of aliases) {
      if (this.DISABLED_PHRASE_ALIASES.has(alias)) continue;
      result = result.replace(new RegExp(`\\b${alias}\\b`, 'gi'), replacement);
    }

    return result;
  }

  private isAdjacentTransposition(source: string, candidate: string): boolean {
    if (source.length !== candidate.length || source.length < 2) {
      return false;
    }

    for (let index = 0; index < source.length - 1; index++) {
      if (
        source[index] === candidate[index + 1] &&
        source[index + 1] === candidate[index] &&
        source.slice(0, index) === candidate.slice(0, index) &&
        source.slice(index + 2) === candidate.slice(index + 2)
      ) {
        return true;
      }
    }

    return false;
  }

  private applySpellCheck(word: string): string {
    const lowerWord = word.toLowerCase();
    if (/[a-zA-Z].*\d|\d.*[a-zA-Z]/.test(word)) return word;
    if (this.PROTECTED_WORDS.includes(lowerWord)) return lowerWord;
    if (this.SPELLCHECK_EXCLUDED_WORDS.has(lowerWord)) return lowerWord;
    if (this.SPELLCHECK_CANDIDATES.includes(lowerWord)) return lowerWord;

    const matches = this.SPELLCHECK_CANDIDATES.filter((candidate) =>
      this.isEligibleSpellCheckMatch(lowerWord, candidate),
    )
      .map((candidate) => ({
        candidate,
        distance: this.getLevenshteinDistance(lowerWord, candidate),
        lengthDifference: Math.abs(lowerWord.length - candidate.length),
        sameEnding: lowerWord.slice(-1) === candidate.slice(-1),
      }))
      .sort((a, b) => {
        if (a.distance !== b.distance) return a.distance - b.distance;
        if (a.sameEnding !== b.sameEnding)
          return Number(b.sameEnding) - Number(a.sameEnding);
        if (a.lengthDifference !== b.lengthDifference)
          return a.lengthDifference - b.lengthDifference;
        return b.candidate.length - a.candidate.length;
      });

    if (matches.length > 0) {
      return matches[0].candidate;
    }

    return lowerWord;
  }

  private convertWordsToNumbers(text: string): string {
    let result = text;

    for (const [key, value] of Object.entries(this.CUSTOM_NUMBER_MAP)) {
      result = result.replace(
        new RegExp(`\\b${key}\\b`, 'gi'),
        value.toString(),
      );
    }

    const protect = [
      { word: 'a', token: '___A_PROT___' },
      { word: 'to', token: '___TO_PROT___' },
      { word: 'for', token: '___FOR_PROT___' },
    ];

    protect.forEach((entry) => {
      result = result.replace(
        new RegExp(`\\b${entry.word}\\b`, 'gi'),
        entry.token,
      );
    });

    const converted = wordsToNumbers(result);
    let final = converted ? converted.toString() : result;

    protect.forEach((entry) => {
      final = final.replace(new RegExp(entry.token, 'g'), entry.word);
    });

    return final;
  }

  private isShouting(text: string): boolean {
    const alphas = text.replace(/[^a-zA-Z]/g, '');
    if (alphas.length === 0) return false;

    const uppers = alphas.replace(/[^A-Z]/g, '');
    return uppers.length / alphas.length > 0.3;
  }

  private normalizeShoutingInput(text: string): string {
    if (!/[a-z]/.test(text)) {
      return text.toLowerCase();
    }

    return text
      .split(/(\b)/)
      .map((token) => {
        if (!/^[A-Za-z]+$/.test(token)) {
          return token;
        }

        if (token.length >= 4 && token === token.toUpperCase()) {
          return token;
        }

        return token.toLowerCase();
      })
      .join('');
  }

  private applySynonymMapping(text: string): string {
    const lower = text.toLowerCase();
    for (const [synonym, canonical] of Object.entries(this.SYNONYM_MAP)) {
      if (lower === synonym) return canonical;
    }
    return text;
  }

  private toTitleCase(text: string): string {
    return text
      .split(/\s+/)
      .map((word) => {
        if (
          word.length >= 2 &&
          word === word.toUpperCase() &&
          /^[A-Z]+$/.test(word)
        ) {
          return word;
        }

        if (/\d/.test(word)) {
          return word;
        }

        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  private toSingular(text: string): string {
    return text
      .split(/\s+/)
      .map((word) => {
        if (
          word.length <= 2 ||
          (word === word.toUpperCase() && /^[A-Z]+$/.test(word))
        ) {
          return word;
        }

        if (this.NON_SINGULARIZABLE_WORDS.has(word.toLowerCase())) {
          return word;
        }

        return pluralize.singular(word);
      })
      .join(' ');
  }

  private shouldFallbackInvalidClarificationToLLM(
    clarification: string,
  ): boolean {
    const normalized = clarification.trim().toLowerCase();

    return [
      'which box should',
      'which storage should',
      "please specify what you'd like to do",
      'could not understand the instruction',
      'this instruction will fall to llm',
    ].some((pattern) => normalized.startsWith(pattern));
  }

  private sanitizeInput(input: string): string {
    return input
      .replace(/\0/g, '')
      .replace(/[\v\f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private toOptionalString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim().replace(/\s+/g, ' ');
    return trimmed.length > 0 ? trimmed : null;
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
}
