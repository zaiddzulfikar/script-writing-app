// Fix regex untuk ekstraksi jumlah halaman
const fs = require('fs');

// Baca file
let content = fs.readFileSync('lib/gemini.ts', 'utf8');

// Fix regex yang rusak
content = content.replace(
  /const numberMatch = userMessage\.match\(\/\(d\+\)s\*halaman\/\);/g,
  "const numberMatch = userMessage.match(/(\\d+)\\s*halaman/);"
);

// Tulis file yang sudah diperbaiki
fs.writeFileSync('lib/gemini.ts', content);

console.log('Regex berhasil diperbaiki!');