# 📌 Elemen Teknis Script - Gemini Guidelines

## Overview
Berhasil menambahkan guideline elemen teknis script ke dalam prompt Gemini agar AI bisa menulis script dengan format yang lebih profesional dan sesuai standar industri film/series.

## 🎯 **Elemen Teknis yang Ditambahkan:**

### **1. O.S. (Off Screen)**
```
Format: KARAKTER (O.S.)
```
- **Penggunaan**: Karakter ada di lokasi yang sama, tapi tidak terlihat kamera
- **Contoh**: Tokoh bicara dari balik pintu, dari ruangan lain, atau dari dalam kamar mandi
- **Script Example**:
```
INT. KAMAR – SIANG

RINA duduk di ranjang, gelisah.

ADI (O.S.)
(kaget)
Kamu ngapain di sini?
```

### **2. V.O. (Voice Over)**
```
Format: KARAKTER (V.O.)
```
- **Penggunaan**: Narasi, monolog batin, atau suara yang tidak berasal dari adegan langsung
- **Contoh**: Tokoh membaca surat, narasi pembuka, atau inner monologue
- **Script Example**:
```
EXT. JALAN JAKARTA – MALAM

Kota ramai dengan lampu neon.

ALYA (V.O.)
Saat itu, aku sadar hidupku bakal berubah selamanya.
```

### **3. CONT'D (Continued)**
```
Format: KARAKTER (CONT'D)
```
- **Penggunaan**: Karakter bicara lagi setelah ada aksi atau interupsi, tapi masih dianggap dialog berlanjut
- **Script Example**:
```
BUDI
Aku nggak bisa...

(beat, menarik napas)

BUDI (CONT'D)
...bohong sama kamu lagi.
```

### **4. (beat)**
```
Format: (beat)
```
- **Penggunaan**: Catatan kecil untuk aktor memberi jeda sejenak dalam dialog
- **Note**: Tidak wajib, tapi membantu ritme
- **Script Example**:
```
NIA
Aku... (beat) aku sayang kamu.
```

### **5. Parentheticals (wrylies)**
```
Format: (sinis), (kaget), (marah), dll.
```
- **Penggunaan**: Arahan singkat cara bicara (bukan deskripsi panjang)
- **Note**: Jangan kebanyakan, cukup untuk menghindari ambigu
- **Script Example**:
```
RINA
(sinis)
Ya, tentu aja kamu yang paling benar.
```

### **6. Transitions**
```
Format: CUT TO:, DISSOLVE TO:
```
- **Penggunaan**: Sekarang jarang dipakai berlebihan, kecuali sangat penting untuk gaya film
- **Note**: Default editing biasanya otomatis "CUT TO"
- **Script Example**:
```
DISSOLVE TO:
```

### **7. Montage & Series of Shots**
```
Format: MONTAGE – JUDUL MONTAGE
```
- **Penggunaan**: Untuk menampilkan rangkaian adegan singkat
- **Script Example**:
```
MONTAGE – PERJALANAN ALYA KE JAKARTA
– Alya masuk bus.
– Alya melihat tiketnya.
– Bus melaju di jalan tol.
```

### **8. Super / Title Cards**
```
Format: SUPER: "Jakarta, 2003"
```
- **Penggunaan**: Kalau ada teks di layar, tulis dengan SUPER:
- **Script Example**:
```
SUPER: "Jakarta, 2003"
```

## 🔧 **Implementasi dalam Gemini Prompts:**

### **1. Script Generation (generateScriptResponse)**
```typescript
📌 ELEMEN TEKNIS SCRIPT:

5.1. O.S. (Off Screen):
- Dipakai kalau karakter ada di lokasi yang sama, tapi tidak terlihat kamera
- Contoh: Tokoh bicara dari balik pintu, dari ruangan lain, atau dari dalam kamar mandi
- Format: KARAKTER (O.S.)

5.2. V.O. (Voice Over):
- Untuk narasi, monolog batin, atau suara yang tidak berasal dari adegan langsung
- Misalnya: tokoh membaca surat, narasi pembuka, atau inner monologue
- Format: KARAKTER (V.O.)

// ... dan seterusnya untuk semua elemen teknis
```

### **2. Episode Suggestion (generateEpisodeSuggestion)**
```typescript
Requirements:
- Follow professional scriptwriting standards dengan elemen teknis yang tepat
- GUNAKAN elemen teknis script yang sesuai: O.S., V.O., CONT'D, (beat), parentheticals, montage, SUPER
- FORMAT episode suggestion dengan standar industri yang profesional
```

### **3. Mode-Specific Episode Suggestion (generateEpisodeSuggestionWithMode)**
```typescript
📌 GUIDELINE EPISODE STRUCTURE:
- GUNAKAN elemen teknis script yang sesuai: O.S., V.O., CONT'D, (beat), parentheticals, montage, SUPER
- FORMAT episode suggestion dengan standar industri yang profesional
```

## 🎬 **Benefits untuk Script Quality:**

### **1. Professional Formatting**
- ✅ **Industry Standard**: Script mengikuti standar industri film/series
- ✅ **Director Friendly**: Mudah dipahami oleh director dan crew
- ✅ **Actor Friendly**: Arahan yang jelas untuk aktor

### **2. Enhanced Storytelling**
- ✅ **O.S./V.O.**: Memungkinkan storytelling yang lebih kreatif
- ✅ **Parentheticals**: Memberikan arahan emosi yang tepat
- ✅ **Montage**: Efisien untuk menunjukkan rangkaian waktu

### **3. Production Ready**
- ✅ **Clear Instructions**: Arahan yang jelas untuk production
- ✅ **Proper Format**: Format yang sesuai untuk software scriptwriting
- ✅ **Professional Look**: Script terlihat profesional dan siap produksi

## 📊 **Contoh Script Output yang Diharapkan:**

### **Before (Tanpa Elemen Teknis):**
```
INT. RUMAH – MALAM

Rina duduk di sofa. Adi masuk dari pintu.

ADI
Kamu ngapain di sini?

RINA
Aku nunggu kamu.
```

### **After (Dengan Elemen Teknis):**
```
INT. RUMAH – MALAM

RINA duduk di sofa, gelisah. Suara langkah kaki dari luar.

ADI (O.S.)
(kaget)
Kamu ngapain di sini?

RINA
(berdiri, menatap ke arah suara)
Aku... (beat) aku nunggu kamu.

ADI masuk dari pintu, wajahnya terkejut.

ADI (CONT'D)
Kenapa nggak bilang dulu?

SUPER: "Jakarta, 2024"
```

## 🚀 **Integration dengan Deep Thinking:**

### **Analysis Phase:**
- AI menganalisis kapan elemen teknis diperlukan
- Mempertimbangkan storytelling yang optimal
- Merencanakan penggunaan O.S., V.O., montage, dll.

### **Generation Phase:**
- Mengimplementasikan elemen teknis yang sesuai
- Memastikan format yang konsisten
- Menghasilkan script yang production-ready

## 🌐 **Deployment Status:**
- ✅ **Build**: Successful compilation
- ✅ **Linting**: No errors
- ✅ **Deploy**: Successfully deployed to Firebase
- ✅ **Live**: https://emtek-script-generation.web.app

## 📝 **Guideline Integration:**

### **Script Generation Instructions:**
```typescript
INSTRUCTIONS:
- Use proper screenplay formatting dengan elemen teknis yang tepat
- GUNAKAN elemen teknis script yang sesuai: O.S., V.O., CONT'D, (beat), parentheticals, montage, SUPER
- FORMAT script dengan standar industri yang profesional
```

### **Episode Suggestion Instructions:**
```typescript
Requirements:
- Follow professional scriptwriting standards dengan elemen teknis yang tepat
- GUNAKAN elemen teknis script yang sesuai: O.S., V.O., CONT'D, (beat), parentheticals, montage, SUPER
- FORMAT episode suggestion dengan standar industri yang profesional
```

## 🔮 **Future Enhancements:**

### **1. Advanced Technical Elements**
- **Camera Directions**: CLOSE UP, WIDE SHOT, dll.
- **Sound Effects**: SFX, MUSIC, dll.
- **Special Effects**: VFX, CGI, dll.

### **2. Format Validation**
- **Auto-formatting**: Validasi format script otomatis
- **Style Check**: Pengecekan konsistensi elemen teknis
- **Production Notes**: Catatan khusus untuk production

### **3. Custom Elements**
- **User-defined**: Elemen teknis custom per project
- **Template System**: Template elemen teknis yang bisa disesuaikan
- **Industry Standards**: Dukungan standar industri yang berbeda

## 📋 **Summary:**

Berhasil menambahkan guideline elemen teknis script yang komprehensif ke dalam semua prompt Gemini. Ini akan menghasilkan script yang lebih profesional, production-ready, dan sesuai dengan standar industri film/series.

### **Key Features:**
- ✅ **8 Elemen Teknis**: O.S., V.O., CONT'D, (beat), parentheticals, transitions, montage, SUPER
- ✅ **Comprehensive Guidelines**: Penjelasan lengkap dengan contoh
- ✅ **Integration**: Terintegrasi dengan semua fungsi script generation
- ✅ **Professional Output**: Script yang siap produksi
- ✅ **Industry Standard**: Mengikuti standar industri yang berlaku
