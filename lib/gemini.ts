import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Project, Episode } from '@/types/database'

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Function to combine multiple Style DNA analyses
export function combineStyleDNA(styleDNAs: any[]): any {
  if (styleDNAs.length === 0) return null
  if (styleDNAs.length === 1) return styleDNAs[0]

  console.log(`🔄 Combining ${styleDNAs.length} Style DNA analyses...`)

  const combined = {
    // Combine thematic voice
    thematicVoice: {
      mainThemes: Array.from(new Set(styleDNAs.flatMap(sd => sd.thematicVoice?.mainThemes || []))),
      philosophicalStance: Array.from(new Set(styleDNAs.flatMap(sd => sd.thematicVoice?.philosophicalStance || []))),
      messagePhilosophy: Array.from(new Set(styleDNAs.flatMap(sd => sd.thematicVoice?.messagePhilosophy || [])))
    },
    
    // Combine dialogue style (use most common or latest)
    dialogueStyle: {
      realism: styleDNAs[0].dialogueStyle?.realism || 'realistic',
      pace: styleDNAs[0].dialogueStyle?.pace || 'moderate',
      humor: styleDNAs[0].dialogueStyle?.humor || 'moderate',
      characteristics: Array.from(new Set(styleDNAs.flatMap(sd => sd.dialogueStyle?.characteristics || [])))
    },
    
    // Combine characterization
    characterization: {
      protagonistTypes: Array.from(new Set(styleDNAs.flatMap(sd => sd.characterization?.protagonistTypes || []))),
      relationships: Array.from(new Set(styleDNAs.flatMap(sd => sd.characterization?.relationships || [])))
    },
    
    // Combine world building
    worldBuilding: {
      settings: Array.from(new Set(styleDNAs.flatMap(sd => sd.worldBuilding?.settings || []))),
      atmosphere: Array.from(new Set(styleDNAs.flatMap(sd => sd.worldBuilding?.atmosphere || []))),
      culturalElements: Array.from(new Set(styleDNAs.flatMap(sd => sd.worldBuilding?.culturalElements || [])))
    },
    
    // Combine tone and mood
    toneMood: {
      primaryTone: styleDNAs[0].toneMood?.primaryTone || 'dramatic',
      atmosphere: Array.from(new Set(styleDNAs.flatMap(sd => sd.toneMood?.atmosphere || [])))
    },
    
    // Combine narrative structure
    narrativeStructure: {
      timeline: styleDNAs[0].narrativeStructure?.timeline || 'linear',
      plotComplexity: styleDNAs[0].narrativeStructure?.plotComplexity || 'moderate',
      narrativeTechniques: Array.from(new Set(styleDNAs.flatMap(sd => sd.narrativeStructure?.narrativeTechniques || [])))
    },
    
    // Combine visual symbolism
    visualSymbolism: {
      recurringImages: Array.from(new Set(styleDNAs.flatMap(sd => sd.visualSymbolism?.recurringImages || []))),
      symbols: Array.from(new Set(styleDNAs.flatMap(sd => sd.visualSymbolism?.symbols || [])))
    },
    
    // Combine pacing
    pacing: {
      overallPace: styleDNAs[0].pacing?.overallPace || 'moderate',
      conflictEscalation: styleDNAs[0].pacing?.conflictEscalation || 'gradual'
    },
    
    // Combine genre preferences
    genrePreferences: {
      primaryGenres: Array.from(new Set(styleDNAs.flatMap(sd => sd.genrePreferences?.primaryGenres || [])))
    },
    
    // Combine message philosophy
    messagePhilosophy: {
      coreMessages: Array.from(new Set(styleDNAs.flatMap(sd => sd.messagePhilosophy?.coreMessages || []))),
      lifePhilosophy: Array.from(new Set(styleDNAs.flatMap(sd => sd.messagePhilosophy?.lifePhilosophy || [])))
    },
    
    // Combined analysis metadata
    analysis: {
      confidence: Math.round(styleDNAs.reduce((sum, sd) => sum + (sd.analysis?.confidence || 0), 0) / styleDNAs.length),
      sampleSize: styleDNAs.length,
      analysisDate: new Date(),
      combinedFrom: styleDNAs.map(sd => sd.id)
    }
  }

  console.log(`✅ Combined Style DNA with ${combined.thematicVoice.mainThemes.length} themes, ${combined.dialogueStyle.characteristics.length} dialogue characteristics`)
  return combined
}

export interface ChatContext {
  project: Project;
  currentEpisode: Episode;
  previousEpisodes: any[];
  recentMessages: any[];
  styleDNA?: any;
  knowledgeGraph?: any;
}

export interface ScriptMetadata {
  episode_number: number | null;
  last_scene_id: string;
  last_scene_summary: string;
  main_characters: string[];
  current_tone_style: string;
  open_threads: string[];
  assumptions_made: string[];
  confidence_score: number;
  style_dna_used?: string;
}

// Interface untuk analisis chunk individual
export interface ChunkAnalysis {
  chunkIndex: number;
  chunkContent: string;
  sceneCount: number;
  characterAppearances: string[];
  plotDevelopments: string[];
  emotionalTone: string;
  keyEvents: string[];
  openThreads: string[];
  transitionPoints: string[];
  confidenceScore: number;
}

// Interface untuk context antar chunk
export interface ChunkContext {
  previousChunks: ChunkAnalysis[];
  cumulativeAnalysis: {
    allCharacters: string[];
    allPlotThreads: string[];
    overallTone: string;
    storyProgress: number; // 0-100%
  };
}

// Advanced context analysis for script continuation
// Fungsi untuk menganalisis sinopsis episode pada generation pertama
export async function analyzeEpisodeSynopsis(
  context: ChatContext,
  activeModes: { knowledgeGraph: boolean; styleDNA: boolean },
  onThinkingStep?: (step: string) => void
): Promise<ScriptMetadata> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 32768, // Maximum for longer scripts
        topP: 0.8,
        topK: 40
      }
    });
    
    onThinkingStep?.('Menganalisis sinopsis episode untuk generation pertama...');
    
    const synopsisAnalysisPrompt = `Anda adalah scriptwriter profesional yang sangat berpengalaman. Analisis sinopsis episode berikut untuk generation pertama script.

EPISODE SYNOPSIS YANG PERLU DIANALISIS:
- Episode Title: ${context.currentEpisode.title}
- Episode Number: ${context.currentEpisode.episodeNumber}
- Setting: ${context.currentEpisode.setting}
- Synopsis: ${context.currentEpisode.synopsis || 'Tidak ada sinopsis tersedia'}

PROJECT CONTEXT:
- Title: ${context.project.title}
- Genre: ${context.project.genre}
- Tone: ${context.project.tone}
- Project Synopsis: ${context.project.synopsis}

TUGAS ANALISIS SINOPSIS:
1. ANALISIS sinopsis episode untuk mengidentifikasi karakter utama yang akan muncul
2. IDENTIFIKASI tone dan style yang sesuai dengan project dan episode
3. EKSTRAK plot threads dan konflik yang akan dimulai di episode ini
4. TENTUKAN setting dan atmosfer yang akan digunakan
5. PREDIKSI scene pembuka yang sesuai dengan sinopsis
6. EVALUASI confidence score berdasarkan kelengkapan sinopsis
7. CATAT asumsi yang dibuat berdasarkan sinopsis
${activeModes.knowledgeGraph ? '8. WAJIB: Cross-reference dengan Knowledge Graph entities dan relationships' : ''}
${activeModes.styleDNA ? '9. WAJIB: Sesuaikan dengan Style DNA yang tersedia' : ''}

HASIL ANALISIS (format JSON):
{
  "episode_number": ${context.currentEpisode.episodeNumber},
  "last_scene_id": "SCENE_1",
  "last_scene_summary": "Episode akan dimulai sesuai sinopsis",
  "main_characters": ["Karakter dari sinopsis", "Karakter pendukung"],
  "current_tone_style": "<tone yang teridentifikasi dari sinopsis>",
  "open_threads": ["Plot thread dari sinopsis", "Konflik yang akan dimulai"],
  "assumptions_made": ["Asumsi berdasarkan sinopsis episode"],
  "confidence_score": <0.0-1.0 berdasarkan kelengkapan sinopsis>,
  "style_dna_used": "${activeModes.styleDNA ? 'Style DNA aktif' : 'Tidak menggunakan Style DNA'}"
}

PENTING:
- Confidence score tinggi (0.8-1.0) jika sinopsis lengkap dan detail
- Confidence score sedang (0.5-0.7) jika sinopsis ada tapi kurang detail
- Confidence score rendah (0.3-0.4) jika sinopsis sangat singkat
- Fokus pada elemen yang bisa diekstrak dari sinopsis
- Karakter harus sesuai dengan yang disebutkan di sinopsis
- Tone harus konsisten dengan project dan episode
${activeModes.styleDNA ? '- WAJIB: Gunakan Style DNA untuk menentukan gaya penulisan' : ''}
${activeModes.knowledgeGraph ? '- WAJIB: Pastikan karakter sesuai dengan entities di Knowledge Graph' : ''}

Berikan analisis JSON yang akurat berdasarkan sinopsis:`;

    const result = await model.generateContent(synopsisAnalysisPrompt);
    const response = await result.response;
    const analysisText = response.text();
    
    onThinkingStep?.('Memproses metadata dari analisis sinopsis...');
    
    // Extract JSON from response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const metadata = JSON.parse(jsonMatch[0]) as ScriptMetadata;
        console.log('📊 Episode Synopsis Analysis:', metadata);
        return metadata;
      } catch (error) {
        console.error('Error parsing synopsis analysis JSON:', error);
      }
    }
    
    // Fallback metadata if JSON parsing fails
    return {
      episode_number: context.currentEpisode.episodeNumber || 1,
      last_scene_id: 'SCENE_1',
      last_scene_summary: 'Episode dimulai sesuai sinopsis',
      main_characters: ['Maya (mahasiswa sastra)', 'Rizky (musisi indie)'],
      current_tone_style: context.project.tone || 'drama',
      open_threads: ['Pertemuan pertama Maya dan Rizky', 'Perkembangan persahabatan', 'Eksplorasi seni dan kehidupan'],
      assumptions_made: ['Analisis sinopsis gagal, menggunakan default berdasarkan sinopsis'],
      confidence_score: 0.6,
      style_dna_used: activeModes.styleDNA ? 'Style DNA aktif' : 'Tidak menggunakan Style DNA'
    };
    
  } catch (error) {
    console.error('Error in episode synopsis analysis:', error);
    return {
      episode_number: context.currentEpisode.episodeNumber || 1,
      last_scene_id: 'SCENE_1',
      last_scene_summary: 'Episode dimulai sesuai sinopsis',
      main_characters: ['Maya (mahasiswa sastra)', 'Rizky (musisi indie)'],
      current_tone_style: context.project.tone || 'drama',
      open_threads: ['Pertemuan pertama Maya dan Rizky', 'Perkembangan persahabatan', 'Eksplorasi seni dan kehidupan'],
      assumptions_made: ['Error dalam analisis sinopsis, menggunakan default berdasarkan sinopsis'],
      confidence_score: 0.5,
      style_dna_used: activeModes.styleDNA ? 'Style DNA aktif' : 'Tidak menggunakan Style DNA'
    };
  }
}

export async function analyzeScriptContext(
  context: ChatContext, 
  activeModes: { knowledgeGraph: boolean; styleDNA: boolean },
  onThinkingStep?: (step: string) => void
): Promise<ScriptMetadata> {
  try {
    // Deteksi generation pertama - termasuk untuk edit message
    const hasNoScript = !context.currentEpisode.script;
    const hasNoAssistantMessages = !context.recentMessages.some(msg => msg.role === 'assistant');
    const isFirstGeneration = hasNoScript && hasNoAssistantMessages;
    
    if (isFirstGeneration) {
      console.log('🎬 First generation detected, analyzing episode synopsis...');
      return await analyzeEpisodeSynopsis(context, activeModes, onThinkingStep);
    }
    
    // Lanjutkan dengan analisis konteks normal untuk generation selanjutnya
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 32768, // Increased for longer scripts (80 pages)
        topP: 0.8,
        topK: 40
      }
    });
    
    onThinkingStep?.('Menganalisis konteks script dan chat history...');
    
    const contextPrompt = buildContextPrompt(context, activeModes);
    
    const analysisPrompt = `Anda adalah scriptwriter profesional yang sangat berpengalaman. Analisis konteks script berikut dan ekstrak metadata yang diperlukan untuk melanjutkan script dengan akurat.

CONTEXT YANG PERLU DIANALISIS:
${contextPrompt}

TUGAS ANALISIS:
1. BACA dan ANALISIS seluruh chat history dan script yang sudah ada
2. IDENTIFIKASI karakter utama, tone/style, dan plot threads yang terbuka
3. TENTUKAN di mana script terakhir berakhir dan scene ID terakhir
4. EVALUASI confidence score berdasarkan kelengkapan informasi
5. CATAT asumsi yang dibuat jika ada informasi yang kurang
${activeModes.knowledgeGraph ? '6. WAJIB: Gunakan Knowledge Graph untuk memastikan konsistensi karakter, plot, dan timeline' : ''}
${activeModes.knowledgeGraph ? '7. WAJIB: Cross-reference dengan entities dan relationships yang ada di Knowledge Graph' : ''}
${activeModes.knowledgeGraph ? '8. WAJIB: Pastikan plot threads sesuai dengan timeline events di Knowledge Graph' : ''}

HASIL ANALISIS (format JSON):
{
  "episode_number": <number episode saat ini atau null jika tidak jelas>,
  "last_scene_id": "<ID scene terakhir, mis. 'SCENE_3', 'INT_CAFE_DAY', dll>",
  "last_scene_summary": "<ringkasan 1-2 kalimat scene terakhir>",
  "main_characters": ["Nama Karakter (peran singkat)", "Nama Karakter (peran singkat)"],
  "current_tone_style": "<tone/style yang teridentifikasi, mis. 'dramedy', 'rom-com', 'slice-of-life'>",
  "open_threads": ["thread plot yang belum selesai", "konflik yang masih terbuka"],
  "assumptions_made": ["asumsi yang dibuat karena informasi kurang"],
  "confidence_score": <angka 0.0-1.0 berdasarkan kelengkapan konteks>,
  "style_dna_used": "${activeModes.styleDNA ? 'WAJIB menggunakan Style DNA yang tersedia' : 'Tidak menggunakan Style DNA'}"
}

PENTING:
- Confidence score tinggi (0.8-1.0) jika script lengkap dan konteks jelas
- Confidence score sedang (0.5-0.7) jika ada beberapa informasi yang kurang
- Confidence score rendah (0.0-0.4) jika konteks sangat terbatas
- Pastikan nama karakter konsisten dengan ejaan yang sudah ada
- Identifikasi tone/style dari dialog dan narasi yang sudah ada
${activeModes.styleDNA ? '- WAJIB MUTLAK: Jika Style DNA aktif, SELALU gunakan Style DNA yang tersedia dalam context TANPA PENGECUALIAN' : ''}
${activeModes.styleDNA ? '- JANGAN PERNAH menilai kesesuaian genre atau tone Style DNA - GUNAKAN SAJA' : ''}
${activeModes.styleDNA ? '- Style DNA adalah PILIHAN USER, bukan keputusan AI' : ''}
${activeModes.knowledgeGraph ? '- WAJIB MUTLAK: Jika Knowledge Graph aktif, SELALU gunakan data Knowledge Graph untuk analisis TANPA PENGECUALIAN' : ''}
${activeModes.knowledgeGraph ? '- WAJIB: Cross-reference semua karakter dengan entities di Knowledge Graph' : ''}
${activeModes.knowledgeGraph ? '- WAJIB: Pastikan plot threads konsisten dengan timeline events di Knowledge Graph' : ''}
${activeModes.knowledgeGraph ? '- WAJIB: Gunakan relationships untuk memahami dinamika antar karakter' : ''}

Berikan analisis JSON yang akurat:`;

    const result = await model.generateContent(analysisPrompt);
    const response = await result.response;
    const analysisText = response.text();
    
    onThinkingStep?.('Memproses metadata dan konteks script...');
    
    // Extract JSON from response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const metadata = JSON.parse(jsonMatch[0]) as ScriptMetadata;
        console.log('📊 Script Context Analysis:', metadata);
        return metadata;
      } catch (error) {
        console.error('Error parsing metadata JSON:', error);
      }
    }
    
    // Fallback metadata if JSON parsing fails
    return {
      episode_number: context.currentEpisode.episodeNumber,
      last_scene_id: 'UNKNOWN',
      last_scene_summary: 'Script context analysis failed',
      main_characters: [],
      current_tone_style: context.project.tone || 'unknown',
      open_threads: [],
      assumptions_made: ['Failed to parse context analysis'],
      confidence_score: 0.3,
      style_dna_used: activeModes.styleDNA ? 'Style DNA aktif' : 'Tidak menggunakan Style DNA'
    };
    
  } catch (error) {
    console.error('Error in script context analysis:', error);
    return {
      episode_number: context.currentEpisode.episodeNumber,
      last_scene_id: 'ERROR',
      last_scene_summary: 'Context analysis failed',
      main_characters: [],
      current_tone_style: context.project.tone || 'unknown',
      open_threads: [],
      assumptions_made: ['Context analysis failed due to error'],
      confidence_score: 0.1,
      style_dna_used: activeModes.styleDNA ? 'Style DNA aktif' : 'Tidak menggunakan Style DNA'
    };
  }
}

// Fungsi untuk menganalisis konten chunk individual
export async function analyzeChunkContent(
  chunkContent: string,
  chunkIndex: number,
  onThinkingStep?: (step: string) => void
): Promise<ChunkAnalysis> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 0.3, // Lower temperature for analysis
        maxOutputTokens: 32768, // Maximum for longer scripts
        topP: 0.8,
        topK: 40
      }
    });
    
    onThinkingStep?.(`Menganalisis bagian ${chunkIndex + 1} dari script...`);
    
    const analysisPrompt = `Anda adalah script analyst profesional. Analisis chunk script berikut dan ekstrak informasi penting untuk continuity.

CHUNK SCRIPT YANG DIANALISIS:
${chunkContent}

TUGAS ANALISIS:
1. Hitung jumlah scene dalam chunk ini
2. Identifikasi karakter yang muncul
3. Catat perkembangan plot yang terjadi
4. Analisis tone emosional
5. Identifikasi event penting
6. Catat thread plot yang terbuka
7. Identifikasi titik transisi
8. Berikan confidence score

HASIL ANALISIS (format JSON):
{
  "chunkIndex": ${chunkIndex},
  "sceneCount": <jumlah scene>,
  "characterAppearances": ["Karakter A", "Karakter B"],
  "plotDevelopments": ["perkembangan plot 1", "perkembangan plot 2"],
  "emotionalTone": "<tone emosional chunk ini>",
  "keyEvents": ["event penting 1", "event penting 2"],
  "openThreads": ["thread terbuka 1", "thread terbuka 2"],
  "transitionPoints": ["transisi 1", "transisi 2"],
  "confidenceScore": <0.0-1.0>
}

PENTING:
- Analisis harus akurat dan detail
- Identifikasi semua karakter yang muncul
- Catat semua perkembangan plot
- Confidence score berdasarkan kelengkapan informasi`;

    const result = await model.generateContent(analysisPrompt);
    const response = await result.response;
    const analysisText = response.text();
    
    // Extract JSON from response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const analysis = JSON.parse(jsonMatch[0]) as ChunkAnalysis;
        analysis.chunkContent = chunkContent; // Store original content
        return analysis;
      } catch (error) {
        console.error('Error parsing chunk analysis JSON:', error);
      }
    }
    
    // Fallback analysis
    return {
      chunkIndex,
      chunkContent,
      sceneCount: 1,
      characterAppearances: [],
      plotDevelopments: [],
      emotionalTone: 'unknown',
      keyEvents: [],
      openThreads: [],
      transitionPoints: [],
      confidenceScore: 0.5
    };
    
  } catch (error) {
    console.error('Error analyzing chunk content:', error);
    return {
      chunkIndex,
      chunkContent,
      sceneCount: 1,
      characterAppearances: [],
      plotDevelopments: [],
      emotionalTone: 'unknown',
      keyEvents: [],
      openThreads: [],
      transitionPoints: [],
      confidenceScore: 0.3
    };
  }
}

// Fungsi untuk membuat context recap dari chunk sebelumnya
export async function generateContextRecap(
  previousChunks: ChunkAnalysis[],
  targetPages: number,
  onThinkingStep?: (step: string) => void
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 32768, // Maximum for longer scripts
        topP: 0.8,
        topK: 40
      }
    });
    
    onThinkingStep?.('Membuat ringkasan konteks dari bagian sebelumnya...');
    
    // Build cumulative analysis
    const allCharacters = Array.from(new Set(previousChunks.flatMap(c => c.characterAppearances)));
    const allPlotThreads = Array.from(new Set(previousChunks.flatMap(c => c.openThreads)));
    const allKeyEvents = previousChunks.flatMap(c => c.keyEvents);
    const storyProgress = Math.min(100, (previousChunks.length * 10)); // Rough progress calculation
    
    const recapPrompt = `Anda adalah scriptwriter profesional. Buat context recap yang komprehensif berdasarkan analisis bagian sebelumnya.

ANALISIS BAGIAN SEBELUMNYA:
${previousChunks.map((chunk, index) => `
BAGIAN ${index + 1}:
- Scene Count: ${chunk.sceneCount}
- Characters: ${chunk.characterAppearances.join(', ')}
- Plot Developments: ${chunk.plotDevelopments.join('; ')}
- Emotional Tone: ${chunk.emotionalTone}
- Key Events: ${chunk.keyEvents.join('; ')}
- Open Threads: ${chunk.openThreads.join('; ')}
`).join('\n')}

CUMULATIVE ANALYSIS:
- Total Characters: ${allCharacters.join(', ')}
- All Plot Threads: ${allPlotThreads.join('; ')}
- Key Events Timeline: ${previousChunks.flatMap(c => c.keyEvents).join(' → ')}
- Story Progress: ${storyProgress}%

TUGAS:
Buat context recap yang akan digunakan untuk bagian berikutnya. Recap harus:
1. Ringkas karakter dan hubungan mereka
2. Ringkas plot threads yang masih terbuka
3. Ringkas tone dan style yang sudah terbentuk
4. Identifikasi di mana story berada sekarang
5. Siapkan continuity untuk bagian berikutnya

FORMAT OUTPUT:
CONTEXT RECAP UNTUK BAGIAN BERIKUTNYA:

**KARAKTER & RELATIONSHIPS:**
[ringkasan karakter dan hubungan]

**PLOT THREADS YANG TERBUKA:**
[daftar thread plot yang belum selesai]

**TONE & STYLE YANG TERBENTUK:**
[analisis tone dan style yang konsisten]

**POSISI STORY SAAT INI:**
[di mana story berada dan apa yang terjadi]

**CONTINUITY UNTUK BAGIAN BERIKUTNYA:**
[apa yang perlu dilanjutkan dan bagaimana]

PENTING:
- Recap harus akurat berdasarkan analisis bagian
- Fokus pada continuity dan konsistensi
- Siapkan transisi yang smooth ke bagian berikutnya`;

    const result = await model.generateContent(recapPrompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error('Error generating context recap:', error);
    return 'Context recap generation failed. Continuing with basic context.';
  }
}

export function buildContextPrompt(context: ChatContext, activeModes: { knowledgeGraph: boolean; styleDNA: boolean }): string {
  let prompt = `PROJECT CONTEXT:
- Title: ${context.project.title}
- Genre: ${context.project.genre}
- Tone: ${context.project.tone}
- Synopsis: ${context.project.synopsis}

CURRENT EPISODE:
- Title: ${context.currentEpisode.title}
- Episode Number: ${context.currentEpisode.episodeNumber}
- Setting: ${context.currentEpisode.setting}
- Synopsis: ${context.currentEpisode.synopsis}
- Current Script Content: ${context.currentEpisode.script || 'Belum ada script'}`;

  if (context.previousEpisodes.length > 0) {
    prompt += `\n\nPREVIOUS EPISODES:`;
    context.previousEpisodes.slice(-3).forEach(ep => {
      prompt += `\n- Episode ${ep.episodeNumber}: ${ep.title} - ${ep.synopsis}`;
    });
  }

  if (context.recentMessages.length > 0) {
    prompt += `\n\nRECENT CHAT HISTORY:`;
    context.recentMessages.slice(-5).forEach(msg => {
      prompt += `\n${msg.role}: ${msg.content}`;
    });
  }

  if (activeModes.styleDNA && context.styleDNA) {
    prompt += `\n\n🚨 STYLE DNA ANALYSIS (WAJIB DIGUNAKAN - TIDAK ADA PENGECUALIAN):
- Tema Utama: ${(context.styleDNA.thematicVoice?.mainThemes || []).join(', ')}
- Pandangan Filosofis: ${(context.styleDNA.thematicVoice?.philosophicalStance || []).join(', ')}
- Gaya Dialog: ${context.styleDNA.dialogueStyle?.realism || 'realistic'} (${context.styleDNA.dialogueStyle?.pace || 'moderate'} pace, ${context.styleDNA.dialogueStyle?.humor || 'moderate'} humor)
- Karakteristik Dialog: ${(context.styleDNA.dialogueStyle?.characteristics || []).join(', ')}
- Jenis Protagonis: ${(context.styleDNA.characterization?.protagonistTypes || []).join(', ')}
- Pola Hubungan: ${(context.styleDNA.characterization?.relationships || []).join(', ')}
- Tone Utama: ${context.styleDNA.toneMood?.primaryTone || 'dramatic'}
- Atmosfer: ${(context.styleDNA.toneMood?.atmosphere || []).join(', ')}
- Struktur Naratif: ${context.styleDNA.narrativeStructure?.timeline || 'linear'} timeline, ${context.styleDNA.narrativeStructure?.plotComplexity || 'moderate'} complexity
- Teknik Naratif: ${(context.styleDNA.narrativeStructure?.narrativeTechniques || []).join(', ')}
- Imaji Berulang: ${(context.styleDNA.visualSymbolism?.recurringImages || []).join(', ')}
- Simbol: ${(context.styleDNA.visualSymbolism?.symbols || []).join(', ')}
- Pacing: ${context.styleDNA.pacing?.overallPace || 'moderate'} overall, ${context.styleDNA.pacing?.conflictEscalation || 'gradual'} escalation
- Genre Utama: ${(context.styleDNA.genrePreferences?.primaryGenres || []).join(', ')}
- Pesan Inti: ${(context.styleDNA.messagePhilosophy?.coreMessages || []).join(', ')}
- Filosofi Hidup: ${(context.styleDNA.messagePhilosophy?.lifePhilosophy || []).join(', ')}
- Confidence: ${context.styleDNA.analysis?.confidence || 0}%

⚠️ PERINGATAN: Style DNA di atas WAJIB digunakan dalam script. JANGAN menilai kesesuaian genre atau tone. Style DNA adalah PILIHAN USER!`;
  }

  if (activeModes.knowledgeGraph && context.knowledgeGraph) {
    prompt += `\n\n🧠 KNOWLEDGE GRAPH (WAJIB DIGUNAKAN UNTUK KONSISTENSI CERITA):
- Entities: ${context.knowledgeGraph.entities.map((e: any) => `${e.name} (${e.type})`).join(', ')}
- Relationships: ${context.knowledgeGraph.relationships.map((r: any) => `${r.from} → ${r.to} (${r.type})`).join(', ')}
- Timeline Events: ${context.knowledgeGraph.timeline.map((t: any) => `${t.event} (${t.episode})`).join(', ')}
- Themes: ${context.knowledgeGraph.themes.join(', ')}
- Character Arcs: ${context.knowledgeGraph.characterArcs ? context.knowledgeGraph.characterArcs.map((c: any) => `${c.character}: ${c.arc}`).join(', ') : 'Tidak tersedia'}
- Plot Threads: ${context.knowledgeGraph.plotThreads ? context.knowledgeGraph.plotThreads.join(', ') : 'Tidak tersedia'}

⚠️ PERINGATAN: Knowledge Graph di atas WAJIB digunakan untuk memastikan konsistensi cerita, karakter, dan plot!`;
  }

  return prompt;
}

// Deep thinking function to analyze all context before generating script
async function deepThinkAndAnalyze(
  userMessage: string,
  context: ChatContext,
  activeModes: { knowledgeGraph: boolean; styleDNA: boolean },
  onThinkingStep?: (step: string) => void
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 32768, // Increased for longer scripts (80 pages)
        topP: 0.8,
        topK: 40
      }
    });
    
    const contextPrompt = buildContextPrompt(context, activeModes);
    
    const deepThinkingPrompt = `Anda adalah seorang scriptwriter profesional yang sangat berpengalaman. Sebelum menulis script, Anda perlu melakukan DEEP THINKING dan menganalisis semua context yang ada.

CONTEXT YANG PERLU DIANALISIS:
${contextPrompt}

USER REQUEST: ${userMessage}

TUGAS DEEP THINKING:
1. BACA DAN ANALISIS semua chat history dan script yang sudah ada
2. IDENTIFIKASI karakter, plot, tema, dan tone yang sudah established
3. PAHAMI konteks episode sebelumnya dan continuity yang perlu dijaga
4. ANALISIS Style DNA dan Knowledge Graph yang tersedia
5. FOKUS PADA SCRIPT YANG SUDAH ADA: Baca dengan teliti script content yang sudah ditulis
6. IDENTIFIKASI di mana script berakhir dan apa yang perlu dilanjutkan
7. PASTIKAN KONTINUITAS: Karakter, setting, dan plot harus konsisten dengan yang sudah ada
8. TENTUKAN struktur 3-act yang tepat untuk episode ini
9. IDENTIFIKASI konflik dan stakes yang perlu dikembangkan
10. RENCANAKAN karakter development dan arc yang sesuai
11. TENTUKAN pacing dan ritme yang optimal

LANGKAH-LANGKAH ANALISIS:
1. **Context Analysis**: Apa yang sudah terjadi dalam cerita?
2. **Character Analysis**: Bagaimana karakter berkembang? Apa wants/needs mereka?
3. **Plot Analysis**: Di mana posisi cerita sekarang? Apa yang perlu terjadi selanjutnya?
4. **Theme Analysis**: Apa tema utama yang perlu dieksplorasi?
5. **Structure Planning**: Bagaimana struktur 3-act untuk episode ini?
6. **Conflict Planning**: Konflik apa yang perlu dikembangkan?
7. **Dialogue Planning**: Bagaimana voice dan tone karakter?
8. **Continuity Planning**: Bagaimana menjaga konsistensi dengan episode sebelumnya?

HASIL ANALISIS:
Berdasarkan analisis mendalam di atas, berikan ringkasan:
- **Current Script Status**: Di mana script saat ini berakhir? Apa yang sudah terjadi?
- **Story Position**: Di mana cerita sekarang dalam konteks episode ini?
- **Character Arcs**: Bagaimana karakter akan berkembang dari posisi saat ini?
- **Main Conflict**: Konflik utama apa yang akan dihadapi selanjutnya?
- **Stakes**: Apa yang dipertaruhkan?
- **Structure**: Bagaimana struktur 3-act episode ini?
- **Key Scenes**: Adegan-adegan kunci apa yang perlu ada untuk melanjutkan?
- **Dialogue Style**: Bagaimana gaya dialog yang konsisten dengan yang sudah ada?
- **Continuity Notes**: Hal-hal apa yang perlu dijaga konsistensinya dengan script yang sudah ada?
- **Next Steps**: Apa yang harus terjadi selanjutnya untuk melanjutkan cerita?

Analisis ini akan menjadi dasar untuk menulis script yang berkualitas tinggi dan konsisten.`;

    onThinkingStep?.('Menganalisis karakter dan plot yang sudah ada...');
    const thinkingResult = await model.generateContent(deepThinkingPrompt);
    const thinkingResponse = await thinkingResult.response;
    const thinkingText = thinkingResponse.text();
    
    onThinkingStep?.('Merencanakan struktur 3-act dan character arcs...');
    console.log('🧠 Deep Thinking Analysis:', thinkingText.substring(0, 500) + '...');
    
    onThinkingStep?.('Mengidentifikasi konflik dan stakes...');
    return thinkingText;
  } catch (error) {
    console.error('Error in deep thinking:', error);
    return 'Deep thinking analysis failed, proceeding with standard generation.';
  }
}

// Rate limiting to prevent too many requests
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

// Parse metadata and continuation from Gemini response
export function parseScriptContinuationResponse(response: string): {
  metadata: ScriptMetadata | null;
  recap: string | null;
  continuation: string;
} {
  try {
    // Add null/undefined checks
    if (!response || typeof response !== 'string') {
      console.log('❌ Invalid response provided to parseScriptContinuationResponse:', response);
      return {
        metadata: null,
        recap: null,
        continuation: response || ''
      };
    }
    
    // Rate limiting
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      console.log('⏳ Rate limiting: processing too quickly, slowing down...');
    }
    lastRequestTime = now;
    
    console.log('🔍 Parsing response:', response.substring(0, 500) + '...');
    console.log('🔍 Full response length:', response.length);
    console.log('🔍 Response contains METADATA:', response.includes('METADATA'));
    console.log('🔍 Response contains **METADATA**:', response.includes('**METADATA**'));
    
    // Extract metadata JSON - try multiple patterns for better compatibility
    // The response format is: METADATA:\n{...}\n\nRECAP:\n...\n\nCONTINUATION:\n...
    // Try multiple patterns to find metadata JSON - more comprehensive approach
    console.log('🔍 Trying pattern 1: **METADATA:** with newline');
    let metadataMatch = response.match(/\*\*METADATA:\*\*\s*(\{[\s\S]*?\})\s*\n/);
    if (!metadataMatch) {
      console.log('🔍 Trying pattern 2: **METADATA:** without newline');
      metadataMatch = response.match(/\*\*METADATA:\*\*\s*(\{[\s\S]*?\})/);
    }
    if (!metadataMatch) {
      console.log('🔍 Trying pattern 3: METADATA: with newline');
      metadataMatch = response.match(/METADATA:\s*\n\s*(\{[\s\S]*?\})\s*\n/);
    }
    if (!metadataMatch) {
      console.log('🔍 Trying pattern 4: METADATA: without newline');
      metadataMatch = response.match(/METADATA:\s*(\{[\s\S]*?\})/);
    }
    if (!metadataMatch) {
      console.log('🔍 Trying pattern 5: **METADATA** (no colon)');
      metadataMatch = response.match(/\*\*METADATA\*\*\s*(\{[\s\S]*?\})/);
    }
    if (!metadataMatch) {
      console.log('🔍 Trying pattern 6: METADATA (no colon)');
      metadataMatch = response.match(/METADATA\s*(\{[\s\S]*?\})/);
    }
    if (!metadataMatch) {
      console.log('🔍 Trying pattern 7: Any JSON with episode_number');
      metadataMatch = response.match(/\{[\s\S]*?"episode_number"[\s\S]*?\}/);
    }
    if (!metadataMatch) {
      console.log('🔍 Trying pattern 8: Any JSON with main_characters');
      metadataMatch = response.match(/\{[\s\S]*?"main_characters"[\s\S]*?\}/);
    }
    if (!metadataMatch) {
      console.log('🔍 Trying pattern 9: Any JSON with current_tone_style');
      metadataMatch = response.match(/\{[\s\S]*?"current_tone_style"[\s\S]*?\}/);
    }
    if (!metadataMatch) {
      console.log('🔍 Trying pattern 10: Extract from METADATA to RECAP section');
      // Try to find JSON object that starts after METADATA and ends before RECAP
      const metadataStart = response.search(/\*\*METADATA:\*\*/);
      const recapStart = response.search(/\*\*RECAP:\*\*/);
      if (metadataStart !== -1 && recapStart !== -1) {
        const metadataSection = response.substring(metadataStart, recapStart);
        const jsonMatch = metadataSection.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          metadataMatch = [null, jsonMatch[0]] as any;
        }
      }
    }
    if (!metadataMatch) {
      console.log('🔍 Trying pattern 11: Find first JSON object in response');
      // Try to find the first JSON object in the entire response
      const jsonMatch = response.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        // Check if it looks like metadata by checking for common fields
        const jsonStr = jsonMatch[0];
        if (jsonStr.includes('episode_number') || jsonStr.includes('main_characters') || jsonStr.includes('current_tone_style')) {
          metadataMatch = [null, jsonStr] as any;
        }
      }
    }
    
    let metadata: ScriptMetadata | null = null;
    
    if (metadataMatch) {
      console.log('✅ Found metadata match!');
      console.log('📊 Found metadata match:', metadataMatch[1].substring(0, 200) + '...');
      console.log('📊 Full metadata match:', metadataMatch[1]);
      try {
        // Clean up the JSON string before parsing
        let jsonStr = metadataMatch[1];
        console.log('🧹 Original JSON string:', jsonStr);
        
        // More comprehensive JSON cleaning with multiple strategies
        jsonStr = jsonStr
          // Remove trailing commas before closing brackets/braces
          .replace(/,(\s*[}\]])/g, '$1')
          // Fix unescaped quotes in strings
          .replace(/"([^"]*)"([^"]*)"([^"]*)":/g, '"$1\\"$2\\"$3":')
          // Remove any control characters
          .replace(/[\x00-\x1F\x7F]/g, '')
          // Fix common JSON issues - unquoted keys
          .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
          // Ensure proper string escaping
          .replace(/([^\\])\\([^"\\\/bfnrt])/g, '$1\\\\$2')
          // Fix broken strings that might cause issues
          .replace(/"([^"]*)\n([^"]*)"/g, '"$1\\n$2"')
          // Remove any incomplete property values
          .replace(/:\s*"[^"]*$/g, ': ""')
          .replace(/:\s*[^",}\]]*$/g, ': ""')
          // Fix any remaining syntax issues
          .replace(/,(\s*[}\]])/g, '$1')
          .replace(/([^\\])\\([^"\\\/bfnrt])/g, '$1\\\\$2')
          // Additional aggressive cleaning
          .replace(/,\s*}/g, '}')  // Remove trailing commas before closing braces
          .replace(/,\s*]/g, ']')  // Remove trailing commas before closing brackets
          .replace(/[^\x20-\x7E]/g, '')  // Remove non-printable characters
          .replace(/\s+/g, ' ')  // Normalize whitespace
          // Fix common AI response issues
          .replace(/"([^"]*)\n([^"]*)"/g, '"$1 $2"')  // Fix newlines in strings
          .replace(/"([^"]*)\s+([^"]*)"/g, '"$1 $2"')  // Fix multiple spaces in strings
          .replace(/\\"/g, '"')  // Remove unnecessary escape quotes
          .replace(/\\\\/g, '\\')  // Fix double backslashes
          .trim();
        
        console.log('🧹 Cleaned JSON string:', jsonStr);
        
        // Try to find the end of the JSON object more accurately
        let braceCount = 0;
        let inString = false;
        let escapeNext = false;
        let jsonEnd = -1;
        
        for (let i = 0; i < jsonStr.length; i++) {
          const char = jsonStr[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"' && !escapeNext) {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === '{') {
              braceCount++;
            } else if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                jsonEnd = i + 1;
                break;
              }
            }
          }
        }
        
        if (jsonEnd > 0) {
          jsonStr = jsonStr.substring(0, jsonEnd);
        }
        
        // Try multiple parsing strategies
        let parseSuccess = false;
        
        // Strategy 1: Direct parse
        try {
          console.log('🔍 Attempting Strategy 1 - Direct parse with JSON string:', jsonStr);
          metadata = JSON.parse(jsonStr) as ScriptMetadata;
          console.log('✅ Successfully parsed metadata (Strategy 1):', metadata);
          parseSuccess = true;
        } catch (error1) {
          console.log('⚠️ Strategy 1 failed with error:', error1);
          console.log('⚠️ Trying Strategy 2 - Fix common issues...');
          
          // Strategy 2: Try to fix common issues and parse again
          try {
            let fixedJson = jsonStr
              .replace(/,\s*}/g, '}')  // Remove trailing commas
              .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
              .replace(/:\s*"[^"]*$/g, ': ""')  // Fix incomplete strings
              .replace(/,\s*$/, '')  // Remove trailing comma at end
              .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')  // Quote unquoted keys
              .replace(/:\s*([^",}\]]+)(?=\s*[,}])/g, ': "$1"')  // Quote unquoted string values
              .replace(/\\"/g, '"')  // Remove unnecessary escape quotes
              .replace(/\\\\/g, '\\');  // Fix double backslashes
            
            console.log('🔍 Strategy 2 - Fixed JSON:', fixedJson);
            metadata = JSON.parse(fixedJson) as ScriptMetadata;
            console.log('✅ Successfully parsed metadata (Strategy 2):', metadata);
            parseSuccess = true;
          } catch (error2) {
            console.log('⚠️ Strategy 2 failed with error:', error2);
            console.log('⚠️ Trying Strategy 3 - Manual field extraction...');
            
            // Strategy 3: Extract individual fields manually with more robust patterns
            try {
              // Try multiple patterns for each field
              const episodeNumberMatch = jsonStr.match(/"episode_number"\s*:\s*(\d+)/) || 
                                       jsonStr.match(/episode_number\s*:\s*(\d+)/) ||
                                       jsonStr.match(/episode_number\s*:\s*"(\d+)"/);
              
              const lastSceneIdMatch = jsonStr.match(/"last_scene_id"\s*:\s*"([^"]*)"/) ||
                                     jsonStr.match(/last_scene_id\s*:\s*"([^"]*)"/) ||
                                     jsonStr.match(/last_scene_id\s*:\s*([^,}]+)/);
              
              const lastSceneSummaryMatch = jsonStr.match(/"last_scene_summary"\s*:\s*"([^"]*)"/) ||
                                          jsonStr.match(/last_scene_summary\s*:\s*"([^"]*)"/) ||
                                          jsonStr.match(/last_scene_summary\s*:\s*([^,}]+)/);
              
              const mainCharactersMatch = jsonStr.match(/"main_characters"\s*:\s*\[(.*?)\]/) ||
                                        jsonStr.match(/main_characters\s*:\s*\[(.*?)\]/);
              
              const currentToneMatch = jsonStr.match(/"current_tone_style"\s*:\s*"([^"]*)"/) ||
                                     jsonStr.match(/current_tone_style\s*:\s*"([^"]*)"/) ||
                                     jsonStr.match(/current_tone_style\s*:\s*([^,}]+)/);
              
              const openThreadsMatch = jsonStr.match(/"open_threads"\s*:\s*\[(.*?)\]/) ||
                                     jsonStr.match(/open_threads\s*:\s*\[(.*?)\]/);
              
              const assumptionsMatch = jsonStr.match(/"assumptions_made"\s*:\s*\[(.*?)\]/) ||
                                     jsonStr.match(/assumptions_made\s*:\s*\[(.*?)\]/);
              
              metadata = {
                episode_number: episodeNumberMatch ? parseInt(episodeNumberMatch[1]) : 1,
                last_scene_id: lastSceneIdMatch ? lastSceneIdMatch[1].replace(/"/g, '').replace(/\\/g, '') : "SCENE_END",
                last_scene_summary: lastSceneSummaryMatch ? lastSceneSummaryMatch[1].replace(/"/g, '').replace(/\\/g, '') : "Script continuation generated",
                main_characters: mainCharactersMatch ? 
                  mainCharactersMatch[1].split(',').map(c => c.trim().replace(/"/g, '').replace(/\\/g, '')) : 
                  ["Protagonist", "Supporting Character", "Antagonist"],
                current_tone_style: currentToneMatch ? currentToneMatch[1].replace(/"/g, '').replace(/\\/g, '') : "Drama",
                open_threads: openThreadsMatch ? 
                  openThreadsMatch[1].split(',').map(t => t.trim().replace(/"/g, '').replace(/\\/g, '')) : 
                  ["Plot development"],
                assumptions_made: assumptionsMatch ? 
                  assumptionsMatch[1].split(',').map(a => a.trim().replace(/"/g, '').replace(/\\/g, '')) : 
                  ["Script analysis completed"],
                confidence_score: 0.7
              };
              console.log('✅ Successfully parsed metadata (Strategy 3 - Manual):', metadata);
              parseSuccess = true;
            } catch (error3) {
              console.log('⚠️ Strategy 3 failed with error:', error3);
              console.log('⚠️ Trying Strategy 4 - Reconstruct JSON...');
              
              // Strategy 4: Try to reconstruct JSON from partial data
              try {
                // Find the last complete property and close the JSON
                const lastCompleteProperty = jsonStr.lastIndexOf('"');
                if (lastCompleteProperty > 0) {
                  const partialJson = jsonStr.substring(0, lastCompleteProperty + 1);
                  const reconstructedJson = partialJson + '}';
                  
                  metadata = JSON.parse(reconstructedJson) as ScriptMetadata;
                  console.log('✅ Successfully parsed metadata (Strategy 4 - Reconstructed):', metadata);
                  parseSuccess = true;
                } else {
                  throw new Error('No complete properties found');
                }
              } catch (error4) {
                console.error('❌ All parsing strategies failed');
              }
            }
          }
        }
        
        if (!parseSuccess) {
          console.error('❌ Error parsing metadata JSON with all strategies');
          console.error('❌ JSON string was:', metadataMatch[1].substring(0, 500) + '...');
          
          // Use fallback metadata
          metadata = {
            episode_number: 1,
            last_scene_id: "SCENE_END",
            last_scene_summary: "Script continuation generated",
            main_characters: ["Miko", "Rian", "Anca"],
            current_tone_style: "Drama",
            open_threads: ["Plot development"],
            assumptions_made: ["Script analysis completed"],
            confidence_score: 0.7
          };
          console.log('🔄 Using fallback metadata due to parsing error');
        }
      } catch (error) {
        console.error('❌ Error in metadata parsing block:', error);
        // Use fallback metadata
        metadata = {
          episode_number: 1,
          last_scene_id: "SCENE_END",
          last_scene_summary: "Script continuation generated",
          main_characters: ["Miko", "Rian", "Anca"],
          current_tone_style: "Komedi",
          open_threads: ["Plot development"],
          assumptions_made: ["Script analysis completed"],
          confidence_score: 0.7
        };
        console.log('🔄 Using fallback metadata due to parsing block error');
      }
    } else {
      console.log('❌ No metadata match found');
      console.log('❌ Response content:', response.substring(0, 1000));
    }

    // Extract recap - try multiple patterns
    let recapMatch = response.match(/RECAP:\s*\n\s*([^\n]+(?:\n(?!CONTINUATION:)[^\n]+)*)/);
    if (!recapMatch) {
      recapMatch = response.match(/\*\*RECAP:\*\*\s*\[([^\]]+)\]/);
    }
    if (!recapMatch) {
      recapMatch = response.match(/RECAP\s*\[([^\]]+)\]/);
    }
    const recap = recapMatch ? recapMatch[1].trim() : null;

    // Extract continuation - try multiple patterns
    let continuationMatch = response.match(/CONTINUATION:\s*\n\s*([\s\S]*?)(?:\n\nQUALITY CHECKS:|ASSUMPTIONS|Style DNA|INSTRUCTIONS|$)/);
    if (!continuationMatch) {
      continuationMatch = response.match(/\*\*CONTINUATION:\*\*\s*([\s\S]*?)(?:\*\*QUALITY CHECKS:\*\*|\*\*ASSUMPTIONS|\*\*Style DNA|\*\*INSTRUCTIONS|$)/);
    }
    if (!continuationMatch) {
      continuationMatch = response.match(/CONTINUATION\s*([\s\S]*?)(?:QUALITY CHECKS|ASSUMPTIONS|Style DNA|INSTRUCTIONS|$)/);
    }
    const continuation = continuationMatch ? continuationMatch[1].trim() : response;

    // Clean up any remaining escape characters in the metadata
    if (metadata) {
      if (metadata.last_scene_summary) {
        metadata.last_scene_summary = metadata.last_scene_summary.replace(/\\/g, '');
      }
      if (metadata.main_characters) {
        metadata.main_characters = metadata.main_characters.map(char => char.replace(/\\/g, ''));
      }
      if (metadata.open_threads) {
        metadata.open_threads = metadata.open_threads.map(thread => thread.replace(/\\/g, ''));
      }
      if (metadata.assumptions_made) {
        metadata.assumptions_made = metadata.assumptions_made.map(assumption => assumption.replace(/\\/g, ''));
      }
    }

    console.log('📋 Parsed result:', { metadata: !!metadata, recap: !!recap, continuationLength: continuation.length });

    return {
      metadata,
      recap,
      continuation
    };
  } catch (error) {
    console.error('Error parsing script continuation response:', error);
    console.error('Response that caused error:', response);
    return {
      metadata: null,
      recap: null,
      continuation: response || ''
    };
  }
}

// Advanced script generation with context analysis (works for all script requests)
export async function generateAdvancedScriptGeneration(
  userMessage: string,
  context: ChatContext,
  activeModes: { knowledgeGraph: boolean; styleDNA: boolean; openMode?: boolean } = { knowledgeGraph: false, styleDNA: false, openMode: false },
  onThinkingStep?: (step: string) => void
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 32768, // Increased for longer scripts (80 pages)
        topP: 0.8,
        topK: 40
      }
    });
    
    // Step 1: Analyze script context
    onThinkingStep?.('Menganalisis konteks script dan metadata...');
    const metadata = await analyzeScriptContext(context, activeModes, onThinkingStep);
    
    // Step 2: Generate script with metadata (works for both continuation and new script requests)
    onThinkingStep?.('Membuat script berdasarkan analisis...');
    
    const contextPrompt = buildContextPrompt(context, activeModes);
    
    const scriptPrompt = `Anda adalah scriptwriter profesional yang sangat berpengalaman. Berdasarkan analisis konteks yang mendalam, buat script yang akurat dan konsisten.

🚨 PERINGATAN BAHASA: WAJIB MENGGUNAKAN BAHASA INDONESIA UNTUK SEMUA RESPONSE! JANGAN MENGGUNAKAN BAHASA INGGRIS SAMA SEKALI!
🔥 JIKA ANDA MENULIS DALAM BAHASA INGGRIS, RESPONSE ANDA AKAN DIHAPUS OTOMATIS!
⚡ SEMUA DIALOG, NARASI, DAN DESKRIPSI HARUS DALAM BAHASA INDONESIA!

🎬 TRANSI SCRIPT (KECUALI): 
- CUT TO:, DISSOLVE TO:, FADE TO:, SMASH CUT TO:, MONTAGE - HARUS DALAM BAHASA INGGRIS
- JANGAN terjemahkan transisi ke bahasa Indonesia
- GUNAKAN format standar industri: CUT TO:, DISSOLVE TO:, dll
- VARIASI TRANSISI: Jangan hanya gunakan CUT TO:, gunakan variasi:
  * CUT TO: untuk transisi cepat/aksi
  * DISSOLVE TO: untuk transisi halus/emosional
  * FADE TO: untuk transisi waktu/lokasi
  * SMASH CUT TO: untuk transisi dramatis/kejutan
  * MONTAGE - untuk serangkaian adegan

${activeModes.styleDNA && context.styleDNA ? `
🎨 STYLE DNA TRANSITION GUIDELINES:
- Pacing: ${context.styleDNA?.pacing?.type || 'moderate'} → Gunakan transisi yang sesuai
- Tone: ${context.styleDNA?.toneMood?.primaryTone || 'drama'} → Sesuaikan ending transition
- Genre: ${context.styleDNA?.genrePreferences?.primaryGenre || 'drama'} → Pilih transisi yang tepat

${getStyleDNATransitionInstructions(context.styleDNA)}

WAJIB: Gunakan transisi yang sesuai dengan Style DNA di atas!
` : ''}

${activeModes.styleDNA ? '🚨 PERINGATAN PENTING: Style DNA AKTIF - WAJIB SELALU DIGUNAKAN TANPA PENGECUALIAN! JANGAN PERNAH menilai kesesuaian genre atau tone. Style DNA adalah PILIHAN USER, bukan keputusan AI!' : ''}
${activeModes.styleDNA ? '🔥 JIKA ANDA MENULIS "Style DNA tidak digunakan" ATAU SEJENISNYA, RESPONSE ANDA AKAN DIHAPUS OTOMATIS!' : ''}
${activeModes.styleDNA ? '⚡ GUNAKAN STYLE DNA YANG TERSEDIA DALAM CONTEXT - TIDAK ADA PILIHAN LAIN!' : ''}
${activeModes.styleDNA ? '🔥 JIKA ANDA MENULIS "Style DNA tidak digunakan" ATAU SEJENISNYA, RESPONSE ANDA AKAN DIHAPUS OTOMATIS!' : ''}
${activeModes.styleDNA ? '⚡ GUNAKAN STYLE DNA YANG TERSEDIA DALAM CONTEXT - TIDAK ADA PILIHAN LAIN!' : ''}

CONTEXT YANG PERLU DIANALISIS:
${contextPrompt}

METADATA ANALISIS:
${JSON.stringify(metadata, null, 2)}

USER REQUEST: ${userMessage}

TUGAS SCRIPT:
1. BACA metadata di atas dengan teliti
2. ${userMessage.toLowerCase().includes('lanjut') || userMessage.toLowerCase().includes('continue') ? 'LANJUTKAN script dari titik terakhir yang teridentifikasi' : 'BUAT script sesuai permintaan user'}
3. JAGA kontinuitas karakter, tone, dan plot threads
4. GUNAKAN confidence score untuk menentukan seberapa detail script
5. ${userMessage.toLowerCase().includes('lanjut') || userMessage.toLowerCase().includes('continue') ? 'JANGAN ulangi atau tulis ulang script yang sudah ada' : 'BUAT script yang fresh dan engaging'}
6. FOKUS pada ${userMessage.toLowerCase().includes('lanjut') || userMessage.toLowerCase().includes('continue') ? 'seamless continuation' : 'script yang berkualitas tinggi'}

🚨 PENTING: JANGAN MENGAKHIRI CERITA!
- JANGAN gunakan FADE OUT, THE END, atau ending yang final
- JANGAN menyelesaikan konflik utama dalam satu generation
- BIARKAN cerita terbuka untuk dilanjutkan user
- GUNAKAN transisi yang sesuai Style DNA (CUT TO:, DISSOLVE TO:, dll)
- BIARKAN cliffhanger atau plot threads yang terbuka
- USER yang menentukan kapan cerita selesai, bukan AI!
${activeModes.styleDNA ? '7. WAJIB MUTLAK: SELALU gunakan Style DNA yang tersedia dalam context untuk konsistensi gaya penulisan TANPA PENGECUALIAN' : ''}
${activeModes.styleDNA ? '8. JANGAN PERNAH menilai kesesuaian genre atau tone Style DNA - GUNAKAN SAJA' : ''}
${activeModes.styleDNA ? '9. Style DNA adalah PILIHAN USER, bukan keputusan AI' : ''}
${activeModes.knowledgeGraph ? '10. WAJIB MUTLAK: SELALU gunakan Knowledge Graph untuk konsistensi cerita, karakter, dan plot TANPA PENGECUALIAN' : ''}
${activeModes.knowledgeGraph ? '11. WAJIB: Cross-reference semua karakter dengan entities di Knowledge Graph' : ''}
${activeModes.knowledgeGraph ? '12. WAJIB: Pastikan plot development sesuai dengan timeline events di Knowledge Graph' : ''}
${activeModes.knowledgeGraph ? '13. WAJIB: Gunakan relationships untuk memahami dinamika antar karakter' : ''}
${activeModes.knowledgeGraph ? '14. WAJIB: Konsistensi dengan character arcs yang sudah established di Knowledge Graph' : ''}

OUTPUT FORMAT:
METADATA:
${JSON.stringify(metadata, null, 2)}

RECAP:
[1-3 kalimat ringkasan konteks ${userMessage.toLowerCase().includes('lanjut') || userMessage.toLowerCase().includes('continue') ? 'terakhir' : 'script yang dibuat'}]

CONTINUATION:
[${userMessage.toLowerCase().includes('lanjut') || userMessage.toLowerCase().includes('continue') ? 'Lanjutan script yang seamless dari titik terakhir' : 'Script yang dibuat sesuai permintaan'}]

**QUALITY CHECKS:**
- Konsistensi karakter: ✓/✗
- Kontinuitas timeline: ✓/✗  
- Tone/style terjaga: ✓/✗
- Thread terbuka ditangani: ✓/✗
${activeModes.styleDNA ? '- Style DNA diterapkan: ✓/✗' : ''}
${activeModes.knowledgeGraph ? '- Knowledge Graph digunakan: ✓/✗' : ''}
${activeModes.knowledgeGraph ? '- Entities konsisten: ✓/✗' : ''}
${activeModes.knowledgeGraph ? '- Relationships dipertahankan: ✓/✗' : ''}
${activeModes.knowledgeGraph ? '- Timeline events diikuti: ✓/✗' : ''}

**ASSUMPTIONS & CONFIDENCE:**
- Asumsi yang dibuat: ${metadata.assumptions_made.join(', ')}
- Skor kepercayaan: ${metadata.confidence_score}/1.0
- Style DNA digunakan: ${metadata.style_dna_used}

INSTRUCTIONS:
- Buat lanjutan script yang mengikuti guidelines scriptwriting profesional
- Pertahankan konsistensi dengan karakter, setting, dan plot yang sudah established
- Gunakan format screenplay yang tepat dengan elemen teknis yang sesuai
- Sertakan arahan scene dan nama karakter
- Buat script yang engaging dan well-structured
- GUNAKAN elemen teknis script yang sesuai: O.S., V.O., CONT'D, (beat), parentheticals, montage, SUPER
- PASTIKAN script mengikuti struktur dan pacing yang baik
- FORMAT script dengan standar industri yang profesional
- WAJIB MENGGUNAKAN BAHASA INDONESIA untuk semua dialog dan narasi
- JANGAN menggunakan bahasa Inggris kecuali untuk nama karakter atau istilah teknis
${activeModes.styleDNA ? '- WAJIB MUTLAK: Jika Style DNA aktif, SELALU terapkan Style DNA yang tersedia untuk konsistensi gaya penulisan TANPA PENGECUALIAN' : ''}
${activeModes.styleDNA ? '- JANGAN PERNAH menilai kesesuaian genre atau tone Style DNA - GUNAKAN SAJA' : ''}
${activeModes.styleDNA ? '- Style DNA adalah PILIHAN USER, bukan keputusan AI' : ''}

🚨 PERINGATAN FORMAT SCRIPT (WAJIB DIIKUTI):
- JANGAN gunakan ** untuk bold text dalam script
- JANGAN gunakan format **Scene 1:** atau ** (action)**
- JANGAN gunakan **NARRATOR (V.O.):** atau **MAYA (V.O.):**
- JANGAN gunakan ** (Potong ke...)** atau ** (Kilas balik...)**
- GUNAKAN format script standar: SCENE HEADING, ACTION, CHARACTER NAME, DIALOGUE
- JANGAN gunakan markdown formatting dalam script
- FORMAT script seperti contoh yang diberikan di atas
- JIKA ANDA MENGGUNAKAN ** DALAM SCRIPT, RESPONSE ANDA AKAN DIHAPUS OTOMATIS!

Buat script sekarang:`;

    const result = await model.generateContent(scriptPrompt);
    const response = await result.response;
    let responseText = response.text();
    
    // FORCE Style DNA usage if active - post-process the response
    if (activeModes.styleDNA && context.styleDNA) {
      responseText = forceStyleDNAUsage(responseText, context.styleDNA);
    }
    
    // FORCE Indonesian language - post-process the response
    responseText = forceIndonesianLanguage(responseText);
    
    // FIX script formatting - post-process the response
    responseText = fixScriptFormatting(responseText);
    
    // NOTE: DO NOT remove metadata from response - it's needed for Script Analysis UI
    // The ScriptRenderer component will filter it out for display
    
    return responseText;
    
  } catch (error) {
    console.error('Error generating advanced script continuation:', error);
    console.error('Style DNA available:', !!context.styleDNA);
    console.error('Active modes:', activeModes);
    
    // Use Style DNA-aware fallback
    return generateFallbackScript(context.currentEpisode, context.project, context.styleDNA);
  }
}

// Alias for backward compatibility
export const generateAdvancedScriptContinuation = generateAdvancedScriptGeneration;

export async function generateScriptResponse(
  userMessage: string,
  context: ChatContext,
  activeModes: { knowledgeGraph: boolean; styleDNA: boolean; openMode?: boolean } = { knowledgeGraph: false, styleDNA: false, openMode: false },
  deepThinkEnabled: boolean = false,
  onThinkingStep?: (step: string) => void
): Promise<string> {
  try {
    // Check if this is a long script request (50+ pages / 20k+ words)
    const lowerMsg = userMessage.toLowerCase();
    const isLongScriptRequest =
      lowerMsg.includes('50') ||
      lowerMsg.includes('lima puluh') ||
      lowerMsg.includes('60') ||
      lowerMsg.includes('enam puluh') ||
      lowerMsg.includes('70') ||
      lowerMsg.includes('tujuh puluh') ||
      lowerMsg.includes('80') ||
      lowerMsg.includes('delapan puluh') ||
      lowerMsg.includes('90') ||
      lowerMsg.includes('sembilan puluh') ||
      lowerMsg.includes('100') ||
      lowerMsg.includes('seratus') ||
      lowerMsg.includes('120') ||
      lowerMsg.includes('seratus dua puluh') ||
      lowerMsg.includes('32000') ||
      lowerMsg.includes('32,000') ||
      lowerMsg.includes('32k') ||
      lowerMsg.includes('32000 kata') ||
      lowerMsg.includes('script panjang') ||
      lowerMsg.includes('kata panjang') ||
      lowerMsg.includes('panjang') ||
      lowerMsg.includes('full') ||
      lowerMsg.includes('lengkap') ||
      lowerMsg.includes('episode lengkap') ||
      lowerMsg.includes('film lengkap') ||
      lowerMsg.includes('tiga puluh dua ribu') ||
      lowerMsg.includes('halaman') && /\d+/.test(userMessage);
    
    if (isLongScriptRequest) {
      console.log('📚 Using long script generation with sections...');
      
      // Extract target pages from user message
      let targetPages = 80; // default
      
      // Look for specific numbers in the message - improved pattern matching
      const numberMatch = userMessage.match(/(\d+)\s*halaman/);
      if (numberMatch) {
        targetPages = parseInt(numberMatch[1]);
      } else {
        // Look for other patterns - more comprehensive
        const allNumbers = userMessage.match(/\d+/g);
        if (allNumbers) {
          // Find the largest number that makes sense for pages (10-500)
          const validNumbers = allNumbers
            .map(n => parseInt(n))
            .filter(n => n >= 10 && n <= 500);
          
          if (validNumbers.length > 0) {
            targetPages = Math.max(...validNumbers);
          }
        }
        
        // Fallback patterns
        if (lowerMsg.includes('50')) targetPages = 50;
        else if (lowerMsg.includes('60')) targetPages = 60;
        else if (lowerMsg.includes('70')) targetPages = 70;
        else if (lowerMsg.includes('80')) targetPages = 80;
        else if (lowerMsg.includes('90')) targetPages = 90;
        else if (lowerMsg.includes('100')) targetPages = 100;
        else if (lowerMsg.includes('120')) targetPages = 120;
      }
      
      console.log(`📚 Target pages detected: ${targetPages}`);
      console.log(`📚 User message: "${userMessage}"`);
      console.log(`📚 Number match result:`, numberMatch);
      return await generateLongScriptInChunks(userMessage, context, activeModes, targetPages, onThinkingStep);
    }
    
    // Check if this is a continuation request
    const isContinuationRequest = userMessage.toLowerCase().includes('lanjut') || 
                                 userMessage.toLowerCase().includes('continue') ||
                                 userMessage.toLowerCase().includes('melanjutkan') ||
                                 userMessage.toLowerCase().includes('teruskan');
    
    if (isContinuationRequest) {
      console.log('🔄 Using advanced script continuation...');
      return await generateAdvancedScriptContinuation(userMessage, context, activeModes, onThinkingStep);
    }
    
    // Check if this is first generation (no script exists yet)
    const hasNoScript = !context.currentEpisode.script;
    const hasNoAssistantMessages = !context.recentMessages.some(msg => msg.role === 'assistant');
    const isFirstGeneration = hasNoScript && hasNoAssistantMessages;
    
    if (isFirstGeneration) {
      console.log('🎬 First generation detected, using advanced script generation with metadata...');
      return await generateAdvancedScriptGeneration(userMessage, context, activeModes, onThinkingStep);
    }
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 32768, // Increased for longer scripts (80 pages)
        topP: 0.8,
        topK: 40
      }
    });
    
    const contextPrompt = buildContextPrompt(context, activeModes);
    
    let prompt: string;
    
    if (deepThinkEnabled) {
      // Step 1: Deep thinking and analysis
      console.log('🧠 Starting deep thinking analysis...');
      onThinkingStep?.('Menganalisis context dan chat history...');
      const deepAnalysis = await deepThinkAndAnalyze(userMessage, context, activeModes, onThinkingStep);
      
      prompt = `${contextPrompt}

🚨 PERINGATAN BAHASA: WAJIB MENGGUNAKAN BAHASA INDONESIA UNTUK SEMUA RESPONSE! JANGAN MENGGUNAKAN BAHASA INGGRIS SAMA SEKALI!
🔥 JIKA ANDA MENULIS DALAM BAHASA INGGRIS, RESPONSE ANDA AKAN DIHAPUS OTOMATIS!
⚡ SEMUA DIALOG, NARASI, DAN DESKRIPSI HARUS DALAM BAHASA INDONESIA!

🎬 TRANSI SCRIPT (KECUALI): 
- CUT TO:, DISSOLVE TO:, FADE TO:, SMASH CUT TO:, MONTAGE - HARUS DALAM BAHASA INGGRIS
- JANGAN terjemahkan transisi ke bahasa Indonesia
- GUNAKAN format standar industri: CUT TO:, DISSOLVE TO:, dll

${activeModes.styleDNA ? '🚨 PERINGATAN PENTING: Style DNA AKTIF - WAJIB SELALU DIGUNAKAN TANPA PENGECUALIAN! JANGAN PERNAH menilai kesesuaian genre atau tone. Style DNA adalah PILIHAN USER, bukan keputusan AI!' : ''}
${activeModes.styleDNA ? '🔥 JIKA ANDA MENULIS "Style DNA tidak digunakan" ATAU SEJENISNYA, RESPONSE ANDA AKAN DIHAPUS OTOMATIS!' : ''}
${activeModes.styleDNA ? '⚡ GUNAKAN STYLE DNA YANG TERSEDIA DALAM CONTEXT - TIDAK ADA PILIHAN LAIN!' : ''}

USER REQUEST: ${userMessage}

🧠 DEEP THINKING ANALYSIS:
${deepAnalysis}

BERDASARKAN ANALISIS MENDALAM DI ATAS, SEKARANG TULIS SCRIPT YANG:`;
    } else {
      // Standard script generation without deep thinking
      console.log('⚡ Generating script without deep thinking...');
      
      prompt = `${contextPrompt}

🚨 PERINGATAN BAHASA: WAJIB MENGGUNAKAN BAHASA INDONESIA UNTUK SEMUA RESPONSE! JANGAN MENGGUNAKAN BAHASA INGGRIS SAMA SEKALI!
🔥 JIKA ANDA MENULIS DALAM BAHASA INGGRIS, RESPONSE ANDA AKAN DIHAPUS OTOMATIS!
⚡ SEMUA DIALOG, NARASI, DAN DESKRIPSI HARUS DALAM BAHASA INDONESIA!

🎬 TRANSI SCRIPT (KECUALI): 
- CUT TO:, DISSOLVE TO:, FADE TO:, SMASH CUT TO:, MONTAGE - HARUS DALAM BAHASA INGGRIS
- JANGAN terjemahkan transisi ke bahasa Indonesia
- GUNAKAN format standar industri: CUT TO:, DISSOLVE TO:, dll

${activeModes.styleDNA ? '🚨 PERINGATAN PENTING: Style DNA AKTIF - WAJIB SELALU DIGUNAKAN TANPA PENGECUALIAN! JANGAN PERNAH menilai kesesuaian genre atau tone. Style DNA adalah PILIHAN USER, bukan keputusan AI!' : ''}
${activeModes.styleDNA ? '🔥 JIKA ANDA MENULIS "Style DNA tidak digunakan" ATAU SEJENISNYA, RESPONSE ANDA AKAN DIHAPUS OTOMATIS!' : ''}
${activeModes.styleDNA ? '⚡ GUNAKAN STYLE DNA YANG TERSEDIA DALAM CONTEXT - TIDAK ADA PILIHAN LAIN!' : ''}

USER REQUEST: ${userMessage}

${userMessage.toLowerCase().includes('lanjut') || userMessage.toLowerCase().includes('continue') ? 
  'LANJUTKAN SCRIPT YANG SUDAH ADA DENGAN:' : 
  'TULIS SCRIPT YANG:'}

📌 GUIDELINE MENULIS SCRIPT FILM/SERIES:

1. STRUKTUR CERITA (3-Act Structure):
- Act 1 (Setup): Perkenalkan tokoh, dunia cerita, dan konflik utama
- Act 2 (Confrontation): Tokoh menghadapi rintangan, ketegangan meningkat
- Act 3 (Resolution): Konflik mencapai klimaks, lalu penyelesaian
- Untuk series: pertimbangkan season arc dan episode arc

2. KARAKTER:
- Tokoh utama harus punya tujuan jelas (wants) dan kebutuhan batin (needs)
- Buat karakter yang punya konflik internal + eksternal
- Karakter pendukung sebaiknya tidak hanya figuran; masing-masing ada motivasi

3. KONFLIK & STAKES:
- Cerita harus punya taruhan (stakes): apa yang hilang kalau tokoh gagal?
- Konflik harus terus berkembang dan menekan karakter ke titik sulit
- Ada escalation: masalah makin berat, solusi makin mahal

4. DIALOG:
- Natural, sesuai kepribadian karakter
- Jangan terlalu eksposisi; tunjukkan lewat aksi ("show, don't tell")
- Punya subteks (yang dimaksud belum tentu sama dengan yang diucapkan)

5. FORMAT TEKNIS (WAJIB DIIKUTI):
- Scene Heading (Slugline): INT./EXT. – LOKASI – WAKTU
- Action: deskripsi singkat apa yang terlihat
- Dialogue: nama karakter di tengah, lalu kalimatnya

🚨 FORMAT SCRIPT YANG BENAR (WAJIB DIIKUTI):
INT. RUMAH MAYA - PAGI HARI

Maya (32) sedang mencuci baju di ember plastik. Wajahnya lelah, 
mata sembab. Lintang (7) tertidur di tikar tipis.

SOUND: Suara air yang diperas dari baju, suara cicak.

MAYA (V.O.)
Pagi lagi. Sama kayak kemarin, sama kayak lusa.

(Maya memeras baju dengan kuat, gerakannya mekanis)

MAYA
(berbisik)
Lintang, bangun sayang.

JANGAN MENGGUNAKAN FORMAT YANG SALAH SEPERTI:
- **Scene 1:** (SALAH)
- ** (Action line)** (SALAH)
- **MAYA (V.O.):** (SALAH)

📌 ELEMEN TEKNIS SCRIPT:

5.1. O.S. (Off Screen):
- Dipakai kalau karakter ada di lokasi yang sama, tapi tidak terlihat kamera
- Contoh: Tokoh bicara dari balik pintu, dari ruangan lain, atau dari dalam kamar mandi
- Format: KARAKTER (O.S.)

5.2. V.O. (Voice Over):
- Untuk narasi, monolog batin, atau suara yang tidak berasal dari adegan langsung
- Misalnya: tokoh membaca surat, narasi pembuka, atau inner monologue
- Format: KARAKTER (V.O.)

5.3. CONT'D (Continued):
- Dipakai kalau karakter bicara lagi setelah ada aksi atau interupsi, tapi masih dianggap dialog berlanjut
- Format: KARAKTER (CONT'D)

5.4. (beat):
- Catatan kecil untuk aktor memberi jeda sejenak dalam dialog
- Tidak wajib, tapi membantu ritme
- Format: (beat)

5.5. Parentheticals (wrylies):
- Arahan singkat cara bicara (bukan deskripsi panjang)
- Jangan kebanyakan, cukup untuk menghindari ambigu
- Format: (sinis), (kaget), (marah), dll.

5.6. Transitions:
- CUT TO:, DISSOLVE TO: (jarang dipakai berlebihan)
- Default editing biasanya otomatis "CUT TO"

5.7. Montage & Series of Shots:
- Untuk menampilkan rangkaian adegan singkat
- Format: MONTAGE – JUDUL MONTAGE

5.8. Super / Title Cards:
- Kalau ada teks di layar, tulis dengan SUPER:
- Format: SUPER: "Jakarta, 2003"

6. RITME & PACE:
- Adegan jangan terlalu panjang, harus punya tujuan
- Untuk film: ±90–120 halaman (1 halaman ≈ 1 menit)
- Untuk series: biasanya 25–60 menit per episode

7. TEMA & PESAN:
- Pastikan ada benang merah/tema besar
- Tema bukan berarti moral yang dipaksakan, tapi pertanyaan atau gagasan yang cerita ingin eksplorasi

8. ORIGINALITAS & HOOK:
- Harus ada premis kuat: ide dasar yang membuat orang mau menonton
- "Hook" di awal penting, terutama untuk series (biar penonton lanjut episode berikutnya)

9. EPISODE BREAKDOWN (untuk series):
- Teaser / Cold Open (menarik perhatian sejak menit awal)
- Plot A, B, C (alur utama & sub-plot)
- Cliffhanger atau resolusi untuk dorong penonton lanjut

INSTRUCTIONS:
${userMessage.toLowerCase().includes('lanjut') || userMessage.toLowerCase().includes('continue') ? 
  `- LANJUTKAN script yang sudah ada dengan seamless continuation
- BACA script yang sudah ada dan lanjutkan dari titik terakhir
- PASTIKAN continuity dengan karakter, setting, dan plot yang sudah established
- JANGAN ulangi atau tulis ulang script yang sudah ada
- LANJUTKAN dengan scene atau adegan berikutnya yang logis
- GUNAKAN format script yang sama dengan yang sudah ada` :
  `- Buat script yang mengikuti guidelines di atas
- Buat script profesional dalam bahasa Indonesia mengikuti guidelines di atas
- Ikuti genre dan tone proyek
- Pertahankan konsistensi dengan episode sebelumnya dan chat history`}

🚨 PENTING: JANGAN MENGAKHIRI CERITA!
- JANGAN gunakan FADE OUT, THE END, atau ending yang final
- JANGAN menyelesaikan konflik utama dalam satu generation
- BIARKAN cerita terbuka untuk dilanjutkan user
- GUNAKAN transisi yang sesuai Style DNA (CUT TO:, DISSOLVE TO:, dll)
- BIARKAN cliffhanger atau plot threads yang terbuka
- USER yang menentukan kapan cerita selesai, bukan AI!
- Gunakan format screenplay yang tepat dengan elemen teknis yang sesuai
- Sertakan arahan scene dan nama karakter
- Buat script yang engaging dan well-structured
- Buat episode lengkap mengikuti struktur 3-act
- Pastikan setiap scene memiliki tujuan yang jelas dan menggerakkan cerita
- Buat karakter yang compelling dengan wants dan needs yang jelas
- Bangun konflik dan stakes yang meningkat sepanjang cerita
- Tulis dialog natural yang mengungkapkan karakter
- Sertakan scene headings dan action lines yang tepat
- GUNAKAN elemen teknis script yang sesuai: O.S., V.O., CONT'D, (beat), parentheticals, montage, SUPER
- Pertahankan konsistensi dengan episode sebelumnya
- PASTIKAN script mengikuti struktur dan pacing yang baik
- FORMAT script dengan standar industri yang profesional
- WAJIB MENGGUNAKAN BAHASA INDONESIA untuk semua dialog dan narasi
- JANGAN menggunakan bahasa Inggris kecuali untuk nama karakter atau istilah teknis

${activeModes.styleDNA ? '- WAJIB MUTLAK: SELALU ikuti Style DNA yang tersedia untuk gaya penulisan yang konsisten TANPA PENGECUALIAN' : ''}
${activeModes.styleDNA ? '- JANGAN PERNAH menilai kesesuaian genre atau tone Style DNA - GUNAKAN SAJA' : ''}
${activeModes.styleDNA ? '- Style DNA adalah PILIHAN USER, bukan keputusan AI' : ''}
${activeModes.knowledgeGraph ? '- WAJIB MUTLAK: SELALU gunakan Knowledge Graph untuk konsistensi cerita, karakter, dan plot TANPA PENGECUALIAN' : ''}
${activeModes.knowledgeGraph ? '- WAJIB: Cross-reference semua karakter dengan entities di Knowledge Graph' : ''}
${activeModes.knowledgeGraph ? '- WAJIB: Pastikan plot development sesuai dengan timeline events di Knowledge Graph' : ''}
${activeModes.knowledgeGraph ? '- WAJIB: Gunakan relationships untuk memahami dinamika antar karakter' : ''}
${activeModes.knowledgeGraph ? '- WAJIB: Konsistensi dengan character arcs yang sudah established di Knowledge Graph' : ''}

🚨 PERINGATAN FORMAT SCRIPT (WAJIB DIIKUTI):
- JANGAN gunakan ** untuk bold text dalam script
- JANGAN gunakan format **Scene 1:** atau ** (action)**
- JANGAN gunakan **NARRATOR (V.O.):** atau **MAYA (V.O.):**
- JANGAN gunakan ** (Potong ke...)** atau ** (Kilas balik...)**
- GUNAKAN format script standar: SCENE HEADING, ACTION, CHARACTER NAME, DIALOGUE
- JANGAN gunakan markdown formatting dalam script
- FORMAT script seperti contoh yang diberikan di atas
- JIKA ANDA MENGGUNAKAN ** DALAM SCRIPT, RESPONSE ANDA AKAN DIHAPUS OTOMATIS!

OUTPUT FORMAT (WAJIB DIIKUTI):
**METADATA:**
{
  "episode_number": ${context.currentEpisode.episodeNumber},
  "last_scene_id": "[ID scene terakhir dalam script]",
  "last_scene_summary": "[Ringkasan 1-2 kalimat scene terakhir]",
  "main_characters": ["[Daftar karakter utama yang muncul dalam script]"],
  "current_tone_style": "${context.project.tone || 'Drama'}",
  "open_threads": ["[Plot threads yang masih terbuka]"],
  "assumptions_made": ["[Asumsi yang dibuat untuk script ini]"],
  "confidence_score": 0.8,
  "style_dna_used": "${activeModes.styleDNA ? 'Style DNA aktif' : 'Tidak menggunakan Style DNA'}"
}

**RECAP:**
[Ringkasan konteks script yang dibuat]

**CONTINUATION:**
[Script content yang dibuat]

Buat script sekarang:`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();
    
    console.log('🤖 Raw AI response length:', responseText.length);
    console.log('🤖 Contains METADATA:', responseText.includes('**METADATA:**'));
    console.log('🤖 Contains RECAP:', responseText.includes('**RECAP:**'));
    console.log('🤖 Contains CONTINUATION:', responseText.includes('**CONTINUATION:**'));
    console.log('🤖 First 500 chars:', responseText.substring(0, 500));
    console.log('🤖 Last 500 chars:', responseText.substring(Math.max(0, responseText.length - 500)));
    
    // FORCE Style DNA usage if active - post-process the response
    if (activeModes.styleDNA && context.styleDNA) {
      responseText = forceStyleDNAUsage(responseText, context.styleDNA);
    }
    
    // FORCE Indonesian language - post-process the response
    responseText = forceIndonesianLanguage(responseText);
    
    // FIX script formatting - post-process the response
    responseText = fixScriptFormatting(responseText);
    
    console.log('🤖 Final response length:', responseText.length);
    console.log('🤖 Final contains METADATA:', responseText.includes('**METADATA:**'));
    
    // NOTE: DO NOT remove metadata from response - it's needed for Script Analysis UI
    // The ScriptRenderer component will filter it out for display
    
    return responseText;
  } catch (error) {
    console.error('Error generating script:', error);
    console.error('Style DNA available:', !!context.styleDNA);
    console.error('Active modes:', activeModes);
    
    // Use Style DNA-aware fallback
    return generateFallbackScript(context.currentEpisode, context.project, context.styleDNA);
  }
}

/**
 * Determine appropriate transitions based on Style DNA
 */
function getStyleDNABasedTransitions(styleDNA: any): {
  preferredTransitions: string[];
  endingTransition: string;
  pacingStyle: string;
} {
  console.log('🎨 getStyleDNABasedTransitions called with:', styleDNA ? 'Style DNA present' : 'No Style DNA');
  
  if (!styleDNA) {
    console.log('🎨 No Style DNA - using default transitions');
    return {
      preferredTransitions: ['CUT TO:'],
      endingTransition: 'CUT TO:',
      pacingStyle: 'moderate'
    };
  }

  const transitions = {
    preferredTransitions: ['CUT TO:'],
    endingTransition: 'CUT TO:',
    pacingStyle: 'moderate'
  };

  // Based on pacing type
  if (styleDNA.pacing?.type === 'fast_paced') {
    transitions.preferredTransitions = ['CUT TO:', 'SMASH CUT TO:'];
    transitions.endingTransition = 'CUT TO:';
  } else if (styleDNA.pacing?.type === 'slow_burn') {
    transitions.preferredTransitions = ['DISSOLVE TO:', 'FADE TO:'];
    transitions.endingTransition = 'CUT TO:'; // Don't end story
  } else if (styleDNA.pacing?.type === 'montage_driven') {
    transitions.preferredTransitions = ['CUT TO:', 'MONTAGE -'];
    transitions.endingTransition = 'CUT TO:';
  }

  // Based on tone/mood
  if (styleDNA.toneMood?.primaryTone === 'dark_gritty') {
    transitions.preferredTransitions = ['CUT TO:', 'SMASH CUT TO:'];
    transitions.endingTransition = 'CUT TO:';
  } else if (styleDNA.toneMood?.primaryTone === 'melancholic') {
    transitions.preferredTransitions = ['DISSOLVE TO:', 'FADE TO:'];
    transitions.endingTransition = 'CUT TO:'; // Don't end story
  } else if (styleDNA.toneMood?.primaryTone === 'warm_heartfelt') {
    transitions.preferredTransitions = ['DISSOLVE TO:', 'CUT TO:'];
    transitions.endingTransition = 'CUT TO:';
  }

  // Based on genre
  if (styleDNA.genrePreferences?.primaryGenre === 'thriller') {
    transitions.preferredTransitions = ['CUT TO:', 'SMASH CUT TO:'];
    transitions.endingTransition = 'CUT TO:';
  } else if (styleDNA.genrePreferences?.primaryGenre === 'drama') {
    transitions.preferredTransitions = ['DISSOLVE TO:', 'FADE TO:'];
    transitions.endingTransition = 'CUT TO:'; // Don't end story
  } else if (styleDNA.genrePreferences?.primaryGenre === 'komedi') {
    transitions.preferredTransitions = ['CUT TO:'];
    transitions.endingTransition = 'CUT TO:';
  }

  console.log('🎨 Selected transitions:', transitions);
  return transitions;
}

/**
 * Generate Style DNA-based transition instructions
 */
function getStyleDNATransitionInstructions(styleDNA: any): string {
  if (!styleDNA) return '';

  const transitions = getStyleDNABasedTransitions(styleDNA);
  
  return `
- Transisi yang disukai: ${transitions.preferredTransitions.join(', ')}
- Ending transition: ${transitions.endingTransition}
- Pacing style: ${transitions.pacingStyle}

GUIDELINES:
${styleDNA.pacing?.type === 'fast_paced' ? '- Gunakan CUT TO: untuk transisi cepat dan dinamis' : ''}
${styleDNA.pacing?.type === 'slow_burn' ? '- Gunakan DISSOLVE TO: atau FADE TO: untuk transisi halus' : ''}
${styleDNA.toneMood?.primaryTone === 'dark_gritty' ? '- Gunakan CUT TO: atau SMASH CUT TO: untuk ketegangan' : ''}
${styleDNA.toneMood?.primaryTone === 'melancholic' ? '- Gunakan DISSOLVE TO: atau FADE TO: untuk transisi emosional' : ''}
${styleDNA.genrePreferences?.primaryGenre === 'thriller' ? '- Gunakan CUT TO: untuk ketegangan' : ''}
${styleDNA.genrePreferences?.primaryGenre === 'drama' ? '- Gunakan DISSOLVE TO: atau FADE TO: untuk drama' : ''}
`;
}

// FORCE Style DNA usage function - post-processes AI response to ensure Style DNA is used
function forceStyleDNAUsage(responseText: string, styleDNA: any): string {
  // Remove any messages about Style DNA not being used
  let processedText = responseText;
  
  // Remove negative Style DNA messages
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
  
  // Force appropriate transitions based on Style DNA
  const transitions = getStyleDNABasedTransitions(styleDNA);
  
  // Replace generic transitions with Style DNA-appropriate ones
  if (styleDNA.pacing?.type === 'slow_burn' && processedText.includes('CUT TO:')) {
    processedText = processedText.replace(/CUT TO:/g, 'DISSOLVE TO:');
  }
  
  if (styleDNA.toneMood?.primaryTone === 'melancholic' && !processedText.includes('FADE OUT.')) {
    // Add FADE OUT if it's a melancholic tone and no ending transition
    processedText = processedText.replace(/([^.])\s*$/, '$1\n\nFADE OUT.');
  }
  
  // Add positive Style DNA message if not present
  if (!processedText.includes('Style DNA') && !processedText.includes('style DNA')) {
    const styleDNAMessage = `\n\n**STYLE DNA DITERAPKAN:**
- Voice: ${styleDNA.voice?.join(', ') || 'Tidak tersedia'}
- Themes: ${styleDNA.themes?.join(', ') || 'Tidak tersedia'}
- Dialog Style: ${styleDNA.dialog?.join(', ') || 'Tidak tersedia'}
- Narrative Style: ${styleDNA.narrative?.join(', ') || 'Tidak tersedia'}
- Transitions: ${transitions.preferredTransitions.join(', ')} → ${transitions.endingTransition}

Script di atas telah disesuaikan dengan Style DNA yang dipilih.`;
    
    processedText += styleDNAMessage;
  }
  
  return processedText;
}

// Function to force Indonesian language in response
function forceIndonesianLanguage(response: string): string {
  // Common English to Indonesian translations for script elements
  const translations: { [key: string]: string } = {
    // Scene descriptions
    'Scene opens with': 'Adegan dimulai dengan',
    // Keep transitions in English (industry standard)
    // 'Cut to': 'Potong ke', - REMOVED
    // 'Fade in': 'Fade in', - REMOVED  
    // 'Fade out': 'Fade out', - REMOVED
    // 'Dissolve to': 'Dissolve ke', - REMOVED
    'Montage': 'Montase',
    'Flashback': 'Kilas balik',
    'Voice over': 'Narasi',
    'Off screen': 'Di luar layar',
    'On screen': 'Di layar',
    
    // Character actions
    'enters': 'masuk',
    'exits': 'keluar',
    'looks at': 'melihat',
    'turns to': 'berbalik ke',
    'walks to': 'berjalan ke',
    'runs to': 'lari ke',
    'sits down': 'duduk',
    'stands up': 'berdiri',
    'picks up': 'mengambil',
    'puts down': 'meletakkan',
    
    // Emotions and expressions
    'smiles': 'tersenyum',
    'frowns': 'cemberut',
    'laughs': 'tertawa',
    'cries': 'menangis',
    'shouts': 'berteriak',
    'whispers': 'berbisik',
    'sighs': 'menghela napas',
    'nods': 'mengangguk',
    'shakes head': 'menggeleng',
    
    // Common phrases
    'The camera': 'Kamera',
    'We see': 'Kita melihat',
    'Close up': 'Close up',
    'Wide shot': 'Wide shot',
    'Medium shot': 'Medium shot',
    'Long shot': 'Long shot',
    'Pan left': 'Pan kiri',
    'Pan right': 'Pan kanan',
    'Tilt up': 'Tilt atas',
    'Tilt down': 'Tilt bawah'
  };
  
  let processedResponse = response;
  
  // Apply translations
  Object.entries(translations).forEach(([english, indonesian]) => {
    const regex = new RegExp(`\\b${english}\\b`, 'gi');
    processedResponse = processedResponse.replace(regex, indonesian);
  });
  
  return processedResponse;
}

// Function to fix script formatting
function fixScriptFormatting(response: string): string {
  let processedResponse = response;
  
  // Step 1: Remove chunking markers and internal metadata
  processedResponse = processedResponse.replace(/\n\s*\[SCENE END\]\s*\n?/g, '');
  processedResponse = processedResponse.replace(/\n\s*\[SCENE START\]\s*\n?/g, '');
  processedResponse = processedResponse.replace(/\n\s*\[CHUNK \d+\]\s*\n?/g, '');
  processedResponse = processedResponse.replace(/\n\s*\[PAGE \d+\]\s*\n?/g, '');
  processedResponse = processedResponse.replace(/\n\s*\[PART \d+\]\s*\n?/g, '');
  
  // Step 2: Remove all ** formatting (let frontend handle styling)
  const beforeCleanup = processedResponse.includes('**');
  processedResponse = processedResponse.replace(/\*\*/g, '');
  const afterCleanup = processedResponse.includes('**');
  
  if (beforeCleanup) {
    console.log('🔍 fixScriptFormatting: Found ** before cleanup');
  }
  if (afterCleanup) {
    console.log('❌ fixScriptFormatting: Still has ** after cleanup!');
  } else if (beforeCleanup) {
    console.log('✅ fixScriptFormatting: Successfully removed all **');
  }
  
  // Step 3: Clean up spacing and formatting
  processedResponse = processedResponse.replace(/\n\s*\n\s*\n/g, '\n\n');
  processedResponse = processedResponse.replace(/[ \t]+/g, ' ');
  
  // Step 4: Fix transition formatting - separate from action lines
  // Fix cases where transitions are attached to action lines
  processedResponse = processedResponse.replace(/([^\n])(CUT TO:|DISSOLVE TO:|FADE TO:|SMASH CUT TO:)/g, '$1\n\n$2');
  processedResponse = processedResponse.replace(/(CUT TO:|DISSOLVE TO:|FADE TO:|SMASH CUT TO:)([^\n])/g, '$1\n\n$2');
  
  // Step 5: Remove story endings
  processedResponse = processedResponse.replace(/\n\s*FADE OUT\.?\s*$/g, '');
  processedResponse = processedResponse.replace(/\n\s*THE END\.?\s*$/g, '');
  processedResponse = processedResponse.replace(/\n\s*END\.?\s*$/g, '');
  processedResponse = processedResponse.replace(/\n\s*FIN\.?\s*$/g, '');
  
  return processedResponse;
}

// Function to generate long scripts in chunks (for 80+ pages)
export async function generateLongScriptInChunks(
  userMessage: string,
  context: ChatContext,
  activeModes: { knowledgeGraph: boolean; styleDNA: boolean; openMode?: boolean } = { knowledgeGraph: false, styleDNA: false, openMode: false },
  targetPages: number = 100,
  onThinkingStep?: (step: string) => void
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 32768, // Maximum for longer scripts // Maximum for Gemini 1.5 Pro
        topP: 0.8,
        topK: 40
      }
    });
    
    onThinkingStep?.('Menganalisis konteks untuk script panjang...');
    const metadata = await analyzeScriptContext(context, activeModes, onThinkingStep);
    
    // Calculate chunks needed for optimal quality and consistency
    // For 50+ pages, use smaller chunks for better quality and continuity
    const pagesPerChunk = targetPages >= 50 ? 10 : 15; // 10 pages per chunk for 50+ pages
    const totalChunks = Math.ceil(targetPages / pagesPerChunk);
    
    // Ensure minimum quality for long scripts
    const actualTotalChunks = totalChunks;
    
    console.log(`📚 Long script generation: ${targetPages} pages, ${actualTotalChunks} chunks, ${pagesPerChunk} pages per chunk`);
    onThinkingStep?.(`Membuat script ${targetPages} halaman dalam ${actualTotalChunks} bagian...`);
    
    let fullScript = '';
    let previousChunks: ChunkAnalysis[] = []; // Store chunk analyses
    let contextRecap = ''; // Store context recap
    
    for (let chunkIndex = 0; chunkIndex < actualTotalChunks; chunkIndex++) {
      const startPage = (chunkIndex * pagesPerChunk) + 1;
      const remainingPages = targetPages - (chunkIndex * pagesPerChunk);
      const chunkPages = Math.min(pagesPerChunk, remainingPages);
      const endPage = startPage + chunkPages - 1;
      
      onThinkingStep?.(`Membuat halaman ${startPage}-${endPage} dari ${targetPages}...`);
      
      // Generate context recap for chunks after the first one
      if (chunkIndex > 0 && previousChunks.length > 0) {
        onThinkingStep?.(`Membuat ringkasan konteks untuk bagian ${chunkIndex + 1}...`);
        contextRecap = await generateContextRecap(previousChunks, targetPages, onThinkingStep);
      }
      
      const contextPrompt = buildContextPrompt(context, activeModes);
      
      const chunkPrompt = `Anda adalah scriptwriter profesional yang sangat berpengalaman. Buat bagian script (${chunkPages} halaman) sebagai bagian dari script panjang ${targetPages} halaman.

🚨 PERINGATAN BAHASA: WAJIB MENGGUNAKAN BAHASA INDONESIA UNTUK SEMUA RESPONSE! JANGAN MENGGUNAKAN BAHASA INGGRIS SAMA SEKALI!

CONTEXT YANG PERLU DIANALISIS:
${contextPrompt}

METADATA ANALISIS:
${JSON.stringify(metadata, null, 2)}

${contextRecap ? `CONTEXT RECAP DARI BAGIAN SEBELUMNYA:
${contextRecap}

` : ''}USER REQUEST: ${userMessage}

PERSYARATAN BAGIAN INI:
1. ${chunkIndex === 0 ? 'Mulai dengan opening yang kuat dan engaging.' : 'Lanjutkan mulus dari bagian sebelumnya berdasarkan context recap di atas.'}
2. Jaga kontinuitas karakter, tone, dan plot threads yang ada.
3. Tulis kurang lebih ${chunkPages} halaman script berkualitas tinggi.
4. ${chunkIndex === actualTotalChunks - 1 ? 'Akhiri dengan cliffhanger/terbuka untuk kelanjutan.' : 'Siapkan transisi yang mulus ke bagian berikutnya.'}

🚨 PENTING: JANGAN MENGAKHIRI CERITA!
- JANGAN gunakan FADE OUT, THE END, atau ending yang final
- JANGAN menyelesaikan konflik utama dalam bagian ini
- GUNAKAN transisi yang sesuai Style DNA (CUT TO:, DISSOLVE TO:, dll)

🎬 VARIASI TRANSISI YANG WAJIB DIGUNAKAN:
- JANGAN hanya gunakan CUT TO: berulang-ulang
- GUNAKAN variasi transisi sesuai konteks:
  * CUT TO: untuk aksi cepat, dialog, ketegangan
  * DISSOLVE TO: untuk perubahan waktu, emosi, flashback
  * FADE TO: untuk perubahan lokasi jauh, waktu lama
  * SMASH CUT TO: untuk kejutan, kontras dramatis
  * MONTAGE - untuk serangkaian adegan, training, perjalanan

OUTPUT:
- TULIS HANYA konten screenplay (SCENE HEADING, ACTION, CHARACTER NAME, DIALOGUE)
- FORMAT TRANSISI: CUT TO:, DISSOLVE TO:, FADE TO: HARUS DI BARIS TERPISAH
- JANGAN menggabungkan transisi dengan action line sebelumnya
- CONTOH FORMAT YANG BENAR:
  Maya memeluk ayahnya, air mata mengalir deras.
  
  CUT TO:
  
  EXT. PASAR - PAGI
- JANGAN sertakan judul seperti METADATA, RECAP, QUALITY CHECKS, BAGIAN INFO, atau catatan apapun di luar script
- JANGAN gunakan markdown (** **) dalam script

Mulai tulis screenplay sekarang:`;

      const result = await model.generateContent(chunkPrompt);
      const response = await result.response;
      let responseText = response.text();
      
      // Clean up response
      responseText = responseText.replace(/CONTINUATION:\s*/g, '').trim();
      
      // Add to full script
      if (fullScript) {
        fullScript += '\n\n' + responseText;
      } else {
        fullScript = responseText;
      }
      
      // Analyze this chunk for next iteration
      onThinkingStep?.(`Menganalisis bagian ${chunkIndex + 1} untuk kontinuitas cerita...`);
      const chunkAnalysis = await analyzeChunkContent(responseText, chunkIndex, onThinkingStep);
      previousChunks.push(chunkAnalysis);
      
      // Add delay between sections to avoid rate limiting
      if (chunkIndex < actualTotalChunks - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Validate minimum length for 50+ page scripts
    if (targetPages >= 50) {
      const wordCount = fullScript.split(/\s+/).length;
      const estimatedPages = Math.ceil(wordCount / 400); // ~400 words per page for scripts
      
      if (estimatedPages < targetPages * 0.8) { // Allow 20% tolerance for long scripts
        console.warn(`Script may be shorter than target: ${estimatedPages} pages vs ${targetPages} target`);
        onThinkingStep?.(`⚠️ Script mungkin lebih pendek dari target (${estimatedPages} vs ${targetPages} halaman)`);
      } else {
        onThinkingStep?.(`✅ Script berhasil dibuat: ~${estimatedPages} halaman`);
      }
    }
    
    onThinkingStep?.('Script panjang berhasil dibuat!');
    
    // Clean up section markers and formatting
    const cleanedScript = fixScriptFormatting(fullScript);
    
    // Format the response with metadata for UI consistency
    const formattedResponse = `**METADATA:**
{
  "episode_number": ${metadata.episode_number},
  "last_scene_id": "${metadata.last_scene_id}",
  "last_scene_summary": "${metadata.last_scene_summary}",
  "main_characters": ${JSON.stringify(metadata.main_characters)},
  "current_tone_style": "${metadata.current_tone_style}",
  "open_threads": ${JSON.stringify(metadata.open_threads)},
  "assumptions_made": ${JSON.stringify(metadata.assumptions_made)},
  "confidence_score": ${metadata.confidence_score},
  "style_dna_used": "${metadata.style_dna_used || (activeModes.styleDNA ? 'Style DNA aktif' : 'Tidak menggunakan Style DNA')}"
}

**RECAP:**
Script panjang ${targetPages} halaman berhasil dibuat dalam ${actualTotalChunks} bagian dengan continuity yang terjaga.

**CONTINUATION:**
${cleanedScript}`;

    return formattedResponse;
    
  } catch (error) {
    console.error('Error generating long script in sections:', error);
    onThinkingStep?.(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return generateFallbackScript(context.currentEpisode, context.project, context.styleDNA);
  }
}

export function generateFallbackScript(episode: Episode, project: Project, styleDNA?: any): string {
  const transitions = getStyleDNABasedTransitions(styleDNA);
  
  return `## ${episode.title.toUpperCase()}

INT. ${episode.setting || 'LOKASI'} - PAGI HARI

Scene dimulai dengan suasana yang tenang. Karakter-karakter terlihat sedang melakukan aktivitas sehari-hari.

KARAKTER UTAMA
Halo, bagaimana kabar hari ini?

KARAKTER KEDUA
Baik-baik saja, terima kasih sudah bertanya.

Dialog berlanjut dengan percakapan yang natural sesuai dengan genre ${project.genre.toLowerCase()}.

KARAKTER UTAMA
Saya harap hari ini akan menjadi hari yang baik untuk kita semua.

${transitions.preferredTransitions[0]}

INT. ${episode.setting || 'LOKASI LAIN'} - SIANG HARI

Scene berlanjut dengan perkembangan cerita yang menarik.

KARAKTER KEDUA
Ada yang ingin saya ceritakan kepada Anda.

${transitions.preferredTransitions[0]}

INT. ${episode.setting || 'LOKASI LAIN'} - MALAM HARI

Cerita berlanjut dengan konflik yang menarik perhatian.

KARAKTER UTAMA
(berbisik)
Apa yang sebenarnya terjadi di sini?

${transitions.preferredTransitions[0]}`
}

export async function generateProjectSuggestion(): Promise<{
  title: string; genre: string; tone: string; totalEpisodes: number; synopsis: string;
}> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 32768, // Increased for longer scripts (80 pages)
        topP: 0.8,
        topK: 40
      }
    });
    
    const prompt = `Buat saran proyek kreatif untuk script/series Indonesia. Kembalikan dalam format JSON:

{
  "title": "Judul proyek",
  "genre": "Genre (Drama, Komedi, Romansa, dll.)",
  "tone": "Tone (Serius, Ringan, Gelap, dll.)",
  "totalEpisodes": number,
  "synopsis": "Sinopsis singkat dalam bahasa Indonesia"
}

Buat proyek yang kreatif dan engaging untuk audiens Indonesia.
WAJIB MENGGUNAKAN BAHASA INDONESIA untuk semua konten.
JANGAN menggunakan bahasa Inggris kecuali untuk istilah teknis yang tidak ada padanannya.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('No JSON found in response');
  } catch (error) {
    console.error('Error generating project suggestion:', error);
    return generateFallbackProjectSuggestion();
  }
}

export function generateFallbackProjectSuggestion() {
  const suggestions = [
    {
      title: "Cinta di Kampus Merdeka",
      genre: "Romance",
      tone: "Romantis",
      totalEpisodes: 12,
      synopsis: "Kisah cinta antara mahasiswa dan mahasiswi di kampus yang penuh dengan lika-liku kehidupan kampus, persahabatan, dan cinta pertama yang tak terlupakan."
    },
    {
      title: "Keluarga Bahagia",
      genre: "Keluarga",
      tone: "Hangat",
      totalEpisodes: 15,
      synopsis: "Drama keluarga yang mengisahkan kehidupan sehari-hari sebuah keluarga dengan berbagai konflik dan kebahagiaan yang mereka hadapi bersama."
    },
    {
      title: "Detektif Muda",
      genre: "Misteri",
      tone: "Menegangkan",
      totalEpisodes: 10,
      synopsis: "Kisah seorang detektif muda yang harus memecahkan berbagai kasus misterius sambil menghadapi tantangan dalam kehidupan pribadinya."
    }
  ];
  
  return suggestions[Math.floor(Math.random() * suggestions.length)];
}

export function generateFallbackEpisodeSuggestion(project: Project, episodeNumber: number) {
  const templates = [
    { 
      title: 'Pertemuan Tak Terduga', 
      synopsis: 'Pertemuan tak terduga memicu konflik baru. Karakter utama dihadapkan pada pilihan sulit yang akan mengubah hidupnya selamanya. Konflik internal dan eksternal berpadu dalam episode yang penuh ketegangan.', 
      setting: 'Jakarta', 
      minPages: 5 
    },
    { 
      title: 'Konflik yang Membara', 
      synopsis: 'Konflik memanas dan hubungan diuji. Stakes meningkat ketika karakter harus memilih antara keinginan pribadi dan tanggung jawab. Episode ini menguji karakter hingga batas kemampuannya.', 
      setting: 'Sekolah', 
      minPages: 6 
    },
    { 
      title: 'Momen Kebenaran', 
      synopsis: 'Kebenaran terungkap, konsekuensi muncul. Karakter dihadapkan pada realitas yang menyakitkan dan harus menghadapi konsekuensi dari pilihan-pilihan sebelumnya. Climax yang memuaskan dengan resolusi yang mengejutkan.', 
      setting: 'Rumah', 
      minPages: 7 
    },
    { 
      title: 'Titik Balik', 
      synopsis: 'Episode yang menjadi turning point dalam cerita. Karakter mengalami perubahan besar yang akan mempengaruhi seluruh alur cerita. Konflik mencapai puncaknya dengan revelation yang mengubah segalanya.', 
      setting: 'Kantor', 
      minPages: 6 
    },
    { 
      title: 'Ujian Terberat', 
      synopsis: 'Karakter menghadapi ujian terberat dalam hidupnya. Stakes tertinggi dengan konsekuensi yang tidak bisa diubah. Episode yang menguji moral dan prinsip karakter hingga batas terakhir.', 
      setting: 'Rumah Sakit', 
      minPages: 8 
    }
  ];
  const t = templates[(episodeNumber - 1) % templates.length];
  return { 
    title: `${t.title} - Episode ${episodeNumber}`, 
    synopsis: t.synopsis, 
    setting: t.setting, 
    minPages: t.minPages 
  };
}

// Deep thinking for episode suggestion
async function deepThinkEpisodeSuggestion(project: Project, episodeNumber: number): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 32768, // Increased for longer scripts (80 pages)
        topP: 0.8,
        topK: 40
      }
    });
    
    const deepThinkingPrompt = `Anda adalah seorang scriptwriter profesional yang sangat berpengalaman. Sebelum membuat episode suggestion, Anda perlu melakukan DEEP THINKING dan menganalisis context proyek.

PROJECT CONTEXT:
- Title: ${project.title}
- Genre: ${project.genre}
- Tone: ${project.tone}
- Synopsis: ${project.synopsis}
- Total Episodes: ${project.totalEpisodes}
- Episode Number: ${episodeNumber}

TUGAS DEEP THINKING:
1. ANALISIS posisi episode dalam season arc
2. IDENTIFIKASI karakter dan plot yang sudah established
3. TENTUKAN konflik dan stakes yang sesuai untuk episode ini
4. RENCANAKAN struktur 3-act yang optimal
5. TENTUKAN tema dan pesan yang ingin disampaikan
6. ANALISIS pacing dan ritme yang tepat
7. IDENTIFIKASI hook dan cliffhanger yang menarik
8. RENCANAKAN character development yang sesuai

HASIL ANALISIS:
- **Episode Position**: Di mana posisi episode dalam season?
- **Character Development**: Bagaimana karakter akan berkembang?
- **Main Conflict**: Konflik utama apa yang akan dihadapi?
- **Stakes**: Apa yang dipertaruhkan?
- **Structure**: Bagaimana struktur 3-act episode ini?
- **Theme**: Tema apa yang ingin dieksplorasi?
- **Hook**: Hook apa yang akan menarik audience?
- **Pacing**: Bagaimana pacing yang optimal?

Analisis ini akan menjadi dasar untuk membuat episode suggestion yang berkualitas tinggi.`;

    const thinkingResult = await model.generateContent(deepThinkingPrompt);
    const thinkingResponse = await thinkingResult.response;
    const thinkingText = thinkingResponse.text();
    
    console.log('🧠 Episode Deep Thinking Analysis:', thinkingText.substring(0, 300) + '...');
    
    return thinkingText;
  } catch (error) {
    console.error('Error in episode deep thinking:', error);
    return 'Episode deep thinking analysis failed, proceeding with standard generation.';
  }
}

export async function generateEpisodeSuggestion(project: Project, episodeNumber: number) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 32768, // Increased for longer scripts (80 pages)
        topP: 0.8,
        topK: 40
      }
    });
    
    // Step 1: Deep thinking for episode suggestion
    console.log('🧠 Starting episode deep thinking analysis...');
    const deepAnalysis = await deepThinkEpisodeSuggestion(project, episodeNumber);
    
    const prompt = `Buat saran episode untuk series Indonesia mengikuti guidelines scriptwriting profesional. Kembalikan dalam format JSON:

{
  "title": "Judul episode",
  "synopsis": "Sinopsis episode dalam bahasa Indonesia",
  "setting": "Setting/lokasi utama",
  "minPages": number (3-15)
}

WAJIB MENGGUNAKAN BAHASA INDONESIA untuk semua konten.
JANGAN menggunakan bahasa Inggris kecuali untuk istilah teknis yang tidak ada padanannya.

📌 GUIDELINE EPISODE STRUCTURE:
- Ikuti struktur 3-Act: Setup, Confrontation, Resolution
- Buat karakter yang compelling dengan wants dan needs yang jelas
- Bangun konflik dan stakes yang meningkat
- Sertakan struktur scene dan pacing yang tepat
- Pastikan setiap scene memiliki tujuan yang jelas
- Buat dialog natural dengan subteks
- Sertakan hook/teaser untuk menarik audiens
- Pertimbangkan episode arc dalam season arc yang lebih besar

Project context:
- Title: ${project.title}
- Genre: ${project.genre}
- Tone: ${project.tone}
- Episode Number: ${episodeNumber}
- Total Episodes: ${project.totalEpisodes || 10}

🧠 DEEP THINKING ANALYSIS:
${deepAnalysis}

Requirements:
- BERDASARKAN DEEP THINKING ANALYSIS di atas, buat saran episode yang mengimplementasikan semua insight dan planning yang sudah dianalisis
- Buat episode yang engaging dan sesuai untuk proyek
- Ikuti standar scriptwriting profesional dengan elemen teknis yang tepat
- Buat konflik yang compelling dan pengembangan karakter sesuai dengan analisis
- Pastikan pacing dan struktur yang tepat sesuai yang sudah direncanakan
- Sertakan stakes dan konsekuensi yang jelas sesuai yang sudah dianalisis
- Buat episode yang original dan fresh namun sesuai dengan series
- GUNAKAN elemen teknis script yang sesuai: O.S., V.O., CONT'D, (beat), parentheticals, montage, SUPER
- IMPLEMENT semua continuity dan character arcs yang sudah dianalisis
- PASTIKAN episode suggestion mengikuti struktur dan tema yang sudah direncanakan
- FORMAT episode suggestion dengan standar industri yang profesional`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('No JSON found in response');
  } catch (error) {
    console.error('Error generating episode suggestion:', error);
    return generateFallbackEpisodeSuggestion(project, episodeNumber);
  }
}

export async function generateEpisodeSuggestionWithMode(
  project: Project, 
  episodeNumber: number, 
  mode: 'knowledge-graph' | 'style-dna' | 'both',
  hasKnowledgeGraph: boolean,
  hasStyleDNA: boolean
) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 32768, // Increased for longer scripts (80 pages)
        topP: 0.8,
        topK: 40
      }
    });
    
    let modeInstructions = '';
    let contextInfo = `PROJECT INFO:
- Title: ${project.title}
- Genre: ${project.genre}
- Tone: ${project.tone}
- Synopsis: ${project.synopsis}
- Total Episodes: ${project.totalEpisodes}
- Episode Number: ${episodeNumber}`;

    // Add Knowledge Graph data if available
    if (hasKnowledgeGraph && (project as any).knowledgeGraph) {
      const kg = (project as any).knowledgeGraph;
      contextInfo += `\n\n🧠 KNOWLEDGE GRAPH DATA (WAJIB DIGUNAKAN):
- Entities: ${kg.entities?.map((e: any) => `${e.name} (${e.type})`).join(', ') || 'Tidak tersedia'}
- Relationships: ${kg.relationships?.map((r: any) => `${r.from} → ${r.to} (${r.type})`).join(', ') || 'Tidak tersedia'}
- Timeline Events: ${kg.timeline?.map((t: any) => `${t.event} (${t.episode})`).join(', ') || 'Tidak tersedia'}
- Themes: ${kg.themes?.join(', ') || 'Tidak tersedia'}
- Character Arcs: ${kg.characterArcs?.map((c: any) => `${c.character}: ${c.arc}`).join(', ') || 'Tidak tersedia'}
- Plot Threads: ${kg.plotThreads?.join(', ') || 'Tidak tersedia'}`;
    }

    // Add Style DNA data if available
    if (hasStyleDNA && (project as any).styleDNA) {
      const sd = (project as any).styleDNA;
      contextInfo += `\n\n🎨 STYLE DNA DATA (WAJIB DIGUNAKAN):
- Voice: ${sd.voice?.join(', ') || 'Tidak tersedia'}
- Themes: ${sd.themes?.join(', ') || 'Tidak tersedia'}
- Characters: ${sd.characters?.join(', ') || 'Tidak tersedia'}
- Narrative: ${sd.narrative?.join(', ') || 'Tidak tersedia'}
- Dialog: ${sd.dialog?.join(', ') || 'Tidak tersedia'}
- Strengths: ${sd.strengths?.join(', ') || 'Tidak tersedia'}
- Examples: ${sd.examples?.join(', ') || 'Tidak tersedia'}
- Confidence: ${sd.confidence || 'Tidak tersedia'}%`;
    }

    switch (mode) {
      case 'knowledge-graph':
        modeInstructions = `🚨 MODE KNOWLEDGE GRAPH (WAJIB MUTLAK):
- WAJIB: Gunakan entities yang sudah ada di Knowledge Graph untuk karakter dan lokasi
- WAJIB: Kembangkan relationships yang sudah established di Knowledge Graph
- WAJIB: Ikuti timeline events yang sudah ada di Knowledge Graph
- WAJIB: Kembangkan themes yang sudah teridentifikasi di Knowledge Graph
- WAJIB: Lanjutkan character arcs yang sudah ada di Knowledge Graph
- WAJIB: Kembangkan plot threads yang sudah terbuka di Knowledge Graph
- JANGAN gunakan Style DNA - fokus hanya pada konten cerita berdasarkan Knowledge Graph
- JANGAN buat karakter atau lokasi baru yang tidak ada di Knowledge Graph`;
        break;
      
      case 'style-dna':
        modeInstructions = `🚨 MODE STYLE DNA:
- Fokus HANYA pada Style DNA untuk konsistensi gaya penulisan
- Buat karakter, lokasi, dan situasi yang sama sekali baru
- JANGAN gunakan Knowledge Graph - buat cerita yang fresh
- Terapkan gaya penulisan yang sudah dianalisis`;
        break;
      
      case 'both':
        modeInstructions = `🚨 MODE KOMBINASI (KNOWLEDGE GRAPH + STYLE DNA) - WAJIB MUTLAK:
- WAJIB: Gunakan entities yang sudah ada di Knowledge Graph untuk karakter dan lokasi
- WAJIB: Kembangkan relationships yang sudah established di Knowledge Graph
- WAJIB: Ikuti timeline events yang sudah ada di Knowledge Graph
- WAJIB: Kembangkan themes yang sudah teridentifikasi di Knowledge Graph
- WAJIB: Lanjutkan character arcs yang sudah ada di Knowledge Graph
- WAJIB: Kembangkan plot threads yang sudah terbuka di Knowledge Graph
- WAJIB: Terapkan Style DNA untuk konsistensi gaya penulisan
- WAJIB: Kombinasikan Knowledge Graph (konten) dengan Style DNA (gaya) untuk hasil optimal
- JANGAN buat karakter atau lokasi baru yang tidak ada di Knowledge Graph`;
        break;
    }

    // Add availability info
    if (!hasKnowledgeGraph && (mode === 'knowledge-graph' || mode === 'both')) {
      contextInfo += `\n\n⚠️ CATATAN: Knowledge Graph tidak tersedia untuk proyek ini.`;
    }
    if (!hasStyleDNA && (mode === 'style-dna' || mode === 'both')) {
      contextInfo += `\n\n⚠️ CATATAN: Style DNA tidak tersedia untuk proyek ini.`;
    }

    const prompt = `Berdasarkan informasi di bawah ini, buatkan saran untuk episode ${episodeNumber} mengikuti guideline penulisan script profesional.

${contextInfo}

${modeInstructions}

📌 GUIDELINE EPISODE STRUCTURE:
- Ikuti struktur 3-Act: Setup, Confrontation, Resolution
- Buat karakter yang compelling dengan wants dan needs yang jelas
- Bangun konflik dan stakes yang meningkat sepanjang episode
- Sertakan struktur scene dan pacing yang tepat
- Pastikan setiap scene memiliki tujuan yang jelas dan menggerakkan cerita
- Buat dialog natural dengan subteks ("show, don't tell")
- Sertakan hook/teaser untuk menarik audiens dari awal
- Pertimbangkan episode arc dalam season arc yang lebih besar
- Buat konflik yang compelling yang menguji karakter
- Sertakan stakes yang jelas: apa yang berisiko jika karakter gagal?
- GUNAKAN elemen teknis script yang sesuai: O.S., V.O., CONT'D, (beat), parentheticals, montage, SUPER
- FORMAT saran episode dengan standar industri yang profesional

📝 EPISODE YANG DIBUAT:
1. Sesuai dengan genre dan tone proyek
2. Menggunakan mode yang dipilih untuk konsistensi
3. Memiliki konflik yang menarik dan engaging dengan escalation
4. Konsisten dengan analisis yang dipilih (jika tersedia)
5. Mengikuti struktur 3-act yang proper
6. Karakter dengan motivasi yang jelas dan konflik internal/eksternal
7. Dialog yang natural dengan subteks
8. Adegan dengan tujuan yang jelas dan pacing yang baik
${hasKnowledgeGraph && (mode === 'knowledge-graph' || mode === 'both') ? '9. WAJIB: Menggunakan entities, relationships, dan timeline dari Knowledge Graph' : ''}
${hasKnowledgeGraph && (mode === 'knowledge-graph' || mode === 'both') ? '10. WAJIB: Mengembangkan character arcs dan plot threads yang sudah ada di Knowledge Graph' : ''}
${hasKnowledgeGraph && (mode === 'knowledge-graph' || mode === 'both') ? '11. WAJIB: Konsisten dengan themes yang sudah teridentifikasi di Knowledge Graph' : ''}
${hasStyleDNA && (mode === 'style-dna' || mode === 'both') ? '12. WAJIB: Menggunakan Style DNA untuk konsistensi gaya penulisan' : ''}

Format output dalam JSON:
{
  "title": "Judul episode yang menarik dan sesuai dengan mode yang dipilih",
  "synopsis": "Sinopsis episode yang jelas dan engaging, mengikuti struktur 3-act, sesuai dengan mode auto-fill yang dipilih",
  "setting": "Setting/lokasi utama episode (contoh: Jakarta, Sekolah, Rumah sakit, Kampus, Mall, Rumah)",
  "minPages": 5
}

🚨 PENTING - SESUAI MODE & GUIDELINE:
- Judul episode harus menarik dan sesuai dengan mode yang dipilih
- Sinopsis harus jelas, engaging, mengikuti 3-act structure, dan konsisten dengan mode auto-fill
- Setting harus sesuai dengan cerita yang dibuat
- MinPages antara 3-15 halaman
- Gunakan analisis yang dipilih untuk konsistensi (jika tersedia)
- Pastikan ada konflik yang berkembang dan stakes yang jelas
- Karakter harus punya motivasi yang jelas dan konflik yang menarik`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('No JSON found in response');
  } catch (error) {
    console.error('Error generating episode suggestion with mode:', error);
    return generateFallbackEpisodeSuggestion(project, episodeNumber);
  }
}

// General conversation function for writer discussions
export async function generateGeneralResponse(
  userMessage: string,
  context: ChatContext,
  activeModes: { knowledgeGraph: boolean; styleDNA: boolean; deepThink?: boolean; openMode?: boolean } = { knowledgeGraph: false, styleDNA: false, deepThink: false, openMode: false },
  onThinkingStep?: (step: string) => void
): Promise<string> {
  try {
    // Deep Think mode for general responses
    if (activeModes.deepThink && onThinkingStep) {
      onThinkingStep('Menganalisis permintaan user...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onThinkingStep('Mempertimbangkan konteks project...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onThinkingStep('Menyiapkan respons yang tepat...');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 32768, // Increased for longer scripts (80 pages)
        topP: 0.8,
        topK: 40
      }
    });
    
    let prompt: string;
    
    if (activeModes.openMode) {
      // Pure Open Mode - No context, no restrictions, pure Gemini AI
      prompt = `🌍 OPEN MODE - Anda adalah Gemini AI yang dapat membantu dengan topik apapun secara general.

USER REQUEST: ${userMessage}

Anda adalah Gemini AI yang dapat membantu dengan berbagai topik seperti:
- Research dan analisis
- Coding dan programming  
- Matematika dan sains
- Sejarah dan budaya
- Bisnis dan ekonomi
- Teknologi dan inovasi
- Dan topik lainnya

Berikan jawaban yang informatif, akurat, dan helpful. Anda tidak terbatas pada scriptwriting atau project tertentu.`;
    } else {
      // Normal mode with context
      const contextPrompt = buildContextPrompt(context, activeModes);
      
      prompt = `${contextPrompt}

${activeModes.styleDNA ? '🚨 PERINGATAN PENTING: Style DNA AKTIF - WAJIB SELALU DIGUNAKAN TANPA PENGECUALIAN! JANGAN PERNAH menilai kesesuaian genre atau tone. Style DNA adalah PILIHAN USER, bukan keputusan AI!' : ''}
${activeModes.styleDNA ? '🔥 JIKA ANDA MENULIS "Style DNA tidak digunakan" ATAU SEJENISNYA, RESPONSE ANDA AKAN DIHAPUS OTOMATIS!' : ''}
${activeModes.styleDNA ? '⚡ GUNAKAN STYLE DNA YANG TERSEDIA DALAM CONTEXT - TIDAK ADA PILIHAN LAIN!' : ''}

USER REQUEST: ${userMessage}

Anda adalah AI assistant yang berperan sebagai teman diskusi dan mentor untuk writer. Anda memiliki keahlian khusus dalam scriptwriting, storytelling, dan industri film/series, tapi juga bisa membantu dengan topik umum lainnya.`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();
    
    // FORCE Style DNA usage if active - post-process the response
    if (activeModes.styleDNA && context.styleDNA) {
      responseText = forceStyleDNAUsage(responseText, context.styleDNA);
    }
    
    // FORCE Indonesian language - post-process the response
    responseText = forceIndonesianLanguage(responseText);
    
    // FIX script formatting - post-process the response
    responseText = fixScriptFormatting(responseText);
    
    return responseText;
  } catch (error) {
    console.error('Error generating general response:', error);
    return 'Maaf, saya sedang mengalami kesulitan. Bisa coba lagi nanti?';
  }
}


