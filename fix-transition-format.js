// Tambahkan instruksi format transisi yang lebih spesifik
const fs = require('fs');

// Baca file
let content = fs.readFileSync('lib/gemini.ts', 'utf8');

// Tambahkan instruksi format transisi sebelum OUTPUT
content = content.replace(
  /OUTPUT:\n- TULIS HANYA konten screenplay \(SCENE HEADING, ACTION, CHARACTER NAME, DIALOGUE\)/g,
  `OUTPUT:
- TULIS HANYA konten screenplay (SCENE HEADING, ACTION, CHARACTER NAME, DIALOGUE)
- FORMAT TRANSISI: CUT TO:, DISSOLVE TO:, FADE TO: HARUS DI BARIS TERPISAH
- JANGAN menggabungkan transisi dengan action line sebelumnya
- CONTOH FORMAT YANG BENAR:
  Maya memeluk ayahnya, air mata mengalir deras.
  
  CUT TO:
  
  EXT. PASAR - PAGI`
);

// Tulis file yang sudah dimodifikasi
fs.writeFileSync('lib/gemini.ts', content);

console.log('Instruksi format transisi berhasil ditambahkan!');
