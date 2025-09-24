// Manual replacement untuk fixScriptFormatting function
// Ganti fungsi yang kompleks dengan versi yang disederhanakan

const fs = require('fs');

// Baca file asli
let content = fs.readFileSync('lib/gemini.ts', 'utf8');

// Fungsi baru yang disederhanakan
const newFunction = `function fixScriptFormatting(response: string): string {
  let processedResponse = response;
  
  // Step 1: Remove chunking markers and internal metadata
  processedResponse = processedResponse.replace(/\\n\\s*\\[SCENE END\\]\\s*\\n?/g, '');
  processedResponse = processedResponse.replace(/\\n\\s*\\[SCENE START\\]\\s*\\n?/g, '');
  processedResponse = processedResponse.replace(/\\n\\s*\\[CHUNK \\d+\\]\\s*\\n?/g, '');
  processedResponse = processedResponse.replace(/\\n\\s*\\[PAGE \\d+\\]\\s*\\n?/g, '');
  processedResponse = processedResponse.replace(/\\n\\s*\\[PART \\d+\\]\\s*\\n?/g, '');
  
  // Step 2: Remove all ** formatting (let frontend handle styling)
  processedResponse = processedResponse.replace(/\\*\\*/g, '');
  
  // Step 3: Clean up spacing and formatting
  processedResponse = processedResponse.replace(/\\n\\s*\\n\\s*\\n/g, '\\n\\n');
  processedResponse = processedResponse.replace(/[ \\t]+/g, ' ');
  
  // Step 4: Remove story endings
  processedResponse = processedResponse.replace(/\\n\\s*FADE OUT\\.?\\s*$/g, '');
  processedResponse = processedResponse.replace(/\\n\\s*THE END\\.?\\s*$/g, '');
  processedResponse = processedResponse.replace(/\\n\\s*END\\.?\\s*$/g, '');
  processedResponse = processedResponse.replace(/\\n\\s*FIN\\.?\\s*$/g, '');
  
  return processedResponse;
}`;

// Ganti fungsi lama dengan yang baru
const oldFunctionRegex = /function fixScriptFormatting\(response: string\): string \{[\s\S]*?return processedResponse;\n\}/;
content = content.replace(oldFunctionRegex, newFunction);

// Tulis file yang sudah dimodifikasi
fs.writeFileSync('lib/gemini.ts', content);

console.log('Fungsi fixScriptFormatting berhasil disederhanakan!');
