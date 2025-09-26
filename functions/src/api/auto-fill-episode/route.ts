import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Function to combine multiple Style DNA analyses
function combineStyleDNA(styleDNAs: any[]): any {
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

export async function POST(request: NextRequest) {
  try {
    const { projectId, episodeNumber, userId, autoFillMode = 'both' } = await request.json();

    if (!projectId || !episodeNumber || !userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    console.log(`🤖 Auto-filling episode ${episodeNumber} for project ${projectId}`);

    // Get project data
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (!projectDoc.exists()) {
      return NextResponse.json({ 
        success: false,
        error: 'Project not found' 
      }, { status: 404 });
    }

    const project = projectDoc.data();

    // Get latest Style DNA for this project (only if needed)
    let styleDNA = null;
    if (autoFillMode === 'style-dna' || autoFillMode === 'both') {
      try {
        const styleDNAQuery = query(
          collection(db, 'styleDNA'),
          where('projectId', '==', projectId)
        );
        const styleDNASnapshot = await getDocs(styleDNAQuery);
        if (!styleDNASnapshot.empty) {
        const styleDNAs = styleDNASnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate()
        })) as any[];
        styleDNAs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        // Combine all Style DNA instead of using only the latest
        styleDNA = styleDNAs.length > 0 ? combineStyleDNA(styleDNAs) : null;
        }
      } catch (error) {
        console.warn('Error fetching Style DNA:', error);
      }
    }

    // Get latest Knowledge Graph for this project (only if needed)
    let knowledgeGraph = null;
    if (autoFillMode === 'knowledge-graph' || autoFillMode === 'both') {
      try {
        const knowledgeGraphQuery = query(
          collection(db, 'knowledgeGraphs'),
          where('projectId', '==', projectId)
        );
        const knowledgeGraphSnapshot = await getDocs(knowledgeGraphQuery);
        if (!knowledgeGraphSnapshot.empty) {
          const knowledgeGraphs = knowledgeGraphSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
            updatedAt: doc.data().updatedAt.toDate()
          })) as any[];
          knowledgeGraphs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          knowledgeGraph = knowledgeGraphs[0];
        }
      } catch (error) {
        console.warn('Error fetching Knowledge Graph:', error);
      }
    }

    // Get previous episodes for context
    const episodesQuery = query(
      collection(db, 'episodes'),
      where('projectId', '==', projectId)
    );
    const episodesSnapshot = await getDocs(episodesQuery);
    const allEpisodes = episodesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    })) as any[];
    
    allEpisodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
    const previousEpisodes = allEpisodes.filter(ep => ep.episodeNumber < episodeNumber);

    // Generate episode suggestion using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    
    // Extract key elements from synopsis using AI
    const synopsisAnalysisPrompt = `Analisis sinopsis berikut dan ekstrak elemen-elemen kunci:

SYNOPSIS: "${project.synopsis}"

Ekstrak dan berikan dalam format JSON:
{
  "characters": ["nama karakter utama", "nama karakter pendukung"],
  "settings": ["lokasi utama", "lokasi pendukung"],
  "plot_elements": ["elemen plot utama", "konflik utama"],
  "themes": ["tema cerita", "pesan moral"],
  "tone_elements": ["aspek tone yang spesifik"],
  "key_objects": ["objek penting", "artifak", "alat"],
  "relationships": ["hubungan antar karakter"]
}

Hanya berikan JSON, tanpa penjelasan tambahan.`;

    let synopsisElements = null;
    try {
      const analysisResult = await model.generateContent(synopsisAnalysisPrompt);
      const analysisResponse = await analysisResult.response;
      const analysisText = analysisResponse.text();
      
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        synopsisElements = JSON.parse(jsonMatch[0]);
        console.log('📋 Extracted synopsis elements:', synopsisElements);
      }
    } catch (error) {
      console.warn('Error analyzing synopsis elements:', error);
    }

    let contextInfo = `PROJECT INFO:
- Title: ${project.title}
- Genre: ${project.genre}
- Tone: ${project.tone}
- Total Episodes: ${project.totalEpisodes}

🎯 PROJECT SYNOPSIS (WAJIB DIPERHATIKAN):
${project.synopsis}`;

    // Add extracted synopsis elements if available
    if (synopsisElements) {
      contextInfo += `\n\n📋 ELEMEN KUNCI DARI SYNOPSIS (WAJIB DIGUNAKAN):
- Karakter: ${synopsisElements.characters?.join(', ') || 'Tidak ada karakter spesifik'}
- Setting/Lokasi: ${synopsisElements.settings?.join(', ') || 'Tidak ada setting spesifik'}
- Plot Elements: ${synopsisElements.plot_elements?.join(', ') || 'Tidak ada plot spesifik'}
- Tema: ${synopsisElements.themes?.join(', ') || 'Tidak ada tema spesifik'}
- Tone Elements: ${synopsisElements.tone_elements?.join(', ') || 'Tidak ada tone spesifik'}
- Objek Penting: ${synopsisElements.key_objects?.join(', ') || 'Tidak ada objek spesifik'}
- Hubungan Karakter: ${synopsisElements.relationships?.join(', ') || 'Tidak ada hubungan spesifik'}`;
    }

    contextInfo += `\n\nEPISODE ${episodeNumber} REQUEST:
- This is episode ${episodeNumber} of ${project.totalEpisodes} total episodes
- Previous episodes: ${previousEpisodes.length} episodes completed
- WAJIB: Episode ini harus SELARAS dengan sinopsis proyek dan menggunakan elemen-elemen kunci di atas

🎯 URUTAN PRIORITAS EPISODE:
1. GUNAKAN DULU: Semua elemen dari sinopsis (karakter, setting, plot, tema, objek, hubungan)
2. BARU KEMUDIAN: Tambahkan elemen fresh yang mendukung dan mengembangkan elemen sinopsis
3. JANGAN LUPA: Elemen sinopsis adalah FONDASI, elemen fresh adalah PENGEMBANGAN`;

    // Add Style DNA context if available and requested
    if (styleDNA && (autoFillMode === 'style-dna' || autoFillMode === 'both')) {
      contextInfo += `\n\nSTYLE DNA (Combined from ${styleDNA.analysis?.sampleSize || 1} analyses):
- Tema Utama: ${(styleDNA.thematicVoice?.mainThemes || []).join(', ')}
- Pandangan Filosofis: ${(styleDNA.thematicVoice?.philosophicalStance || []).join(', ')}
- Gaya Dialog: ${styleDNA.dialogueStyle?.realism || 'realistic'} (${styleDNA.dialogueStyle?.pace || 'moderate'} pace, ${styleDNA.dialogueStyle?.humor || 'moderate'} humor)
- Karakteristik Dialog: ${(styleDNA.dialogueStyle?.characteristics || []).join(', ')}
- Jenis Protagonis: ${(styleDNA.characterization?.protagonistTypes || []).join(', ')}
- Pola Hubungan: ${(styleDNA.characterization?.relationships || []).join(', ')}
- Tone Utama: ${styleDNA.toneMood?.primaryTone || 'dramatic'}
- Atmosfer: ${(styleDNA.toneMood?.atmosphere || []).join(', ')}
- Struktur Naratif: ${styleDNA.narrativeStructure?.timeline || 'linear'} timeline, ${styleDNA.narrativeStructure?.plotComplexity || 'moderate'} complexity
- Teknik Naratif: ${(styleDNA.narrativeStructure?.narrativeTechniques || []).join(', ')}
- Imaji Berulang: ${(styleDNA.visualSymbolism?.recurringImages || []).join(', ')}
- Simbol: ${(styleDNA.visualSymbolism?.symbols || []).join(', ')}
- Pacing: ${styleDNA.pacing?.overallPace || 'moderate'} overall, ${styleDNA.pacing?.conflictEscalation || 'gradual'} escalation
- Genre Utama: ${(styleDNA.genrePreferences?.primaryGenres || []).join(', ')}
- Pesan Inti: ${(styleDNA.messagePhilosophy?.coreMessages || []).join(', ')}
- Filosofi Hidup: ${(styleDNA.messagePhilosophy?.lifePhilosophy || []).join(', ')}
- Combined Confidence: ${styleDNA.analysis?.confidence || 0}%`;
    }

    // Add Knowledge Graph context if available and requested
    if (knowledgeGraph && (autoFillMode === 'knowledge-graph' || autoFillMode === 'both')) {
      contextInfo += `\n\nKNOWLEDGE GRAPH (from previous scripts):
- Entities: ${knowledgeGraph.entities?.slice(0, 10).map((e: any) => `${e.name} (${e.type})`).join(', ')}
- Themes: ${knowledgeGraph.themes?.join(', ')}
- Timeline: ${knowledgeGraph.timeline?.slice(0, 5).map((t: any) => t.event).join(', ')}`;
    }

    if (previousEpisodes.length > 0) {
      contextInfo += `\n\nREFERENSI EPISODE SEBELUMNYA (untuk konteks saja, JANGAN ulang):
${previousEpisodes.slice(-2).map(ep => `- Episode ${ep.episodeNumber}: ${ep.title}`).join('\n')}

⚠️ CATATAN: Episode sebelumnya hanya untuk konteks. Episode baru harus BENAR-BENAR FRESH dengan karakter dan situasi yang sama sekali baru.`;
    }

    // Determine episode structure based on episode number and total episodes
    const totalEpisodes = project.totalEpisodes || 10;
    const isFirstEpisode = episodeNumber === 1;
    const isLastEpisode = episodeNumber === totalEpisodes;
    const isMiddleEpisode = episodeNumber > 1 && episodeNumber < totalEpisodes;
    const isEarlyEpisode = episodeNumber <= Math.ceil(totalEpisodes * 0.3);
    const isLateEpisode = episodeNumber >= Math.ceil(totalEpisodes * 0.7);

    let episodeStructureGuidance = '';
    
    if (isFirstEpisode) {
      episodeStructureGuidance = `\n\n🎬 EPISODE ${episodeNumber} - EPISODE PEMBUKA (ESTABLISHING):
WAJIB MENGANDUNG:
• Establishing World & Tone - perkenalkan dunia cerita dengan detail yang engaging
• Perkenalan Karakter Utama - introduce karakter utama dengan clear motivation dan goal
• Conflict Awal - setup central conflict yang akan drive seluruh cerita
• Hook / Pertanyaan Dramatis - buat audience penasaran dan ingin tahu lebih lanjut
• Tema / Premis - establish tema utama yang akan berkembang sepanjang cerita
• Balance antara Eksposisi & Aksi - jangan terlalu banyak info dump, seimbangkan dengan aksi
• Ending yang Menggantung - buat cliffhanger yang membuat audience ingin episode berikutnya

🎯 FOKUS EPISODE PEMBUKA:
- Buat opening yang kuat dan memorable
- Establish rules dan tone dunia cerita
- Introduce karakter utama dengan cara yang engaging
- Setup conflict yang akan menjadi backbone cerita
- Buat audience invested dalam cerita dari awal`;
    } else if (isMiddleEpisode) {
      episodeStructureGuidance = `\n\n🎭 EPISODE ${episodeNumber} - EPISODE TENGAH (DEVELOPMENT):
WAJIB MENGANDUNG:
• Pengembangan Karakter - develop karakter utama dan supporting characters
• Konflik Bertingkat - tingkatkan konflik dan tambahkan layer baru
• Arc Mini per Episode - setiap episode harus punya arc sendiri yang complete
• Pembangunan Dunia (World-Building) - expand dunia cerita dengan detail baru
• Pacing & Variasi - variasi tempo dan jenis scene untuk menjaga engagement
• Bangun Menuju Mid-Season & Climax - prepare untuk climax yang akan datang

🎯 FOKUS EPISODE TENGAH:
- Develop karakter dengan depth dan complexity
- Tingkatkan stakes dan konflik
- Tambahkan plot twists dan revelations
- Expand dunia cerita dengan detail yang menarik
- Maintain momentum menuju climax
- Setiap episode harus punya payoff sendiri`;
    } else if (isLastEpisode) {
      episodeStructureGuidance = `\n\n🏁 EPISODE ${episodeNumber} - EPISODE PENUTUP (CLIMAX & RESOLUTION):
WAJIB MENGANDUNG:
• Klimaks (Climax) - puncak konflik yang sudah dibangun dari episode sebelumnya
• Resolusi Arc Karakter - resolve character arcs dengan satisfying conclusion
• Jawaban dari Pertanyaan Utama - answer central questions yang diajukan di episode 1
• Twist Akhir / Cliffhanger (opsional) - bisa ada twist atau setup untuk season berikutnya
• Pacing yang Lebih Intens - tempo yang lebih cepat dan intense

🎯 FOKUS EPISODE PENUTUP:
- Deliver climax yang memuaskan
- Resolve semua major plot threads
- Give characters satisfying conclusions
- Answer central questions
- Leave audience satisfied atau excited untuk season berikutnya`;
    }

    // Generate mode-specific instructions
    let modeInstructions = '';
    let focusInstructions = '';

    switch (autoFillMode) {
      case 'knowledge-graph':
        modeInstructions = `🚨 MODE KNOWLEDGE GRAPH:
- Gunakan karakter, lokasi, dan plot dari Knowledge Graph yang sudah dianalisis
- Buat episode yang konsisten dengan dunia cerita yang sudah ada
- Manfaatkan entitas dan hubungan yang sudah teridentifikasi
- JANGAN gunakan Style DNA - fokus hanya pada konten cerita`;
        focusInstructions = `🎯 FOKUS KNOWLEDGE GRAPH:
- Gunakan karakter yang sudah ada dalam Knowledge Graph
- Manfaatkan lokasi dan setting yang sudah teridentifikasi
- Ikuti timeline dan peristiwa yang sudah dianalisis
- Kembangkan tema yang sudah ada dalam Knowledge Graph`;
        break;
      
      case 'style-dna':
        modeInstructions = `🚨 MODE STYLE DNA:
- Fokus HANYA pada Style DNA untuk konsistensi gaya penulisan
- Buat karakter, lokasi, dan situasi yang sama sekali baru
- JANGAN gunakan Knowledge Graph - buat cerita yang fresh
- Terapkan gaya penulisan yang sudah dianalisis`;
        focusInstructions = `🎨 FOKUS STYLE DNA:
- Gunakan voice dan tone yang sudah dianalisis dalam Style DNA
- Terapkan themes yang sudah dianalisis
- Ikuti narrative style yang sudah dianalisis
- Gunakan dialog style yang sudah dianalisis
- Manfaatkan kekuatan penulisan yang sudah dianalisis`;
        break;
      
      case 'both':
        modeInstructions = `🚨 MODE KOMBINASI (KNOWLEDGE GRAPH + STYLE DNA):
- Gunakan Knowledge Graph untuk konten cerita (karakter, lokasi, plot)
- Gunakan Style DNA untuk konsistensi gaya penulisan
- Kombinasikan keduanya untuk hasil yang paling optimal
- Buat episode yang konsisten dengan dunia cerita DAN gaya penulisan`;
        focusInstructions = `🎯 FOKUS KOMBINASI:
- Manfaatkan karakter dan lokasi dari Knowledge Graph
- Terapkan gaya penulisan dari Style DNA
- Kembangkan tema yang sudah ada dengan gaya yang konsisten
- Buat cerita yang rich dan engaging dengan konsistensi penuh`;
        break;
      
      case 'none':
        modeInstructions = `🚨 MODE FRESH EPISODE:
- Buat episode yang BENAR-BENAR FRESH dan baru
- JANGAN gunakan Knowledge Graph maupun Style DNA
- Buat karakter, lokasi, dan situasi yang sama sekali baru
- Fokus hanya pada genre dan tone proyek`;
        focusInstructions = `🎯 FOKUS FRESH:
- Buat cerita yang benar-benar baru dan menarik
- Sesuaikan dengan genre dan tone proyek
- Buat karakter dan konflik yang fresh
- Jangan terikat dengan analisis sebelumnya`;
        break;
    }

    const prompt = `Berdasarkan informasi di bawah ini, buatkan saran untuk episode ${episodeNumber}.

${contextInfo}${episodeStructureGuidance}

${modeInstructions}

${focusInstructions}

📝 EPISODE YANG DIBUAT (URUTAN PRIORITAS):
1. 🎯 WAJIB SELARAS dengan PROJECT SYNOPSIS di atas - episode harus mendukung dan mengembangkan cerita utama
2. 📋 PRIORITAS UTAMA: GUNAKAN DULU semua elemen-elemen kunci dari sinopsis (karakter, setting, plot, tema, objek, hubungan)
3. 🆕 BARU KEMUDIAN: Tambahkan karakter/situasi fresh yang mendukung dan mengembangkan elemen sinopsis
4. Sesuai dengan genre dan tone proyek
5. ${autoFillMode === 'none' ? 'BENAR-BENAR FRESH tanpa referensi analisis' : 'Menggunakan analisis yang dipilih untuk konsistensi'}
6. Memiliki konflik yang menarik dan engaging yang relevan dengan sinopsis proyek dan elemen-elemen kunci
7. ${autoFillMode === 'none' ? 'Buat karakter dan situasi yang sama sekali baru' : 'Konsisten dengan analisis yang dipilih'}
8. Mengikuti struktur episode yang sesuai dengan posisi episode (pembuka/tengah/penutup)
9. Memenuhi requirements struktur episode yang sudah ditentukan di atas
10. 🔗 Menghubungkan elemen-elemen sinopsis dengan episode baru secara natural dan engaging

Format output dalam JSON:
{
  "title": "Judul episode yang menarik dan sesuai dengan mode yang dipilih",
  "synopsis": "Sinopsis episode yang jelas dan engaging, sesuai dengan mode auto-fill yang dipilih",
  "setting": "Setting/lokasi utama episode (contoh: Jakarta, Sekolah, Rumah sakit, Kampus, Mall, Rumah)",
  "minPages": 5
}

🚨 PENTING - URUTAN PRIORITAS (WAJIB DIIKUTI):
- 🎯 WAJIB: Episode HARUS mendukung dan mengembangkan cerita dari PROJECT SYNOPSIS
- 📋 PRIORITAS 1: GUNAKAN DULU semua karakter, setting, plot elements, tema, dan objek dari ELEMEN KUNCI SYNOPSIS
- 🆕 PRIORITAS 2: BARU KEMUDIAN tambahkan karakter/situasi fresh yang mendukung elemen sinopsis
- Judul episode harus menarik dan sesuai dengan mode yang dipilih
- Sinopsis episode harus jelas, engaging, dan SELARAS dengan sinopsis proyek utama
- Setting episode harus MULAI dari setting sinopsis, baru tambahkan setting fresh jika perlu
- Karakter episode harus MULAI dari karakter sinopsis, baru tambahkan karakter fresh jika perlu
- Plot episode harus MULAI dari plot elements sinopsis, baru kembangkan dengan elemen fresh
- MinPages antara 3-15 halaman
- ${autoFillMode === 'none' ? 'Buat cerita yang benar-benar fresh tanpa referensi analisis' : 'Gunakan analisis yang dipilih untuk konsistensi'}
- ${autoFillMode === 'none' ? 'JANGAN gunakan karakter, lokasi, atau plot dari episode sebelumnya' : 'Manfaatkan analisis yang dipilih untuk hasil yang optimal'}
- ⚠️ JANGAN LUPA: Setiap episode adalah bagian dari cerita besar yang dijelaskan dalam PROJECT SYNOPSIS
- 🔗 HUBUNGKAN: Elemen-elemen dari sinopsis harus terintegrasi secara natural dalam episode
- 📋 JANGAN LUPA: Elemen sinopsis adalah FONDASI, elemen fresh adalah PENGEMBANGAN`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    console.log(`🤖 AI Response: ${responseText.substring(0, 200)}...`);

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in response');
    }
    
    const episodeSuggestion = JSON.parse(jsonMatch[0]);
    console.log(`✅ Generated episode suggestion:`, episodeSuggestion);

    return NextResponse.json({
      success: true,
      episode: episodeSuggestion,
      context: {
        autoFillMode,
        hasStyleDNA: !!styleDNA,
        hasKnowledgeGraph: !!knowledgeGraph,
        previousEpisodesCount: previousEpisodes.length
      }
    });

  } catch (error) {
    console.error('Error auto-filling episode:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
