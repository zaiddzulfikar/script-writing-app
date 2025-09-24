// Perbaiki penomoran step yang duplikat
const fs = require('fs');

// Baca file
let content = fs.readFileSync('lib/gemini.ts', 'utf8');

// Perbaiki penomoran step
content = content.replace(
  /  // Step 4: Fix transition formatting - separate from action lines\n  // Fix cases where transitions are attached to action lines\n  processedResponse = processedResponse\.replace\(\/\(\[\\^\\\\n\]\)\(CUT TO:|DISSOLVE TO:|FADE TO:|SMASH CUT TO:\)\/g, '\$1\\\\n\\\\n\$2'\);\n  processedResponse = processedResponse\.replace\(\/\(CUT TO:|DISSOLVE TO:|FADE TO:|SMASH CUT TO:\)\(\[\\^\\\\n\]\)\/g, '\$1\\\\n\\\\n\$2'\);\n  \n  // Step 4: Remove story endings/g,
  `  // Step 4: Fix transition formatting - separate from action lines
  // Fix cases where transitions are attached to action lines
  processedResponse = processedResponse.replace(/([^\\n])(CUT TO:|DISSOLVE TO:|FADE TO:|SMASH CUT TO:)/g, '$1\\n\\n$2');
  processedResponse = processedResponse.replace(/(CUT TO:|DISSOLVE TO:|FADE TO:|SMASH CUT TO:)([^\\n])/g, '$1\\n\\n$2');
  
  // Step 5: Remove story endings`
);

// Tulis file yang sudah dimodifikasi
fs.writeFileSync('lib/gemini.ts', content);

console.log('Penomoran step berhasil diperbaiki!');
