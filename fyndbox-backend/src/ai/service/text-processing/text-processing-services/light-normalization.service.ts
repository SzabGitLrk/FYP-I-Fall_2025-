import { Injectable } from '@nestjs/common';
import wordsToNumbers from 'words-to-numbers';
import { DICTIONARY_CONFIG } from './dictionary.config';

@Injectable()
export class LightNormalizationService {
    private readonly DICTIONARY = DICTIONARY_CONFIG;
    private readonly PROTECTED_WORDS = DICTIONARY_CONFIG.PROTECTED_WORDS;
    private readonly STOP_WORDS = DICTIONARY_CONFIG.STOP_WORDS;
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
    private readonly SPELLCHECK_CANDIDATES = this.buildSpellCheckCandidates();

    // Main cleanup pass used before parsing.
    lightNormalization(text: string): { normalizedText: string; llmBackup: string; typoCount: number } {
        if (!text) return { normalizedText: '', llmBackup: '', typoCount: 0 };
        const input = this.isShouting(text) ? this.normalizeShoutingInput(text) : text;
        let cleaned = input.replace(/[\u200B-\u200D\uFEFF]/g, '').trim().replace(/\s+/g, ' ');
        cleaned = this.removeStopWords(cleaned);
        cleaned = this.applyPhraseAliases(cleaned.trim().replace(/\s+/g, ' '));
        cleaned = this.convertWordsToNumbers(cleaned.trim().replace(/\s+/g, ' '));
        const tokens = cleaned.split(/(\b)/);
        let typoCount = 0;
        const result = tokens.map((t) => {
            if (!t.match(/^[a-zA-Z0-9]+$/)) return t;
            if (t.match(/^[A-Z]{3,}$/)) return t;
            const corrected = this.applySpellCheck(t);
            if (corrected !== t.toLowerCase() && corrected !== t) typoCount++;
            return corrected;
        }).join('').replace(/\s+/g, ' ').trim();
        return { normalizedText: result, llmBackup: result, typoCount };
    }

    // Shared stop-word remover for validation.
    public removeStopWords(text: string): string {
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
        protect.forEach((p) => result = result.replace(new RegExp(`\\b${p.word}\\b`, 'gi'), p.p));
        const converted = wordsToNumbers(result);
        let final = converted ? converted.toString() : result;
        protect.forEach((p) => final = final.replace(new RegExp(p.p, 'g'), p.word));
        return final;
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

                // Preserve likely acronyms while lowering the rest.
                if (token.length >= 4 && token === token.toUpperCase()) {
                    return token;
                }

                return token.toLowerCase();
            })
            .join('');
    }
}
