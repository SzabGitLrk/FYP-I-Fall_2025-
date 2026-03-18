import { Injectable } from '@nestjs/common';
import * as pluralize from 'pluralize';
import { DICTIONARY_CONFIG } from './dictionary.config';

@Injectable()
export class HeavyNormalizationService {
    private readonly NON_SINGULARIZABLE_WORDS = new Set(
        DICTIONARY_CONFIG.NON_SINGULARIZABLE_WORDS,
    );

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

    // Allow runtime additions.
    addSynonym(synonym: string, canonical: string): void {
        this.SYNONYM_MAP[synonym.toLowerCase()] = canonical;
    }

    getSynonyms(): Record<string, string> {
        return { ...this.SYNONYM_MAP };
    }

    toTitleCase(text: string): string {
        return text.split(/\s+/).map((word) => {
            if (word.length >= 2 && word === word.toUpperCase() && /^[A-Z]+$/.test(word)) {
                return word;
            }
            if (/\d/.test(word)) {
                return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join(' ');
    }

    toSingular(text: string): string {
        return text.split(/\s+/).map((word) => {
            if (word.length <= 2 || (word === word.toUpperCase() && /^[A-Z]+$/.test(word))) {
                return word;
            }
            if (this.NON_SINGULARIZABLE_WORDS.has(word.toLowerCase())) {
                return word;
            }
            return pluralize.singular(word);
        }).join(' ');
    }

    normalizeDescriptionText(description?: string | null): string {
        return (description || '')
            .trim()
            .replace(/\s+/g, ' ')
            .toLowerCase();
    }

    normalizeLookupName(name: string | null | undefined): string {
        return this.toSingular((name || '').trim().toLowerCase()).replace(/\s+/g, ' ');
    }

    heavyNormalization(parsedData: any): any {
        const result = { ...parsedData };

        const normalizeEntityName = (name: string): string => {
            const synonymResult = this.applySynonymMapping(name);
            const wasMapped = synonymResult !== name;
            const hasNumberedSuffix = /\b\d+\s*$/.test(synonymResult.trim());
            const singularized = wasMapped || hasNumberedSuffix
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
                description: box.description ? this.toTitleCase(box.description) : box.description,
            }));
        }

        if (result.boxName) {
            result.boxName = normalizeEntityName(result.boxName);
        }

        if (result.items && result.items.length > 0) {
            result.items = result.items.map((item: any) => ({
                ...item,
                name: normalizeEntityName(item.name),
                description: item.description ? this.toTitleCase(item.description) : item.description,
            }));
        }

        return result;
    }

    private applySynonymMapping(text: string): string {
        const lower = text.toLowerCase();
        for (const [synonym, canonical] of Object.entries(this.SYNONYM_MAP)) {
            if (lower === synonym) return canonical;
        }
        return text;
    }
}
