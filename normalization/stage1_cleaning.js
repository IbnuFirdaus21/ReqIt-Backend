import { FILLER_WORDS, NUMBER_TO_LETTER_MAP } from './constants.js';

const PROFANITY_LIST = [
    'anjing', 'bangsat', 'brengsek', 'bajingan', 'kontol',
    'memek', 'tai', 'tolol', 'goblok', 'idiot', 'bodoh',
    'kampret', 'keparat', 'sialan', 'asu', 'dancok', 'jancok',
    'cok', 'ngentot', 'babi', 'monyet', 'celeng', 'bedebah',
    'setan', 'iblis', 'laknat', 'kurang ajar'
];

const containsProfanity = (text) => {
    const words = text.split(/\s+/);
    return PROFANITY_LIST.some(badWord => {
        if (badWord.includes(' ')) {
            return text.includes(badWord);
        }
        return words.includes(badWord);
    });
};

const stage1Clean = (rawInput) => {
    if (!rawInput || typeof rawInput !== 'string') {
        return { cleaned: '', isProfanity: false, isRejected: true };
    }

    let text = rawInput.toLowerCase().trim();

    Object.entries(NUMBER_TO_LETTER_MAP).forEach(([num, letter]) => {
        text = text.split(num).join(letter);
    });

    text = text.replace(/[^a-z\s]/g, '');
    text = text.replace(/\s+/g, ' ').trim();

    const isProfanity = containsProfanity(text);
    if (isProfanity) {
        return { cleaned: text, isProfanity: true, isRejected: true };
    }

    const words = text.split(' ');
    const filtered = words.filter(w => !FILLER_WORDS.includes(w));
    text = filtered.join(' ').trim();

    if (!text || text.length < 2) {
        return { cleaned: text, isProfanity: false, isRejected: true };
    }

    // Step 8: Cek minimum konsonan — menolak hasil konversi angka
    // yang tidak bermakna seperti "ieas" dari "12345"
    const consonants = (text.replace(/\s/g, '').match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length;
    const vowels = (text.replace(/\s/g, '').match(/[aiueo]/g) || []).length;

    if (vowels === 0 || consonants < 2) {
        return { cleaned: text, isProfanity: false, isRejected: true };
    }

    // Step 9: Cek rasio vokal minimum
    // "asdfgh" → 1 vokal, 5 konsonan → ratio 0.167 → REJECTED
    // "geprek" → 2 vokal (e,e), 4 konsonan → ratio 0.333 → LOLOS
    // "nasi item" → 4 vokal, 4 konsonan → ratio 0.5 → LOLOS
    if (vowels < 1 || (vowels / (vowels + consonants)) < 0.14) {
        return { cleaned: text, isProfanity: false, isRejected: true };
    }

    return { cleaned: text, isProfanity: false, isRejected: false };
};

export { stage1Clean, containsProfanity };