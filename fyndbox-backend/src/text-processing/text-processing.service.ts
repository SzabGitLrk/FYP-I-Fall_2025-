import { Injectable, Optional } from '@nestjs/common';
import wordsToNumbers from 'words-to-numbers';
import * as pluralize from 'pluralize';
import { DataSource } from 'typeorm';
import { DICTIONARY_CONFIG } from './dictionary.config';
import { Storage } from '../storage/storage.entity';

/**
 * TextProcessingService - Main service for processing user text input
 * 
 * Pipeline phases:
 * 1. Light Normalization - Basic text cleanup and typo correction
 * 2. Parsing & Extraction - Extract entities (storage, boxes, items) from text
 * 3. Intent Classification - Determine what user wants to do
 * 4. Heavy Normalization - Standardize entity names (title case, singular form)
 * 5. Database Persistence - Save to database
 * 6. Smart Acknowledgment - Generate user-friendly response
 */
@Injectable()
export class TextProcessingService {
    // Import dictionaries from config file for extensibility
    private readonly DICTIONARY = DICTIONARY_CONFIG;
    
    // Alias for backward compatibility
    private readonly PROTECTED_WORDS = DICTIONARY_CONFIG.PROTECTED_WORDS;
    private readonly STOP_WORDS = DICTIONARY_CONFIG.STOP_WORDS;
    private readonly NON_SINGULARIZABLE_WORDS = new Set(
        DICTIONARY_CONFIG.NON_SINGULARIZABLE_WORDS,
    );
    private readonly CUSTOM_NUMBER_MAP = DICTIONARY_CONFIG.CUSTOM_NUMBER_MAP;
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
    private readonly GENERIC_ENTITY_LABELS = new Set([
        'storage', 'storages', 'room', 'rooms', 'area', 'areas', 'space', 'spaces',
        'location', 'locations', 'box', 'boxes', 'bin', 'bins', 'crate', 'crates',
        'container', 'containers', 'item', 'items', 'object', 'objects', 'thing',
        'things', 'article', 'articles',
    ]);
    private readonly SPELLCHECK_CANDIDATES = this.buildSpellCheckCandidates();

    constructor(@Optional() private readonly dataSource?: DataSource) {}

    /**
     * Fetch user's existing context (storages, boxes, items) from database
     * Used for validation and suggestions like "already exists"
     * @param userId - The user's ID
     * @returns Object containing arrays of existing storages, boxes, and items
     */
    async getExistingContext(userId: string): Promise<{
        storages: Array<{ id: string; name: string; description?: string | null }>;
        boxes: Array<{ id: string; name: string; storageId: string }>;
        items: Array<{ id: string; name: string; quantity: number; boxId: string }>;
    }> {
        const context = {
            storages: [] as Array<{ id: string; name: string; description?: string | null }>,
            boxes: [] as Array<{ id: string; name: string; storageId: string }>,
            items: [] as Array<{ id: string; name: string; quantity: number; boxId: string }>,
        };

        try {
            if (!this.dataSource) {
                return context;
            }

            const storages = await this.dataSource.getRepository(Storage).find({
                where: { userId },
                relations: ['boxes', 'boxes.items'],
                order: { createdAt: 'DESC' },
            });

            context.storages = storages.map((storage) => ({
                id: storage.id,
                name: storage.name,
                description: storage.description ?? null,
            }));

            context.boxes = storages.flatMap((storage) =>
                (storage.boxes || []).map((box) => ({
                    id: box.id,
                    name: box.name,
                    storageId: storage.id,
                })),
            );

            context.items = storages.flatMap((storage) =>
                (storage.boxes || []).flatMap((box) =>
                    (box.items || []).map((item) => ({
                        id: item.id,
                        name: item.name,
                        quantity: item.quantity || 0,
                        boxId: box.id,
                    })),
                ),
            );
        } catch (error) {
            // If DB fetch fails, return empty context (will use defaults)
            console.warn('Failed to fetch existing context:', (error as Error).message);
        }

        return context;
    }
    /**
     * Calculate Levenshtein distance between two strings
     * Used for fuzzy matching and typo correction
     * @param a - First string to compare
     * @param b - Second string to compare
     * @returns Number of edits needed to transform a into b
     */
    private getLevenshteinDistance(a: string, b: string): number {
        const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
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
                if (
                    i > 1
                    && j > 1
                    && a[i - 1] === b[j - 2]
                    && a[i - 2] === b[j - 1]
                ) {
                    matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
                }
            }
        }
        return matrix[a.length][b.length];
    }

    private buildSpellCheckCandidates(): string[] {
        const sources = [
            ...Object.values(DICTIONARY_CONFIG.INTENTS).flat(),
            ...Object.values(DICTIONARY_CONFIG.ENTITIES).flat(),
            ...DICTIONARY_CONFIG.CONNECTORS,
            ...DICTIONARY_CONFIG.CONTAINMENT_KEYS,
            ...DICTIONARY_CONFIG.DESCRIPTION_KEYS,
            ...Object.entries(DICTIONARY_CONFIG.PHRASE_ALIASES)
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
            return candidate.charAt(0) === word.charAt(0) && (sameEnding || lengthDifference === 1);
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

    private buildKeywordAlternationPattern(entries: string[]): string {
        return Array.from(new Set(entries))
            .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .sort((a, b) => b.length - a.length)
            .join('|');
    }

    private buildSectionKeywordAlternationPattern(entries: string[]): string {
        const variants = entries.flatMap((entry) => {
            const normalized = entry.trim();
            if (!normalized) {
                return [];
            }

            return [
                normalized,
                pluralize.singular(normalized),
                pluralize.plural(normalized),
            ];
        });

        return this.buildKeywordAlternationPattern(variants);
    }

    private normalizeDescriptionText(description?: string | null): string {
        return (description || '')
            .trim()
            .replace(/\s+/g, ' ')
            .toLowerCase();
    }

    private extractStructuredDescription(
        value: string,
        descriptionKeys: string[],
    ): { name: string; description: string | null } {
        const trimmed = (value || '').trim();
        if (!trimmed) {
            return { name: '', description: null };
        }

        const descriptionPattern = this.buildKeywordAlternationPattern(descriptionKeys);
        if (!descriptionPattern) {
            return { name: trimmed, description: null };
        }

        const match = trimmed.match(
            new RegExp(
                `^(?<name>.+?)\\s+(?:${descriptionPattern})\\s+(?<description>.+)$`,
                'i',
            ),
        );

        if (!match?.groups?.name || !match.groups.description) {
            return { name: trimmed, description: null };
        }

        return {
            name: match.groups.name.trim(),
            description: match.groups.description.trim(),
        };
    }

    private isAdjacentTransposition(source: string, candidate: string): boolean {
        if (source.length !== candidate.length || source.length < 2) {
            return false;
        }

        for (let index = 0; index < source.length - 1; index++) {
            if (
                source[index] === candidate[index + 1]
                && source[index + 1] === candidate[index]
                && source.slice(0, index) === candidate.slice(0, index)
                && source.slice(index + 2) === candidate.slice(index + 2)
            ) {
                return true;
            }
        }

        return false;
    }

    private applySpellCheck(word: string): string {
        const lowerWord = word.toLowerCase();
        // Preserve mixed-case alphanumeric identifiers (e.g., cs1A, BSCS)
        if (/[a-zA-Z].*\d|\d.*[a-zA-Z]/.test(word)) return word;
        if (this.PROTECTED_WORDS.includes(lowerWord)) return lowerWord;
        if (this.SPELLCHECK_EXCLUDED_WORDS.has(lowerWord)) return lowerWord;
        if (this.SPELLCHECK_CANDIDATES.includes(lowerWord)) return lowerWord;

        const matches = this.SPELLCHECK_CANDIDATES
            .filter((candidate) => this.isEligibleSpellCheckMatch(lowerWord, candidate))
            .map((candidate) => ({
                candidate,
                distance: this.getLevenshteinDistance(lowerWord, candidate),
                lengthDifference: Math.abs(lowerWord.length - candidate.length),
                sameEnding: lowerWord.slice(-1) === candidate.slice(-1),
            }))
            .sort((a, b) => {
                if (a.distance !== b.distance) return a.distance - b.distance;
                if (a.sameEnding !== b.sameEnding) return Number(b.sameEnding) - Number(a.sameEnding);
                if (a.lengthDifference !== b.lengthDifference) return a.lengthDifference - b.lengthDifference;
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
            result = result.replace(new RegExp(`\\b${key}\\b`, 'gi'), value.toString());
        }
        const protect = [{ word: 'a', p: '___A_PROT___' }, { word: 'to', p: '___TO_PROT___' }, { word: 'for', p: '___FOR_PROT___' }];
        protect.forEach(p => result = result.replace(new RegExp(`\\b${p.word}\\b`, 'gi'), p.p));
        const converted = wordsToNumbers(result);
        let final = converted ? converted.toString() : result;
        protect.forEach(p => final = final.replace(new RegExp(p.p, 'g'), p.word));
        return final;
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
            const firstToken = tokens[0].replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '').toLowerCase();
            if (!boundaryStopWords.has(firstToken)) break;
            tokens.shift();
        }

        while (tokens.length > 2) {
            const lastIndex = tokens.length - 1;
            const lastToken = tokens[lastIndex].replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '').toLowerCase();
            if (!boundaryStopWords.has(lastToken)) break;
            tokens.pop();
        }

        result = tokens.join(' ');
        return result.trim().replace(/\s+/g, ' ');
    }

    private isShouting(text: string): boolean {
        const alphas = text.replace(/[^a-zA-Z]/g, '');
        if (alphas.length === 0) return false;
        const uppers = alphas.replace(/[^A-Z]/g, '');
        return (uppers.length / alphas.length) > 0.3;
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

                // Preserve likely acronyms while lowering the rest of a "shouting" sentence.
                if (token.length >= 4 && token === token.toUpperCase()) {
                    return token;
                }

                return token.toLowerCase();
            })
            .join('');
    }

    lightNormalization(text: string): { normalizedText: string, llmBackup: string, typoCount: number } {
        if (!text) return { normalizedText: '', llmBackup: '', typoCount: 0 };
        let input = this.isShouting(text) ? this.normalizeShoutingInput(text) : text;
        let cleaned = input.replace(/[\u200B-\u200D\uFEFF]/g, '').trim().replace(/\s+/g, ' ');
        cleaned = this.removeStopWords(cleaned);
        cleaned = this.applyPhraseAliases(cleaned.trim().replace(/\s+/g, ' '));
        cleaned = this.convertWordsToNumbers(cleaned.trim().replace(/\s+/g, ' '));
        const tokens = cleaned.split(/(\b)/);
        let typoCount = 0;
        const result = tokens.map(t => {
            if (!t.match(/^[a-zA-Z0-9]+$/)) return t;
            if (t.match(/^[A-Z]{3,}$/)) return t;
            const corrected = this.applySpellCheck(t);
            if (corrected !== t.toLowerCase() && corrected !== t) typoCount++;
            return corrected;
        }).join('').replace(/\s+/g, ' ').trim();
        return { normalizedText: result, llmBackup: result, typoCount };
    }

    /**
     * Phase 2, 4, 5, 6, 7 & 8: Parsing & Extraction (Linear Entity Accumulator)
     */
    parseExtraction(normalizedText: string): any {
        if (!normalizedText) return { intent: null, storageName: null, storageDescription: null, boxes: [], items: [], ambiguous: false };

        const dict = this.DICTIONARY;
        const intentSyns = Object.values(dict.INTENTS).flat();
        const storageSyns = dict.ENTITIES.STORAGE;
        const boxSyns = dict.ENTITIES.BOX;
        const itemSyns = dict.ENTITIES.ITEM;
        const conjunctions = ['and', 'then', 'but', 'also'];
        const articles = ['the', 'a', 'an'];
        const genericReferences = ['it', 'them', 'that', 'those'];
        const transitionPhrases = ['which', 'where'];
        const descKeys = dict.DESCRIPTION_KEYS;
        const containmentKeys = dict.CONTAINMENT_KEYS;
        const overlappingConnectorDescriptionKeys = new Set(
            dict.CONNECTORS.filter((key) => descKeys.includes(key)),
        );
        // "to" added as connector for directional phrases ("add X to Y")
        const connectors = [...dict.CONNECTORS, ...containmentKeys, 'for', 'with', 'including', 'to', 'from'];

        // 1. Intent Detection (collects ALL intent types found)
        const intentsFound = new Map<string, number>();
        Object.entries(dict.INTENTS).forEach(([intent, syns]) => {
            syns.forEach(syn => {
                const regex = new RegExp(`\\b${syn}\\b`, 'gi');
                let match; while ((match = regex.exec(normalizedText))) {
                    const key = intent.toLowerCase();
                    if (!intentsFound.has(key) || match.index < intentsFound.get(key)!) intentsFound.set(key, match.index);
                }
            });
        });
        // Raw intent: single intent or handle CREATE+INCREMENT combo
        let extractedIntent: string | null = null;
        if (intentsFound.size === 1) {
            extractedIntent = intentsFound.keys().next().value;
        } else if (intentsFound.size === 2 && intentsFound.has('create') && intentsFound.has('increment')) {
            // Multi-sentence: "Create box. Then add items" → treat as 'create'
            extractedIntent = 'create';
        }
        const orderedIntents = Array.from(intentsFound.entries())
            .sort((left, right) => left[1] - right[1])
            .map(([intentName]) => intentName);
        const compatibleIntentMap: Record<string, string[]> = {
            create: ['create', 'increment'],
            increment: ['increment', 'create', 'update'],
            decrement: ['decrement'],
            update: ['update', 'increment'],
        };
        if (!extractedIntent && orderedIntents.length > 0) {
            const primaryIntent = orderedIntents[0];
            const compatibleIntents = compatibleIntentMap[primaryIntent] || [primaryIntent];
            if (orderedIntents.every((intentName) => compatibleIntents.includes(intentName))) {
                extractedIntent = primaryIntent;
            }
        }
        const isAmbiguous = intentsFound.size > 1 && extractedIntent === null;

        // 2. Tokenized Scanning
        const allKeywords = [...intentSyns, ...storageSyns, ...boxSyns, ...itemSyns, ...connectors, ...conjunctions, ...descKeys, ...articles];
        const greedyDelimPattern = allKeywords.sort((a, b) => b.length - a.length).join('|');
        const splitRegex = new RegExp(`(\\b(?:${greedyDelimPattern})\\b|[.,:()]|\\b\\d+\\b)`, 'gi');
        const parts = normalizedText.split(splitRegex).filter(p => p !== undefined);

        let storageName: string | null = null;
        let storageDescription: string | null = null;
        let boxes: any[] = [];
        let items: any[] = [];

        let currentMode: 'STORAGE' | 'BOX' | 'ITEM' | 'NONE' = 'NONE';
        let isParsingDescription = false;
        let pendingQuantity: number | null = null;
        let activeBoxRef: string | null = null;
        let expectNameTokens = false;
        let boxRefCounter = 1;

        let currentBoxCluster: string[] = [];
        let currentItemCluster: number[] = [];
        let accumulator = '';

        const groupedStorageSectionPattern = this.buildSectionKeywordAlternationPattern(storageSyns);
        const groupedBoxSectionPattern = this.buildSectionKeywordAlternationPattern(boxSyns);
        const groupedItemSectionPattern = this.buildSectionKeywordAlternationPattern(itemSyns);
        const keywordFlags = {
            storageKeywordSeen: new RegExp(`\\b(?:${groupedStorageSectionPattern})\\b`, 'i').test(normalizedText),
            boxKeywordSeen: new RegExp(`\\b(?:${groupedBoxSectionPattern})\\b`, 'i').test(normalizedText),
            itemKeywordSeen: new RegExp(`\\b(?:${groupedItemSectionPattern})\\b`, 'i').test(normalizedText),
        };
        const groupedNameConnectorPattern = this.buildKeywordAlternationPattern([
            'named',
            'called',
            'labeled',
            'labelled',
            'titled',
            'known as',
        ]);
        const structuredDescriptionKeys = descKeys.filter((entry) => entry.toLowerCase() !== 'with');
        const groupedStorageDescriptionPattern = this.buildKeywordAlternationPattern(
            structuredDescriptionKeys,
        );
        const groupedSectionMatch = normalizedText.match(
            new RegExp(
                `^(?<intent>\\w+)\\s+(?:a\\s+)?(?:${groupedStorageSectionPattern})\\s+(?:(?:${groupedNameConnectorPattern})\\s+)?(?<storage>.+?)(?:\\s+(?:${groupedStorageDescriptionPattern})\\s+(?<storageDesc>.+?))?\\s+containing\\s+(?:${groupedBoxSectionPattern}):\\s+(?<rest>.+)$`,
                'i',
            ),
        );
        const multiBoxEachMatch = normalizedText.match(
            new RegExp(
                `^(?<intent>\\w+)\\s+(?:a\\s+)?(?:${groupedStorageSectionPattern})\\s+(?:(?:${groupedNameConnectorPattern})\\s+)?(?<storage>.+?)(?:\\s+(?:${groupedStorageDescriptionPattern})\\s+(?<storageDesc>.+?))?\\s+(?:with|containing)\\s+(?<boxQty>\\d+)\\s+(?:${groupedBoxSectionPattern})(?:\\s+of)?\\s+(?<boxName>[a-zA-Z0-9 ]+?)\\s+(?:(?:each\\s+has)\\s+(?:(?<itemQty>\\d+)\\s+(?:${groupedItemSectionPattern})(?:\\s+of)?\\s+(?<itemName>[a-zA-Z0-9 ]+)|(?:${groupedItemSectionPattern})\\s+(?<itemQtyAlt>\\d+)\\s+(?:of\\s+)?(?<itemNameAlt>[a-zA-Z0-9 ]+))|with\\s+(?:(?<itemQtyWith>\\d+)\\s+(?<itemNameWith>[a-zA-Z0-9 ]+?)|(?<itemNameWithAlt>[a-zA-Z0-9 ]+?)\\s+(?<itemQtyWithAlt>\\d+))\\s+(?:in\\s+each|each))$`,
                'i',
            ),
        );
        if (multiBoxEachMatch?.groups) {
            const itemQuantity = multiBoxEachMatch.groups.itemQty
                ? parseInt(multiBoxEachMatch.groups.itemQty, 10)
                : multiBoxEachMatch.groups.itemQtyAlt
                    ? parseInt(multiBoxEachMatch.groups.itemQtyAlt, 10)
                    : multiBoxEachMatch.groups.itemQtyWith
                        ? parseInt(multiBoxEachMatch.groups.itemQtyWith, 10)
                        : parseInt(multiBoxEachMatch.groups.itemQtyWithAlt, 10);
            const rawItemName = (
                multiBoxEachMatch.groups.itemName
                || multiBoxEachMatch.groups.itemNameAlt
                || multiBoxEachMatch.groups.itemNameWith
                || multiBoxEachMatch.groups.itemNameWithAlt
            )?.trim();
            const { name: itemName, description: itemDescription } = rawItemName
                ? this.extractStructuredDescription(rawItemName, structuredDescriptionKeys)
                : { name: '', description: null };
            const { name: boxName, description: boxDescription } = this.extractStructuredDescription(
                multiBoxEachMatch.groups.boxName.trim(),
                structuredDescriptionKeys,
            );
            const allWords = normalizedText.split(/\s+/).filter((w) => w.length > 0);

            return {
                intent: 'create',
                storageName: multiBoxEachMatch.groups.storage.trim(),
                storageDescription: multiBoxEachMatch.groups.storageDesc?.trim() || null,
                boxes: [
                    {
                        name: boxName,
                        quantity: parseInt(multiBoxEachMatch.groups.boxQty, 10),
                        description: boxDescription,
                        clientRef: 'b1',
                    },
                ],
                items: itemName
                    ? [
                        {
                            name: itemName,
                            quantity: itemQuantity,
                            explicitQuantity: true,
                            replicatePerExpandedBox: true,
                            description: itemDescription,
                            boxClientRef: 'b1',
                            orphaned: false,
                        },
                    ]
                    : [],
                boxName: boxName,
                boxQuantity: parseInt(multiBoxEachMatch.groups.boxQty, 10),
                boxDescription: boxDescription,
                ambiguous: false,
                rawIntents: ['create'],
                totalWords: allWords.length,
                extractedWordCount: allWords.length,
                meta: {
                    mappingStrategy: 'sequential',
                    preIntentLocationOverflow: false,
                    ...keywordFlags,
                },
            };
        }
        if (
            /\beach\b/i.test(normalizedText)
            && new RegExp(
                `\\b\\d+\\s+(?:${groupedBoxSectionPattern})\\b`,
                'i',
            ).test(normalizedText)
        ) {
            return {
                intent: null,
                storageName: null,
                storageDescription: null,
                boxes: [],
                items: [],
                ambiguous: false,
                rawIntents: extractedIntent ? [extractedIntent] : [],
                totalWords: normalizedText.split(/\s+/).filter((w) => w.length > 0).length,
                extractedWordCount: 0,
                meta: {
                    incompleteStructuredQuantity: true,
                    preIntentLocationOverflow: false,
                    ...keywordFlags,
                },
            };
        }
        if (groupedSectionMatch?.groups) {
            const rest = groupedSectionMatch.groups.rest.trim();
            const groupedBoxes: any[] = [];
            const groupedItems: any[] = [];
            let groupedRefCounter = 1;
            const itemSectionPattern = new RegExp(
                `\\s+(?:${groupedItemSectionPattern}):\\s+`,
                'i',
            );
            const itemSectionMatch = itemSectionPattern.exec(rest);

            if (itemSectionMatch) {
                const itemSectionStart = itemSectionMatch.index;
                const itemSectionEnd = itemSectionStart + itemSectionMatch[0].length;
                const boxSegmentParts = rest
                    .slice(0, itemSectionStart)
                    .split(/\s+and\s+/i)
                    .map((part) => part.trim())
                    .filter(Boolean);
                const itemSegmentParts = rest
                    .slice(itemSectionEnd)
                    .split(/\s+and\s+/i)
                    .map((part) => part.trim())
                    .filter(Boolean);

                for (const segment of boxSegmentParts) {
                    const segmentMatch = segment.match(
                        /^(?:(?<boxQty>\d+)\s+)?(?<boxName>[a-zA-Z0-9 ]+)$/i,
                    );
                    if (!segmentMatch?.groups?.boxName) {
                        groupedBoxes.length = 0;
                        groupedItems.length = 0;
                        break;
                    }
                    const { name: boxName, description: boxDescription } = this.extractStructuredDescription(
                        segmentMatch.groups.boxName.trim(),
                        structuredDescriptionKeys,
                    );

                    groupedBoxes.push({
                        name: boxName,
                        quantity: segmentMatch.groups.boxQty
                            ? parseInt(segmentMatch.groups.boxQty, 10)
                            : null,
                        description: boxDescription,
                        clientRef: `b${groupedRefCounter++}`,
                    });
                }

                for (const [index, segment] of itemSegmentParts.entries()) {
                    const segmentMatch = segment.match(
                        /^(?:(?<leadingQty>\d+)\s+)?(?<itemName>[a-zA-Z0-9 ]+?)(?:\s+(?<trailingQty>\d+))?(?:\s+(?<replicate>in\s+each|each))?$/i,
                    );
                    if (!segmentMatch?.groups?.itemName || groupedBoxes.length === 0) {
                        groupedBoxes.length = 0;
                        groupedItems.length = 0;
                        break;
                    }

                    const quantity = segmentMatch.groups.leadingQty
                        ? parseInt(segmentMatch.groups.leadingQty, 10)
                        : segmentMatch.groups.trailingQty
                            ? parseInt(segmentMatch.groups.trailingQty, 10)
                            : 1;
                    const replicatePerExpandedBox = !!segmentMatch.groups.replicate;
                    const targetBox = groupedBoxes[Math.min(index, groupedBoxes.length - 1)];
                    const { name: itemName, description: itemDescription } = this.extractStructuredDescription(
                        segmentMatch.groups.itemName.trim(),
                        structuredDescriptionKeys,
                    );
                    groupedItems.push({
                        name: itemName,
                        quantity,
                        explicitQuantity: true,
                        replicatePerExpandedBox,
                        description: itemDescription,
                        boxClientRef: targetBox.clientRef,
                        orphaned: false,
                    });
                }
            } else {
                const segmentParts = rest.split(/\s+and\s+/i).map((part) => part.trim()).filter(Boolean);
                const simpleBoxOnly = segmentParts.every((segment) =>
                    /^[a-zA-Z0-9 ]+$/.test(segment)
                    && !/^\d+\b/.test(segment)
                    && !/\beach\b/i.test(segment),
                );

                if (simpleBoxOnly) {
                    for (const segment of segmentParts) {
                        const { name: boxName, description: boxDescription } = this.extractStructuredDescription(
                            segment.trim(),
                            structuredDescriptionKeys,
                        );
                        groupedBoxes.push({
                            name: boxName,
                            quantity: null,
                            description: boxDescription,
                            clientRef: `b${groupedRefCounter++}`,
                        });
                    }
                } else {
                    for (const segment of segmentParts) {
                        const segmentMatch = segment.match(
                            /^(?<boxQty>\d+)\s+(?<boxName>[a-zA-Z0-9 ]+?)(?:\s+(?<itemQty>\d+)\s+(?<itemName>[a-zA-Z0-9 ]+?)\s+each)?$/i,
                        );
                        if (!segmentMatch?.groups) {
                            groupedBoxes.length = 0;
                            groupedItems.length = 0;
                            break;
                        }
                        const { name: boxName, description: boxDescription } = this.extractStructuredDescription(
                            segmentMatch.groups.boxName.trim(),
                            structuredDescriptionKeys,
                        );

                        const clientRef = `b${groupedRefCounter++}`;
                        groupedBoxes.push({
                            name: boxName,
                            quantity: parseInt(segmentMatch.groups.boxQty, 10),
                            description: boxDescription,
                            clientRef,
                        });

                        if (segmentMatch.groups.itemQty && segmentMatch.groups.itemName) {
                            const { name: itemName, description: itemDescription } = this.extractStructuredDescription(
                                segmentMatch.groups.itemName.trim(),
                                structuredDescriptionKeys,
                            );
                            groupedItems.push({
                                name: itemName,
                                quantity: parseInt(segmentMatch.groups.itemQty, 10),
                                explicitQuantity: true,
                                replicatePerExpandedBox: true,
                                description: itemDescription,
                                boxClientRef: clientRef,
                                orphaned: false,
                            });
                        }
                    }
                }
            }

            if (groupedBoxes.length > 0) {
                const allWords = normalizedText.split(/\s+/).filter((w) => w.length > 0);
                return {
                    intent: 'create',
                    storageName: groupedSectionMatch.groups.storage.trim(),
                    storageDescription: groupedSectionMatch.groups.storageDesc?.trim() || null,
                    boxes: groupedBoxes,
                    items: groupedItems,
                    boxName: groupedBoxes[0]?.name ?? null,
                    boxQuantity: groupedBoxes[0]?.quantity ?? null,
                    boxDescription: groupedBoxes[0]?.description ?? null,
                    ambiguous: false,
                    rawIntents: ['create'],
                    totalWords: allWords.length,
                    extractedWordCount: allWords.length,
                    meta: {
                        mappingStrategy: groupedItems.length > 0 ? 'sequential' : 'direct',
                        preIntentLocationOverflow: false,
                        ...keywordFlags,
                    },
                };
            }

            return {
                intent: extractedIntent,
                storageName: groupedSectionMatch.groups.storage.trim(),
                storageDescription: groupedSectionMatch.groups.storageDesc?.trim() || null,
                boxes: [],
                items: [],
                ambiguous: false,
                rawIntents: extractedIntent ? [extractedIntent] : [],
                totalWords: normalizedText.split(/\s+/).filter((w) => w.length > 0).length,
                extractedWordCount: 0,
                meta: {
                    incompleteStructuredQuantity: true,
                    preIntentLocationOverflow: false,
                    ...keywordFlags,
                },
            };
        }

        // Track nested "in" contexts before intent verb
        let preIntentInContexts: string[] = [];
        let preIntentInCount = 0;
        let preIntentLocationOverflow = false;
        let seenIntentVerb = false;
        let usedPreIntentContext = false;
        const nameConnectors = new Set(
            dict.CONNECTORS.filter((connector) => !['in', 'to', 'from', 'under'].includes(connector)),
        );

        const createBoxRef = () => `b${boxRefCounter++}`;
        const registerBox = (name: string, quantity: number | null, orphaned: boolean) => {
            const ref = createBoxRef();
            boxes.push({ name, quantity, description: null, clientRef: ref, orphaned });
            pendingQuantity = null;
            items.forEach((it) => {
                if (it.orphaned && !it.boxClientRef) {
                    it.boxClientRef = ref;
                    it.orphaned = false;
                }
            });
            activeBoxRef = ref;
            currentBoxCluster.push(ref);
        };

        const finalize = (fallbackName?: string) => {
            let trimmed = accumulator.replace(/^[,.:;\s]+|[,.:;\s]+$/g, '').trim();
            accumulator = '';
            let resolvedQuantity = pendingQuantity;
            let quantityWasExplicit = pendingQuantity !== null;

            if (!trimmed && resolvedQuantity && fallbackName) trimmed = fallbackName;
            if (!trimmed) return;

            // Strip leading "of " from accumulated text (e.g., "of eggs" → "eggs")
            trimmed = trimmed.replace(/^of\s+/i, '');
            // Strip quantity filler words (e.g., "more hammer" → "hammer")
            trimmed = trimmed.replace(/^more\s+/i, '');

            // Filter out generic references
            if (genericReferences.includes(trimmed.toLowerCase()) && !isParsingDescription) return;

            if (isParsingDescription) {
                if (currentMode === 'STORAGE') {
                    storageDescription = storageDescription ? `${storageDescription} ${trimmed}` : trimmed;
                } else if (currentMode === 'BOX' && currentBoxCluster.length > 0) {
                    const b = boxes.find(x => x.clientRef === currentBoxCluster[currentBoxCluster.length - 1]);
                    if (b) b.description = b.description ? `${b.description} ${trimmed}` : trimmed;
                } else if ((currentMode === 'ITEM' || currentMode === 'NONE') && items.length > 0) {
                    const it = items[items.length - 1];
                    it.description = it.description ? `${it.description} ${trimmed}` : trimmed;
                }
            } else {
                if (currentMode === 'STORAGE' && !storageName) {
                    storageName = trimmed;
                    boxes.forEach(b => { if (b.orphaned) b.orphaned = false; });
                } else if (currentMode === 'BOX') {
                    registerBox(trimmed, resolvedQuantity, true);
                } else {
                    if (currentMode === 'ITEM' && resolvedQuantity === null) {
                        const trailingQuantityMatch = trimmed.match(/^(.*\D)\s+(\d+)$/);
                        if (trailingQuantityMatch) {
                            trimmed = trailingQuantityMatch[1].trim();
                            resolvedQuantity = parseInt(trailingQuantityMatch[2], 10);
                            quantityWasExplicit = true;
                        }
                    }

                    items.push({
                        name: trimmed,
                        quantity: resolvedQuantity || 1,
                        explicitQuantity: quantityWasExplicit,
                        description: null,
                        boxClientRef: activeBoxRef,
                        orphaned: activeBoxRef === null
                    });
                    pendingQuantity = null;
                    currentItemCluster.push(items.length - 1);
                }
            }

            expectNameTokens = false;
        };

        const detectContextInLookahead = (startIndex: number): 'STORAGE' | 'BOX' | 'ITEM' | null => {
            for (let j = startIndex; j < Math.min(startIndex + 5, parts.length); j++) {
                const look = (parts[j] || '').trim().toLowerCase();
                if (!look) continue;
                if (storageSyns.includes(look)) return 'STORAGE';
                if (boxSyns.includes(look)) return 'BOX';
                if (itemSyns.includes(look)) return 'ITEM';
            }
            return null;
        };

        const resolveKeywordMode = (
            token: string,
        ): {
            targetMode: 'STORAGE' | 'BOX' | 'ITEM' | 'NONE';
            forceDescription: boolean;
        } => {
            if (storageSyns.includes(token)) {
                return { targetMode: 'STORAGE', forceDescription: false };
            }

            if (boxSyns.includes(token)) {
                return { targetMode: 'BOX', forceDescription: false };
            }

            if (containmentKeys.includes(token)) {
                return {
                    targetMode: currentMode === 'ITEM' ? 'NONE' : 'ITEM',
                    forceDescription: currentMode === 'ITEM',
                };
            }

            if (itemSyns.includes(token)) {
                return { targetMode: 'ITEM', forceDescription: false };
            }

            if (descKeys.includes(token)) {
                if (overlappingConnectorDescriptionKeys.has(token)) {
                    const shouldDescribe = currentMode !== 'NONE' && accumulator.trim().length > 0;
                    return {
                        targetMode: 'NONE',
                        forceDescription: shouldDescribe,
                    };
                }

                return { targetMode: 'NONE', forceDescription: true };
            }

            return { targetMode: 'NONE', forceDescription: false };
        };

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i].trim();
            if (!part) continue;
            const lower = part.toLowerCase();

            // Punctuation — finalize but DON'T reset mode (supports multi-sentence)
            if (lower.match(/^[.,:()-]$/)) {
                finalize();
                if (lower === '(') isParsingDescription = true;
                if (lower === ')') isParsingDescription = false;
                // Period/comma: just finalize, mode carries over for multi-sentence
                continue;
            }

            if (!isParsingDescription && expectNameTokens && currentMode !== 'NONE') {
                let nextNonEmptyToken = '';
                for (let j = i + 1; j < parts.length; j++) {
                    nextNonEmptyToken = (parts[j] || '').trim().toLowerCase();
                    if (nextNonEmptyToken) break;
                }
                const isEntitySectionHeader = (
                    (storageSyns.includes(lower) || boxSyns.includes(lower) || itemSyns.includes(lower))
                    && nextNonEmptyToken === ':'
                );
                const isStructuralBoundary = (
                    intentSyns.includes(lower)
                    || conjunctions.includes(lower)
                    || transitionPhrases.includes(lower)
                    || descKeys.includes(lower)
                    || containmentKeys.includes(lower)
                    || isEntitySectionHeader
                    || lower === 'in'
                    || ['to', 'from', 'under'].includes(lower)
                    || nameConnectors.has(lower)
                );
                const isBoxIdLabel = (
                    currentMode === 'BOX'
                    && !accumulator.trim()
                    && /^\d+$/.test(part)
                    && parts
                        .slice(i + 1, i + 4)
                        .some((look) => ['.', ':', '-', ')'].includes((look || '').trim()))
                );

                if (isBoxIdLabel) {
                    continue;
                }

                if (!/^\d+$/.test(part) && !isStructuralBoundary && !this.GENERIC_ENTITY_LABELS.has(lower)) {
                    accumulator = accumulator ? `${accumulator} ${part}` : part;
                    continue;
                }
            }

            if (preIntentInContexts.length > 0 && preIntentInContexts[preIntentInContexts.length - 1] === 'pending') {
                if (conjunctions.includes(lower) && accumulator.trim() && storageName) {
                    const trimmed = accumulator.replace(/^[,.:;\s]+|[,.:;\s]+$/g, '').trim();
                    accumulator = '';
                    if (trimmed) {
                        registerBox(trimmed, null, false);
                        usedPreIntentContext = true;
                    }
                    continue;
                }

                accumulator = accumulator ? `${accumulator} ${part}` : part;

                let nextRelevant = '';
                for (let j = i + 1; j < parts.length; j++) {
                    nextRelevant = (parts[j] || '').trim().toLowerCase();
                    if (nextRelevant) break;
                }
                const nextLooksLikeVerb = (
                    intentSyns.includes(nextRelevant)
                    && !storageSyns.includes(nextRelevant)
                    && !boxSyns.includes(nextRelevant)
                    && !itemSyns.includes(nextRelevant)
                );
                if (nextRelevant === 'in' || nextLooksLikeVerb) {
                    const trimmed = accumulator.replace(/^[,.:;\s]+|[,.:;\s]+$/g, '').trim();
                    accumulator = '';
                    if (trimmed) {
                        if (!storageName) {
                            storageName = trimmed;
                            preIntentInContexts[preIntentInContexts.length - 1] = 'storage';
                            usedPreIntentContext = true;
                        } else {
                            registerBox(trimmed, null, false);
                            preIntentInContexts[preIntentInContexts.length - 1] = 'box';
                            usedPreIntentContext = true;
                        }
                    }
                }
                continue;
            }

            // Keyword Mode Switching
            const resolvedKeyword = resolveKeywordMode(lower);
            let targetMode: 'STORAGE' | 'BOX' | 'ITEM' | 'NONE' = resolvedKeyword.targetMode;
            if (resolvedKeyword.forceDescription) {
                if (lower === 'with' && (currentMode === 'NONE' || accumulator === '')) { /* pass */ }
                else { finalize(); isParsingDescription = true; continue; }
            } else if (intentSyns.includes(lower)) {
                finalize();
                seenIntentVerb = true;
                const ctx = detectContextInLookahead(i + 1);
                currentMode = ctx || 'ITEM';
                expectNameTokens = false;
                isParsingDescription = false; continue;
            }

            if (targetMode !== 'NONE') {
                if (isParsingDescription) {
                    if (targetMode !== currentMode) { finalize(); isParsingDescription = false; }
                    else { accumulator = accumulator ? `${accumulator} ${part}` : part; continue; }
                }

                // Allow same-mode accumulation (e.g. "Larkana Store")
                if (targetMode === currentMode && accumulator.trim()) {
                    accumulator = accumulator ? `${accumulator} ${part}` : part; continue;
                }

                if (accumulator.trim()) finalize();

                if (targetMode === 'BOX' && currentItemCluster.length > 0) {
                    this.applySequentialMapping(currentBoxCluster, currentItemCluster, items);
                    currentBoxCluster = []; currentItemCluster = [];
                }
                currentMode = targetMode;
                expectNameTokens = true;
                continue;
            }

            // Connectors
            if (conjunctions.includes(lower) || connectors.includes(lower)) {
                if (isParsingDescription) {
                    if (lower === 'in') {
                        let nextNonEmpty = '';
                        for (let j = i + 1; j < parts.length; j++) {
                            nextNonEmpty = (parts[j] || '').trim().toLowerCase();
                            if (nextNonEmpty) break;
                        }

                        if (transitionPhrases.includes(nextNonEmpty)) {
                            finalize();
                            isParsingDescription = false;
                            continue;
                        }
                    }

                    let nextIsEntity = false;
                    for (let j = i + 1; j < parts.length; j++) {
                        const next = (parts[j] || '').trim().toLowerCase();
                        if (!next) continue;
                        if (next.match(/^\d+$/) || storageSyns.includes(next) || boxSyns.includes(next) || itemSyns.includes(next)) { nextIsEntity = true; break; }
                        if (allKeywords.includes(next)) break;
                    }
                    if (nextIsEntity) { finalize(); isParsingDescription = false; continue; }
                } else {
                    if (nameConnectors.has(lower) && currentMode !== 'NONE') {
                        if (accumulator.trim()) {
                            finalize();
                        }
                        expectNameTokens = true;
                        continue;
                    }

                    // Handle "in" connector
                    if (lower === 'in' && i < parts.length - 1) {
                        // Check for "in which" → context-aware transition
                        let nextNonEmpty = '';
                        for (let j = i + 1; j < parts.length; j++) {
                            nextNonEmpty = (parts[j] || '').trim().toLowerCase();
                            if (nextNonEmpty) break;
                        }
                        if (transitionPhrases.includes(nextNonEmpty)) {
                            finalize();
                            // "in which" → use verb lookahead to determine mode (not forced ITEM)
                            // Look past "which" for the next verb's context
                            let postWhichIdx = i + 1;
                            for (; postWhichIdx < parts.length; postWhichIdx++) {
                                const look = (parts[postWhichIdx] || '').trim().toLowerCase();
                                if (look && !transitionPhrases.includes(look)) break;
                            }
                            // Now look for intent verb and its context
                            for (let j = postWhichIdx; j < parts.length; j++) {
                                const look = (parts[j] || '').trim().toLowerCase();
                                if (!look) continue;
                                if (intentSyns.includes(look)) {
                                    const ctx = detectContextInLookahead(j + 1);
                                    currentMode = ctx || 'ITEM';
                                    break;
                                }
                                break;
                            }
                            continue;
                        }

                        if (!seenIntentVerb && currentMode === 'NONE' && !accumulator.trim() && !pendingQuantity) {
                            finalize(pendingQuantity ? 'items' : undefined);
                            if (preIntentInCount >= 2) {
                                preIntentLocationOverflow = true;
                                continue;
                            }
                            preIntentInContexts.push('pending');
                            preIntentInCount += 1;
                            continue;
                        }

                        // Standard "in" context detection
                        if (accumulator === '') {
                            const ctx = detectContextInLookahead(i + 1);
                            if (ctx) {
                                finalize(pendingQuantity ? 'items' : undefined);
                                currentMode = ctx;
                                expectNameTokens = false;
                                continue;
                            }
                            // No entity keyword found. Collect as pre-intent "in" context
                            if (!seenIntentVerb) {
                                if (preIntentInCount >= 2) {
                                    preIntentLocationOverflow = true;
                                    continue;
                                }
                                preIntentInContexts.push('pending');
                                preIntentInCount += 1;
                                continue;
                            }
                        }
                    }

                    // Handle "of" → skip it (quantity carries forward)
                    if (lower === 'of') {
                        continue;
                    }

                    // Handle "to" → finalize and skip (directional: "add X to Y")
                    if (lower === 'to') {
                        finalize(pendingQuantity ? 'items' : undefined);
                        continue;
                    }

                    // Handle "for" as a name connector after BOX or STORAGE mode
                    if (lower === 'for' && (currentMode === 'BOX' || currentMode === 'STORAGE') && accumulator === '') {
                        // "box for shirts" / "storage for my tools" — "for" acts like "named"
                        expectNameTokens = true;
                        continue;
                    }

                    let nameInSight = false;
                    for (let j = i + 1; j < parts.length; j++) {
                        const look = (parts[j] || '').trim().toLowerCase();
                        if (!look) continue;
                        if (look.match(/^[.,:()]$/) || allKeywords.includes(look)) break;
                        nameInSight = true; break;
                    }
                    finalize(!nameInSight && pendingQuantity ? 'items' : undefined);
                    if (conjunctions.includes(lower) && (currentMode === 'BOX' || currentMode === 'ITEM')) {
                        expectNameTokens = true;
                    }
                    continue;
                }
            }

            // Transition phrases ("which", "where") — skip them
            if (transitionPhrases.includes(lower)) {
                continue;
            }

            // Articles
            if (articles.includes(lower)) {
                if (!isParsingDescription) {
                    if (lower === 'a' && currentMode === 'BOX' && accumulator === '') {
                        let boxKeywordNext = false;
                        for (let j = i + 1; j < parts.length; j++) {
                            const look = (parts[j] || '').trim().toLowerCase();
                            if (!look) continue;
                            if (boxSyns.includes(look)) { boxKeywordNext = true; break; }
                            if (look.match(/^[a-zA-Z0-9]+$/)) break;
                        }
                        if (boxKeywordNext) continue;
                    } else continue;
                }
            }

            // Numbers
            if (part.match(/^\d+$/)) {
                let isID = false;
                for (let j = i + 1; j < Math.min(i + 5, parts.length); j++) {
                    const look = (parts[j] || '').trim().toLowerCase();
                    if (!look) continue;
                    if (look.match(/^[:-]$/)) { isID = true; break; }
                    if (!look.match(/^[.,:()]$/)) break;
                }
                if (isID) continue;

                let isCount = false;
                const countConfirmConnectors = ['to', 'of', 'for'];
                for (let j = i + 1; j < parts.length; j++) {
                    const look = (parts[j] || '').trim().toLowerCase();
                    if (!look) continue;
                    if (look.match(/^[.,:()]$/)) break;
                    if (storageSyns.includes(look) || boxSyns.includes(look) || itemSyns.includes(look)) { isCount = true; break; }
                    // "3 to box", "12 of eggs", "5 for shipping" → number is always a count
                    if (countConfirmConnectors.includes(look)) { isCount = true; break; }
                    if (!allKeywords.includes(look)) { isCount = true; break; }
                    break;
                }
                if (isCount) {
                    if (accumulator.trim()) finalize();
                    pendingQuantity = parseInt(part, 10); continue;
                }
            }

            // Pre-intent "in" context: assign accumulated text as storage or box(es)
            if (preIntentInContexts.length > 0 && preIntentInContexts[preIntentInContexts.length - 1] === 'pending') {
                if (conjunctions.includes(lower) && accumulator.trim() && storageName) {
                    const trimmed = accumulator.replace(/^[,.:;\s]+|[,.:;\s]+$/g, '').trim();
                    accumulator = '';
                    if (trimmed) {
                        registerBox(trimmed, null, false);
                        usedPreIntentContext = true;
                    }
                    continue;
                }

                accumulator = accumulator ? `${accumulator} ${part}` : part;

                // Look ahead: is the next meaningful token "in" or an intent verb or entity keyword?
                let nextRelevant = '';
                for (let j = i + 1; j < parts.length; j++) {
                    nextRelevant = (parts[j] || '').trim().toLowerCase();
                    if (nextRelevant) break;
                }
                if (nextRelevant === 'in' || intentSyns.includes(nextRelevant)) {
                    const trimmed = accumulator.replace(/^[,.:;\s]+|[,.:;\s]+$/g, '').trim();
                    accumulator = '';
                        if (trimmed) {
                            if (!storageName) {
                                // First pre-intent "in X" → storage
                                storageName = trimmed;
                                preIntentInContexts[preIntentInContexts.length - 1] = 'storage';
                                usedPreIntentContext = true;
                            } else {
                                // Subsequent "in X" → box (supports 3+ levels)
                                registerBox(trimmed, null, false);
                                preIntentInContexts[preIntentInContexts.length - 1] = 'box';
                                usedPreIntentContext = true;
                            }
                        }
                }
                continue;
            }

            accumulator = accumulator ? `${accumulator} ${part}` : part;
        }
        finalize(pendingQuantity ? 'items' : undefined);
        this.applySequentialMapping(currentBoxCluster, currentItemCluster, items);
        if (extractedIntent === 'increment' && usedPreIntentContext) {
            extractedIntent = 'create';
        }

        // 3. Contextual Intent: promote INCREMENT → CREATE when new boxes were created
        // Count extracted words vs total (Set-based to prevent double-counting)
        const sanitizeCountToken = (value: string) =>
            value
                .toLowerCase()
                .replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '')
                .trim();
        const allWords = normalizedText
            .split(/\s+/)
            .map((word) => sanitizeCountToken(word))
            .filter((word) => word.length > 0);
        const totalWords = allWords.length;
        const understoodIndices = new Set<number>();
        const keywordSet = new Set([...intentSyns, ...storageSyns, ...boxSyns, ...itemSyns, ...connectors, ...conjunctions, ...articles, ...descKeys]);
        // Mark keywords and numbers as understood
        allWords.forEach((w, i) => {
            if (keywordSet.has(w.toLowerCase()) || /^\d+$/.test(w)) understoodIndices.add(i);
        });
        // Mark entity words as understood (find their position in allWords)
        const markEntityWords = (text: string) => {
            const words = text
                .split(/\s+/)
                .map((word) => sanitizeCountToken(word))
                .filter((word) => word.length > 0);
            for (const ew of words) {
                const idx = allWords.findIndex((w, i) => !understoodIndices.has(i) && w.toLowerCase() === ew.toLowerCase());
                if (idx >= 0) understoodIndices.add(idx);
            }
        };
        if (storageName) markEntityWords(storageName);
        if (storageDescription) markEntityWords(storageDescription as string);
        boxes.forEach((b: any) => { markEntityWords(b.name); if (b.description) markEntityWords(b.description); });
        items.forEach((it: any) => { markEntityWords(it.name); if (it.description) markEntityWords(it.description); });

        return {
            intent: extractedIntent, storageName, storageDescription,
            boxes: boxes.map(b => ({ name: b.name, quantity: b.quantity || null, description: b.description, clientRef: b.clientRef })),
            items: items.map(it => ({
                name: it.name,
                quantity: it.quantity,
                explicitQuantity: !!it.explicitQuantity,
                description: it.description,
                boxClientRef: it.boxClientRef,
                orphaned: it.orphaned,
            })),
            boxName: boxes.length > 0 ? boxes[0].name : null,
            boxQuantity: boxes.length > 0 ? (boxes[0].quantity || null) : null,
            boxDescription: boxes.length > 0 ? boxes[0].description : null,
            ambiguous: isAmbiguous,
            rawIntents: orderedIntents,
            totalWords,
            extractedWordCount: understoodIndices.size,
            meta: {
                mappingStrategy: (boxes.length > 1 && items.length >= boxes.length) ? 'sequential' : 'direct',
                preIntentLocationOverflow,
                ...keywordFlags,
            },
        };
    }

    private applySequentialMapping(boxRefs: string[], itemIdxs: number[], items: any[]) {
        if (boxRefs.length > 1 && itemIdxs.length >= boxRefs.length) {
            // 1:1 pairing: Box1 ↔ Item1, Box2 ↔ Item2
            for (let j = 0; j < boxRefs.length; j++) {
                if (j < itemIdxs.length) {
                    items[itemIdxs[j]].boxClientRef = boxRefs[j];
                    items[itemIdxs[j]].orphaned = false;
                }
            }
            // Extra items beyond 1:1 pairing → assign to the last box
            const lastBoxRef = boxRefs[boxRefs.length - 1];
            for (let j = boxRefs.length; j < itemIdxs.length; j++) {
                items[itemIdxs[j]].boxClientRef = lastBoxRef;
                items[itemIdxs[j]].orphaned = false;
            }
        }
    }

    /**
     * Phase 4: Heavy Normalization
     * Standardize extracted raw data after parsing for consistency.
     */

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

    /**
     * Add a custom synonym at runtime.
     */
    addSynonym(synonym: string, canonical: string): void {
        this.SYNONYM_MAP[synonym.toLowerCase()] = canonical;
    }

    /**
     * Get the current synonym map (defaults + custom).
     */
    getSynonyms(): Record<string, string> {
        return { ...this.SYNONYM_MAP };
    }

    /**
     * Title Case: capitalize first letter of each word, preserve acronyms (3+ consecutive uppercase).
     */
    private toTitleCase(text: string): string {
        return text.split(/\s+/).map(word => {
            // Preserve acronyms: if the word is 2+ chars and ALL uppercase, keep it
            if (word.length >= 2 && word === word.toUpperCase() && /^[A-Z]+$/.test(word)) {
                return word;
            }
            if (/\d/.test(word)) {
                return word;
            }
            // Title case: first letter uppercase, rest lowercase
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');
    }

    /**
     * Plural → Singular: normalize entity names to singular form.
     */
    private toSingular(text: string): string {
        return text.split(/\s+/).map(word => {
            // Skip acronyms and very short words
            if (word.length <= 2 || (word === word.toUpperCase() && /^[A-Z]+$/.test(word))) {
                return word;
            }
            if (this.NON_SINGULARIZABLE_WORDS.has(word.toLowerCase())) {
                return word;
            }
            return pluralize.singular(word);
        }).join(' ');
    }

    /**
     * Synonym Mapping: map known colloquial terms to standard names.
     */
    private applySynonymMapping(text: string): string {
        const lower = text.toLowerCase();
        for (const [synonym, canonical] of Object.entries(this.SYNONYM_MAP)) {
            if (lower === synonym) return canonical;
        }
        return text;
    }

    /**
     * Apply heavy normalization to a parsed data object (from parseExtraction).
     * Transforms entity names and descriptions: Title Case, Singular, Synonym Map.
     */
    heavyNormalization(parsedData: any): any {
        const result = { ...parsedData };

        // Helper: synonym map → (skip singular if synonym matched) → title case
        const normalizeEntityName = (name: string): string => {
            const synonymResult = this.applySynonymMapping(name);
            const wasMapped = synonymResult !== name;
            // If synonym mapped, the canonical name is already correct — skip singularization
            const singularized = wasMapped ? synonymResult : this.toSingular(synonymResult);
            return this.toTitleCase(singularized);
        };

        // Normalize storage name
        if (result.storageName) {
            result.storageName = normalizeEntityName(result.storageName);
        }

        // Normalize storage description
        if (result.storageDescription) {
            result.storageDescription = this.toTitleCase(result.storageDescription);
        }

        // Normalize boxes
        if (result.boxes && result.boxes.length > 0) {
            result.boxes = result.boxes.map((box: any) => ({
                ...box,
                name: normalizeEntityName(box.name),
                description: box.description ? this.toTitleCase(box.description) : box.description,
            }));
        }

        // Normalize box name (legacy single-box field)
        if (result.boxName) {
            result.boxName = normalizeEntityName(result.boxName);
        }

        // Normalize items
        if (result.items && result.items.length > 0) {
            result.items = result.items.map((item: any) => ({
                ...item,
                name: normalizeEntityName(item.name),
                description: item.description ? this.toTitleCase(item.description) : item.description,
            }));
        }

        return result;
    }

    /**
     * Phase 3: Intent Classification & Validation
     */

    /** Pre-pipeline gate — call BEFORE lightNormalization */
    validateInput(rawText: string | null | undefined): { isValid: boolean, message: string | null } {
        if (!rawText || rawText.trim().length === 0) {
            return { isValid: false, message: 'Please enter an instruction to get started.' };
        }

        const cleanedForValidation = this.removeStopWords(
            rawText
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            .trim()
            .replace(/\s+/g, ' '),
        );

        const wordCount = cleanedForValidation ? cleanedForValidation.split(/\s+/).length : 0;
        if (wordCount < 3) {
            return {
                isValid: false,
                message: "Please clarify your instruction. Try something like 'Create storage Garage with box Tools'.",
            };
        }
        return { isValid: true, message: null };
    }

    private COMPATIBLE_INTENTS: Record<string, string[]> = {
        'create': ['create', 'increment'],
        'increment': ['increment', 'create', 'update'],
        'decrement': ['decrement'],
        'update': ['update', 'increment'],
    };

    private hasUnrecognizedWords(parsedData: any): boolean {
        const totalWords = parsedData?.totalWords || 0;
        const extractedWordCount = parsedData?.extractedWordCount || 0;
        return extractedWordCount < totalWords;
    }

    private hasConversationalEntityNoise(parsedData: any): boolean {
        const suspiciousWords = new Set([
            'can',
            'could',
            'would',
            'should',
            'you',
            'your',
            'i',
            'me',
            'my',
            'mine',
            'we',
            'our',
            'they',
            'them',
            'want',
            'needs',
            'need',
            'organize',
            'organise',
            'easily',
            'find',
            'please',
            'help',
            'just',
            'so',
        ]);

        const entityTexts = [
            parsedData?.storageName,
            ...(parsedData?.boxes || []).map((box: any) => box?.name),
            ...(parsedData?.items || []).map((item: any) => item?.name),
        ]
            .filter(Boolean)
            .map((value: string) => value.toLowerCase());

        let suspiciousTokenCount = 0;
        for (const text of entityTexts) {
            const tokens = text.split(/\s+/).filter(Boolean);
            suspiciousTokenCount += tokens.filter((token) => suspiciousWords.has(token)).length;

            if (tokens.length >= 5 && suspiciousTokenCount > 0) {
                return true;
            }
        }

        return suspiciousTokenCount >= 2;
    }

    private buildMissingIntentClarification(parsedData: any): string {
        const missingParts = ['intent'];
        if (!parsedData.storageName) {
            missingParts.push('storage');
        }

        const targets: string[] = [];
        parsedData.boxes?.forEach((box: any) => targets.push(`box '${box.name}'`));
        parsedData.items?.forEach((item: any) => {
            if (item?.name && item.name.toLowerCase() !== 'items') {
                targets.push(`item '${item.name}'`);
            }
        });
        if (!targets.length && parsedData.storageName) {
            targets.push(`storage '${parsedData.storageName}'`);
        }

        const missingLabel = this.joinHumanList(missingParts);
        const targetLabel = targets.length > 0 ? ` for ${this.joinHumanList(targets)}` : '';
        return `Please specify the ${missingLabel}${targetLabel}.`;
    }

    private buildMissingBoxClarification(parsedData: any): string {
        const visibleItems = (parsedData.items || [])
            .map((item: any) => item.name)
            .filter((name: string) => name && name.toLowerCase() !== 'items')
            .map((name: string) => `'${name}'`);
        const itemLabel = visibleItems.length > 0
            ? ` for ${this.joinHumanList(visibleItems)}`
            : '';
        const storageLabel = parsedData.storageName
            ? ` in storage '${this.toTitleCase(parsedData.storageName)}'`
            : '';

        return `Please specify a box${storageLabel}${itemLabel}.`;
    }

    private buildMissingStorageClarification(parsedData: any): string {
        const targets: string[] = [];
        parsedData.boxes?.forEach((box: any) => targets.push(`'${box.name}'`));
        parsedData.items?.forEach((item: any) => {
            if (item?.name && item.name.toLowerCase() !== 'items') {
                targets.push(`'${item.name}'`);
            }
        });
        const targetLabel = targets.length > 0
            ? ` for ${this.joinHumanList(targets)}`
            : '';

        return `Please specify the storage${targetLabel}.`;
    }

    intentClassification(
        parsedData: any,
        existingContext?: {
            storages: Array<string | { name: string }>;
            boxes: Array<string | { name: string }>;
            items: Array<string | { name: string; quantity?: number }>;
        },
        typoCount: number = 0
    ): any {
        const rawIntents: string[] = parsedData.rawIntents || [];
        const intent = parsedData.intent;
        const hasEntities = parsedData.storageName || parsedData.boxes?.length > 0 || parsedData.items?.length > 0;
        const hasUnrecognizedWords = this.hasUnrecognizedWords(parsedData);
        const hasConversationalNoise = this.hasConversationalEntityNoise(parsedData);
        const hasStructuredAnchor = Boolean(
            parsedData.storageName
            || parsedData.meta?.storageKeywordSeen
            || parsedData.meta?.boxKeywordSeen,
        );

        // Scope detection
        const scope = {
            affectsStorage: !!parsedData.storageName,
            affectsBoxes: (parsedData.boxes?.length || 0) > 0,
            affectsItems: (parsedData.items?.length || 0) > 0,
        };

        if (parsedData.meta?.preIntentLocationOverflow) {
            return {
                intent,
                isValid: false,
                scope,
                clarification: "Please use one storage and up to two box levels. Example: 'In Kitchen in Fridge add dozen eggs'.",
                suggestions: [],
                confidence: 0,
                shouldFallToLLM: false,
            };
        }

        if (parsedData.meta?.incompleteStructuredQuantity) {
            return {
                intent,
                isValid: false,
                scope,
                clarification: null,
                suggestions: [],
                confidence: 0,
                shouldFallToLLM: true,
            };
        }

        // 1. No intent and no entities → cannot understand
        if (!intent && rawIntents.length === 0 && !hasEntities) {
            return {
                intent: null, isValid: false, scope,
                clarification: 'Could not understand the instruction. Please try again.',
                suggestions: [], confidence: 0, shouldFallToLLM: true,
            };
        }

        // 2. No intent but has entities → ask user to specify intent
        if (!intent && rawIntents.length === 0 && hasEntities) {
            const canDirectClarify = !hasUnrecognizedWords && !hasConversationalNoise && hasStructuredAnchor;
            return {
                intent: null, isValid: false, scope,
                clarification: this.buildMissingIntentClarification(parsedData),
                suggestions: [], confidence: 0, shouldFallToLLM: !canDirectClarify,
            };
        }

        // 3. Conflicting intents → abort
        if (rawIntents.length > 1) {
            const primary = rawIntents[0];
            const compatible = this.COMPATIBLE_INTENTS[primary] || [primary];
            const conflicting = rawIntents.filter(i => !compatible.includes(i));
            if (conflicting.length > 0) {
                return {
                    intent: null, isValid: false, scope,
                    clarification: 'Please provide one instruction at a time.',
                    suggestions: [], confidence: 0, shouldFallToLLM: true,
                };
            }
        }

        // 4. Project Scope: DELETE/REMOVE handling
        if (intent === 'decrement') {
            const targetedItems = parsedData.items || [];
            if (targetedItems.length > 0) {
                if (!existingContext) {
                    return {
                        intent: 'decrement', isValid: false, scope,
                        clarification: "Please confirm which existing item quantity should be decreased.",
                        suggestions: [], confidence: 0, shouldFallToLLM: true,
                    };
                }

                const matchedStorageRecord = parsedData.storageName
                    ? existingContext.storages.find(
                        (storage: any) => this.normalizeLookupName(
                            typeof storage === 'string' ? storage : storage.name,
                        ) === this.normalizeLookupName(parsedData.storageName),
                    )
                    : null;
                const matchedStorageId = matchedStorageRecord && typeof matchedStorageRecord === 'object'
                    ? (matchedStorageRecord as any).id
                    : null;
                const scopedBoxes = matchedStorageId
                    ? existingContext.boxes.filter(
                        (box: any) => typeof box === 'object' && (box as any).storageId === matchedStorageId,
                    )
                    : existingContext.boxes;
                const decrementSummaries: string[] = [];

                for (const item of targetedItems) {
                    const targetBoxName = parsedData.boxes?.length === 1
                        ? parsedData.boxes[0].name
                        : this.getBoxNameForItem(parsedData, item.boxClientRef);
                    const matchedBoxRecord = targetBoxName
                        ? scopedBoxes.find(
                            (box: any) => this.normalizeLookupName(
                                typeof box === 'string' ? box : box.name,
                            ) === this.normalizeLookupName(targetBoxName),
                        )
                        : null;
                    const dbItem = matchedBoxRecord
                        ? existingContext.items.find(
                            (existingItem: any) =>
                                typeof existingItem === 'object'
                                && (existingItem as any).boxId === (matchedBoxRecord as any).id
                                && this.normalizeLookupName((existingItem as any).name) === this.normalizeLookupName(item.name),
                        )
                        : null;

                    if (!dbItem || typeof dbItem === 'string') {
                        return {
                            intent: 'decrement', isValid: false, scope,
                            clarification: `Item '${item.name}' was not found. Please check the name and try again.`,
                            suggestions: [], confidence: 0, shouldFallToLLM: false,
                        };
                    }

                    const currentQuantity = (dbItem as any).quantity ?? 0;
                    const nextQuantity = Math.max(0, currentQuantity - (item.quantity || 1));
                    const displayItemName = this.toTitleCase((dbItem as any).name || item.name);
                    decrementSummaries.push(
                        `Deletion is not supported. Decrease '${displayItemName}' from ${currentQuantity} to ${nextQuantity}?`,
                    );
                }

                return {
                    intent: 'decrement',
                    isValid: true,
                    scope,
                    clarification: null,
                    confirmation: decrementSummaries.join(' '),
                    expandedBoxes: null,
                    suggestions: [],
                    confidence: 0.95,
                    shouldFallToLLM: false,
                };
            } else {
                // DELETE + entity (no meaningful quantity) → unsupported
                return {
                    intent: null, isValid: false, scope,
                    clarification: 'Deletion is not supported in this version.',
                    suggestions: [], confidence: 0, shouldFallToLLM: false,
                };
            }
        }

        if (
            intent
            && parsedData.storageName
            && !scope.affectsBoxes
            && !scope.affectsItems
            && parsedData.meta?.itemKeywordSeen
        ) {
            const canDirectClarify = !hasUnrecognizedWords && !hasConversationalNoise;
            return {
                intent, isValid: false, scope,
                clarification: this.buildMissingBoxClarification(parsedData),
                suggestions: [], confidence: 0, shouldFallToLLM: !canDirectClarify,
            };
        }

        // 5. Structure Check: items require a box
        if (scope.affectsItems && !scope.affectsBoxes) {
            const canDirectClarify = !hasUnrecognizedWords
                && !hasConversationalNoise
                && Boolean(parsedData.storageName || parsedData.meta?.boxKeywordSeen);
            return {
                intent, isValid: false, scope,
                clarification: this.buildMissingBoxClarification(parsedData),
                suggestions: [], confidence: 0, shouldFallToLLM: !canDirectClarify,
            };
        }

        // 6. Structure Check: Storage required when boxes/items exist
        if (!parsedData.storageName && (scope.affectsBoxes || scope.affectsItems)) {
            const canDirectClarify = !hasUnrecognizedWords
                && !hasConversationalNoise
                && Boolean(parsedData.meta?.boxKeywordSeen);
            return {
                intent, isValid: false, scope,
                clarification: this.buildMissingStorageClarification(parsedData),
                suggestions: [], confidence: 0, shouldFallToLLM: !canDirectClarify,
            };
        }

        // 7. Multi-Box Expansion Rule
        let confirmation: string | null = null;
        let expandedBoxes: any[] | null = null;
        const allExpandedNames: string[] = [];
        const boxesWithQty = (parsedData.boxes || []).filter((b: any) => b.quantity && b.quantity > 1);
        if (boxesWithQty.length > 0) {
            for (const box of boxesWithQty) {
                if (box.quantity > 10) {
                    return {
                        intent, isValid: false, scope,
                        clarification: `Only 10 boxes can be created at a time. You requested ${box.quantity} boxes of '${box.name}'.`,
                        suggestions: [], confidence: 0, shouldFallToLLM: false,
                    };
                }
                // Auto-name expansion: "3 boxes of Tools" → Tool 1, Tool 2, Tool 3
                const baseName = box.name.charAt(0).toUpperCase() + box.name.slice(1);
                const expanded: string[] = [];
                for (let n = 1; n <= box.quantity; n++) {
                    expanded.push(`${baseName} ${n}`);
                }
                expandedBoxes = expandedBoxes || [];
                expandedBoxes.push({
                    originalName: box.name,
                    normalizedOriginalName: this.toSingular(box.name).toLowerCase(),
                    quantity: box.quantity,
                    expandedNames: expanded,
                });
                allExpandedNames.push(...expanded);
            }
            const repeatedItemSummaries = (parsedData.items || [])
                .filter((item: any) => item.replicatePerExpandedBox)
                .map((item: any) => {
                    const sourceBox = (parsedData.boxes || []).find(
                        (box: any) => box.clientRef === item.boxClientRef,
                    );

                    if (!sourceBox?.quantity || sourceBox.quantity <= 1) {
                        return null;
                    }

                    const itemLabel = `'${this.toTitleCase(this.toSingular(item.name))}' (x${item.quantity || 1})`;
                    const boxLabel = `'${this.toTitleCase(sourceBox.name)}'`;
                    return `${itemLabel} in each ${boxLabel} box`;
                })
                .filter(Boolean);
            const repeatedItemSuffix = repeatedItemSummaries.length > 0
                ? ` with ${this.joinHumanList(repeatedItemSummaries as string[])}`
                : '';
            confirmation = `You are about to create ${allExpandedNames.length} boxes (${allExpandedNames.join(', ')})${repeatedItemSuffix}. Confirm?`;
        }

        // 8. Ambiguity detection with existing context (Levenshtein < 2)
        const suggestions: string[] = [];
        // Collect box names that were expanded (multi-box) — skip them in create-vs-update
        const expandedOriginalNames = new Set((expandedBoxes || []).map((eb: any) => eb.originalName.toLowerCase()));
        const matchedStorageNames: string[] = [];
        const matchedStorageSummaries: string[] = [];
        const matchedBoxNames: string[] = [];
        const matchedItemSummaries: string[] = [];
        const pendingCreateSummaries: string[] = [];

        if (existingContext) {
            // Check create-vs-update
            if (intent === 'create') {
                const matchedStorageRecord = parsedData.storageName
                    ? existingContext.storages.find(
                        (s: any) => this.normalizeLookupName(
                            typeof s === 'string' ? s : s.name,
                        ) === this.normalizeLookupName(parsedData.storageName),
                    )
                    : null;
                const matchedStorageId = matchedStorageRecord && typeof matchedStorageRecord === 'object'
                    ? (matchedStorageRecord as any).id
                    : null;
                const scopedBoxes = matchedStorageId
                    ? existingContext.boxes.filter(
                        (b: any) => typeof b === 'object' && (b as any).storageId === matchedStorageId,
                    )
                    : [];

                if (parsedData.storageName) {
                    const match = matchedStorageRecord;
                    if (match) {
                        matchedStorageNames.push(this.toTitleCase(parsedData.storageName));
                        suggestions.push(`Storage '${parsedData.storageName}' already exists. Did you mean to update it?`);
                        if (
                            parsedData.storageDescription
                            && this.normalizeDescriptionText(
                                typeof match === 'object' ? (match as any).description : null,
                            ) !== this.normalizeDescriptionText(parsedData.storageDescription)
                        ) {
                            matchedStorageSummaries.push(
                                `Storage '${this.toTitleCase(parsedData.storageName)}' already exists. Update description to '${this.toTitleCase(parsedData.storageDescription)}'?`,
                            );
                        }
                    }
                }
                parsedData.boxes?.forEach((box: any) => {
                    // Skip boxes that were multi-box expanded — expanded names are new
                    if (expandedOriginalNames.has(box.name.toLowerCase())) return;
                    const match = scopedBoxes.find(
                        (b: any) => this.normalizeLookupName(
                            typeof b === 'string' ? b : b.name,
                        ) === this.normalizeLookupName(box.name)
                    );
                    if (match) {
                        matchedBoxNames.push(this.toTitleCase(box.name));
                        suggestions.push(`Box '${box.name}' already exists. Did you mean to update it?`);
                    } else {
                        pendingCreateSummaries.push(
                            `New box '${this.toTitleCase(this.toSingular(box.name))}' will be created.`,
                        );
                    }
                });
                parsedData.items?.forEach((item: any) => {
                    const itemName = (typeof item === 'string' ? item : item.name);
                    const targetBoxName = parsedData.boxes?.length === 1
                        ? parsedData.boxes[0].name
                        : this.getBoxNameForItem(parsedData, item.boxClientRef);
                    const matchedBoxRecord = targetBoxName
                        ? scopedBoxes.find(
                            (b: any) => this.normalizeLookupName(
                                typeof b === 'string' ? b : b.name,
                            ) === this.normalizeLookupName(targetBoxName),
                        )
                        : null;
                    const match = matchedBoxRecord
                        ? existingContext.items.find(
                            (it: any) =>
                                typeof it === 'object'
                                && (it as any).boxId === (matchedBoxRecord as any).id
                                && this.normalizeLookupName((it as any).name) === this.normalizeLookupName(itemName),
                        )
                        : null;
                    if (match) {
                        const quantityToAdd = typeof item === 'string' ? 1 : (item.quantity || 1);
                        const explicitQuantity = typeof item === 'string'
                            ? false
                            : Boolean(item.explicitQuantity);
                        const currentQuantity = typeof match === 'string' ? null : (match.quantity ?? null);
                        const displayStorageName = parsedData.storageName
                            ? this.toTitleCase(parsedData.storageName)
                            : null;
                        const displayBoxName = targetBoxName
                            ? this.toTitleCase(targetBoxName)
                            : null;
                        const displayItemName = this.toTitleCase(
                            typeof match === 'object' && (match as any).name
                                ? (match as any).name
                                : itemName,
                        );
                        const pathLabel = displayStorageName && displayBoxName
                            ? `${displayStorageName}/${displayBoxName}`
                            : displayBoxName || displayStorageName;
                        if (explicitQuantity && currentQuantity !== null) {
                            matchedItemSummaries.push(
                                `${displayItemName} exists${pathLabel ? ` in ${pathLabel}` : ''} (Qty: ${currentQuantity}). Add ${quantityToAdd} more? (New Total: ${currentQuantity + quantityToAdd})`,
                            );
                        } else if (explicitQuantity) {
                            matchedItemSummaries.push(
                                `${displayItemName} already exists${pathLabel ? ` in ${pathLabel}` : ''}. Add ${quantityToAdd} more?`,
                            );
                        } else {
                            suggestions.push(`Item '${itemName}' already exists and no quantity change was requested.`);
                        }
                        suggestions.push(`Item '${itemName}' already exists. Did you mean to update it?`);
                    } else if (targetBoxName) {
                        const quantityLabel = typeof item === 'string' ? 1 : (item.quantity || 1);
                        pendingCreateSummaries.push(
                            `New item '${this.toTitleCase(this.toSingular(itemName))}' (x${quantityLabel}) will be added to '${this.toTitleCase(this.toSingular(targetBoxName))}'.`,
                        );
                    }
                });
            }

            // Fuzzy ambiguity: Levenshtein < 2 (distance exactly 1)
            const allDbNames = [
                ...existingContext.storages.map((s: any) => typeof s === 'string' ? s : s.name),
                ...existingContext.boxes.map((b: any) => typeof b === 'string' ? b : b.name),
                ...existingContext.items.map((it: any) => typeof it === 'string' ? it : it.name),
            ];
            const entityNamesToCheck = [
                parsedData.storageName,
                ...(parsedData.boxes?.map((b: any) => b.name) || []),
                ...(parsedData.items?.map((it: any) => it.name) || []),
            ].filter(Boolean);

            for (const name of entityNamesToCheck) {
                const fuzzyMatches = allDbNames.filter(
                    dbName => dbName.toLowerCase() !== name.toLowerCase()
                        && this.getLevenshteinDistance(name.toLowerCase(), dbName.toLowerCase()) < 2
                );
                if (fuzzyMatches.length > 0) {
                    const candidates = [name, ...fuzzyMatches].map(n => `'${n}'`).join(' or ');
                    suggestions.push(`Ambiguous request. Did you mean ${candidates}?`);
                }
            }
        }

        if (
            !confirmation
            && intent === 'create'
            && suggestions.some((suggestion) => suggestion.includes('already exists'))
        ) {
            if (matchedStorageSummaries.length > 0 || matchedItemSummaries.length > 0) {
                confirmation = [...matchedStorageSummaries, ...matchedItemSummaries, ...pendingCreateSummaries].join(' ');
            }
        }

        // 9. Confidence Scoring (Weighted Multi-Signal)
        let confidence = 0;

        // Entity Detection Bonuses — recognized structures boost confidence
        if (intent) confidence += 0.3;
        if (parsedData.storageName) confidence += 0.2;
        const boxCount = parsedData.boxes?.length || 0;
        confidence += Math.min(0.3, boxCount * 0.15);  // max +0.3
        const itemCount = parsedData.items?.length || 0;
        confidence += Math.min(0.2, itemCount * 0.1);   // max +0.2
        if (intent && parsedData.storageName && boxCount === 0 && itemCount === 0) {
            confidence += 0.25;
        }

        // Detection Quality Penalty: -0.05 per typo/fuzzy fix
        confidence -= typoCount * 0.05;

        // Noise Penalty: unrecognized words (weighted lower than before)
        const totalWords = parsedData.totalWords || 1;
        const extractedWordCount = parsedData.extractedWordCount || 0;
        const unrecognizedRatio = (totalWords - extractedWordCount) / totalWords;
        if (unrecognizedRatio > 0.1) {
            confidence -= 0.3 * unrecognizedRatio;
        }

        // Critical Keys: Intent and Storage Name must be present
        if (!intent || !parsedData.storageName) {
            confidence = 0;
        }

        // Clamp to [0, 1]
        confidence = Math.max(0, Math.min(1, parseFloat(confidence.toFixed(2))));
        const shouldFallToLLM = confidence < 0.5;

        return {
            intent, isValid: true, scope,
            clarification: null,
            confirmation,
            expandedBoxes,
            suggestions,
            confidence,
            shouldFallToLLM,
        };
    }

    /**
     * Full Pipeline Orchestrator
     * Runs: Phase 1 → 2 → 3 → (LLM check) → 4 → Confirmation Summary
     * Returns the processed result ready for user confirmation before DB persistence.
     */
    processInput(rawInput: string, existingContext?: any): any {
        // Phase 1: Light Normalization
        const { normalizedText, llmBackup, typoCount } = this.lightNormalization(rawInput);

        // Phase 2: Parsing & Extraction
        const parsed = this.parseExtraction(normalizedText);

        // Phase 3: Intent Classification & Validation
        const classified = this.intentClassification(parsed, existingContext, typoCount);

        // If not valid (clarification needed), return early
        if (!classified.isValid) {
            const clarification = classified.clarification || 'This instruction will fall to LLM for manual review.';
            const fallbackToLLM = typeof classified.shouldFallToLLM === 'boolean'
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

        // --- LLM Fallback Check ---
        if (classified.shouldFallToLLM) {
            console.log(`[LLM Fallback] Confidence: ${classified.confidence} | Input: "${rawInput}" | Backup: "${llmBackup}"`);
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

        // Phase 4: Heavy Normalization
        const normalized = this.heavyNormalization(parsed);
        const prepared = this.prepareNormalizedDataForPersistence(
            normalized,
            classified.expandedBoxes,
        );
        // Carry forward classified metadata
        prepared.intent = classified.intent;
        prepared.confirmation = classified.confirmation;
        prepared.expandedBoxes = classified.expandedBoxes;
        prepared.suggestions = classified.suggestions;
        prepared.confidence = classified.confidence;
        prepared.meta = { ...prepared.meta, ...parsed.meta };

        // Generate confirmation summary for user
        const confirmationSummary = this.generateConfirmationSummary(prepared);

        return {
            success: true,
            fallbackToLLM: false,
            message: confirmationSummary,
            data: prepared,
            classified,
        };
    }

    private shouldFallbackInvalidClarificationToLLM(clarification: string): boolean {
        const normalized = clarification.trim().toLowerCase();

        return [
            'which box should',
            'which storage should',
            "please specify what you'd like to do",
            'could not understand the instruction',
            'this instruction will fall to llm',
        ].some((pattern) => normalized.startsWith(pattern));
    }

    /**
     * Phase 5: Database Storage Strategy
     */

    /**
     * Generate a human-readable confirmation summary before persisting to DB.
     */
    generateConfirmationSummary(normalizedData: any): string {
        const lines: string[] = ['Ready to save:'];

        if (normalizedData.storageName) {
            lines.push(`  🗄️ Storage: ${normalizedData.storageName}${normalizedData.storageDescription ? ` (${normalizedData.storageDescription})` : ''}`);
        }

        if (normalizedData.boxes?.length > 0) {
            const boxNames = normalizedData.boxes.map((b: any) => b.name).join(', ');
            lines.push(`  📦 Boxes: ${boxNames}`);
        }

        if (normalizedData.items?.length > 0) {
            const itemDescriptions = normalizedData.items.map((item: any) => {
                const qty = item.quantity || 1;
                const boxRef = item.boxClientRef;
                // Find the box name by clientRef
                const box = normalizedData.boxes?.find((b: any) => b.clientRef === boxRef);
                const boxName = box ? box.name : 'Unknown';
                return `${item.name} (x${qty}) → ${boxName}`;
            });
            lines.push(`  🔩 Items: ${itemDescriptions.join(', ')}`);
        }

        lines.push('Confirm? [Yes / Cancel]');
        return lines.join('\n');
    }

    private normalizeLookupName(name: string | null | undefined): string {
        return this.toSingular((name || '').trim().toLowerCase()).replace(/\s+/g, ' ');
    }

    private async findExistingStorageByName(
        manager: any,
        userId: string,
        storageName: string,
    ): Promise<any | null> {
        const storages = await manager.find('Storage', {
            where: { userId },
        });

        const normalizedTarget = this.normalizeLookupName(storageName);
        return storages.find(
            (storage: any) => this.normalizeLookupName(storage.name) === normalizedTarget,
        ) || null;
    }

    private async findExistingBoxByName(
        manager: any,
        storageId: string,
        boxName: string,
    ): Promise<any | null> {
        const boxes = await manager.find('Box', {
            where: { storageId },
        });

        const normalizedTarget = this.normalizeLookupName(boxName);
        return boxes.find(
            (box: any) => this.normalizeLookupName(box.name) === normalizedTarget,
        ) || null;
    }

    private async findExistingItemByName(
        manager: any,
        boxId: string,
        itemName: string,
    ): Promise<any | null> {
        const items = await manager.find('Item', {
            where: { boxId },
        });

        const normalizedTarget = this.normalizeLookupName(itemName);
        return items.find(
            (item: any) => this.normalizeLookupName(item.name) === normalizedTarget,
        ) || null;
    }

    /**
     * Persist the validated + normalized data to the database using a transaction.
     * Steps: Storage (find or create) → Box (find or create) → Item (find or create/update).
     */
    async persistToDatabase(normalizedData: any, userId: string): Promise<{ success: boolean; message: string; ids?: any; warnings?: string[] }> {
        if (!this.dataSource) {
            return { success: false, message: 'Database connection not available.' };
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const intent = normalizedData.intent; // 'create' | 'increment' | 'decrement' | 'update'

            // --- Storage Layer ---
            let storageId: string | null = null;
            let storageAction: 'created' | 'found' | null = null;
            let storageDescriptionUpdated = false;
            if (normalizedData.storageName) {
                const existingStorage = await this.findExistingStorageByName(
                    queryRunner.manager,
                    userId,
                    normalizedData.storageName,
                );

                if (existingStorage) {
                    storageId = (existingStorage as any).id;
                    storageAction = 'found';
                    const nextDescription = normalizedData.storageDescription || null;
                    if (
                        nextDescription
                        && (intent === 'create' || intent === 'update')
                        && this.normalizeDescriptionText((existingStorage as any).description) !== this.normalizeDescriptionText(nextDescription)
                    ) {
                        (existingStorage as any).description = nextDescription;
                        await queryRunner.manager.save('Storage', existingStorage);
                        storageDescriptionUpdated = true;
                    }
                } else {
                    const newStorage = queryRunner.manager.create('Storage', {
                        name: normalizedData.storageName,
                        description: normalizedData.storageDescription || null,
                        userId,
                    });
                    const savedStorage = await queryRunner.manager.save('Storage', newStorage);
                    storageId = (savedStorage as any).id;
                    storageAction = 'created';
                }
            }

            // --- Box Layer ---
            const boxIdMap = new Map<string, string>(); // clientRef → DB id
            const boxActions: { name: string; action: 'created' | 'found'; items: string[] }[] = [];
            if (normalizedData.boxes?.length > 0 && storageId) {
                for (const box of normalizedData.boxes) {
                    const existingBox = await this.findExistingBoxByName(
                        queryRunner.manager,
                        storageId,
                        box.name,
                    );

                    if (existingBox) {
                        boxIdMap.set(box.clientRef, (existingBox as any).id);
                        boxActions.push({ name: box.name, action: 'found', items: [] });
                    } else {
                        const newBox = queryRunner.manager.create('Box', {
                            name: box.name,
                            description: box.description || null,
                            storageId,
                        });
                        const savedBox = await queryRunner.manager.save('Box', newBox);
                        const boxId = (savedBox as any).id;

                        // Generate QR Payload after save (needs DB-assigned ID)
                        const qrPayload = JSON.stringify({
                            boxId,
                            name: box.name,
                            storageId,
                            createdAt: new Date().toISOString(),
                        });
                        (savedBox as any).qrPayload = qrPayload;
                        await queryRunner.manager.save('Box', savedBox);

                        boxIdMap.set(box.clientRef, boxId);
                        boxActions.push({ name: box.name, action: 'created', items: [] });
                    }
                }
            }

            // --- Item Layer (Intent-Based) ---
            const savedItemIds: string[] = [];
            const warnings: string[] = [];
            const itemActions: {
                name: string;
                action: string;
                oldQty?: number;
                newQty?: number;
                boxClientRef?: string;
                quantityChanged?: boolean;
                descriptionChanged?: boolean;
            }[] = [];

            if (normalizedData.items?.length > 0) {
                for (const item of normalizedData.items) {
                    const boxId = boxIdMap.get(item.boxClientRef);
                    if (!boxId) {
                        throw new Error(`Item '${item.name}' could not be mapped to a box.`);
                    }

                    const existingItem = await this.findExistingItemByName(
                        queryRunner.manager,
                        boxId,
                        item.name,
                    );

                    if (existingItem) {
                        // --- Scenario A: Item Exists ---
                        const existing = existingItem as any;
                        const oldQty = existing.quantity || 0;

                        if (intent === 'increment') {
                            existing.quantity = oldQty + (item.quantity || 1);
                            itemActions.push({
                                name: item.name,
                                action: 'incremented',
                                oldQty,
                                newQty: existing.quantity,
                                boxClientRef: item.boxClientRef,
                                quantityChanged: true,
                                descriptionChanged: false,
                            });
                        } else if (intent === 'create') {
                            const hasDescriptionUpdate = !!item.description && item.description !== existing.description;
                            if (item.explicitQuantity) {
                                existing.quantity = oldQty + (item.quantity || 1);
                                if (hasDescriptionUpdate) {
                                    existing.description = item.description;
                                }
                                itemActions.push({
                                    name: item.name,
                                    action: 'incremented',
                                    oldQty,
                                    newQty: existing.quantity,
                                    boxClientRef: item.boxClientRef,
                                    quantityChanged: true,
                                    descriptionChanged: hasDescriptionUpdate,
                                });
                            } else if (hasDescriptionUpdate) {
                                existing.description = item.description;
                                itemActions.push({
                                    name: item.name,
                                    action: 'modified',
                                    oldQty,
                                    newQty: existing.quantity,
                                    boxClientRef: item.boxClientRef,
                                    quantityChanged: false,
                                    descriptionChanged: true,
                                });
                            } else {
                                itemActions.push({
                                    name: item.name,
                                    action: 'unchanged',
                                    oldQty,
                                    newQty: existing.quantity,
                                    boxClientRef: item.boxClientRef,
                                    quantityChanged: false,
                                    descriptionChanged: false,
                                });
                                savedItemIds.push(existing.id);
                                continue;
                            }
                        } else if (intent === 'decrement') {
                            const newQty = oldQty - (item.quantity || 1);
                            if (newQty < 0) {
                                existing.quantity = 0;
                                const boxEntry = normalizedData.boxes?.find((b: any) => b.clientRef === item.boxClientRef);
                                const boxName = boxEntry ? boxEntry.name : 'Unknown';
                                warnings.push(`'${item.name}' quantity set to 0 in '${boxName}' box (was ${oldQty}, tried to remove ${item.quantity || 1}).`);
                            } else {
                                existing.quantity = newQty;
                            }
                            itemActions.push({
                                name: item.name,
                                action: 'decremented',
                                oldQty,
                                newQty: existing.quantity,
                                boxClientRef: item.boxClientRef,
                                quantityChanged: true,
                                descriptionChanged: false,
                            });
                        } else if (intent === 'update') {
                            const hasDescriptionInput = item.description !== null && item.description !== undefined;
                            const hasQuantityInput = item.quantity !== null && item.quantity !== undefined;
                            const descriptionChanged = hasDescriptionInput
                                && this.normalizeDescriptionText(item.description) !== this.normalizeDescriptionText(existing.description);
                            const quantityChanged = hasQuantityInput
                                && item.quantity !== oldQty;

                            if (descriptionChanged) {
                                existing.description = item.description;
                            }
                            if (quantityChanged) {
                                existing.quantity = item.quantity;
                            }

                            if (!descriptionChanged && !quantityChanged) {
                                itemActions.push({
                                    name: item.name,
                                    action: 'unchanged',
                                    oldQty,
                                    newQty: existing.quantity,
                                    boxClientRef: item.boxClientRef,
                                    quantityChanged: false,
                                    descriptionChanged: false,
                                });
                                savedItemIds.push(existing.id);
                                continue;
                            }

                            itemActions.push({
                                name: item.name,
                                action: 'modified',
                                oldQty,
                                newQty: existing.quantity,
                                boxClientRef: item.boxClientRef,
                                quantityChanged,
                                descriptionChanged,
                            });
                        }

                        const updated = await queryRunner.manager.save('Item', existing);
                        savedItemIds.push(updated.id);

                    } else {
                        // --- Scenario B: Item Missing ---
                        if (intent === 'decrement') {
                            const boxEntry = normalizedData.boxes?.find((b: any) => b.clientRef === item.boxClientRef);
                            const boxName = boxEntry ? boxEntry.name : 'Unknown';
                            throw new Error(`Item '${item.name}' not found in '${boxName}' box. Cannot remove a non-existent item.`);
                        }

                        const newItem = queryRunner.manager.create('Item', {
                            name: item.name,
                            description: item.description || null,
                            quantity: item.quantity || 1,
                            boxId,
                        });
                        const savedItem = await queryRunner.manager.save('Item', newItem);
                        savedItemIds.push((savedItem as any).id);
                        itemActions.push({
                            name: item.name,
                            action: 'created',
                            newQty: item.quantity || 1,
                            boxClientRef: item.boxClientRef,
                            quantityChanged: false,
                            descriptionChanged: Boolean(item.description),
                        });
                    }
                }
            }

            await queryRunner.commitTransaction();

            // --- Phase 7: Smart Acknowledgment ---
            const actionLog = { storageAction, storageDescriptionUpdated, boxActions, itemActions };
            const acknowledgment = this.generateSmartAcknowledgment(normalizedData, actionLog);

            return {
                success: true,
                message: acknowledgment,
                ids: {
                    storageId,
                    boxIds: Object.fromEntries(boxIdMap),
                    itemIds: savedItemIds,
                },
                warnings,
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            return {
                success: false,
                message: `Something went wrong. No changes were saved. ${error instanceof Error ? error.message : ''}`.trim(),
            };
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Phase 7: Resolution & Smart Acknowledgment
     * Generates a user-friendly summary based on intent + DB actions.
     */
    generateSmartAcknowledgment(
        normalizedData: any,
        actionLog: {
            storageAction: 'created' | 'found' | null;
            storageDescriptionUpdated?: boolean;
            boxActions: { name: string; action: 'created' | 'found'; items: string[] }[];
            itemActions: {
                name: string;
                action: string;
                oldQty?: number;
                newQty?: number;
                boxClientRef?: string;
                quantityChanged?: boolean;
                descriptionChanged?: boolean;
            }[];
        },
    ): string {
        const intent = normalizedData.intent;
        const storageLead = this.buildStorageAcknowledgmentLead(
            intent,
            normalizedData.storageName,
            actionLog.storageAction,
        );
        const isSequential = normalizedData.meta?.mappingStrategy === 'sequential';
        const storageDescriptionDetail = actionLog.storageDescriptionUpdated
            ? 'Updated the description.'
            : null;

        if (intent === 'create' && this.isCreateNoOp(actionLog)) {
            return this.buildCreateNoOpAcknowledgment(
                normalizedData,
                actionLog,
                storageLead,
            );
        }

        if (intent === 'update' && this.isUpdateNoOp(actionLog)) {
            return this.buildUpdateNoOpAcknowledgment(
                normalizedData,
                actionLog,
            );
        }

        if (intent === 'create' && isSequential && actionLog.boxActions.length > 0) {
            const sequentialMessage = this.buildSequentialAcknowledgment(
                normalizedData,
                actionLog,
                storageLead,
            );
            return storageDescriptionDetail
                ? `${sequentialMessage} ${storageDescriptionDetail}`
                : sequentialMessage;
        }

        let detailParts: string[] = [];

        switch (intent) {
            case 'create':
                detailParts = this.buildCreateAcknowledgmentDetails(
                    normalizedData,
                    actionLog,
                );
                break;
            case 'increment':
                detailParts = this.buildIncrementAcknowledgmentDetails(
                    normalizedData,
                    actionLog,
                );
                break;
            case 'decrement':
                detailParts = this.buildDecrementAcknowledgmentDetails(
                    normalizedData,
                    actionLog,
                );
                break;
            case 'update':
                detailParts = this.buildUpdateAcknowledgmentDetails(
                    normalizedData,
                    actionLog,
                );
                break;
            default:
                detailParts = this.buildCreateAcknowledgmentDetails(
                    normalizedData,
                    actionLog,
                );
                break;
        }

        if (storageDescriptionDetail) {
            detailParts.unshift(storageDescriptionDetail);
        }

        if (!storageLead && detailParts.length === 0) {
            return 'No changes were made.';
        }

        if (actionLog.storageDescriptionUpdated && normalizedData.storageName && detailParts.length === 1) {
            return `Storage '${normalizedData.storageName}' already exists. Updated the description.`;
        }

        if (storageLead && detailParts.length === 0) {
            if (intent === 'create' && actionLog.storageAction === 'found') {
                return `${storageLead}. No changes needed.`;
            }
            return `${storageLead}.`;
        }

        if (!storageLead) {
            return detailParts.join(' ');
        }

        if (intent === 'create' && actionLog.storageAction === 'created') {
            const normalizedDetails = detailParts.map((detail) => detail.trim());

            if (
                normalizedDetails.length === 1
                && normalizedDetails[0].startsWith('Created box ')
            ) {
                return `${storageLead} and ${normalizedDetails[0]
                    .replace(/^Created box /, "box ")
                    .replace(/\.$/, '.')}`;
            }

            if (
                normalizedDetails.length > 1
                && normalizedDetails.every((detail) => detail.startsWith('Created box '))
            ) {
                const boxLabels = normalizedDetails.map((detail) =>
                    detail
                        .replace(/^Created box /, '')
                        .replace(/\.$/, ''),
                );
                return `${storageLead} with boxes ${this.joinHumanList(boxLabels)}.`;
            }
        }

        return `${storageLead}. ${detailParts.join(' ')}`;
    }

    private isCreateNoOp(actionLog: {
        storageAction: 'created' | 'found' | null;
        storageDescriptionUpdated?: boolean;
        boxActions: { name: string; action: 'created' | 'found'; items: string[] }[];
        itemActions: {
            name: string;
            action: string;
            oldQty?: number;
            newQty?: number;
            boxClientRef?: string;
            quantityChanged?: boolean;
            descriptionChanged?: boolean;
        }[];
    }): boolean {
        const hasExistingContent = actionLog.storageAction === 'found'
            || actionLog.boxActions.some((box) => box.action === 'found')
            || actionLog.itemActions.some((item) => item.action === 'unchanged');
        const hasCreatedBoxes = actionLog.boxActions.some((box) => box.action === 'created');
        const hasChangedItems = actionLog.itemActions.some((item) => item.action !== 'unchanged');

        return hasExistingContent
            && !actionLog.storageDescriptionUpdated
            && !hasCreatedBoxes
            && !hasChangedItems;
    }

    private isUpdateNoOp(actionLog: {
        storageAction: 'created' | 'found' | null;
        storageDescriptionUpdated?: boolean;
        boxActions: { name: string; action: 'created' | 'found'; items: string[] }[];
        itemActions: {
            name: string;
            action: string;
            oldQty?: number;
            newQty?: number;
            boxClientRef?: string;
            quantityChanged?: boolean;
            descriptionChanged?: boolean;
        }[];
    }): boolean {
        return this.isCreateNoOp(actionLog);
    }

    private buildCreateNoOpAcknowledgment(
        normalizedData: any,
        actionLog: {
            storageAction: 'created' | 'found' | null;
            storageDescriptionUpdated?: boolean;
            boxActions: { name: string; action: 'created' | 'found'; items: string[] }[];
            itemActions: {
                name: string;
                action: string;
                oldQty?: number;
                newQty?: number;
                boxClientRef?: string;
                quantityChanged?: boolean;
                descriptionChanged?: boolean;
            }[];
        },
        storageLead: string | null,
    ): string {
        const parts: string[] = [];

        if (storageLead) {
            parts.push(`${storageLead}.`);
        }

        const boxesWithoutItems: string[] = [];

        for (const box of actionLog.boxActions.filter((entry) => entry.action === 'found')) {
            const unchangedItems = this.getItemsForBox(
                normalizedData,
                actionLog.itemActions,
                box.name,
            ).filter((item) => item.action === 'unchanged');

            if (unchangedItems.length === 0) {
                boxesWithoutItems.push(`'${box.name}'`);
                continue;
            }

            parts.push(
                `Box '${box.name}' already contains ${this.joinHumanList(
                    unchangedItems.map((item) => this.formatCreatedItemLabel(item)),
                )}.`,
            );
        }

        if (boxesWithoutItems.length > 0) {
            parts.push(
                boxesWithoutItems.length === 1
                    ? `Box ${boxesWithoutItems[0]} already exists.`
                    : `Boxes ${this.joinHumanList(boxesWithoutItems)} already exist.`,
            );
        }

        if (parts.length === 0) {
            return 'No changes were made.';
        }

        parts.push('No changes needed.');
        return parts.join(' ');
    }

    private buildUpdateNoOpAcknowledgment(
        normalizedData: any,
        actionLog: {
            storageAction: 'created' | 'found' | null;
            storageDescriptionUpdated?: boolean;
            boxActions: { name: string; action: 'created' | 'found'; items: string[] }[];
            itemActions: {
                name: string;
                action: string;
                oldQty?: number;
                newQty?: number;
                boxClientRef?: string;
                quantityChanged?: boolean;
                descriptionChanged?: boolean;
            }[];
        },
    ): string {
        const parts: string[] = [];

        if (normalizedData.storageName && actionLog.storageAction === 'found') {
            parts.push(`Storage '${normalizedData.storageName}' already exists.`);
        }

        const boxesWithoutItems: string[] = [];

        for (const box of actionLog.boxActions.filter((entry) => entry.action === 'found')) {
            const unchangedItems = this.getItemsForBox(
                normalizedData,
                actionLog.itemActions,
                box.name,
            ).filter((item) => item.action === 'unchanged');

            if (unchangedItems.length === 0) {
                boxesWithoutItems.push(`'${box.name}'`);
                continue;
            }

            parts.push(
                `Box '${box.name}' already contains ${this.joinHumanList(
                    unchangedItems.map((item) => this.formatCreatedItemLabel(item)),
                )}.`,
            );
        }

        if (boxesWithoutItems.length > 0) {
            parts.push(
                boxesWithoutItems.length === 1
                    ? `Box ${boxesWithoutItems[0]} already exists.`
                    : `Boxes ${this.joinHumanList(boxesWithoutItems)} already exist.`,
            );
        }

        if (parts.length === 0) {
            return 'No changes were made.';
        }

        if (parts.length === 1 && normalizedData.storageName && actionLog.storageAction === 'found') {
            return `No changes needed. Storage '${normalizedData.storageName}' is already up to date.`;
        }

        parts.push('No changes needed.');
        return parts.join(' ');
    }

    /**
     * Format a single item action into a user-friendly string.
     * Never uses the word "Deleted" — uses "Removed" and "Remaining" instead.
     */
    private buildStorageAcknowledgmentLead(
        intent: string,
        storageName: string | null,
        storageAction: 'created' | 'found' | null,
    ): string | null {
        if (!storageName) {
            return null;
        }

        if (storageAction === 'created') {
            return `Created new storage '${storageName}'`;
        }

        if (storageAction === 'found') {
            if (intent === 'create') {
                return `Storage '${storageName}' already exists`;
            }

            if (intent === 'update') {
                return `Storage '${storageName}' already exists`;
            }

            return `Updated '${storageName}'`;
        }

        return null;
    }

    private buildSequentialAcknowledgment(
        normalizedData: any,
        actionLog: {
            storageAction: 'created' | 'found' | null;
            boxActions: { name: string; action: 'created' | 'found'; items: string[] }[];
            itemActions: { name: string; action: string; oldQty?: number; newQty?: number; boxClientRef?: string }[];
        },
        storageLead: string | null,
    ): string {
        const condensedSequentialMessage = this.buildCondensedSequentialAcknowledgment(
            normalizedData,
            actionLog,
            storageLead,
        );
        if (condensedSequentialMessage) {
            return condensedSequentialMessage;
        }

        const boxParts = actionLog.boxActions.map((box) => {
            const boxItems = this.getItemsForBox(
                normalizedData,
                actionLog.itemActions,
                box.name,
            );

            if (boxItems.length === 0) {
                return `'${box.name}'`;
            }

            const itemNames = boxItems.map((item) =>
                this.formatCreatedItemLabel(item),
            ).join(', ');
            return `'${box.name}' (with ${itemNames})`;
        });

        const boxCount = actionLog.boxActions.length;
        const boxPhrase = `${boxCount} box${boxCount > 1 ? 'es' : ''}: ${boxParts.join(', ')}.`;

        if (!storageLead) {
            return `Created ${boxPhrase}`;
        }

        if (actionLog.storageAction === 'created') {
            return `${storageLead} with ${boxPhrase}`;
        }

        const boxVerb = actionLog.boxActions.some((box) => box.action === 'created')
            ? 'Created'
            : 'Updated';
        return `${storageLead}. ${boxVerb} ${boxPhrase}`;
    }

    private buildCondensedSequentialAcknowledgment(
        normalizedData: any,
        actionLog: {
            storageAction: 'created' | 'found' | null;
            boxActions: { name: string; action: 'created' | 'found'; items: string[] }[];
            itemActions: { name: string; action: string; oldQty?: number; newQty?: number; boxClientRef?: string }[];
        },
        storageLead: string | null,
    ): string | null {
        if (actionLog.boxActions.length === 0) {
            return null;
        }

        const groupedBoxes = new Map<string, {
            baseName: string;
            count: number;
            action: 'created' | 'found';
            itemLabels: string[];
            quantitySummary: string | null;
        }>();

        for (const box of actionLog.boxActions) {
            const baseName = this.getSequentialBaseName(box.name);
            const boxItems = this.getItemsForBox(
                normalizedData,
                actionLog.itemActions,
                box.name,
            );
            const itemLabels = boxItems.map((item) => this.formatCreatedItemLabel(item));
            const quantitySummary = boxItems.length === 1 && boxItems[0].newQty
                ? `x${boxItems[0].newQty}`
                : null;
            const key = `${baseName}::${itemLabels.join('|')}`;
            const existing = groupedBoxes.get(key);

            if (existing) {
                existing.count += 1;
                continue;
            }

            groupedBoxes.set(key, {
                baseName,
                count: 1,
                action: box.action,
                itemLabels,
                quantitySummary,
            });
        }

        if (
            groupedBoxes.size !== 1
            || actionLog.boxActions.length <= 1
        ) {
            return null;
        }

        const [group] = [...groupedBoxes.values()];
        if (group.count !== actionLog.boxActions.length) {
            return null;
        }

        const detail = group.quantitySummary
            ? `${group.count} boxes of '${group.baseName}' ${group.quantitySummary} in each.`
            : `${group.count} boxes of '${group.baseName}'.`;

        if (!storageLead) {
            return `Created ${detail}`;
        }

        if (actionLog.storageAction === 'created') {
            return `${storageLead} with ${detail}`;
        }

        const verb = group.action === 'created' ? 'Created' : 'Updated';
        return `${storageLead}. ${verb} ${detail}`;
    }

    private getSequentialBaseName(boxName: string): string {
        const numberedSuffixMatch = boxName.match(/^(.*?)(?:\s+(?:with\s+)?\d+)$/i);
        if (numberedSuffixMatch?.[1]) {
            return numberedSuffixMatch[1].trim();
        }

        return boxName.trim();
    }

    private buildCreateAcknowledgmentDetails(
        normalizedData: any,
        actionLog: {
            boxActions: { name: string; action: 'created' | 'found'; items: string[] }[];
            itemActions: { name: string; action: string; oldQty?: number; newQty?: number; boxClientRef?: string }[];
        },
    ): string[] {
        if (actionLog.boxActions.length > 0) {
            return actionLog.boxActions.map((box) => {
                const boxItems = this.getItemsForBox(
                    normalizedData,
                    actionLog.itemActions,
                    box.name,
                );
                const boxVerb = box.action === 'created' ? 'Created' : 'Updated';
                const hasOnlyUnchangedItems = boxItems.length > 0
                    && boxItems.every((item) => item.action === 'unchanged');

                if (boxItems.length === 0) {
                    if (box.action === 'found') {
                        return `Box '${box.name}' already exists.`;
                    }
                    return `${boxVerb} box '${box.name}'.`;
                }

                if (box.action === 'found' && hasOnlyUnchangedItems) {
                    const itemLabels = boxItems.map((item) =>
                        this.formatCreatedItemLabel(item),
                    );
                    return `Box '${box.name}' already contains ${this.joinHumanList(itemLabels)}.`;
                }

                if (box.action === 'found') {
                    const unchangedItems = boxItems.filter((item) => item.action === 'unchanged');
                    const createdItems = boxItems.filter((item) => item.action === 'created');
                    const incrementedItems = boxItems.filter((item) => item.action === 'incremented');
                    const modifiedItems = boxItems.filter((item) => item.action === 'modified');
                    const detailParts = [`Box '${box.name}' already exists.`];

                    if (unchangedItems.length > 0) {
                        detailParts.push(
                            `Already contains ${this.joinHumanList(
                                unchangedItems.map((item) => this.formatCreatedItemLabel(item)),
                            )}.`,
                        );
                    }

                    if (createdItems.length > 0) {
                        detailParts.push(
                            `Added ${this.joinHumanList(
                                createdItems.map((item) => this.formatCreatedItemLabel(item)),
                            )}.`,
                        );
                    }

                    if (incrementedItems.length > 0) {
                        detailParts.push(
                            ...incrementedItems.map((item) => {
                                const previousQty = item.oldQty || 0;
                                const currentQty = item.newQty || previousQty;
                                const added = Math.max(0, currentQty - previousQty);

                                return `${item.name} already exists in '${box.name}'. Added ${added} more. New total: ${currentQty}.`;
                            }),
                        );
                    }

                    if (modifiedItems.length > 0) {
                        detailParts.push(
                            ...modifiedItems.map((item) =>
                                `Updated '${item.name}'${item.newQty !== undefined ? ` to ${item.newQty}` : ''}.`,
                            ),
                        );
                    }

                    return detailParts.join(' ');
                }

                const itemLabels = boxItems.map((item) =>
                    this.formatCreatedItemLabel(item),
                );
                return `${boxVerb} box '${box.name}' with ${this.joinHumanList(itemLabels)}.`;
            });
        }

        return actionLog.itemActions.map((item) => {
            const boxName = this.getBoxNameForItem(
                normalizedData,
                item.boxClientRef,
            );
            return `Added ${item.newQty || 1} ${item.name}${boxName ? ` to '${boxName}' box` : ''}.`;
        });
    }

    private buildIncrementAcknowledgmentDetails(
        normalizedData: any,
        actionLog: {
            boxActions: { name: string; action: 'created' | 'found'; items: string[] }[];
            itemActions: {
                name: string;
                action: string;
                oldQty?: number;
                newQty?: number;
                boxClientRef?: string;
                quantityChanged?: boolean;
                descriptionChanged?: boolean;
            }[];
        },
    ): string[] {
        const parts: string[] = [];
        const createdBoxNames = new Set(
            actionLog.boxActions
                .filter((box) => box.action === 'created')
                .map((box) => box.name),
        );

        for (const box of actionLog.boxActions.filter((entry) => entry.action === 'created')) {
            const boxItems = this.getItemsForBox(
                normalizedData,
                actionLog.itemActions,
                box.name,
            );

            if (boxItems.length === 0) {
                parts.push(`Created box '${box.name}'.`);
                continue;
            }

            const itemLabels = boxItems.map((item) =>
                this.formatCreatedItemLabel(item),
            );
            parts.push(`Created box '${box.name}' with ${this.joinHumanList(itemLabels)}.`);
        }

        for (const item of actionLog.itemActions) {
            const boxName = this.getBoxNameForItem(
                normalizedData,
                item.boxClientRef,
            );

            if (boxName && createdBoxNames.has(boxName) && item.action === 'created') {
                continue;
            }

            if (item.action === 'incremented') {
                const previousQty = item.oldQty || 0;
                const currentQty = item.newQty || previousQty;
                const added = Math.max(0, currentQty - previousQty);

                if (boxName) {
                    parts.push(
                        `${item.name} already exists in '${boxName}'. Added ${added} more. New total: ${currentQty}.`,
                    );
                } else {
                    parts.push(
                        `Added ${added} more ${item.name}. New total: ${currentQty}.`,
                    );
                }
                continue;
            }

            if (item.action === 'created') {
                const label = this.formatCreatedItemLabel(item);
                parts.push(
                    boxName
                        ? `Added ${label} to '${boxName}'.`
                        : `Added ${label}.`,
                );
                continue;
            }

            if (item.action === 'modified') {
                if (item.quantityChanged && item.oldQty !== undefined && item.newQty !== undefined) {
                    parts.push(
                        `Updated '${boxName || item.name}': ${item.name} quantity changed from ${item.oldQty} to ${item.newQty}.`,
                    );
                    continue;
                }

                parts.push(`Updated '${boxName || item.name}': ${item.name} description was updated.`);
            }
        }

        return parts;
    }

    private buildDecrementAcknowledgmentDetails(
        normalizedData: any,
        actionLog: {
            itemActions: {
                name: string;
                action: string;
                oldQty?: number;
                newQty?: number;
                boxClientRef?: string;
                quantityChanged?: boolean;
                descriptionChanged?: boolean;
            }[];
        },
    ): string[] {
        return actionLog.itemActions.map((item) => {
            const remaining = item.newQty ?? 0;
            const removed = (item.oldQty || 0) - remaining;
            const boxName = this.getBoxNameForItem(
                normalizedData,
                item.boxClientRef,
            );

            if (boxName) {
                return `Updated '${boxName}': Removed ${removed} ${item.name}. Remaining: ${remaining}.`;
            }

            return `Removed ${removed} ${item.name}. Remaining: ${remaining}.`;
        });
    }

    private buildUpdateAcknowledgmentDetails(
        normalizedData: any,
        actionLog: {
            boxActions: { name: string; action: 'created' | 'found'; items: string[] }[];
            itemActions: {
                name: string;
                action: string;
                oldQty?: number;
                newQty?: number;
                boxClientRef?: string;
                quantityChanged?: boolean;
                descriptionChanged?: boolean;
            }[];
        },
    ): string[] {
        const parts: string[] = [];

        for (const box of actionLog.boxActions) {
            const boxItems = this.getItemsForBox(
                normalizedData,
                actionLog.itemActions,
                box.name,
            );

            if (box.action === 'created') {
                if (boxItems.length === 0) {
                    parts.push(`Created box '${box.name}'.`);
                    continue;
                }

                const createdLabels = boxItems
                    .filter((item) => item.action === 'created')
                    .map((item) => this.formatCreatedItemLabel(item));
                if (createdLabels.length === 0) {
                    parts.push(`Created box '${box.name}'.`);
                    continue;
                }

                parts.push(
                    `Created box '${box.name}' with ${this.joinHumanList(createdLabels)}.`,
                );
                continue;
            }

            const createdItems = boxItems.filter((item) => item.action === 'created');
            if (createdItems.length > 0) {
                parts.push(
                    `Added ${this.joinHumanList(
                        createdItems.map((item) => this.formatCreatedItemLabel(item)),
                    )} to existing box '${box.name}'.`,
                );
            }
        }

        for (const item of actionLog.itemActions) {
            const boxName = this.getBoxNameForItem(
                normalizedData,
                item.boxClientRef,
            );

            if (item.action === 'modified') {
                if (item.quantityChanged && item.oldQty !== undefined && item.newQty !== undefined) {
                    parts.push(
                        `Updated '${boxName || item.name}': ${item.name} quantity changed from ${item.oldQty} to ${item.newQty}.`,
                    );
                    continue;
                }

                if (item.descriptionChanged) {
                    parts.push(`Updated '${boxName || item.name}': ${item.name} description was updated.`);
                }
                continue;
            }

            if (item.action === 'created' && !boxName) {
                parts.push(`Created '${item.name}'${boxName ? ` in '${boxName}'` : ''}${item.newQty ? ` (x${item.newQty})` : ''}.`);
            }
        }

        return parts;
    }

    private getItemsForBox(
        normalizedData: any,
        itemActions: Array<{ name: string; action: string; oldQty?: number; newQty?: number; boxClientRef?: string }>,
        boxName: string,
    ) {
        return itemActions.filter(
            (item) => this.getBoxNameForItem(normalizedData, item.boxClientRef) === boxName,
        );
    }

    private getBoxNameForItem(normalizedData: any, boxClientRef?: string): string | null {
        if (!boxClientRef) {
            return null;
        }

        const box = normalizedData.boxes?.find(
            (entry: any) => entry.clientRef === boxClientRef,
        );
        return box?.name ?? null;
    }

    private formatCreatedItemLabel(item: { name: string; newQty?: number }): string {
        const quantity = item.newQty ?? 1;
        return quantity > 1 ? `'${item.name}' (x${quantity})` : `'${item.name}'`;
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

    private prepareNormalizedDataForPersistence(
        normalizedData: any,
        expandedBoxes?: Array<{ originalName: string; normalizedOriginalName?: string; expandedNames: string[] }> | null,
    ): any {
        const prepared = {
            ...normalizedData,
            boxes: [...(normalizedData.boxes || [])],
            items: [...(normalizedData.items || [])],
        };

        if (!expandedBoxes || expandedBoxes.length === 0) {
            return prepared;
        }

        const expansionByOriginalName = new Map<string, string[]>();
        expandedBoxes.forEach((entry) => {
            expansionByOriginalName.set(entry.originalName.toLowerCase(), entry.expandedNames);
            if (entry.normalizedOriginalName) {
                expansionByOriginalName.set(entry.normalizedOriginalName, entry.expandedNames);
            }
        });
        const expandedBoxList: any[] = [];
        const sourceItems = prepared.items.map((item: any) => ({ ...item }));
        const finalItems: any[] = [];

        for (const box of prepared.boxes) {
            const expandedNames = expansionByOriginalName.get(
                box.name.toLowerCase(),
            );
            const relatedItems = sourceItems.filter(
                (item: any) => item.boxClientRef === box.clientRef,
            );

            if (!expandedNames || expandedNames.length <= 1) {
                expandedBoxList.push({ ...box, quantity: null });
                finalItems.push(...relatedItems);
                continue;
            }

            const expandedRefs = expandedNames.map((name) => `${box.clientRef}:${name}`);

            expandedNames.forEach((name, index) => {
                expandedBoxList.push({
                    ...box,
                    name,
                    quantity: null,
                    clientRef: expandedRefs[index],
                });
            });

            if (relatedItems.length === expandedRefs.length) {
                relatedItems.forEach((item: any, index: number) => {
                    finalItems.push({
                        ...item,
                        boxClientRef: expandedRefs[index],
                    });
                });
            } else if (relatedItems.length > 0) {
                relatedItems.forEach((item: any) => {
                    if (item.replicatePerExpandedBox) {
                        expandedRefs.forEach((ref: string) => {
                            finalItems.push({
                                ...item,
                                boxClientRef: ref,
                            });
                        });
                        return;
                    }

                    finalItems.push({
                        ...item,
                        boxClientRef: expandedRefs[0],
                    });
                });
            }
        }

        prepared.boxes = expandedBoxList;
        prepared.items = finalItems;
        return prepared;
    }
}
