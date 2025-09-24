// Fix untuk menambahkan fixScriptFormatting di generateLongScriptInChunks
const fs = require('fs');

// Baca file
let content = fs.readFileSync('lib/gemini.ts', 'utf8');

// Ganti return fullScript dengan cleanup terlebih dahulu
content = content.replace(
  /onThinkingStep\?\.\('Script panjang berhasil dibuat!'\);\s*return fullScript;/g,
  `onThinkingStep?.('Script panjang berhasil dibuat!');
    
    // Clean up chunking markers and formatting
    const cleanedScript = fixScriptFormatting(fullScript);
    return cleanedScript;`
);

// Tulis file yang sudah diperbaiki
fs.writeFileSync('lib/gemini.ts', content);

console.log('fixScriptFormatting berhasil ditambahkan ke generateLongScriptInChunks!');
