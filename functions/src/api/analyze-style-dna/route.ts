import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { StyleDNA } from "@/types/style-dna";

export const runtime = "nodejs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { scriptId, projectId, userId } = await request.json();
    
    if (!scriptId || !projectId || !userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Parameter yang diperlukan tidak ditemukan' 
      }, { status: 400 });
    }

    // Get script data from Firestore
    const scriptDoc = await getDoc(doc(db, 'scripts', scriptId));
    if (!scriptDoc.exists()) {
      return NextResponse.json({ 
        success: false,
        error: 'Naskah tidak ditemukan' 
      }, { status: 404 });
    }

    const scriptData = scriptDoc.data();
    const extractedText = scriptData.extractedText;

    if (!extractedText || extractedText.length < 100) {
      return NextResponse.json({ 
        success: false,
        error: 'Teks naskah terlalu pendek untuk dianalisis' 
      }, { status: 422 });
    }

    console.log(`🚀 Starting Style DNA analysis for script: ${scriptData.fileName}`);
    console.log(`📄 Text length: ${extractedText.length} characters`);

    // Generate Style DNA using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    
    const prompt = `Analisis script berikut dan ekstrak Style DNA penulisnya secara komprehensif. Berikan response dalam format JSON dengan struktur berikut:

{
  "thematicVoice": {
    "mainThemes": ["tema utama yang dominan"],
    "philosophicalStance": ["pandangan filosofis penulis"],
    "moralQuestions": ["pertanyaan moral yang diajukan"],
    "socialIssues": ["isu sosial yang diangkat"],
    "personalValues": ["nilai pribadi yang tercermin"]
  },
  "dialogueStyle": {
    "realism": "realistic" | "stylized" | "poetic" | "minimalist" | "verbose",
    "pace": "fast" | "moderate" | "slow" | "varied",
    "humor": "none" | "subtle" | "moderate" | "heavy" | "satirical",
    "philosophy": "none" | "light" | "moderate" | "heavy",
    "subtext": "none" | "light" | "moderate" | "heavy",
    "characteristics": ["karakteristik dialog yang menonjol"]
  },
  "characterization": {
    "protagonistTypes": ["jenis protagonis yang sering digunakan"],
    "supportingCharacterTypes": ["jenis karakter pendukung"],
    "characterArcs": ["pola character development"],
    "relationships": ["pola hubungan antar karakter"],
    "conflicts": ["jenis konflik yang sering muncul"],
    "motivations": ["pola motivasi karakter"]
  },
  "worldBuilding": {
    "settings": ["setting yang sering dipilih"],
    "timePeriods": ["periode waktu"],
    "atmosphere": ["atmosfer yang diciptakan"],
    "culturalElements": ["elemen budaya"],
    "technology": ["level teknologi"],
    "socialStructures": ["struktur sosial"]
  },
  "toneMood": {
    "primaryTone": "dark" | "light" | "dramatic" | "comedic" | "romantic" | "tragic" | "absurd" | "mixed",
    "moodShifts": ["pola perubahan mood"],
    "emotionalRange": ["rentang emosi"],
    "atmosphere": ["atmosfer yang dominan"],
    "tension": "low" | "moderate" | "high" | "varied",
    "resolution": "happy" | "bittersweet" | "tragic" | "ambiguous" | "varied"
  },
  "narrativeStructure": {
    "timeline": "linear" | "non-linear" | "mixed",
    "plotComplexity": "simple" | "moderate" | "complex",
    "subplotUsage": "none" | "minimal" | "moderate" | "extensive",
    "pacing": "slow" | "moderate" | "fast" | "varied",
    "detailLevel": "minimal" | "moderate" | "detailed" | "extensive",
    "narrativeTechniques": ["teknik naratif yang digunakan"]
  },
  "visualSymbolism": {
    "recurringImages": ["imaji yang sering muncul"],
    "colorPalette": ["palet warna"],
    "symbols": ["simbol yang digunakan"],
    "metaphors": ["metafora yang digunakan"],
    "visualStyle": ["gaya visual"],
    "environmentalDetails": ["detail lingkungan"]
  },
  "pacing": {
    "overallPace": "slow" | "moderate" | "fast" | "varied",
    "actionSequences": "minimal" | "moderate" | "frequent",
    "contemplativeMoments": "minimal" | "moderate" | "frequent",
    "conflictEscalation": "gradual" | "rapid" | "varied",
    "resolutionSpeed": "slow" | "moderate" | "fast" | "varied",
    "rhythmPatterns": ["pola ritme"]
  },
  "genrePreferences": {
    "primaryGenres": ["genre utama"],
    "genreBlends": ["campuran genre"],
    "genreConventions": ["konvensi genre yang diikuti"],
    "genreSubversions": ["subversi genre"],
    "genreInnovations": ["inovasi genre"]
  },
  "messagePhilosophy": {
    "coreMessages": ["pesan inti"],
    "lifePhilosophy": ["filosofi hidup"],
    "moralLessons": ["pelajaran moral"],
    "socialCommentary": ["komentar sosial"],
    "personalInsights": ["insight pribadi"],
    "worldview": ["pandangan dunia"]
  },
  "analysis": {
    "confidence": 85,
    "sampleSize": 1,
    "analysisDate": "2024-01-01T00:00:00.000Z",
    "examples": ["contoh kutipan yang mewakili style"],
    "strengths": ["kekuatan penulisan"],
    "patterns": ["pola yang teridentifikasi"],
    "uniqueness": ["elemen unik"]
  },
  "usage": {
    "recommendedFor": ["genre/proyek yang cocok"],
    "strengths": ["kekuatan style"],
    "considerations": ["hal yang perlu dipertimbangkan"],
    "adaptationNotes": ["catatan adaptasi"]
  }
}

Script untuk dianalisis:
${extractedText.substring(0, 8000)} // Limit to 8000 chars

Pastikan:
- Voice: array string karakteristik gaya penulisan (formal/informal, direct/indirect, dll)
- Themes: array string tema utama yang muncul dalam script
- Characters: array string deskripsi karakter yang muncul (bukan objek)
- Narrative: array string teknik naratif yang digunakan
- Dialog: array string karakteristik dialog
- Strengths: array string kelebihan penulisan
- Examples: array string contoh kutipan yang mewakili style
- Confidence: number tingkat kepercayaan analisis (0-100)

PENTING: Semua array harus berisi string, bukan objek. Untuk characters, berikan deskripsi singkat sebagai string.

Berikan analisis yang mendalam dan akurat dalam bahasa Indonesia.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    console.log(`🤖 AI Response: ${responseText.substring(0, 200)}...`);

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in response');
    }
    
    const styleDNAData = JSON.parse(jsonMatch[0]);
    console.log(`✅ Parsed Style DNA:`, styleDNAData);

    // Clean and validate the data
    const cleanedStyleDNA = {
      voice: Array.isArray(styleDNAData.voice) ? styleDNAData.voice : [],
      themes: Array.isArray(styleDNAData.themes) ? styleDNAData.themes : [],
      characters: Array.isArray(styleDNAData.characters) 
        ? styleDNAData.characters.map((item: any) => 
            typeof item === 'string' ? item : (item?.name || item?.description || JSON.stringify(item))
          ) 
        : [],
      narrative: Array.isArray(styleDNAData.narrative) ? styleDNAData.narrative : [],
      dialog: Array.isArray(styleDNAData.dialog) ? styleDNAData.dialog : [],
      strengths: Array.isArray(styleDNAData.strengths) ? styleDNAData.strengths : [],
      examples: Array.isArray(styleDNAData.examples) ? styleDNAData.examples : [],
      confidence: typeof styleDNAData.confidence === 'number' ? styleDNAData.confidence : 0
    };

    // Save to Firestore
    const styleDNARef = await addDoc(collection(db, 'styleDNA'), {
      userId,
      projectId,
      scriptId,
      ...cleanedStyleDNA,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`💾 Saving Style DNA: ${styleDNARef.id}`);

    return NextResponse.json({
      success: true,
      styleDNAId: styleDNARef.id,
      styleDNA: cleanedStyleDNA,
      message: 'Style DNA berhasil dibuat'
    });

  } catch (error) {
    console.error('Style DNA analysis error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error tidak diketahui'
    }, { status: 500 });
  }
}
