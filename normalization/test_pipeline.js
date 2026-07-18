import { normalizeMenuRequest, normalizeAllergy } from './pipeline.js';

const menuCases = [
    { input: 'Nasi Goreng', desc: 'exact match' },
    { input: 'n4si goreng', desc: 'substitusi angka' },
    { input: 'bihun gorengx', desc: 'typo ringan' },
    { input: 'mie ayam dong kak', desc: 'filler words' },
    { input: 'nasi goreng anjing', desc: 'profanity' },
    { input: 'geprek', desc: 'singkatan — butuh LLM' },
    { input: 'nasi item', desc: 'informal — butuh LLM' },
    { input: 'apa aja yang enak', desc: 'tidak relevan' },
    { input: 'asdfgh', desc: 'random chars' },
];

const allergyCases = [
    { input: 'alergi susu', desc: 'formal DAIRY' },
    { input: 'ga tahan susu', desc: 'informal DAIRY' },
    { input: 'alergi telur', desc: 'formal EGGS' },
    { input: 'celiac', desc: 'istilah medis GLUTEN' },
    { input: 'alergi udara', desc: 'tidak relevan' },
    { input: 'tai', desc: 'profanity' },
];

const runTest = async () => {
    console.log('=== TEST PIPELINE — Domain Menu ===\n');
    for (const { input, desc } of menuCases) {
        const result = await normalizeMenuRequest(input);
        const status = result.accepted ? '✅ ACCEPTED' : '❌ REJECTED';
        console.log(`[${desc}] "${input}"`);
        console.log(`  Status    : ${status}`);
        console.log(`  Cleaned   : "${result.cleanedInput}"`);
        console.log(`  Normalized: ${result.normalized || '-'}`);
        console.log(`  Stage     : ${result.stage} (${result.source})`);
        console.log(`  Confidence: ${result.confidence}`);
        console.log(`  Reason    : ${result.reason}`);
        console.log('');
    }

    console.log('=== TEST PIPELINE — Domain Alergi ===\n');
    for (const { input, desc } of allergyCases) {
        const result = await normalizeAllergy(input);
        const status = result.accepted ? '✅ ACCEPTED' : '❌ REJECTED';
        console.log(`[${desc}] "${input}"`);
        console.log(`  Status    : ${status}`);
        console.log(`  Cleaned   : "${result.cleanedInput}"`);
        console.log(`  Normalized: ${result.normalized || '-'}`);
        console.log(`  Stage     : ${result.stage} (${result.source})`);
        console.log(`  Confidence: ${result.confidence}`);
        console.log(`  Reason    : ${result.reason}`);
        console.log('');
    }
};

runTest();
