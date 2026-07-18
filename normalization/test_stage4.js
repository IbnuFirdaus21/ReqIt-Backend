import { stage4MenuDecision, stage4AllergyDecision } from './stage4_threshold.js';

// Simulasi hasil dari Stage 2 (fuzzy) dan Stage 3 (LLM)
// tanpa perlu memanggil API apapun
const menuCases = [
    {
        desc: 'fuzzy match tinggi — harus ACCEPTED',
        result: { matched: true, result: { id: 1, nama: 'Nasi Goreng', kategori: 'Nasi' }, confidence: 1.0 },
        source: 'fuzzy'
    },
    {
        desc: 'fuzzy match cukup — harus ACCEPTED',
        result: { matched: true, result: { id: 12, nama: 'Bihun Goreng', kategori: 'Mie' }, confidence: 0.9846 },
        source: 'fuzzy'
    },
    {
        desc: 'fuzzy match pas di threshold — harus ACCEPTED',
        result: { matched: true, result: { id: 17, nama: 'Ayam Geprek', kategori: 'Lauk' }, confidence: 0.80 },
        source: 'llm'
    },
    {
        desc: 'LLM match di bawah threshold — harus REJECTED',
        result: { matched: true, result: { id: 15, nama: 'Ayam Goreng', kategori: 'Lauk' }, confidence: 0.75 },
        source: 'llm'
    },
    {
        desc: 'tidak ada match sama sekali — harus REJECTED',
        result: { matched: false, result: null, confidence: 0.61 },
        source: 'fuzzy'
    },
    {
        desc: 'LLM confidence 0 (tidak relevan) — harus REJECTED',
        result: { matched: false, result: null, confidence: 0.0 },
        source: 'llm'
    },
];

const allergyCases = [
    {
        desc: 'fuzzy match substring — harus ACCEPTED',
        result: { matched: true, result: 'DAIRY', confidence: 0.90 },
        source: 'fuzzy'
    },
    {
        desc: 'LLM match tinggi — harus ACCEPTED',
        result: { matched: true, result: 'GLUTEN', confidence: 0.95 },
        source: 'llm'
    },
    {
        desc: 'LLM match di bawah threshold — harus REJECTED',
        result: { matched: true, result: 'SEAFOOD', confidence: 0.72 },
        source: 'llm'
    },
    {
        desc: 'tidak relevan — harus REJECTED',
        result: { matched: false, result: null, confidence: 0.0 },
        source: 'llm'
    },
];

console.log('=== TEST STAGE 4: Confidence Threshold — Domain Menu ===\n');
menuCases.forEach(({ desc, result, source }) => {
    const decision = stage4MenuDecision(result, source);
    const status = decision.accepted ? '✅ ACCEPTED' : '❌ REJECTED';
    console.log(`[${desc}]`);
    console.log(`  Source    : ${source}`);
    console.log(`  Confidence: ${result.confidence}`);
    console.log(`  Decision  : ${status}`);
    console.log(`  Reason    : ${decision.reason}`);
    if (decision.accepted) {
        console.log(`  Result    : ${decision.result.nama}`);
    }
    console.log('');
});

console.log('=== TEST STAGE 4: Confidence Threshold — Domain Alergi ===\n');
allergyCases.forEach(({ desc, result, source }) => {
    const decision = stage4AllergyDecision(result, source);
    const status = decision.accepted ? '✅ ACCEPTED' : '❌ REJECTED';
    console.log(`[${desc}]`);
    console.log(`  Source    : ${source}`);
    console.log(`  Confidence: ${result.confidence}`);
    console.log(`  Decision  : ${status}`);
    console.log(`  Reason    : ${decision.reason}`);
    if (decision.accepted) {
        console.log(`  Result    : ${decision.result}`);
    }
    console.log('');
});
