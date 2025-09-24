// Manual test untuk fixScriptFormatting
function fixScriptFormatting(response) {
  let processedResponse = response;
  
  // Step 1: Remove chunking markers and internal metadata
  processedResponse = processedResponse.replace(/\n\s*\[SCENE END\]\s*\n?/g, '');
  processedResponse = processedResponse.replace(/\n\s*\[SCENE START\]\s*\n?/g, '');
  processedResponse = processedResponse.replace(/\n\s*\[CHUNK \d+\]\s*\n?/g, '');
  processedResponse = processedResponse.replace(/\n\s*\[PAGE \d+\]\s*\n?/g, '');
  processedResponse = processedResponse.replace(/\n\s*\[PART \d+\]\s*\n?/g, '');
  
  // Step 2: Remove all ** formatting (let frontend handle styling)
  processedResponse = processedResponse.replace(/\*\*/g, '');
  
  // Step 3: Clean up spacing and formatting
  processedResponse = processedResponse.replace(/\n\s*\n\s*\n/g, '\n\n');
  processedResponse = processedResponse.replace(/[ \t]+/g, ' ');
  
  // Step 4: Remove story endings
  processedResponse = processedResponse.replace(/\n\s*FADE OUT\.?\s*$/g, '');
  processedResponse = processedResponse.replace(/\n\s*THE END\.?\s*$/g, '');
  processedResponse = processedResponse.replace(/\n\s*END\.?\s*$/g, '');
  processedResponse = processedResponse.replace(/\n\s*FIN\.?\s*$/g, '');
  
  return processedResponse;
}

// Test cases
const testCases = [
  '**INT. RUMAH SAKIT - MALAM**',
  '**EXT. JALAN RAYA - SIANG**',
  '**MAYA**',
  '**DOKTER (V.O.)**',
  '**INT. RUMAH SAKIT - MALAM**\n\n**EXT. JALAN RAYA - SIANG**',
  '[SCENE END]\n**INT. RUMAH SAKIT - MALAM**\n[SCENE START]',
  '**INT. RUMAH SAKIT - MALAM**\n\nAction line here\n\n**MAYA**\nDialogue here'
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
