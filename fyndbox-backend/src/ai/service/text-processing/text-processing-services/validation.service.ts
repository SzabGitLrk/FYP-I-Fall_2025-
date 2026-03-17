import { Injectable } from '@nestjs/common';
import { LightNormalizationService } from './light-normalization.service';
import { HeavyNormalizationService } from './heavy-normalization.service';

@Injectable()
export class ValidationService {
    private COMPATIBLE_INTENTS: Record<string, string[]> = {
        'create': ['create', 'increment'],
        'increment': ['increment', 'create', 'update'],
        'decrement': ['decrement'],
        'update': ['update', 'increment'],
    };

    constructor(
        private readonly lightNormalization: LightNormalizationService,
        private readonly normalization: HeavyNormalizationService,
    ) {}

    // Pre-pipeline gate.
    validateInput(rawText: string | null | undefined): { isValid: boolean; message: string | null } {
        if (!rawText || rawText.trim().length === 0) {
            return { isValid: false, message: 'Please enter an instruction to get started.' };
        }

        const cleanedForValidation = this.lightNormalization.removeStopWords(
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

    intentClassification(
        parsedData: any,
        existingContext?: {
            storages: Array<string | { name: string }>;
            boxes: Array<string | { name: string }>;
            items: Array<string | { name: string; quantity?: number }>;
        },
        typoCount: number = 0,
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

        const scope = {
            affectsStorage: !!parsedData.storageName,
            affectsBoxes: (parsedData.boxes?.length || 0) > 0,
            affectsItems: (parsedData.items?.length || 0) > 0,
        };

        const suggestions: string[] = [];
        if (existingContext) {
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
                    (dbName) => dbName.toLowerCase() !== name.toLowerCase()
                        && this.getLevenshteinDistance(name.toLowerCase(), dbName.toLowerCase()) < 2,
                );
                if (fuzzyMatches.length > 0) {
                    const candidates = [name, ...fuzzyMatches].map((n) => `'${n}'`).join(' or ');
                    suggestions.push(`Ambiguous request. Did you mean ${candidates}?`);
                }
            }
        }

        if (parsedData.meta?.preIntentLocationOverflow) {
            return {
                intent,
                isValid: false,
                scope,
                clarification: "Please use one storage and up to two box levels. Example: 'In Kitchen in Fridge add dozen eggs'.",
                suggestions,
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
                suggestions,
                confidence: 0,
                shouldFallToLLM: true,
            };
        }

        if (!intent && rawIntents.length === 0 && !hasEntities) {
            return {
                intent: null, isValid: false, scope,
                clarification: 'Could not understand the instruction. Please try again.',
                suggestions, confidence: 0, shouldFallToLLM: true,
            };
        }

        if (!intent && rawIntents.length === 0 && hasEntities) {
            const canDirectClarify = !hasUnrecognizedWords && !hasConversationalNoise && hasStructuredAnchor;
            return {
                intent: null, isValid: false, scope,
                clarification: this.buildMissingIntentClarification(parsedData),
                suggestions, confidence: 0, shouldFallToLLM: !canDirectClarify,
            };
        }

        if (rawIntents.length > 1) {
            const primary = rawIntents[0];
            const compatible = this.COMPATIBLE_INTENTS[primary] || [primary];
            const conflicting = rawIntents.filter((i) => !compatible.includes(i));
            if (conflicting.length > 0) {
                return {
                    intent: null, isValid: false, scope,
                    clarification: 'Please provide one instruction at a time.',
                    suggestions, confidence: 0, shouldFallToLLM: true,
                };
            }
        }

        if (intent === 'decrement') {
            const targetedItems = parsedData.items || [];
            if (targetedItems.length > 0) {
                if (!existingContext) {
                    // When context is unavailable and a storage was named, tell the user it doesn't exist.
                    if (parsedData.storageName) {
                        return {
                            intent: 'decrement', isValid: false, scope,
                            clarification: `Storage '${this.toTitleCase(parsedData.storageName)}' does not exist.`,
                            suggestions, confidence: 0, shouldFallToLLM: false,
                        };
                    }
                    return {
                        intent: 'decrement', isValid: false, scope,
                        clarification: 'Please confirm which existing item quantity should be decreased.',
                        suggestions, confidence: 0, shouldFallToLLM: true,
                    };
                }

                const matchedStorageRecord = parsedData.storageName
                    ? existingContext.storages.find(
                        (storage: any) => this.normalizeLookupName(
                            typeof storage === 'string' ? storage : storage.name,
                        ) === this.normalizeLookupName(parsedData.storageName),
                    )
                    : null;
                // Surface a clear missing-storage message for remove/decrement flows.
                if (parsedData.storageName && !matchedStorageRecord) {
                    return {
                        intent: 'decrement', isValid: false, scope,
                        clarification: `Storage '${this.toTitleCase(parsedData.storageName)}' does not exist.`,
                        suggestions, confidence: 0, shouldFallToLLM: false,
                    };
                }
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
                    // Stop early when a target box is missing for a remove/decrement instruction.
                    if (targetBoxName && !matchedBoxRecord) {
                        const storageLabel = parsedData.storageName
                            ? ` in storage '${this.toTitleCase(parsedData.storageName)}'`
                            : '';
                        return {
                            intent: 'decrement', isValid: false, scope,
                            clarification: `Box '${this.toTitleCase(targetBoxName)}' does not exist${storageLabel}.`,
                            suggestions, confidence: 0, shouldFallToLLM: false,
                        };
                    }
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
                            clarification: `Item '${this.toTitleCase(item.name)}' does not exist.`,
                            suggestions, confidence: 0, shouldFallToLLM: false,
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
                    suggestions,
                    confidence: 0.95,
                    shouldFallToLLM: false,
                };
            }

            return {
                intent: null, isValid: false, scope,
                clarification: 'Deletion is not supported in this version.',
                suggestions, confidence: 0, shouldFallToLLM: false,
            };
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
                suggestions, confidence: 0, shouldFallToLLM: !canDirectClarify,
            };
        }

        if (scope.affectsItems && !scope.affectsBoxes) {
            const canDirectClarify = !hasUnrecognizedWords
                && !hasConversationalNoise
                && Boolean(parsedData.storageName || parsedData.meta?.boxKeywordSeen);
            return {
                intent, isValid: false, scope,
                clarification: this.buildMissingBoxClarification(parsedData),
                suggestions, confidence: 0, shouldFallToLLM: !canDirectClarify,
            };
        }

        if (!parsedData.storageName && (scope.affectsBoxes || scope.affectsItems)) {
            const canDirectClarify = !hasUnrecognizedWords
                && !hasConversationalNoise
                && Boolean(parsedData.meta?.boxKeywordSeen);
            return {
                intent, isValid: false, scope,
                clarification: this.buildMissingStorageClarification(parsedData),
                suggestions, confidence: 0, shouldFallToLLM: !canDirectClarify,
            };
        }

        // Confirm creation when update/increment targets a missing storage or box.
        if (
            (intent === 'update' || intent === 'increment')
            && parsedData.storageName
        ) {
            const matchedStorageRecord = existingContext?.storages.find(
                (storage: any) => this.normalizeLookupName(
                    typeof storage === 'string' ? storage : storage.name,
                ) === this.normalizeLookupName(parsedData.storageName),
            );
            if (!matchedStorageRecord) {
                return {
                    intent,
                    isValid: true,
                    scope,
                    clarification: null,
                    confirmation: `Storage '${this.toTitleCase(parsedData.storageName)}' does not exist. Create it?`,
                    expandedBoxes: null,
                    suggestions,
                    confidence: 0.85,
                    shouldFallToLLM: false,
                };
            }

            const storageId = typeof matchedStorageRecord === 'object'
                ? (matchedStorageRecord as any).id
                : null;
            const scopedBoxes = storageId
                ? (existingContext?.boxes || []).filter(
                    (box: any) => typeof box === 'object' && (box as any).storageId === storageId,
                )
                : (existingContext?.boxes || []);
            const missingBoxes = (parsedData.boxes || [])
                .map((box: any) => box?.name)
                .filter(Boolean)
                .filter((boxName: string) => !scopedBoxes.some(
                    (box: any) => this.normalizeLookupName(
                        typeof box === 'string' ? box : box.name,
                    ) === this.normalizeLookupName(boxName),
                ));
            if (missingBoxes.length > 0) {
                const quotedBoxes = missingBoxes.map(
                    (boxName: string) => `'${this.toTitleCase(boxName)}'`,
                );
                const storageLabel = parsedData.storageName
                    ? ` in storage '${this.toTitleCase(parsedData.storageName)}'`
                    : '';
                const boxLabel = missingBoxes.length === 1 ? 'Box' : 'Boxes';
                const createLabel = missingBoxes.length === 1 ? 'it' : 'them';
                const existVerb = missingBoxes.length === 1 ? 'does' : 'do';
                return {
                    intent,
                    isValid: true,
                    scope,
                    clarification: null,
                    confirmation: `${boxLabel} ${this.joinHumanList(quotedBoxes)} ${existVerb} not exist${storageLabel}. Create ${createLabel}?`,
                    expandedBoxes: null,
                    suggestions,
                    confidence: 0.85,
                    shouldFallToLLM: false,
                };
            }
        }

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
                        suggestions, confidence: 0, shouldFallToLLM: false,
                    };
                }
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

        const expandedOriginalNames = new Set((expandedBoxes || []).map((eb: any) => eb.originalName.toLowerCase()));
        const matchedStorageSummaries: string[] = [];
        const matchedItemSummaries: string[] = [];
        const pendingCreateSummaries: string[] = [];

        if (existingContext) {
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
                    if (expandedOriginalNames.has(box.name.toLowerCase())) return;
                    const match = scopedBoxes.find(
                        (b: any) => this.normalizeLookupName(
                            typeof b === 'string' ? b : b.name,
                        ) === this.normalizeLookupName(box.name),
                    );
                    if (match) {
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

        let confidence = 0;
        if (intent) confidence += 0.3;
        if (parsedData.storageName) confidence += 0.2;
        const boxCount = parsedData.boxes?.length || 0;
        confidence += Math.min(0.3, boxCount * 0.15);
        const itemCount = parsedData.items?.length || 0;
        confidence += Math.min(0.2, itemCount * 0.1);
        if (intent && parsedData.storageName && boxCount === 0 && itemCount === 0) {
            confidence += 0.25;
        }

        confidence -= typoCount * 0.05;

        const totalWords = parsedData.totalWords || 1;
        const extractedWordCount = parsedData.extractedWordCount || 0;
        const unrecognizedRatio = (totalWords - extractedWordCount) / totalWords;
        if (unrecognizedRatio > 0.1) {
            confidence -= 0.3 * unrecognizedRatio;
        }

        if (!intent || !parsedData.storageName) {
            confidence = 0;
        }

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

    private getBoxNameForItem(normalizedData: any, boxClientRef?: string): string | null {
        if (!boxClientRef) return null;
        const box = normalizedData.boxes?.find(
            (entry: any) => entry.clientRef === boxClientRef,
        );
        return box?.name ?? null;
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

    private toTitleCase(value: string): string {
        return this.normalization.toTitleCase(value);
    }

    private toSingular(value: string): string {
        return this.normalization.toSingular(value);
    }

    private normalizeLookupName(value: string | null | undefined): string {
        return this.normalization.normalizeLookupName(value);
    }

    private normalizeDescriptionText(value?: string | null): string {
        return this.normalization.normalizeDescriptionText(value);
    }
}
