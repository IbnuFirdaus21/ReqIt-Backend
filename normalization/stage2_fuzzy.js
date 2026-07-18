import natural from 'natural';
import { STANDARD_MENU_CATEGORIES, STANDARD_ALLERGY_CATEGORIES } from './constants.js';

const { JaroWinklerDistance } = natural;

// Threshold minimum similarity untuk diterima di Stage 2
const FUZZY_THRESHOLD_MENU = 0.85;
const FUZZY_THRESHOLD_ALLERGY = 0.85;

/**
 * Tahap 2: Fuzzy String Matching berbasis Jaro-Winkler
 * Domain: Request Menu
 * @param {string} cleanedInput - output dari Stage 1
 * @returns {{ matched: boolean, result: object|null, confidence: number }}
 */
const stage2FuzzyMenu = (cleanedInput) => {
    let bestMatch = null;
    let bestScore = 0;

    STANDARD_MENU_CATEGORIES.forEach(menu => {
        const menuLower = menu.nama.toLowerCase();
        const score = JaroWinklerDistance(cleanedInput, menuLower);

        if (score > bestScore) {
            bestScore = score;
            bestMatch = menu;
        }
    });

    if (bestScore >= FUZZY_THRESHOLD_MENU) {
        return {
            matched: true,
            result: {
                id: bestMatch.id,
                nama: bestMatch.nama,
                kategori: bestMatch.kategori
            },
            confidence: parseFloat(bestScore.toFixed(4))
        };
    }

    return { matched: false, result: null, confidence: parseFloat(bestScore.toFixed(4)) };
};

/**
 * Tahap 2: Fuzzy String Matching berbasis Jaro-Winkler
 * Domain: Alergi
 * @param {string} cleanedInput - output dari Stage 1
 * @returns {{ matched: boolean, result: string|null, confidence: number }}
 */
const stage2FuzzyAllergy = (cleanedInput) => {
    let bestMatch = null;
    let bestScore = 0;

    // Mapping keyword alergi ke kategori standar
    const allergyKeywords = {
        'DAIRY':   ['susu', 'dairy', 'laktosa', 'lactose', 'keju', 'yogurt', 'mentega'],
        'EGGS':    ['telur', 'egg', 'eggs'],
        'PEANUT':  ['kacang tanah', 'peanut', 'kacang'],
        'TREENUT': ['almond', 'mete', 'kenari', 'pistachio', 'treenut', 'tree nut'],
        'SOY':     ['kedelai', 'soy', 'tahu', 'tempe', 'kecap'],
        'GLUTEN':  ['gluten', 'gandum', 'terigu', 'tepung'],
        'FISH':    ['ikan', 'fish'],
        'SEAFOOD': ['udang', 'seafood', 'kepiting', 'cumi', 'kerang', 'laut'],
        'SESAME':  ['wijen', 'sesame']
    };

    // Cek tiap keyword dengan Jaro-Winkler
    Object.entries(allergyKeywords).forEach(([category, keywords]) => {
        keywords.forEach(keyword => {
            const score = JaroWinklerDistance(cleanedInput, keyword);
            // Cek juga apakah keyword ada di dalam input (substring match)
            const containsKeyword = cleanedInput.includes(keyword);
            const effectiveScore = containsKeyword ? Math.max(score, 0.90) : score;

            if (effectiveScore > bestScore) {
                bestScore = effectiveScore;
                bestMatch = category;
            }
        });
    });

    if (bestScore >= FUZZY_THRESHOLD_ALLERGY) {
        return {
            matched: true,
            result: bestMatch,
            confidence: parseFloat(bestScore.toFixed(4))
        };
    }

    return { matched: false, result: null, confidence: parseFloat(bestScore.toFixed(4)) };
};

export { stage2FuzzyMenu, stage2FuzzyAllergy, FUZZY_THRESHOLD_MENU, FUZZY_THRESHOLD_ALLERGY };
