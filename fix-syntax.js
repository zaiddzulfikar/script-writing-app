// Fix syntax error di gemini.ts
const fs = require('fs');

// Baca file
let content = fs.readFileSync('lib/gemini.ts', 'utf8');

// Ganti }} dengan }
content = content.replace(/\}\}/g, '}');

// Tulis file yang sudah diperbaiki
fs.writeFileSync('lib/gemini.ts', content);

console.log('Syntax error berhasil diperbaiki!');
