import {
    STANDARD_MENU_CATEGORIES,
    STANDARD_ALLERGY_CATEGORIES,
    ALLERGY_CATEGORY_DESCRIPTIONS
} from './constants.js';

import JaroWinklerDistance from 'natural/lib/natural/distance/jaro-winkler_distance.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';

/**
 * Ambil top-N menu yang paling mirip dengan input
 * untuk dipasang ke prompt — hemat token
 */
const getTopMenuCandidates = (cleanedInput, topN = 15) => {
    return STANDARD_MENU_CATEGORIES
        .map(menu => ({
            ...menu,
            score: JaroWinklerDistance(cleanedInput, menu.nama.toLowerCase())
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topN);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Panggil LLM via OpenRouter
 */
const callLLM = async (prompt, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        const response = await fetch(
            `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0,
                        maxOutputTokens: 100
                    }
                })
            }
        );

        if (response.status === 429) {
            console.log(`    Rate limited. Tunggu 30s (attempt ${attempt}/${retries})...`);
            await sleep(30000);
            continue;
        }

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Gemini error: ${response.status} - ${JSON.stringify(err)}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    }
    throw new Error('Max retries reached');
};

/**
 * Tahap 3: LLM Classification — Domain Menu
 * @param {string} cleanedInput - output dari Stage 1
 * @returns {Promise<{ matched: boolean, result: object|null, confidence: number }>}
 */
const stage3LLMMenu = async (cleanedInput) => {
    const topCandidates = getTopMenuCandidates(cleanedInput, 15);
    const menuList = topCandidates
        .map(m => `${m.id}. ${m.nama}`)
        .join('\n');

    const prompt = `Daftar menu standar:\n${menuList}\n\nInput siswa: "${cleanedInput}"\n\nJika cocok:\n{"id": <nomor_id>, "nama": "<nama_menu>", "confidence": <0.0-1.0>}\n\nJika tidak cocok:\n{"id": null, "nama": null, "confidence": 0.0}`;

    try {
        const raw = await callLLM(prompt);
        const jsonMatch = raw.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) return { matched: false, result: null, confidence: 0.0 };

        const parsed = JSON.parse(jsonMatch[0]);
        const confidence = parseFloat(parsed.confidence) || 0.0;

        if (parsed.id && parsed.nama && confidence > 0) {
            const menuData = STANDARD_MENU_CATEGORIES.find(m => m.id === parsed.id);
            return {
                matched: true,
                result: {
                    id: parsed.id,
                    nama: parsed.nama,
                    kategori: menuData?.kategori || null
                },
                confidence: parseFloat(confidence.toFixed(4))
            };
        }

        return { matched: false, result: null, confidence: 0.0 };
    } catch (err) {
        console.error('Stage 3 Menu LLM error:', err.message);
        return { matched: false, result: null, confidence: 0.0 };
    }
};

/**
 * Tahap 3: LLM Classification — Domain Alergi
 * @param {string} cleanedInput - output dari Stage 1
 * @returns {Promise<{ matched: boolean, result: string|null, confidence: number }>}
 */
const stage3LLMAllergy = async (cleanedInput) => {
    const categoryList = STANDARD_ALLERGY_CATEGORIES
        .map(cat => `- ${cat}: ${ALLERGY_CATEGORY_DESCRIPTIONS[cat]}`)
        .join('\n');

    const prompt = `Kategori alergi standar:\n${categoryList}\n\nInput siswa: "${cleanedInput}"\n\nJika cocok:\n{"category": "<NAMA_KATEGORI>", "confidence": <0.0-1.0>}\n\nJika tidak cocok:\n{"category": null, "confidence": 0.0}`;

    try {
        const raw = await callLLM(prompt);
        const jsonMatch = raw.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) return { matched: false, result: null, confidence: 0.0 };

        const parsed = JSON.parse(jsonMatch[0]);
        const confidence = parseFloat(parsed.confidence) || 0.0;

        if (
            parsed.category &&
            STANDARD_ALLERGY_CATEGORIES.includes(parsed.category) &&
            confidence > 0
        ) {
            return {
                matched: true,
                result: parsed.category,
                confidence: parseFloat(confidence.toFixed(4))
            };
        }

        return { matched: false, result: null, confidence: 0.0 };
    } catch (err) {
        console.error('Stage 3 Allergy LLM error:', err.message);
        return { matched: false, result: null, confidence: 0.0 };
    }
};

export { stage3LLMMenu, stage3LLMAllergy };
