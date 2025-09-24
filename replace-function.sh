#!/bin/bash

# Script untuk mengganti fixScriptFormatting dengan versi yang disederhanakan
echo "Mengganti fixScriptFormatting dengan versi yang disederhanakan..."

# Backup file asli
cp lib/gemini.ts lib/gemini.ts.backup3

# Buat file temporary dengan fungsi baru
cat > temp_function.js << 'EOF'
function fixScriptFormatting(response: string): string {
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
EOF

# Ganti fungsi di file asli
# Cari line number untuk function fixScriptFormatting
start_line=$(grep -n "function fixScriptFormatting" lib/gemini.ts | cut -d: -f1)
end_line=$(grep -n "return processedResponse;" lib/gemini.ts | tail -1 | cut -d: -f1)

# Hapus fungsi lama dan ganti dengan yang baru
sed -i '' "${start_line},${end_line}d" lib/gemini.ts

# Insert fungsi baru
sed -i '' "${start_line}i\\
function fixScriptFormatting(response: string): string {\\
  let processedResponse = response;\\
  \\
  // Step 1: Remove chunking markers and internal metadata\\
  processedResponse = processedResponse.replace(/\\n\\s*\\[SCENE END\\]\\s*\\n?/g, '');\\
  processedResponse = processedResponse.replace(/\\n\\s*\\[SCENE START\\]\\s*\\n?/g, '');\\
  processedResponse = processedResponse.replace(/\\n\\s*\\[CHUNK \\d+\\]\\s*\\n?/g, '');\\
  processedResponse = processedResponse.replace(/\\n\\s*\\[PAGE \\d+\\]\\s*\\n?/g, '');\\
  processedResponse = processedResponse.replace(/\\n\\s*\\[PART \\d+\\]\\s*\\n?/g, '');\\
  \\
  // Step 2: Remove all ** formatting (let frontend handle styling)\\
  processedResponse = processedResponse.replace(/\\*\\*/g, '');\\
  \\
  // Step 3: Clean up spacing and formatting\\
  processedResponse = processedResponse.replace(/\\n\\s*\\n\\s*\\n/g, '\\n\\n');\\
  processedResponse = processedResponse.replace(/[ \\t]+/g, ' ');\\
  \\
  // Step 4: Remove story endings\\
  processedResponse = processedResponse.replace(/\\n\\s*FADE OUT\\.?\\s*$/g, '');\\
  processedResponse = processedResponse.replace(/\\n\\s*THE END\\.?\\s*$/g, '');\\
  processedResponse = processedResponse.replace(/\\n\\s*END\\.?\\s*$/g, '');\\
  processedResponse = processedResponse.replace(/\\n\\s*FIN\\.?\\s*$/g, '');\\
  \\
  return processedResponse;\\
}" lib/gemini.ts

echo "Fungsi fixScriptFormatting berhasil disederhanakan!"
echo "File backup tersimpan di: lib/gemini.ts.backup3"
