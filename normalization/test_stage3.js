import { stage1Clean } from './stage1_cleaning.js';
import { stage2FuzzyMenu, stage2FuzzyAllergy } from './stage2_fuzzy.js';
import { stage3LLMMenu, stage3LLMAllergy } from './stage3_llm.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Hanya test case yang TIDAK berhasil di Stage 2
const menuCases = [
    { input: 'geprek', desc: 'singkatan Ayam Geprek' },
    { input: 'nasi item', desc: 'informal Nasi Uduk' },
    { input: 'bkso', desc: 'typo berat Bakso' },
    { input: 'rndang', desc: 'typo berat Rendang Sapi' },
    { input: 'apa aja yang enak', desc: 'tidak relevan' },
    { input: 'terserah', desc: 'tidak relevan' },
    { input: '12345', desc: 'angka random' },
];

const allergyCases = [
    { input: 'lactose intolerant', desc: 'english DAIRY' },
    { input: 'celiac', desc: 'istilah medis GLUTEN' },
    { input: 'tidak bisa makan tepung', desc: 'deskriptif GLUTEN' },
    { input: 'ga bisa makan hasil laut', desc: 'deskriptif SEAFOOD' },
    { input: 'makan ikan langsung merah merah', desc: 'deskriptif FISH' },
    { input: 'alergi udara', desc: 'tidak relevan' },
    { input: 'alergi semua makanan', desc: 'tidak relevan' },
];

const runTest = async () => {
    console.log('=== TEST STAGE 3: LLM Classification — Domain Menu ===\n');
    for (const { input, desc } of menuCases) {
        const cleaned = stage1Clean(input);
        if (cleaned.isRejected) {
            console.log(`[${desc}] "${input}" → REJECTED di Stage 1\n`);
            continue;
        }
        const fuzzy = stage2FuzzyMenu(cleaned.cleaned);
        if (fuzzy.matched) {
            console.log(`[${desc}] "${input}" → sudah match di Stage 2: ${fuzzy.result.nama}\n`);
            continue;
        }
        console.log(`[${desc}] memanggil LLM...`);
        const llm = await stage3LLMMenu(cleaned.cleaned);
        await sleep(5000);
        await sleep(12000);
        console.log(`  Input     : "${input}" → cleaned: "${cleaned.cleaned}"`);
        console.log(`  Matched   : ${llm.matched}`);
        console.log(`  Result    : ${llm.matched ? llm.result.nama : 'tidak ditemukan'}`);
        console.log(`  Confidence: ${llm.confidence}`);
        console.log('');
    }

    console.log('=== TEST STAGE 3: LLM Classification — Domain Alergi ===\n');
    for (const { input, desc } of allergyCases) {
        const cleaned = stage1Clean(input);
        if (cleaned.isRejected) {
            console.log(`[${desc}] "${input}" → REJECTED di Stage 1\n`);
            continue;
        }
        const fuzzy = stage2FuzzyAllergy(cleaned.cleaned);
        if (fuzzy.matched) {
            console.log(`[${desc}] "${input}" → sudah match di Stage 2: ${fuzzy.result}\n`);
            continue;
        }
        console.log(`[${desc}] memanggil LLM...`);
        const llm = await stage3LLMAllergy(cleaned.cleaned);
        await sleep(5000);
        await sleep(12000);
        console.log(`  Input     : "${input}" → cleaned: "${cleaned.cleaned}"`);
        console.log(`  Matched   : ${llm.matched}`);
        console.log(`  Result    : ${llm.matched ? llm.result : 'tidak ditemukan'}`);
        console.log(`  Confidence: ${llm.confidence}`);
        console.log('');
    }
};

runTest();
