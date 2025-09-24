// Comprehensive test untuk fixScriptFormatting
const fs = require('fs');

// Baca file gemini.ts
let content = fs.readFileSync('lib/gemini.ts', 'utf8');

// Extract fungsi fixScriptFormatting
const functionMatch = content.match(/function fixScriptFormatting\(response: string\): string \{[\s\S]*?return processedResponse;\n\}/);
if (!functionMatch) {
  console.log('Fungsi fixScriptFormatting tidak ditemukan!');
  process.exit(1);
}

// Buat fungsi untuk testing
const fixScriptFormatting = new Function('response', functionMatch[0].replace('function fixScriptFormatting(response: string): string {', '').replace('return processedResponse;', 'return processedResponse;'));

// Test cases yang lebih realistis
const testCases = [
  '**INT. RUMAH SAKIT - MALAM**',
  '**EXT. JALAN RAYA - SIANG**',
  '**MAYA**',
  '**DOKTER (V.O.)**',
  '**INT. RUMAH SAKIT - MALAM**\n\n**EXT. JALAN RAYA - SIANG**',
  '[SCENE END]\n**INT. RUMAH SAKIT - MALAM**\n[SCENE START]',
  '**INT. RUMAH SAKIT - MALAM**\n\nAction line here\n\n**MAYA**\nDialogue here',
  '**INT. RUMAH SAKIT - MALAM**\n\n**MAYA**\nHello world\n\n**EXT. JALAN RAYA - SIANG**\n\n**DOKTER**\nHow are you?'
];

console.log('Testing fixScriptFormatting function:');
console.log('=====================================');

testCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}:`);
  console.log('Input:', JSON.stringify(testCase));
  const result = fixScriptFormatting(testCase);
  console.log('Output:', JSON.stringify(result));
  console.log('Contains **:', result.includes('**'));
  
  if (result.includes('**')) {
    console.log('❌ MASALAH: Masih ada ** yang tidak terhapus!');
  } else {
    console.log('✅ OK: Semua ** berhasil dihapus');
  }
});
