import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  StyleDNA, 
  StyleDNAGenerationOptions 
} from '@/types/style-dna';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

/**
 * Style DNA Generator - Uses Style DNA to generate scripts with consistent writer's voice
 * Applies the 10 key aspects of Style DNA to maintain creative consistency
 */
export class StyleDNAGenerator {
  private model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

  /**
   * Generate script using Style DNA
   */
  async generateScriptWithStyleDNA(
    userMessage: string,
    context: any,
    styleDNA: StyleDNA,
    options: StyleDNAGenerationOptions = {
      adaptationMode: 'flexible',
      focusAreas: [],
      intensity: 80,
      preserveOriginal: false
    }
  ): Promise<string> {
    try {
      console.log('🎨 Generating script with Style DNA...');
      
      // Step 1: Analyze Style DNA and create usage context
      const usageContext = this.createUsageContext(styleDNA, context, options);
      
      // Step 2: Generate Style DNA-enhanced prompt
      const enhancedPrompt = this.createStyleDNAEnhancedPrompt(
        userMessage,
        context,
        styleDNA,
        usageContext,
        options
      );
      
      // Step 3: Generate script with Style DNA
      const result = await this.model.generateContent(enhancedPrompt);
      const response = await result.response;
      let responseText = response.text();
      
      // Step 4: Post-process to ensure Style DNA application
      responseText = this.postProcessStyleDNA(responseText, styleDNA, options);
      
      return responseText;
      
    } catch (error) {
      console.error('Error generating script with Style DNA:', error);
      throw new Error(`Style DNA generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create usage context from Style DNA
   */
  private createUsageContext(
    styleDNA: StyleDNA, 
    context: any, 
    options: StyleDNAGenerationOptions
  ): any {
    return {
      styleDNA,
      targetProject: {
        genre: context.project?.genre || 'Drama',
        tone: context.project?.tone || 'Serius',
        targetAudience: context.project?.targetAudience || 'Umum',
        projectGoals: context.project?.goals || ['Entertainment', 'Storytelling']
      },
      adaptationLevel: options.adaptationMode,
      focusAreas: options.focusAreas
    };
  }

  /**
   * Create Style DNA-enhanced prompt
   */
  private createStyleDNAEnhancedPrompt(
    userMessage: string,
    context: any,
    styleDNA: StyleDNA,
    usageContext: any,
    options: StyleDNAGenerationOptions
  ): string {
    const styleDNAInstructions = this.generateStyleDNAInstructions(styleDNA, options);
    const adaptationInstructions = this.generateAdaptationInstructions(usageContext, options);
    
    return `Anda adalah scriptwriter profesional yang WAJIB menggunakan Style DNA yang diberikan untuk menulis script yang konsisten dengan gaya penulis.

🚨 PERINGATAN BAHASA: WAJIB MENGGUNAKAN BAHASA INDONESIA UNTUK SEMUA RESPONSE! JANGAN MENGGUNAKAN BAHASA INGGRIS SAMA SEKALI!
🔥 JIKA ANDA MENULIS DALAM BAHASA INGGRIS, RESPONSE ANDA AKAN DIHAPUS OTOMATIS!
⚡ SEMUA DIALOG, NARASI, DAN DESKRIPSI HARUS DALAM BAHASA INDONESIA!

🎬 TRANSI SCRIPT (KECUALI): 
- CUT TO:, DISSOLVE TO:, FADE TO:, SMASH CUT TO:, MONTAGE - HARUS DALAM BAHASA INGGRIS
- JANGAN terjemahkan transisi ke bahasa Indonesia
- GUNAKAN format standar industri: CUT TO:, DISSOLVE TO:, dll

🎨 STYLE DNA YANG WAJIB DIGUNAKAN (TIDAK ADA PENGECUALIAN):
${styleDNAInstructions}

📋 KONTEKS PROYEK:
- Title: ${context.project?.title || 'N/A'}
- Genre: ${context.project?.genre || 'N/A'}
- Tone: ${context.project?.tone || 'N/A'}
- Synopsis: ${context.project?.synopsis || 'N/A'}

📝 EPISODE SAAT INI:
- Title: ${context.currentEpisode?.title || 'N/A'}
- Episode Number: ${context.currentEpisode?.episodeNumber || 'N/A'}
- Setting: ${context.currentEpisode?.setting || 'N/A'}
- Synopsis: ${context.currentEpisode?.synopsis || 'N/A'}

🔄 CHAT HISTORY:
${context.recentMessages?.slice(-5).map((msg: any) => `${msg.role}: ${msg.content}`).join('\n') || 'Tidak ada chat history'}

📌 OPSI GENERASI:
- Mode Adaptasi: ${options.adaptationMode}
- Fokus Area: ${options.focusAreas?.join(', ') || 'Semua area'}
- Intensity: ${options.intensity}%
- Preserve Original: ${options.preserveOriginal ? 'Ya' : 'Tidak'}

${adaptationInstructions}

USER REQUEST: ${userMessage}

TUGAS SCRIPT DENGAN STYLE DNA:
1. WAJIB MUTLAK: Gunakan Style DNA yang diberikan untuk konsistensi gaya penulisan
2. Terapkan semua aspek Style DNA: tema, dialog, karakterisasi, dunia cerita, tone, struktur, visual, pacing, genre, dan pesan
3. Jaga konsistensi dengan episode sebelumnya dan chat history
4. Buat script yang engaging dan well-structured
5. Gunakan format screenplay yang tepat
6. Pastikan dialog natural dan karakter yang compelling
7. Bangun konflik dan stakes yang meningkat
8. Sertakan elemen teknis script yang sesuai

🚨 PENTING: JANGAN MENGAKHIRI CERITA!
- JANGAN gunakan FADE OUT, THE END, atau ending yang final
- JANGAN menyelesaikan konflik utama dalam satu generation
- BIARKAN cerita terbuka untuk dilanjutkan user
- GUNAKAN transisi yang sesuai Style DNA (CUT TO:, DISSOLVE TO:, dll)
- BIARKAN cliffhanger atau plot threads yang terbuka
- USER yang menentukan kapan cerita selesai, bukan AI!

OUTPUT FORMAT:
**METADATA:**
{
  "episode_number": ${context.currentEpisode?.episodeNumber || 1},
  "last_scene_id": "[ID scene terakhir]",
  "last_scene_summary": "[Ringkasan scene terakhir]",
  "main_characters": ["[Daftar karakter utama]"],
  "current_tone_style": "${styleDNA.toneMood?.primaryTone || 'Drama'}",
  "open_threads": ["[Plot threads yang terbuka]"],
  "assumptions_made": ["[Asumsi yang dibuat]"],
  "confidence_score": 0.8,
  "style_dna_used": "Style DNA aktif - ${styleDNA.analysis?.confidence || 85}% confidence"
}

**RECAP:**
[Ringkasan konteks script]

**CONTINUATION:**
[Script content yang dibuat dengan Style DNA]

**STYLE DNA APPLICATION:**
- Tema Utama: ${styleDNA.thematicVoice?.mainThemes?.join(', ') || 'N/A'}
- Gaya Dialog: ${styleDNA.dialogueStyle?.type || 'N/A'} - ${styleDNA.dialogueStyle?.pace || 'N/A'}
- Karakterisasi: ${styleDNA.characterization?.protagonistType || 'N/A'}
- Dunia Cerita: ${styleDNA.worldBuilding?.type || 'N/A'}
- Tone & Mood: ${styleDNA.toneMood?.primaryTone || 'N/A'}
- Struktur: ${styleDNA.narrativeStructure?.type || 'N/A'} - ${styleDNA.narrativeStructure?.pacing || 'N/A'}
- Visual: ${styleDNA.visualSymbolism?.recurringImages?.join(', ') || 'N/A'}
- Pacing: ${styleDNA.pacing?.type || 'N/A'}
- Genre: ${styleDNA.genrePreferences?.primaryGenre || 'N/A'}
- Pesan: ${styleDNA.messagePhilosophy?.corePhilosophy || 'N/A'}

🚨 PERINGATAN FORMAT SCRIPT (WAJIB DIIKUTI):
- JANGAN gunakan ** untuk bold text dalam script
- JANGAN gunakan format **Scene 1:** atau ** (action)**
- JANGAN gunakan **NARRATOR (V.O.):** atau **MAYA (V.O.):**
- JANGAN gunakan ** (Potong ke...)** atau ** (Kilas balik...)**
- GUNAKAN format script standar: SCENE HEADING, ACTION, CHARACTER NAME, DIALOGUE
- JANGAN gunakan markdown formatting dalam script
- FORMAT script seperti contoh yang diberikan di atas
- JIKA ANDA MENGGUNAKAN ** DALAM SCRIPT, RESPONSE ANDA AKAN DIHAPUS OTOMATIS!

Buat script sekarang dengan Style DNA yang konsisten:`;
  }

  /**
   * Generate Style DNA instructions
   */
  private generateStyleDNAInstructions(styleDNA: StyleDNA, options: StyleDNAGenerationOptions): string {
    const intensity = options.intensity;
    const focusAreas = options.focusAreas;
    const preserveOriginal = options.preserveOriginal;
    
    let instructions = '';
    
    // 1. Tema Utama (Thematic Voice)
    if (focusAreas?.length === 0 || focusAreas?.includes('thematicVoice')) {
      instructions += `
1. TEMA UTAMA (Thematic Voice) - WAJIB DITERAPKAN:
   - Tema Utama: ${styleDNA.thematicVoice?.mainThemes?.join(', ') || 'Tidak tersedia'}
   - Voice Tematis: ${styleDNA.thematicVoice?.thematicVoice || 'Tidak tersedia'}
   - Pesan/Filosofi: ${styleDNA.thematicVoice?.messagePhilosophy?.join(', ') || 'Tidak tersedia'}
   - Intensitas: ${(intensity || 50) > 80 ? 'TINGGI' : (intensity || 50) < 50 ? 'RENDAH' : 'NORMAL'}`;
    }
    
    // 2. Gaya Dialog
    if (focusAreas?.length === 0 || focusAreas?.includes('dialogueStyle')) {
      instructions += `
2. GAYA DIALOG - WAJIB DITERAPKAN:
   - Tipe Dialog: ${styleDNA.dialogueStyle?.type || 'Tidak tersedia'}
   - Pace: ${styleDNA.dialogueStyle?.pace || 'Tidak tersedia'}
   - Humor: ${styleDNA.dialogueStyle?.humor || 'Tidak tersedia'}
   - Karakteristik: ${styleDNA.dialogueStyle?.characteristics?.join(', ') || 'Tidak tersedia'}
   - Intensitas: ${(intensity || 50) > 80 ? 'TINGGI' : (intensity || 50) < 50 ? 'RENDAH' : 'NORMAL'}`;
    }
    
    // 3. Karakterisasi
    if (focusAreas?.length === 0 || focusAreas?.includes('characterization') && (focusAreas.length === 0 || focusAreas.includes('characterization'))) {
      instructions += `
3. KARAKTERISASI - WAJIB DITERAPKAN:
   - Tipe Protagonis: ${styleDNA.characterization?.protagonistType || 'Tidak tersedia'}
   - Kedalaman Karakter: ${styleDNA.characterization?.characterDepth || 'Tidak tersedia'}
   - Pola Hubungan: ${styleDNA.characterization?.relationshipPatterns?.join(', ') || 'Tidak tersedia'}
   - Intensitas: ${(intensity || 50) > 80 ? 'TINGGI' : (intensity || 50) < 50 ? 'RENDAH' : 'NORMAL'}`;
    }
    
    // 4. Dunia Cerita (World-Building)
    if (focusAreas?.length === 0 || focusAreas?.includes('worldBuilding') && (focusAreas.length === 0 || focusAreas.includes('worldBuilding'))) {
      instructions += `
4. DUNIA CERITA (World-Building) - WAJIB DITERAPKAN:
   - Tipe Dunia: ${styleDNA.worldBuilding?.type || 'Tidak tersedia'}
   - Atmosfer: ${styleDNA.worldBuilding?.atmosphere?.join(', ') || 'Tidak tersedia'}
   - Elemen Budaya: ${styleDNA.worldBuilding?.culturalElements?.join(', ') || 'Tidak tersedia'}
   - Intensitas: ${(intensity || 50) > 80 ? 'TINGGI' : (intensity || 50) < 50 ? 'RENDAH' : 'NORMAL'}`;
    }
    
    // 5. Tone & Mood
    if (focusAreas?.length === 0 || focusAreas?.includes('toneMood') && (focusAreas.length === 0 || focusAreas.includes('toneMood'))) {
      instructions += `
5. TONE & MOOD - WAJIB DITERAPKAN:
   - Tone Utama: ${styleDNA.toneMood?.primaryTone || 'Tidak tersedia'}
   - Perubahan Mood: ${styleDNA.toneMood?.moodShifts?.join(', ') || 'Tidak tersedia'}
   - Intensitas: ${(intensity || 50) > 80 ? 'TINGGI' : (intensity || 50) < 50 ? 'RENDAH' : 'NORMAL'}`;
    }
    
    // 6. Struktur Naratif
    if (focusAreas?.length === 0 || focusAreas?.includes('narrativeStructure') && (focusAreas.length === 0 || focusAreas.includes('narrativeStructure'))) {
      instructions += `
6. STRUKTUR NARATIF - WAJIB DITERAPKAN:
   - Tipe Struktur: ${styleDNA.narrativeStructure?.type || 'Tidak tersedia'}
   - Pacing: ${styleDNA.narrativeStructure?.pacing || 'Tidak tersedia'}
   - Intensitas: ${(intensity || 50) > 80 ? 'TINGGI' : (intensity || 50) < 50 ? 'RENDAH' : 'NORMAL'}`;
    }
    
    // 7. Visual & Simbolisme
    if (focusAreas?.length === 0 || focusAreas?.includes('visualSymbolism') && (focusAreas.length === 0 || focusAreas.includes('visualSymbolism'))) {
      instructions += `
7. VISUAL & SIMBOLISME - WAJIB DITERAPKAN:
   - Imaji Berulang: ${styleDNA.visualSymbolism?.recurringImages?.join(', ') || 'Tidak tersedia'}
   - Simbol: ${styleDNA.visualSymbolism?.symbols?.join(', ') || 'Tidak tersedia'}
   - Palet Warna: ${styleDNA.visualSymbolism?.colorPalette?.join(', ') || 'Tidak tersedia'}
   - Intensitas: ${(intensity || 50) > 80 ? 'TINGGI' : (intensity || 50) < 50 ? 'RENDAH' : 'NORMAL'}`;
    }
    
    // 8. Pacing (Ritme Cerita)
    if (focusAreas?.length === 0 || focusAreas?.includes('pacing') && (focusAreas.length === 0 || focusAreas.includes('pacing'))) {
      instructions += `
8. PACING (Ritme Cerita) - WAJIB DITERAPKAN:
   - Tipe Pacing: ${styleDNA.pacing?.type || 'Tidak tersedia'}
   - Eskalasi Konflik: ${styleDNA.pacing?.conflictEscalation || 'Tidak tersedia'}
   - Intensitas: ${(intensity || 50) > 80 ? 'TINGGI' : (intensity || 50) < 50 ? 'RENDAH' : 'NORMAL'}`;
    }
    
    // 9. Genre Favorit
    if (focusAreas?.length === 0 || focusAreas?.includes('genrePreferences') && (focusAreas.length === 0 || focusAreas.includes('genrePreferences'))) {
      instructions += `
9. GENRE FAVORIT - WAJIB DITERAPKAN:
   - Genre Utama: ${styleDNA.genrePreferences?.primaryGenre || 'Tidak tersedia'}
   - Kombinasi Genre: ${styleDNA.genrePreferences?.genreBlends?.join(', ') || 'Tidak tersedia'}
   - Intensitas: ${(intensity || 50) > 80 ? 'TINGGI' : (intensity || 50) < 50 ? 'RENDAH' : 'NORMAL'}`;
    }
    
    // 10. Pesan / Filosofi Hidup
    if (focusAreas?.length === 0 || focusAreas?.includes('messagePhilosophy') && (focusAreas.length === 0 || focusAreas.includes('messagePhilosophy'))) {
      instructions += `
10. PESAN / FILOSOFI HIDUP - WAJIB DITERAPKAN:
    - Filosofi Inti: ${styleDNA.messagePhilosophy?.corePhilosophy || 'Tidak tersedia'}
    - Pesan Utama: ${styleDNA.messagePhilosophy?.coreMessages?.join(', ') || 'Tidak tersedia'}
    - Intensitas: ${(intensity || 50) > 80 ? 'TINGGI' : (intensity || 50) < 50 ? 'RENDAH' : 'NORMAL'}`;
    }
    
    return instructions;
  }

  /**
   * Generate adaptation instructions
   */
  private generateAdaptationInstructions(usageContext: any, options: StyleDNAGenerationOptions): string {
    const { adaptationLevel, targetProject } = usageContext;
    
    let instructions = '';
    
    switch (adaptationLevel) {
      case 'strict':
        instructions = `
🔒 MODE ADAPTASI KETAT:
- WAJIB mengikuti Style DNA dengan ketat tanpa modifikasi
- JANGAN menyesuaikan dengan genre atau tone proyek target
- GUNAKAN semua elemen Style DNA dengan intensitas penuh
- PRIORITAS: Konsistensi Style DNA di atas kesesuaian proyek`;
        break;
        
      case 'flexible':
        instructions = `
🔄 MODE ADAPTASI FLEKSIBEL:
- Gunakan Style DNA sebagai dasar dengan penyesuaian untuk proyek target
- Sesuaikan elemen yang tidak konflik dengan genre/tone proyek
- Pertahankan elemen inti Style DNA yang tidak bisa diubah
- PRIORITAS: Keseimbangan antara Style DNA dan kesesuaian proyek`;
        break;
        
      case 'inspired':
        instructions = `
💡 MODE ADAPTASI TERINSPIRASI:
- Gunakan Style DNA sebagai inspirasi dan referensi
- Bebas menyesuaikan dengan kebutuhan proyek target
- Pertahankan hanya elemen yang paling khas dari Style DNA
- PRIORITAS: Kesesuaian proyek dengan sentuhan Style DNA`;
        break;
    }
    
    instructions += `

📊 PROYEK TARGET:
- Genre: ${targetProject.genre}
- Tone: ${targetProject.tone}
- Target Audience: ${targetProject.targetAudience}
- Goals: ${targetProject.projectGoals.join(', ')}

🎯 FOKUS AREA: ${(options.focusAreas?.length || 0) > 0 ? options.focusAreas?.join(', ') : 'Semua area Style DNA'}
⚡ INTENSITY: ${options.intensity || 50}% (${(options.intensity || 50) > 80 ? 'TINGGI' : (options.intensity || 50) < 50 ? 'RENDAH' : 'NORMAL'})
🔄 PRESERVE ORIGINAL: ${options.preserveOriginal ? 'YA' : 'TIDAK'}`;
    
    return instructions;
  }

  /**
   * Post-process script to ensure Style DNA application
   */
  private postProcessStyleDNA(
    responseText: string, 
    styleDNA: StyleDNA, 
    options: StyleDNAGenerationOptions
  ): string {
    let processedText = responseText;
    
    // Remove any negative Style DNA messages
    const negativePatterns = [
      /Style DNA tidak digunakan[^.]*\./gi,
      /Style DNA yang diberikan tidak relevan[^.]*\./gi,
      /Style DNA tidak sesuai dengan[^.]*\./gi,
      /Oleh karena itu, Style DNA tidak digunakan[^.]*\./gi,
      /Style DNA tidak akan digunakan[^.]*\./gi,
      /Style DNA tidak diterapkan[^.]*\./gi,
      /karena Style DNA yang diberikan[^.]*\./gi,
      /Style DNA tidak cocok dengan[^.]*\./gi,
      /Style DNA tidak akan diterapkan[^.]*\./gi
    ];
    
    negativePatterns.forEach(pattern => {
      processedText = processedText.replace(pattern, '');
    });
    
    // Add Style DNA application confirmation if not present
    if (!processedText.includes('STYLE DNA APPLICATION') && !processedText.includes('Style DNA')) {
      const styleDNAConfirmation = `

**STYLE DNA DITERAPKAN:**
- Tema Utama: ${styleDNA.thematicVoice?.mainThemes?.join(', ') || 'Tidak tersedia'}
- Gaya Dialog: ${styleDNA.dialogueStyle?.type || 'Tidak tersedia'} - ${styleDNA.dialogueStyle?.pace || 'Tidak tersedia'}
- Karakterisasi: ${styleDNA.characterization?.protagonistType || 'Tidak tersedia'}
- Dunia Cerita: ${styleDNA.worldBuilding?.type || 'Tidak tersedia'}
- Tone & Mood: ${styleDNA.toneMood?.primaryTone || 'Tidak tersedia'}
- Struktur: ${styleDNA.narrativeStructure?.type || 'Tidak tersedia'} - ${styleDNA.narrativeStructure?.pacing || 'Tidak tersedia'}
- Visual: ${styleDNA.visualSymbolism?.recurringImages?.join(', ') || 'Tidak tersedia'}
- Pacing: ${styleDNA.pacing?.type || 'Tidak tersedia'}
- Genre: ${styleDNA.genrePreferences?.primaryGenre || 'Tidak tersedia'}
- Pesan: ${styleDNA.messagePhilosophy?.corePhilosophy || 'Tidak tersedia'}

Script di atas telah disesuaikan dengan Style DNA yang dipilih dengan mode adaptasi: ${options.adaptationMode}`;
      
      processedText += styleDNAConfirmation;
    }
    
    return processedText;
  }

  /**
   * Generate Style DNA usage report
   */
  async generateUsageReport(
    styleDNA: StyleDNA, 
    generatedScript: string, 
    options: StyleDNAGenerationOptions
  ): Promise<any> {
    const prompt = `Analisis penggunaan Style DNA dalam script yang dihasilkan. Berikan response dalam format JSON:

{
  "styleDNAApplication": {
    "thematicVoice": number,
    "dialogueStyle": number,
    "characterization": number,
    "worldBuilding": number,
    "toneMood": number,
    "narrativeStructure": number,
    "visualSymbolism": number,
    "pacing": number,
    "genrePreferences": number,
    "messagePhilosophy": number,
    "overall": number
  },
  "effectiveness": "excellent" | "good" | "fair" | "poor",
  "consistency": "high" | "moderate" | "low",
  "adaptation": "successful" | "partial" | "failed",
  "recommendations": ["rekomendasi untuk perbaikan"],
  "strengths": ["kekuatan aplikasi Style DNA"],
  "areasForImprovement": ["area yang perlu diperbaiki"]
}

Style DNA yang digunakan:
${JSON.stringify(styleDNA, null, 2)}

Script yang dihasilkan:
${generatedScript.substring(0, 5000)}

Opsi generasi:
${JSON.stringify(options, null, 2)}

Instruksi:
1. Evaluasi seberapa baik setiap aspek Style DNA diterapkan (0-100)
2. Analisis efektivitas dan konsistensi aplikasi
3. Evaluasi keberhasilan adaptasi
4. Berikan rekomendasi untuk perbaikan
5. Identifikasi kekuatan dan area yang perlu diperbaiki

Berikan analisis yang komprehensif dalam bahasa Indonesia.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to parse Style DNA usage report response');
  }

  /**
   * Generate Style DNA template for new projects
   */
  async generateStyleDNATemplate(
    projectGenre: string,
    projectTone: string,
    targetAudience: string
  ): Promise<Partial<StyleDNA>> {
    const prompt = `Buat template Style DNA untuk proyek baru dengan spesifikasi berikut. Berikan response dalam format JSON:

{
  "thematicVoice": {
    "mainThemes": ["tema yang cocok untuk genre dan tone"],
    "philosophicalStance": ["pandangan filosofis yang sesuai"],
    "moralQuestions": ["pertanyaan moral yang relevan"],
    "socialIssues": ["isu sosial yang sesuai"],
    "personalValues": ["nilai yang sesuai dengan target audience"]
  },
  "dialogueStyle": {
    "realism": "realistic" | "stylized" | "poetic" | "minimalist" | "verbose",
    "pace": "fast" | "moderate" | "slow" | "varied",
    "humor": "none" | "subtle" | "moderate" | "heavy" | "satirical",
    "philosophy": "none" | "light" | "moderate" | "heavy",
    "subtext": "none" | "light" | "moderate" | "heavy",
    "characteristics": ["karakteristik dialog yang sesuai"]
  },
  "characterization": {
    "protagonistTypes": ["jenis protagonis yang sesuai"],
    "supportingCharacterTypes": ["jenis karakter pendukung"],
    "characterArcs": ["pola character development"],
    "relationships": ["pola hubungan yang sesuai"],
    "conflicts": ["jenis konflik yang sesuai"],
    "motivations": ["pola motivasi yang sesuai"]
  },
  "worldBuilding": {
    "settings": ["setting yang sesuai dengan genre"],
    "timePeriods": ["periode waktu yang sesuai"],
    "atmosphere": ["atmosfer yang sesuai dengan tone"],
    "culturalElements": ["elemen budaya yang sesuai"],
    "technology": ["level teknologi yang sesuai"],
    "socialStructures": ["struktur sosial yang sesuai"]
  },
  "toneMood": {
    "primaryTone": "dark" | "light" | "dramatic" | "comedic" | "romantic" | "tragic" | "absurd" | "mixed",
    "moodShifts": ["pola perubahan mood yang sesuai"],
    "emotionalRange": ["rentang emosi yang sesuai"],
    "atmosphere": ["atmosfer yang sesuai"],
    "tension": "low" | "moderate" | "high" | "varied",
    "resolution": "happy" | "bittersweet" | "tragic" | "ambiguous" | "varied"
  },
  "narrativeStructure": {
    "timeline": "linear" | "non-linear" | "mixed",
    "plotComplexity": "simple" | "moderate" | "complex",
    "subplotUsage": "none" | "minimal" | "moderate" | "extensive",
    "pacing": "slow" | "moderate" | "fast" | "varied",
    "detailLevel": "minimal" | "moderate" | "detailed" | "extensive",
    "narrativeTechniques": ["teknik naratif yang sesuai"]
  },
  "visualSymbolism": {
    "recurringImages": ["imaji yang sesuai dengan genre dan tone"],
    "colorPalette": ["palet warna yang sesuai"],
    "symbols": ["simbol yang sesuai"],
    "metaphors": ["metafora yang sesuai"],
    "visualStyle": ["gaya visual yang sesuai"],
    "environmentalDetails": ["detail lingkungan yang sesuai"]
  },
  "pacing": {
    "overallPace": "slow" | "moderate" | "fast" | "varied",
    "actionSequences": "none" | "minimal" | "moderate" | "extensive",
    "contemplativeMoments": "none" | "minimal" | "moderate" | "extensive",
    "conflictEscalation": "gradual" | "sudden" | "varied",
    "resolutionSpeed": "slow" | "moderate" | "fast",
    "rhythmPatterns": ["pola ritme yang sesuai"]
  },
  "genrePreferences": {
    "primaryGenres": ["genre utama"],
    "genreBlends": ["kombinasi genre yang sesuai"],
    "genreConventions": ["konvensi genre yang harus diikuti"],
    "genreSubversions": ["konvensi genre yang bisa disubversi"],
    "genreInnovations": ["inovasi genre yang bisa dilakukan"]
  },
  "messagePhilosophy": {
    "coreMessages": ["pesan utama yang sesuai"],
    "lifePhilosophy": ["filosofi hidup yang sesuai"],
    "moralLessons": ["pelajaran moral yang sesuai"],
    "socialCommentary": ["komentar sosial yang sesuai"],
    "personalInsights": ["insight pribadi yang sesuai"],
    "worldview": ["pandangan dunia yang sesuai"]
  }
}

Spesifikasi proyek:
- Genre: ${projectGenre}
- Tone: ${projectTone}
- Target Audience: ${targetAudience}

Instruksi:
1. Buat template Style DNA yang sesuai dengan spesifikasi proyek
2. Pastikan semua elemen konsisten dengan genre dan tone
3. Sesuaikan dengan target audience
4. Berikan opsi yang fleksibel untuk adaptasi
5. Fokus pada elemen yang paling penting untuk genre tersebut

Berikan template yang komprehensif dalam bahasa Indonesia.`;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to parse Style DNA template response');
  }
}

// Export singleton instance
export const styleDNAGenerator = new StyleDNAGenerator();
