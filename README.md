# Emtek Script Generation

Aplikasi web AI-powered untuk men-generate script film, sinetron, dan original series menggunakan Google Gemini AI.

## Features

- 🔐 **Authentication**: Register/Login dengan Firebase Auth
- 📁 **Project Management**: Buat dan kelola proyek script
- 📺 **Episode System**: Setiap proyek memiliki multiple episode
- 💬 **Chat Interface**: GPT-like UI untuk develop script per episode
- 🧠 **Context Awareness**: AI memahami konteks antar episode dalam 1 proyek
- 📝 **Script Generation**: Generate script dalam format yang siap pakai
- 💾 **Save & Export**: Simpan dan export script
- 🎨 **Modern UI**: Monokrom hitam-putih yang clean dan modern

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS (Monokrom theme)
- **AI**: Google Gemini API
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod

## Setup Instructions

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd emtek-script-generation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` dengan konfigurasi Firebase dan Gemini API yang sudah disediakan:
   ```
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyB79O8FP5SiVzt8m9lvwSYPjP_-J0Bwxnk
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=emtek-script-generation.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=emtek-script-generation
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=emtek-script-generation.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=532934715727
   NEXT_PUBLIC_FIREBASE_APP_ID=1:532934715727:web:3d03ef178ac6a4051afd3a
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-TQSTVPQX6P

   # Gemini AI API Key
   GEMINI_API_KEY=AIzaSyDPHgjW_T7Fgb2GgsvdgmNAUXBH4mqF-k0
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/         # Dashboard page
│   ├── project/[id]/      # Project detail page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── CreateProjectModal.tsx
│   ├── CreateEpisodeModal.tsx
│   └── ChatInterface.tsx
├── contexts/              # React contexts
│   └── AuthContext.tsx
├── lib/                   # Utility libraries
│   ├── firebase.ts        # Firebase configuration
│   ├── gemini.ts          # Gemini AI integration
│   └── utils.ts           # Utility functions
├── types/                 # TypeScript type definitions
│   └── database.ts
└── public/               # Static assets
```

## Usage

### 1. Authentication
- Register akun baru atau login dengan akun yang sudah ada
- Setelah login, Anda akan diarahkan ke dashboard

### 2. Project Management
- Klik "Buat Proyek Baru" untuk membuat proyek script
- Isi detail proyek: judul, genre, jumlah episode, durasi, dll
- Proyek akan tersimpan di dashboard

### 3. Episode Development
- Klik proyek untuk membuka detail proyek
- Buat episode baru dengan klik tombol "+"
- Pilih episode dari sidebar untuk mulai mengembangkan script

### 4. Chat dengan AI
- Gunakan chat interface seperti GPT untuk berinteraksi dengan AI
- AI akan memahami konteks proyek dan episode sebelumnya
- Minta AI untuk generate script, dialog, atau scene tertentu
- Script yang di-generate bisa di-copy atau di-download

### 5. Context Awareness
- AI memahami karakter, setting, dan tone yang sudah ditetapkan di proyek
- AI mengingat percakapan sebelumnya dalam episode yang sama
- AI bisa merujuk ke episode sebelumnya dalam proyek yang sama

## API Keys

- **Gemini API**: Sudah dikonfigurasi dengan API key yang diberikan
- **Firebase**: Sudah dikonfigurasi dengan Firebase config yang diberikan

## Database Structure

```
Users
├── Projects
│   ├── Episodes
│   │   ├── Chat Messages
│   │   └── Script Versions
│   └── Project Metadata
```

## Features Detail

### Project Management
- Create project dengan metadata lengkap
- Genre, tone, target audience
- Jumlah episode dan durasi per episode
- Karakter utama dan setting
- Sinopsis dan catatan tambahan

### Episode System
- Multiple episode per project
- Episode numbering otomatis
- Status tracking (draft, in-progress, completed)
- Sidebar navigation untuk episode

### Chat Interface
- GPT-like UI dengan real-time messaging
- Context-aware AI responses
- Script generation dengan format yang siap pakai
- Copy dan download functionality
- Message history dengan Firebase

### AI Integration
- Google Gemini API integration
- Context awareness antar episode
- Project metadata understanding
- Character consistency
- Tone dan genre adherence

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License
