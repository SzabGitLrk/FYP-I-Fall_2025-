import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import * as pluralize from 'pluralize';
import { ApiResponse } from '@fyndbox/shared/types/api-response';
import wordsToNumbers from 'words-to-numbers';
import { DICTIONARY_CONFIG } from '../config/nlp-dictionary.config';
import { ConfirmAiResultDto } from '../dto/confirm-ai-result.dto';
import {
  ProcessTextDto,
  ProcessTextResponseDto,
} from '../dto/process-text-request.dto';
import { AiPersistenceService } from './ai-persistence.service';
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
  ) {}

  // Facade methods used by controllers and tests.
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
        if (corrected !== token.toLowerCase() && corrected !== token)
          typoCount++;
        return corrected;
      })
      .join('')
      .replace(/\s+/g, ' ')
      .trim();
    return { normalizedText: result, llmBackup: result, typoCount };
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

  // Keep the old service API available while editor/index caches catch up.
  confirmAndPersistRequest(
    userId: string | undefined,
    confirmDto: ConfirmAiResultDto,
  ): Promise<ApiResponse<any>> {
    return this.aiPersistenceService.confirmAndPersistRequest(
      userId,
      confirmDto,
    );
  }

  generateConfirmationSummary(normalizedData: any): string {
    const lines: string[] = ['Ready to save:'];

    if (normalizedData.storageName) {
      lines.push(
        `  Storage: ${normalizedData.storageName}${normalizedData.storageDescription ? ` (${normalizedData.storageDescription})` : ''}`,
      );
    }

    if (normalizedData.boxes?.length > 0) {
      const boxNames = normalizedData.boxes
        .map((box: any) => box.name)
        .join(', ');
      lines.push(`  Boxes: ${boxNames}`);
    }

    if (normalizedData.items?.length > 0) {
      const itemDescriptions = normalizedData.items.map((item: any) => {
        const qty = item.quantity || 1;
        const boxRef = item.boxClientRef;
        const box = normalizedData.boxes?.find(
          (entry: any) => entry.clientRef === boxRef,
        );
        const boxName = box ? box.name : 'Unknown';
        return `${item.name} (x${qty}) -> ${boxName}`;
      });
      lines.push(`  Items: ${itemDescriptions.join(', ')}`);
    }

    lines.push('Confirm? [Yes / Cancel]');
    return lines.join('\n');
  }

  // Handle the full text-processing request flow.
  async processTextRequest(
    userId: string | undefined,
    processTextDto: ProcessTextDto,
  ): Promise<ApiResponse<ProcessTextResponseDto>> {
    const startTime = Date.now();

    try {
      // Step 1: Basic input checks.
      if (!processTextDto.text || processTextDto.text.trim().length === 0) {
        this.logger.warn(`Empty input from user ${userId}`);
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: 'Text input is required. Please enter an instruction.',
          data: undefined,
        };
      }

      if (processTextDto.text.length > this.maxInputLength) {
        this.logger.warn(
          `Input too long from user ${userId}: ${processTextDto.text.length} chars`,
        );
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: `Input too long. Maximum ${this.maxInputLength} characters allowed.`,
          data: undefined,
        };
      }

      // Step 2: Sanitize input.
      const sanitizedText = this.sanitizeInput(processTextDto.text);
      if (sanitizedText !== processTextDto.text) {
        this.logger.debug(`Input sanitized for user ${userId}`);
      }

      // Step 3: Service-level validation.
      const validation = this.validateInput(sanitizedText);
      if (!validation.isValid) {
        this.logger.debug(`Validation failed: ${validation.message}`);
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          success: false,
          message: validation.message || undefined,
          data: undefined,
        };
      }

      // Step 4: Load context for intent decisions.
      let existingContext;
      if (userId) {
        try {
          existingContext =
            await this.aiPersistenceService.getExistingContext(userId);
        } catch (error) {
          this.logger.warn(
            `Failed to fetch context: ${(error as Error).message}`,
          );
          existingContext = undefined;
        }
      }

      // Step 5: Process the text pipeline.
      const result = this.processInput(sanitizedText, existingContext);

      const duration = Date.now() - startTime;
      this.logger.log(
        `Processed "${sanitizedText.substring(0, 50)}..." ` +
          `| Intent: ${result.data?.intent || 'none'} ` +
          `| Success: ${result.success} ` +
          `| Duration: ${duration}ms ` +
          `| User: ${userId}`,
      );

      return {
        statusCode: HttpStatus.OK,
        success: result.success,
        message:
          result.message ||
          (result.success
            ? 'Text processed successfully'
            : 'Processing failed'),
        data: {
          parsedData: result.data ?? null,
          classified: result.classified ?? null,
          fallbackToLLM: result.fallbackToLLM ?? false,
          confidence:
            result.confidence ?? result.classified?.confidence ?? null,
          rawInput: result.rawInput ?? sanitizedText,
          llmBackup: result.llmBackup ?? sanitizedText,
          _meta: {
            processedAt: new Date().toISOString(),
            processingTimeMs: duration,
            inputLength: sanitizedText.length,
          },
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Error processing text from user ${userId}: ${(error as Error).message}`,
        (error as Error).stack,
      );

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        success: false,
        message:
          'Something went wrong while processing your request. Please try again.',
        data: undefined,
      };
    }
  }

  processInput(rawInput: string, existingContext?: any): any {
    // Phase 1: Light normalization
    const { normalizedText, llmBackup, typoCount } =
      this.lightNormalization(rawInput);

    // Phase 2: Parsing and extraction
    const parsed = this.parseExtraction(normalizedText);

    // Phase 3: Intent classification and validation
    const classified = this.intentClassification(
      parsed,
      existingContext,
      typoCount,
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
        fallbackToLLM,
        message: fallbackToLLM
          ? 'This instruction will fall to LLM for manual review.'
          : clarification,
        classified,
      };
    }

    if (classified.shouldFallToLLM) {
      console.log(
        `[LLM Fallback] Confidence: ${classified.confidence} | Input: "${rawInput}" | Backup: "${llmBackup}"`,
      );
      return {
        success: false,
        fallbackToLLM: true,
        confidence: classified.confidence,
        message: `This prompt needs manual review. Confidence: ${classified.confidence}`,
        rawInput,
        llmBackup,
        classified,
      };
    }

    // Phase 4: Heavy normalization
    const parsedForPersistence = classified.resolvedParsedData || parsed;
    const normalized = this.heavyNormalization(parsedForPersistence);
    const prepared =
      this.aiPersistenceService.prepareNormalizedDataForPersistence(
        normalized,
        classified.expandedBoxes,
      );
    prepared.intent = classified.intent;
    prepared.confirmation = classified.confirmation;
    prepared.expandedBoxes = classified.expandedBoxes;
    prepared.suggestions = classified.suggestions;
    prepared.confidence = classified.confidence;
    prepared.meta = { ...prepared.meta, ...parsedForPersistence.meta };

    // Phase 5: Confirmation summary
    const confirmationSummary = this.generateConfirmationSummary(prepared);

    return {
      success: true,
      fallbackToLLM: false,
      message: confirmationSummary,
      data: prepared,
      classified,
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
      if (this.DISABLED_PHRASE_ALIASES.has(alias)) {
        continue;
      }
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
    return (
      input
        // Remove null bytes
        .replace(/\0/g, '')
        // Remove vertical tab and form feed
        .replace(/[\v\f]/g, '')
        // Normalize multiple spaces to single space
        .replace(/\s+/g, ' ')
        // Trim leading/trailing whitespace
        .trim()
    );
  }
}
