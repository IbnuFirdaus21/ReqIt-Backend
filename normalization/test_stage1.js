import { stage1Clean } from './stage1_cleaning.js';

const testCases = [
    { input: 'Nasi Goreng', desc: 'normal' },
    { input: 'n4si goreng', desc: 'substitusi angka' },
    { input: 'mie ayam dong kak', desc: 'filler words' },
    { input: 'nasi goreng anjing', desc: 'profanity di akhir' },
    { input: '4njing', desc: 'profanity + substitusi angka' },
    { input: 'NaSi GoReNg', desc: 'kapitalisasi acak' },
    { input: 'asdfgh', desc: 'random chars' },
    { input: 'ya', desc: 'terlalu pendek' },
    { input: 'alergi susu', desc: 'alergi formal' },
    { input: 'ga tahan susu', desc: 'alergi informal' },
    { input: 'asdfgh', desc: 'random chars - harus REJECTED' },
    { input: '12345', desc: 'angka random - harus REJECTED' },
    { input: 'nasi item', desc: 'informal - harus LOLOS' },
    { input: 'geprek', desc: 'singkatan - harus LOLOS' },
];

console.log('=== TEST STAGE 1: Rule-Based Cleaning ===\n');
testCases.forEach(({ input, desc }) => {
    const result = stage1Clean(input);
    console.log(`[${desc}]`);
    console.log(`  Input    : "${input}"`);
    console.log(`  Cleaned  : "${result.cleaned}"`);
    console.log(`  Profanity: ${result.isProfanity}`);
    console.log(`  Rejected : ${result.isRejected}`);
    console.log('');
});