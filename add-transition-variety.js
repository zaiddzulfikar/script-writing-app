// Tambahkan variasi transisi bahkan tanpa Style DNA
const fs = require('fs');

// Baca file
let content = fs.readFileSync('lib/gemini.ts', 'utf8');

// Tambahkan instruksi variasi transisi di prompt utama
const oldPrompt = `- CUT TO:, DISSOLVE TO:, FADE TO:, SMASH CUT TO:, MONTAGE - HARUS DALAM BAHASA INGGRIS
- JANGAN terjemahkan transisi ke bahasa Indonesia
- GUNAKAN format standar industri: CUT TO:, DISSOLVE TO:, dll`;

const newPrompt = `- CUT TO:, DISSOLVE TO:, FADE TO:, SMASH CUT TO:, MONTAGE - HARUS DALAM BAHASA INGGRIS
- JANGAN terjemahkan transisi ke bahasa Indonesia
- GUNAKAN format standar industri: CUT TO:, DISSOLVE TO:, dll
- VARIASI TRANSISI: Jangan hanya gunakan CUT TO:, gunakan variasi:
  * CUT TO: untuk transisi cepat/aksi
  * DISSOLVE TO: untuk transisi halus/emosional
  * FADE TO: untuk transisi waktu/lokasi
  * SMASH CUT TO: untuk transisi dramatis/kejutan
  * MONTAGE - untuk serangkaian adegan`;

content = content.replace(oldPrompt, newPrompt);

// Tulis file yang sudah dimodifikasi
fs.writeFileSync('lib/gemini.ts', content);

console.log('Variasi transisi berhasil ditambahkan!');
