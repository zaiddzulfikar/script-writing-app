// Tambahkan instruksi variasi transisi di prompt chunking
const fs = require('fs');

// Baca file
let content = fs.readFileSync('lib/gemini.ts', 'utf8');

// Tambahkan instruksi variasi transisi setelah PERSYARATAN BAGIAN INI
const oldSection = `PERSYARATAN BAGIAN INI:
1. ${chunkIndex === 0 ? 'Mulai dengan opening yang kuat dan engaging.' : 'Lanjutkan mulus dari bagian sebelumnya tanpa mengulang.'}
2. Jaga kontinuitas karakter, tone, dan plot threads yang ada.
3. Tulis kurang lebih ${chunkPages} halaman script berkualitas tinggi.
4. ${chunkIndex === totalChunks - 1 ? 'Akhiri dengan cliffhanger/terbuka untuk kelanjutan.' : 'Siapkan transisi yang mulus ke bagian berikutnya.'}`;

const newSection = `PERSYARATAN BAGIAN INI:
1. ${chunkIndex === 0 ? 'Mulai dengan opening yang kuat dan engaging.' : 'Lanjutkan mulus dari bagian sebelumnya tanpa mengulang.'}
2. Jaga kontinuitas karakter, tone, dan plot threads yang ada.
3. Tulis kurang lebih ${chunkPages} halaman script berkualitas tinggi.
4. ${chunkIndex === totalChunks - 1 ? 'Akhiri dengan cliffhanger/terbuka untuk kelanjutan.' : 'Siapkan transisi yang mulus ke bagian berikutnya.'}

🎬 VARIASI TRANSISI YANG WAJIB DIGUNAKAN:
- JANGAN hanya gunakan CUT TO: berulang-ulang
- GUNAKAN variasi transisi sesuai konteks:
  * CUT TO: untuk aksi cepat, dialog, ketegangan
  * DISSOLVE TO: untuk perubahan waktu, emosi, flashback
  * FADE TO: untuk perubahan lokasi jauh, waktu lama
  * SMASH CUT TO: untuk kejutan, kontras dramatis
  * MONTAGE - untuk serangkaian adegan, training, perjalanan`;

content = content.replace(oldSection, newSection);

// Tulis file yang sudah dimodifikasi
fs.writeFileSync('lib/gemini.ts', content);

console.log('Instruksi variasi transisi di chunking berhasil ditambahkan!');
