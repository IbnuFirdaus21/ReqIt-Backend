import { stage1Clean } from './stage1_cleaning.js';
import { stage2FuzzyMenu, stage2FuzzyAllergy } from './stage2_fuzzy.js';

const menuCases = [
    { input: 'nasi goreng', desc: 'exact match' },
    { input: 'n4si goreng', desc: 'substitusi angka' },
    { input: 'bihun gorengx', desc: 'typo ringan' },
    { input: 'mie 4yam', desc: 'substitusi angka' },
    { input: 'ayam grpek', desc: 'typo berat' },
    { input: 'geprek', desc: 'singkatan' },
    { input: 'asdfgh', desc: 'tidak relevan' },
];

const allergyCases = [
    { input: 'alergi susu', desc: 'formal DAIRY' },
    { input: 'ga tahan susu', desc: 'informal DAIRY' },
    { input: 'lactose intolerant', desc: 'english DAIRY' },
    { input: 'alergi telur', desc: 'formal EGGS' },
    { input: 'alergi kacang tanah', desc: 'formal PEANUT' },
    { input: 'alergi gandum', desc: 'formal GLUTEN' },
    { input: 'alergi udang', desc: 'formal SEAFOOD' },
    { input: 'alergi wijen', desc: 'formal SESAME' },
    { input: 'alergi udara', desc: 'tidak relevan' },
];

console.log('=== TEST STAGE 2: Fuzzy Matching — Domain Menu ===\n');
menuCases.forEach(({ input, desc }) => {
    const cleaned = stage1Clean(input);
    if (cleaned.isRejected) {
        console.log(`[${desc}] "${input}" → REJECTED di Stage 1\n`);
        return;
    }
    const result = stage2FuzzyMenu(cleaned.cleaned);
    console.log(`[${desc}]`);
    console.log(`  Input    : "${input}" → cleaned: "${cleaned.cleaned}"`);
    console.log(`  Matched  : ${result.matched}`);
    console.log(`  Result   : ${result.matched ? result.result.nama : 'tidak ditemukan'}`);
    console.log(`  Confidence: ${result.confidence}`);
    console.log('');
});

console.log('=== TEST STAGE 2: Fuzzy Matching — Domain Alergi ===\n');
allergyCases.forEach(({ input, desc }) => {
    const cleaned = stage1Clean(input);
    if (cleaned.isRejected) {
        console.log(`[${desc}] "${input}" → REJECTED di Stage 1\n`);
        return;
    }
    const result = stage2FuzzyAllergy(cleaned.cleaned);
    console.log(`[${desc}]`);
    console.log(`  Input    : "${input}" → cleaned: "${cleaned.cleaned}"`);
    console.log(`  Matched  : ${result.matched}`);
    console.log(`  Result   : ${result.matched ? result.result : 'tidak ditemukan'}`);
    console.log(`  Confidence: ${result.confidence}`);
    console.log('');
});