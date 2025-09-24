// Tambahkan post-processing untuk memisahkan transisi dari action line
const fs = require('fs');

// Baca file
let content = fs.readFileSync('lib/gemini.ts', 'utf8');

// Tambahkan post-processing untuk transisi setelah Step 3
const oldStep3 = `  // Step 3: Clean up spacing and formatting
  processedResponse = processedResponse.replace(/\\n\\s*\\n\\s*\\n/g, '\\n\\n');
  processedResponse = processedResponse.replace(/[ \\t]+/g, ' ');`;

const newStep3 = `  // Step 3: Clean up spacing and formatting
  processedResponse = processedResponse.replace(/\\n\\s*\\n\\s*\\n/g, '\\n\\n');
  processedResponse = processedResponse.replace(/[ \\t]+/g, ' ');
  
  // Step 4: Fix transition formatting - separate from action lines
  // Fix cases where transitions are attached to action lines
  processedResponse = processedResponse.replace(/([^\\n])(CUT TO:|DISSOLVE TO:|FADE TO:|SMASH CUT TO:)/g, '$1\\n\\n$2');
  processedResponse = processedResponse.replace(/(CUT TO:|DISSOLVE TO:|FADE TO:|SMASH CUT TO:)([^\\n])/g, '$1\\n\\n$2');`;

content = content.replace(oldStep3, newStep3);

// Tulis file yang sudah dimodifikasi
fs.writeFileSync('lib/gemini.ts', content);

console.log('Post-processing untuk transisi berhasil ditambahkan!');
