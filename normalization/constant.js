const menuStandar = require('./data/menu_standar.json');

// Kategori standar domain Request Menu
// Diambil langsung dari menu_standar.json (60 menu resmi)
const STANDARD_MENU_CATEGORIES = menuStandar.map(item => ({
    id: item.id,
    nama: item.nama,
    kategori: item.kategori
}));

// Daftar nama menu saja (untuk fuzzy matching Tahap 2)
const MENU_NAMES = menuStandar.map(item => item.nama);

// Kategori standar domain Alergi
// Berdasarkan Rizzi & Gangemi (2024) - 9 kategori alergen standar
const STANDARD_ALLERGY_CATEGORIES = [
    'DAIRY',
    'EGGS',
    'PEANUT',
    'TREENUT',
    'SOY',
    'GLUTEN',
    'FISH',
    'SEAFOOD',
    'SESAME'
];

// Mapping bantu untuk LLM prompt (deskripsi tiap kategori alergi)
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

// Daftar filler words bahasa Indonesia yang dihapus saat cleaning
const FILLER_WORDS = [
    'pake', 'pakai', 'sama', 'dengan', 'ya', 'dong', 'sih',
    'aja', 'saja', 'nih', 'tuh', 'gitu', 'gini', 'banget',
    'mohon', 'tolong', 'kak', 'min', 'admin'
];

// Mapping substitusi angka ke huruf (untuk menangani typo seperti "4yam")
const NUMBER_TO_LETTER_MAP = {
    '4': 'a',
    '3': 'e',
    '1': 'i',
    '0': 'o',
    '5': 's',
    '7': 't',
    '8': 'b'
};

module.exports = {
    STANDARD_MENU_CATEGORIES,
    MENU_NAMES,
    STANDARD_ALLERGY_CATEGORIES,
    ALLERGY_CATEGORY_DESCRIPTIONS,
    FILLER_WORDS,
    NUMBER_TO_LETTER_MAP
};