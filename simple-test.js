// Simple test untuk fixScriptFormatting
const fs = require('fs');

// Baca file gemini.ts
let content = fs.readFileSync('lib/gemini.ts', 'utf8');

// Test manual
const testInput = '**INT. RUMAH SAKIT - MALAM**';
console.log('Input:', testInput);

// Simulasi fixScriptFormatting
let processedResponse = testInput;

// Step 1: Remove chunking markers
processedResponse = processedResponse.replace(/\n\s*\[SCENE END\]\s*\n?/g, '');
processedResponse = processedResponse.replace(/\n\s*\[SCENE START\]\s*\n?/g, '');
processedResponse = processedResponse.replace(/\n\s*\[CHUNK \d+\]\s*\n?/g, '');
processedResponse = processedResponse.replace(/\n\s*\[PAGE \d+\]\s*\n?/g, '');
processedResponse = processedResponse.replace(/\n\s*\[PART \d+\]\s*\n?/g, '');

// Step 2: Remove all ** formatting
processedResponse = processedResponse.replace(/\*\*/g, '');

console.log('After removing **:', processedResponse);
console.log('Still contains **:', processedResponse.includes('**'));
