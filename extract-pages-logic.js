// Tambahkan logika untuk mengekstrak jumlah halaman dari user message
const fs = require('fs');

// Baca file
let content = fs.readFileSync('lib/gemini.ts', 'utf8');

// Ganti logika hardcoded 80 dengan dynamic extraction
content = content.replace(
  /    if \(isLongScriptRequest\) \{\n      console\.log\('📚 Using long script generation with chunking\.\.\.'\);\n      return await generateLongScriptInChunks\(userMessage, context, activeModes, 80, onThinkingStep\);\n    \}/g,
  `    if (isLongScriptRequest) {
      console.log('📚 Using long script generation with chunking...');
      
      // Extract target pages from user message
      let targetPages = 80; // default
      
      // Look for specific numbers in the message
      const numberMatch = userMessage.match(/(\d+)\s*halaman/);
      if (numberMatch) {
        targetPages = parseInt(numberMatch[1]);
      } else {
        // Look for other patterns
        if (lowerMsg.includes('90')) targetPages = 90;
        else if (lowerMsg.includes('100')) targetPages = 100;
        else if (lowerMsg.includes('120')) targetPages = 120;
        else if (lowerMsg.includes('80')) targetPages = 80;
      }
      
      console.log(\`📚 Target pages detected: \${targetPages}\`);
      return await generateLongScriptInChunks(userMessage, context, activeModes, targetPages, onThinkingStep);
    }`
);

// Tulis file yang sudah dimodifikasi
fs.writeFileSync('lib/gemini.ts', content);

console.log('Logika ekstraksi jumlah halaman berhasil ditambahkan!');
