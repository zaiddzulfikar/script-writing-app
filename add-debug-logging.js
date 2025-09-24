// Tambahkan debug logging ke fixScriptFormatting
const fs = require('fs');

// Baca file
let content = fs.readFileSync('lib/gemini.ts', 'utf8');

// Tambahkan debug logging sebelum dan sesudah replace ** 
content = content.replace(
  /  \/\/ Step 2: Remove all \*\* formatting \(let frontend handle styling\)\n  processedResponse = processedResponse\.replace\(\/\\\*\\\*\/g, ''\);/g,
  `  // Step 2: Remove all ** formatting (let frontend handle styling)
  const beforeCleanup = processedResponse.includes('**');
  processedResponse = processedResponse.replace(/\\*\\*/g, '');
  const afterCleanup = processedResponse.includes('**');
  
  if (beforeCleanup) {
    console.log('🔍 fixScriptFormatting: Found ** before cleanup');
  }
  if (afterCleanup) {
    console.log('❌ fixScriptFormatting: Still has ** after cleanup!');
  } else if (beforeCleanup) {
    console.log('✅ fixScriptFormatting: Successfully removed all **');
  }`
);

// Tulis file yang sudah dimodifikasi
fs.writeFileSync('lib/gemini.ts', content);

console.log('Debug logging berhasil ditambahkan ke fixScriptFormatting!');
