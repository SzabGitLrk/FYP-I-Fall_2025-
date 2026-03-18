import { Injectable } from '@nestjs/common';
import * as pluralize from 'pluralize';
import { DICTIONARY_CONFIG } from './dictionary.config';

@Injectable()
export class TextParsingService {
    private readonly DICTIONARY = DICTIONARY_CONFIG;
    private readonly GENERIC_ENTITY_LABELS = new Set([
        'storage', 'storages', 'room', 'rooms', 'area', 'areas', 'space', 'spaces',
        'location', 'locations', 'box', 'boxes', 'bin', 'bins', 'crate', 'crates',
        'container', 'containers', 'item', 'items', 'object', 'objects', 'thing',
        'things', 'article', 'articles',
    ]);

    private extractExplicitFamilyBoxSelector(
        text: string,
    ): { selector: 'all' | 'each'; boxName: string } | null {
        const match = text.match(
            /\b(?<selector>all|each)\s+(?<boxName>[a-zA-Z0-9 ]+?)\s+box(?:es)?\b/i,
        );
        if (!match?.groups?.selector || !match.groups.boxName) {
            return null;
        }

        return {
            selector: match.groups.selector.toLowerCase() as 'all' | 'each',
            boxName: match.groups.boxName.trim(),
        };
    }

    private isExplicitFamilySelectorArtifact(
        itemName: string | null | undefined,
        selector: 'all' | 'each',
        boxName: string,
    ): boolean {
        const normalizedItem = (itemName || '').trim().toLowerCase();
        if (!normalizedItem) {
            return false;
        }

        return normalizedItem === `${selector} ${boxName}`.trim().toLowerCase();
    }

    private parseDirectionalItemPhrase(
        itemPhrase: string,
        itemKeywords: string[],
    ): { name: string; quantity: number; explicitQuantity: boolean } {
        const rawPhrase = (itemPhrase || '').trim();
        if (!rawPhrase) {
            return { name: '', quantity: 1, explicitQuantity: false };
        }

        let normalizedPhrase = rawPhrase;
        if (/^(?:more|extra|additional|another)\s+/i.test(normalizedPhrase)) {
            normalizedPhrase = normalizedPhrase.replace(
                /^(?:more|extra|additional|another)\s+/i,
                '',
            ).trim();
        }

        const itemKeywordPattern = this.buildKeywordAlternationPattern(itemKeywords);
        if (itemKeywordPattern) {
            normalizedPhrase = normalizedPhrase.replace(
                new RegExp(`^(?:${itemKeywordPattern})\\s+`, 'i'),
                '',
            ).trim();
        }

        if (!normalizedPhrase) {
            return {
                name: rawPhrase.toLowerCase(),
                quantity: 1,
                explicitQuantity: false,
            };
        }

        const leadingQuantityMatch = normalizedPhrase.match(
            /^(?<qty>\d+)\s+(?<name>.+)$/i,
        );
        if (leadingQuantityMatch?.groups?.qty && leadingQuantityMatch.groups.name) {
            return {
                name: leadingQuantityMatch.groups.name.trim(),
                quantity: parseInt(leadingQuantityMatch.groups.qty, 10),
                explicitQuantity: true,
            };
        }

        const trailingQuantityMatch = normalizedPhrase.match(
            /^(?<name>.+?)\s+(?<qty>\d+)$/i,
        );
        if (trailingQuantityMatch?.groups?.qty && trailingQuantityMatch.groups.name) {
            return {
                name: trailingQuantityMatch.groups.name.trim(),
                quantity: parseInt(trailingQuantityMatch.groups.qty, 10),
                explicitQuantity: true,
            };
        }

        return {
            name: normalizedPhrase,
            quantity: 1,
            explicitQuantity: false,
        };
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
            // Multi-sentence: "Create box. Then add items" -> treat as 'create'
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
        const incrementIntentPattern = this.buildKeywordAlternationPattern(
            dict.INTENTS.INCREMENT,
        );
        const groupedSectionMatch = normalizedText.match(
            new RegExp(
                `^(?<intent>\\w+)\\s+(?:a\\s+)?(?:${groupedStorageSectionPattern})\\s+(?:(?:${groupedNameConnectorPattern})\\s+)?(?<storage>.+?)(?:\\s+(?:${groupedStorageDescriptionPattern})\\s+(?<storageDesc>.+?))?\\s+containing\\s+(?<boxKeyword>[a-zA-Z0-9 ]+?):\\s+(?<rest>.+)$`,
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
        const directionalIncrementMatch = normalizedText.match(
            new RegExp(
                `^(?<intent>${incrementIntentPattern})\\s+(?<itemPhrase>.+?)\\s+to\\s+(?<boxPhrase>.+?)(?:\\s+in\\s+(?:${groupedStorageSectionPattern})\\s+(?<storage>.+))?$`,
                'i',
            ),
        );
        if (directionalIncrementMatch?.groups?.itemPhrase && directionalIncrementMatch.groups.boxPhrase) {
            const rawBoxPhrase = directionalIncrementMatch.groups.boxPhrase.trim();
            const explicitFamilyBox = this.extractExplicitFamilyBoxSelector(rawBoxPhrase);
            const explicitBoxMatch = rawBoxPhrase.match(
                new RegExp(
                    `^(?:${groupedBoxSectionPattern})\\s+(?<boxName>.+)$`,
                    'i',
                ),
            );
            const resolvedBoxName = explicitFamilyBox?.boxName?.trim()
                || explicitBoxMatch?.groups?.boxName?.trim();

            if (resolvedBoxName) {
                const parsedItem = this.parseDirectionalItemPhrase(
                    directionalIncrementMatch.groups.itemPhrase,
                    itemSyns,
                );
                const allWords = normalizedText.split(/\s+/).filter((w) => w.length > 0);

                return {
                    intent: 'increment',
                    storageName: directionalIncrementMatch.groups.storage?.trim() || null,
                    storageDescription: null,
                    boxes: [
                        {
                            name: resolvedBoxName,
                            quantity: null,
                            description: null,
                            clientRef: 'b1',
                        },
                    ],
                    items: parsedItem.name
                        ? [
                            {
                                name: parsedItem.name,
                                quantity: parsedItem.quantity,
                                explicitQuantity: parsedItem.explicitQuantity,
                                description: null,
                                boxClientRef: 'b1',
                                orphaned: false,
                            },
                        ]
                        : [],
                    boxName: resolvedBoxName,
                    boxQuantity: null,
                    boxDescription: null,
                    ambiguous: false,
                    rawIntents: ['increment'],
                    totalWords: allWords.length,
                    extractedWordCount: allWords.length,
                    meta: {
                        mappingStrategy: 'direct',
                        preIntentLocationOverflow: false,
                        boxFamilySelector: explicitFamilyBox?.selector ?? null,
                        boxFamilyName: explicitFamilyBox?.boxName ?? null,
                        ...keywordFlags,
                    },
                };
            }
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
            const boxKeyword = groupedSectionMatch.groups.boxKeyword.toLowerCase();
            const genericBoxSectionKeywords = new Set(
                boxSyns.flatMap((syn) => {
                    const normalized = syn.toLowerCase();
                    return [
                        normalized,
                        pluralize.singular(normalized),
                        pluralize.plural(normalized),
                    ];
                }),
            );
            // Treat recognized box synonyms, or any label followed by a later item section,
            // as a grouped box-section header.
            const isGenericBoxKeyword = genericBoxSectionKeywords.has(boxKeyword) || !!itemSectionMatch;

            if (!isGenericBoxKeyword) {
                groupedBoxes.push({
                    name: groupedSectionMatch.groups.boxKeyword,
                    quantity: null,
                    description: null,
                    clientRef: `b${groupedRefCounter++}`,
                });
            }

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
                        continue;
                    }

                    const boxNameRaw = segmentMatch.groups.boxName.trim();
                    const boxNameLower = boxNameRaw.toLowerCase();
                    const hasExplicitBoxKeyword = this.DICTIONARY.ENTITIES.BOX.some((syn) =>
                        boxNameLower === syn.toLowerCase() || boxNameLower.startsWith(syn.toLowerCase() + ' '),
                    );

                    if (!isGenericBoxKeyword && !hasExplicitBoxKeyword) {
                        const targetBox = groupedBoxes[groupedBoxes.length - 1];
                        const { name: itemName, description: itemDescription } = this.extractStructuredDescription(
                            boxNameRaw,
                            structuredDescriptionKeys,
                        );
                        groupedItems.push({
                            name: itemName,
                            quantity: segmentMatch.groups.boxQty ? parseInt(segmentMatch.groups.boxQty, 10) : 1,
                            explicitQuantity: !!segmentMatch.groups.boxQty,
                            replicatePerExpandedBox: false,
                            description: itemDescription,
                            boxClientRef: targetBox.clientRef,
                            orphaned: false,
                        });
                        continue;
                    }

                    const { name: boxName, description: boxDescription } = this.extractStructuredDescription(
                        boxNameRaw,
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
                for (const segment of segmentParts) {
                    const segmentMatch = segment.match(
                        /^(?:(?<qty>\d+)\s+)?(?<name>[a-zA-Z0-9 ]+)$/i,
                    );
                    if (!segmentMatch?.groups?.name) {
                        continue;
                    }

                    const nameRaw = segmentMatch.groups.name.trim();
                    const nameLower = nameRaw.toLowerCase();
                    const hasExplicitBoxKeyword = this.DICTIONARY.ENTITIES.BOX.some((syn) =>
                        nameLower === syn.toLowerCase() || nameLower.startsWith(syn.toLowerCase() + ' '),
                    );

                    if (!isGenericBoxKeyword && !hasExplicitBoxKeyword) {
                        const targetBox = groupedBoxes[groupedBoxes.length - 1];
                        const { name: itemName, description: itemDescription } = this.extractStructuredDescription(
                            nameRaw,
                            structuredDescriptionKeys,
                        );
                        groupedItems.push({
                            name: itemName,
                            quantity: segmentMatch.groups.qty ? parseInt(segmentMatch.groups.qty, 10) : 1,
                            explicitQuantity: !!segmentMatch.groups.qty,
                            replicatePerExpandedBox: false,
                            description: itemDescription,
                            boxClientRef: targetBox.clientRef,
                            orphaned: false,
                        });
                        continue;
                    }

                    const { name: boxName, description: boxDescription } = this.extractStructuredDescription(
                        nameRaw,
                        structuredDescriptionKeys,
                    );

                    groupedBoxes.push({
                        name: boxName,
                        quantity: segmentMatch.groups.qty
                            ? parseInt(segmentMatch.groups.qty, 10)
                            : null,
                        description: boxDescription,
                        clientRef: `b${groupedRefCounter++}`,
                    });
                }
            }

            if (groupedBoxes.length > 0) {
                const allWords = normalizedText.split(/\s+/).filter((w) => w.length > 0);
                return {
                    intent: extractedIntent || (groupedSectionMatch.groups.intent ? groupedSectionMatch.groups.intent.toLowerCase() : 'create'),
                    storageName: groupedSectionMatch.groups.storage.trim(),
                    storageDescription: groupedSectionMatch.groups.storageDesc?.trim() || null,
                    boxes: groupedBoxes,
                    items: groupedItems,
                    boxName: groupedBoxes[0]?.name ?? null,
                    boxQuantity: groupedBoxes[0]?.quantity ?? null,
                    boxDescription: groupedBoxes[0]?.description ?? null,
                    ambiguous: false,
                    rawIntents: orderedIntents.length > 0 ? orderedIntents : [(groupedSectionMatch.groups.intent ? groupedSectionMatch.groups.intent.toLowerCase() : 'create')],
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

            // Strip leading "of " from accumulated text (e.g., "of eggs" -> "eggs")
            trimmed = trimmed.replace(/^of\s+/i, '');
            // Strip quantity filler words (e.g., "more hammer" -> "hammer")
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

            // Punctuation - finalize but DO NOT reset mode (supports multi-sentence)
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
                        // Check for "in which" -> context-aware transition
                        let nextNonEmpty = '';
                        for (let j = i + 1; j < parts.length; j++) {
                            nextNonEmpty = (parts[j] || '').trim().toLowerCase();
                            if (nextNonEmpty) break;
                        }
                        if (transitionPhrases.includes(nextNonEmpty)) {
                            finalize();
                            // "in which" -> use verb lookahead to determine mode (not forced ITEM)
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

                    // Handle "of" -> skip it (quantity carries forward)
                    if (lower === 'of') {
                        continue;
                    }

                    // Handle "to" -> finalize and skip (directional: "add X to Y")
                    if (lower === 'to') {
                        finalize(pendingQuantity ? 'items' : undefined);
                        continue;
                    }

                    // Handle "for" as a name connector after BOX or STORAGE mode
                    if (lower === 'for' && (currentMode === 'BOX' || currentMode === 'STORAGE') && accumulator === '') {
                        // "box for shirts" / "storage for my tools" - "for" acts like "named"
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

            // Transition phrases ("which", "where") - skip them
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
                    // "3 to box", "12 of eggs", "5 for shipping" -> number is always a count
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
                                // First pre-intent "in X" -> storage
                                storageName = trimmed;
                                preIntentInContexts[preIntentInContexts.length - 1] = 'storage';
                                usedPreIntentContext = true;
                            } else {
                                // Subsequent "in X" -> box (supports 3+ levels)
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

        const explicitFamilySelector = this.extractExplicitFamilyBoxSelector(normalizedText);
        if (explicitFamilySelector) {
            const clientRef = boxes[0]?.clientRef || createBoxRef();
            boxes = [{
                name: explicitFamilySelector.boxName,
                quantity: null,
                description: boxes[0]?.description ?? null,
                clientRef,
            }];
            items = items
                .filter((item: any) => !this.isExplicitFamilySelectorArtifact(
                    item?.name,
                    explicitFamilySelector.selector,
                    explicitFamilySelector.boxName,
                ))
                .map((item: any) => ({
                    ...item,
                    boxClientRef: clientRef,
                    orphaned: false,
                    replicatePerExpandedBox: true,
                }));
        }

        // 3. Contextual Intent: promote INCREMENT -> CREATE when new boxes were created
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
                boxFamilySelector: explicitFamilySelector?.selector ?? null,
                boxFamilyName: explicitFamilySelector?.boxName ?? null,
                ...keywordFlags,
            },
        };
    }

    private applySequentialMapping(boxRefs: string[], itemIdxs: number[], items: any[]) {
        if (boxRefs.length > 1 && itemIdxs.length >= boxRefs.length) {
            // 1:1 pairing: Box1 <-> Item1, Box2 <-> Item2
            for (let j = 0; j < boxRefs.length; j++) {
                if (j < itemIdxs.length) {
                    items[itemIdxs[j]].boxClientRef = boxRefs[j];
                    items[itemIdxs[j]].orphaned = false;
                }
            }
            // Extra items beyond 1:1 pairing -> assign to the last box
            const lastBoxRef = boxRefs[boxRefs.length - 1];
            for (let j = boxRefs.length; j < itemIdxs.length; j++) {
                items[itemIdxs[j]].boxClientRef = lastBoxRef;
                items[itemIdxs[j]].orphaned = false;
            }
        }
    }

}
