import { stage1Clean } from './stage1_cleaning.js';
import { stage2FuzzyMenu, stage2FuzzyAllergy } from './stage2_fuzzy.js';
import { stage3LLMMenu, stage3LLMAllergy } from './stage3_llm.js';
import { stage4MenuDecision, stage4AllergyDecision } from './stage4_threshold.js';

/**
 * Pipeline Normalisasi Lengkap — Domain Request Menu
 * 
 * Alur: Stage1 (Cleaning) → Stage2 (Fuzzy) → Stage3 (LLM jika perlu) → Stage4 (Threshold)
 * 
 * @param {string} rawInput - input mentah dari siswa
 * @returns {Promise<{
 *   accepted: boolean,
 *   normalized: string|null,
 *   menuId: number|null,
 *   kategori: string|null,
 *   confidence: number,
 *   source: string,
 *   stage: number,
 *   reason: string,
 *   cleanedInput: string
 * }>}
 */
const normalizeMenuRequest = async (rawInput) => {
    // STAGE 1: Rule-Based Cleaning
    const stage1Result = stage1Clean(rawInput);

    // Jika Stage 1 reject (profanity atau terlalu pendek)
    if (stage1Result.isRejected) {
        return {
            accepted: false,
            normalized: null,
            menuId: null,
            kategori: null,
            confidence: 0,
            source: 'stage1',
            stage: 1,
            reason: stage1Result.isProfanity ? 'REJECTED_PROFANITY' : 'REJECTED_TOO_SHORT',
            cleanedInput: stage1Result.cleaned
        };
    }

    // STAGE 2: Fuzzy Matching
    const stage2Result = stage2FuzzyMenu(stage1Result.cleaned);
    const stage2Decision = stage4MenuDecision(stage2Result, 'fuzzy');

    // Jika Stage 2 berhasil melewati threshold
    if (stage2Decision.accepted) {
        return {
            accepted: true,
            normalized: stage2Decision.result.nama,
            menuId: stage2Decision.result.id,
            kategori: stage2Decision.result.kategori,
            confidence: stage2Decision.confidence,
            source: 'fuzzy',
            stage: 2,
            reason: 'ACCEPTED',
            cleanedInput: stage1Result.cleaned
        };
    }

    // STAGE 3: LLM Classification (hanya jika Stage 2 tidak cukup)
    const stage3Result = await stage3LLMMenu(stage1Result.cleaned);
    const stage3Decision = stage4MenuDecision(stage3Result, 'llm');

    // Jika Stage 3 berhasil melewati threshold
    if (stage3Decision.accepted) {
        return {
            accepted: true,
            normalized: stage3Decision.result.nama,
            menuId: stage3Decision.result.id,
            kategori: stage3Decision.result.kategori,
            confidence: stage3Decision.confidence,
            source: 'llm',
            stage: 3,
            reason: 'ACCEPTED',
            cleanedInput: stage1Result.cleaned
        };
    }

    // STAGE 4: Semua stage gagal — REJECTED
    return {
        accepted: false,
        normalized: null,
        menuId: null,
        kategori: null,
        confidence: stage3Decision.confidence,
        source: 'llm',
        stage: 4,
        reason: 'REJECTED_UNRECOGNIZED',
        cleanedInput: stage1Result.cleaned
    };
};

/**
 * Pipeline Normalisasi Lengkap — Domain Alergi
 * 
 * @param {string} rawInput - input mentah dari siswa
 * @returns {Promise<{
 *   accepted: boolean,
 *   normalized: string|null,
 *   confidence: number,
 *   source: string,
 *   stage: number,
 *   reason: string,
 *   cleanedInput: string
 * }>}
 */
const normalizeAllergy = async (rawInput) => {
    // STAGE 1: Rule-Based Cleaning
    const stage1Result = stage1Clean(rawInput);

    // Jika Stage 1 reject
    if (stage1Result.isRejected) {
        return {
            accepted: false,
            normalized: null,
            confidence: 0,
            source: 'stage1',
            stage: 1,
            reason: stage1Result.isProfanity ? 'REJECTED_PROFANITY' : 'REJECTED_TOO_SHORT',
            cleanedInput: stage1Result.cleaned
        };
    }

    // STAGE 2: Fuzzy Matching
    const stage2Result = stage2FuzzyAllergy(stage1Result.cleaned);
    const stage2Decision = stage4AllergyDecision(stage2Result, 'fuzzy');

    // Jika Stage 2 berhasil
    if (stage2Decision.accepted) {
        return {
            accepted: true,
            normalized: stage2Decision.result,
            confidence: stage2Decision.confidence,
            source: 'fuzzy',
            stage: 2,
            reason: 'ACCEPTED',
            cleanedInput: stage1Result.cleaned
        };
    }

    // STAGE 3: LLM Classification
    const stage3Result = await stage3LLMAllergy(stage1Result.cleaned);
    const stage3Decision = stage4AllergyDecision(stage3Result, 'llm');

    // Jika Stage 3 berhasil
    if (stage3Decision.accepted) {
        return {
            accepted: true,
            normalized: stage3Decision.result,
            confidence: stage3Decision.confidence,
            source: 'llm',
            stage: 3,
            reason: 'ACCEPTED',
            cleanedInput: stage1Result.cleaned
        };
    }

    // Semua stage gagal
    return {
        accepted: false,
        normalized: null,
        confidence: stage3Decision.confidence,
        source: 'llm',
        stage: 4,
        reason: 'REJECTED_UNRECOGNIZED',
        cleanedInput: stage1Result.cleaned
    };
};

export { normalizeMenuRequest, normalizeAllergy };
