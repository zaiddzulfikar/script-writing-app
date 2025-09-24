# Setup Instructions for Script Analysis

## 🔑 API Key Configuration

Untuk menggunakan fitur analisis naskah (Style DNA, Knowledge Graph), Anda perlu mengkonfigurasi API key Gemini.

### Langkah-langkah:

1. **Buat file `.env.local` di root directory project:**
```bash
# Di terminal, jalankan:
touch .env.local
```

2. **Tambahkan API key ke file `.env.local`:**
```env
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

3. **Dapatkan API key Gemini:**
   - Kunjungi: https://makersuite.google.com/app/apikey
   - Login dengan Google account
   - Klik "Create API Key"
   - Copy API key yang dihasilkan
   - Paste ke file `.env.local`

4. **Restart development server:**
```bash
npm run dev
```

## 🎯 Fitur yang Tersedia

### 1. Style DNA Analysis
- Menganalisis gaya penulisan
- Ekstrak karakteristik dialog
- Identifikasi teknik naratif
- Confidence score

### 2. Knowledge Graph Analysis  
- Ekstrak entitas (karakter, lokasi, objek)
- Identifikasi relasi antar entitas
- Buat timeline peristiwa
- Ekstrak tema utama

### 3. Both Analyses
- Menjalankan kedua analisis sekaligus
- Progress tracking terpisah
- Hasil gabungan yang komprehensif

## 🚀 Cara Menggunakan

1. Upload naskah script
2. Pilih salah satu dari 3 button:
   - **Style DNA** - Analisis gaya penulisan
   - **Knowledge Graph** - Analisis konten cerita  
   - **Both** - Kedua analisis
3. Klik "Start Analysis"
4. Tunggu proses selesai
5. Lihat hasil analisis

## ⚠️ Troubleshooting

### Error: "API key not configured"
- Pastikan file `.env.local` ada di root directory
- Pastikan API key sudah di-set dengan benar
- Restart development server

### Error: "API quota exceeded"
- Tunggu beberapa saat dan coba lagi
- Cek quota di Google AI Studio

### Error: "Network error"
- Cek koneksi internet
- Pastikan tidak ada firewall yang memblokir

## 📝 Notes

- API key akan digunakan di client-side (browser)
- Pastikan API key tidak di-commit ke repository
- File `.env.local` sudah di-ignore di `.gitignore`
