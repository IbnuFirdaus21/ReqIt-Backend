import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const menuStandar = require('./data/menu_standar.json');

const STANDARD_MENU_CATEGORIES = menuStandar.map(item => ({
    id: item.id,
    nama: item.nama,
    kategori: item.kategori
}));

const MENU_NAMES = menuStandar.map(item => item.nama);

const STANDARD_ALLERGY_CATEGORIES = [
    'DAIRY', 'EGGS', 'PEANUT', 'TREENUT', 'SOY',
    'GLUTEN', 'FISH', 'SEAFOOD', 'SESAME'
];

const ALLERGY_CATEGORY_DESCRIPTIONS = {
    DAIRY: 'susu sapi, keju, yogurt, mentega, produk olahan susu',
    EGGS: 'telur ayam, telur bebek, dan produk turunannya',
    PEANUT: 'kacang tanah',
    TREENUT: 'kacang pohon seperti almond, kacang mete, kenari, pistachio',
    SOY: 'kedelai, tahu, tempe, kecap',
    GLUTEN: 'gandum, terigu, gluten',
    FISH: 'ikan dan produk olahan ikan',
    SEAFOOD: 'udang, kepiting, cumi, kerang',
    SESAME: 'wijen'
};

const FILLER_WORDS = [
    'pake', 'pakai', 'sama', 'dengan', 'ya', 'dong', 'sih',
    'aja', 'saja', 'nih', 'tuh', 'gitu', 'gini', 'banget',
    'mohon', 'tolong', 'kak', 'min', 'admin'
];

const NUMBER_TO_LETTER_MAP = {
    '4': 'a',
    '3': 'e',
    '1': 'i',
    '0': 'o',
    '5': 's',
    '7': 't',
    '8': 'b'
};

export {
    STANDARD_MENU_CATEGORIES,
    MENU_NAMES,
    STANDARD_ALLERGY_CATEGORIES,
    ALLERGY_CATEGORY_DESCRIPTIONS,
    FILLER_WORDS,
    NUMBER_TO_LETTER_MAP
};