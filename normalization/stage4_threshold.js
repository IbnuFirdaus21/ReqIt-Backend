/**
 * Tahap 4: Confidence Threshold — Decision Gate
 * 
 * Threshold dikalibrasi independen per domain berdasarkan:
 * - Rouzegar & Makrehchi (2024): confidence threshold 80% sebagai titik optimal
 * - Domain Menu: threshold lebih ketat karena nama menu spesifik
 * - Domain Alergi: threshold sedikit lebih rendah karena variasi bahasa lebih luas
 */

const THRESHOLD_MENU = 0.80;
const THRESHOLD_ALLERGY = 0.80;

/**
 * Tahap 4: Decision Gate — Domain Menu
 * Menerima atau menolak hasil dari Stage 2 atau Stage 3
 * 
 * @param {{matched: boolean, result: object|null, confidence: number}} stageResult
 * @param {'fuzzy'|'llm'} source - dari stage mana hasil ini berasal
 * @returns {{
 *   accepted: boolean,
 *   result: object|null,
 *   confidence: number,
 *   source: string,
 *   reason: string
 * }}
 */
const stage4MenuDecision = (stageResult, source) => {
    if (!stageResult.matched || stageResult.result === null) {
        return {
            accepted: false,
            result: null,
            confidence: stageResult.confidence,
            source,
            reason: 'REJECTED_NO_MATCH'
        };
    }

    if (stageResult.confidence >= THRESHOLD_MENU) {
        return {
            accepted: true,
            result: stageResult.result,
            confidence: stageResult.confidence,
            source,
            reason: 'ACCEPTED'
        };
    }

    return {
        accepted: false,
        result: null,
        confidence: stageResult.confidence,
        source,
        reason: `REJECTED_LOW_CONFIDENCE (${stageResult.confidence} < ${THRESHOLD_MENU})`
    };
};

/**
 * Tahap 4: Decision Gate — Domain Alergi
 * 
 * @param {{matched: boolean, result: string|null, confidence: number}} stageResult
 * @param {'fuzzy'|'llm'} source
 * @returns {{
 *   accepted: boolean,
 *   result: string|null,
 *   confidence: number,
 *   source: string,
 *   reason: string
 * }}
 */
const stage4AllergyDecision = (stageResult, source) => {
    if (!stageResult.matched || stageResult.result === null) {
        return {
            accepted: false,
            result: null,
            confidence: stageResult.confidence,
            source,
            reason: 'REJECTED_NO_MATCH'
        };
    }

    if (stageResult.confidence >= THRESHOLD_ALLERGY) {
        return {
            accepted: true,
            result: stageResult.result,
            confidence: stageResult.confidence,
            source,
            reason: 'ACCEPTED'
        };
    }

    return {
        accepted: false,
        result: null,
        confidence: stageResult.confidence,
        source,
        reason: `REJECTED_LOW_CONFIDENCE (${stageResult.confidence} < ${THRESHOLD_ALLERGY})`
    };
};

export {
    stage4MenuDecision,
    stage4AllergyDecision,
    THRESHOLD_MENU,
    THRESHOLD_ALLERGY
};
