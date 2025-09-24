import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { KnowledgeGraph } from "@/types/database";

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

    console.log(`🚀 Starting Knowledge Graph analysis for script: ${scriptData.fileName}`);
    console.log(`📄 Text length: ${extractedText.length} characters`);

    // Generate Knowledge Graph using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Analisis script berikut dan buat Knowledge Graph yang mendalam. Berikan response dalam format JSON dengan struktur berikut:

{
  "entities": [
    {
      "name": "string",
      "type": "Person|Location|Event|Object|Concept",
      "description": "string"
    }
  ],
  "relationships": [
    {
      "from": "string (entity name)",
      "to": "string (entity name)",
      "type": "string (relationship type)"
    }
  ],
  "timeline": [
    {
      "event": "string",
      "order": number
    }
  ],
  "themes": ["array of main themes"]
}

Script untuk dianalisis:
${extractedText.substring(0, 8000)} // Limit to 8000 chars

Instruksi:
1. Identifikasi semua entitas penting (karakter, lokasi, objek, konsep)
2. Tentukan hubungan antar entitas
3. Buat timeline peristiwa dalam urutan kronologis
4. Ekstrak tema utama
5. Pastikan semua nama entitas konsisten
6. Berikan deskripsi yang jelas untuk setiap entitas
7. Tentukan jenis hubungan yang bermakna (family, works_with, located_in, dll)

Berikan analisis yang komprehensif dan akurat dalam bahasa Indonesia.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    console.log(`🤖 AI Response: ${responseText.substring(0, 200)}...`);

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in response');
    }
    
    const knowledgeGraphData = JSON.parse(jsonMatch[0]);
    console.log(`✅ Parsed Knowledge Graph:`, knowledgeGraphData);

    // Clean and validate the data
    const cleanedKnowledgeGraph = {
      entities: Array.isArray(knowledgeGraphData.entities) ? knowledgeGraphData.entities : [],
      relationships: Array.isArray(knowledgeGraphData.relationships) ? knowledgeGraphData.relationships : [],
      timeline: Array.isArray(knowledgeGraphData.timeline) ? knowledgeGraphData.timeline : [],
      themes: Array.isArray(knowledgeGraphData.themes) ? knowledgeGraphData.themes : []
    };

    // Save to Firestore
    const knowledgeGraphRef = await addDoc(collection(db, 'knowledgeGraphs'), {
      userId,
      projectId,
      scriptId,
      ...cleanedKnowledgeGraph,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`💾 Saving Knowledge Graph: ${knowledgeGraphRef.id}`);

    return NextResponse.json({
      success: true,
      knowledgeGraphId: knowledgeGraphRef.id,
      knowledgeGraph: cleanedKnowledgeGraph,
      message: 'Knowledge Graph berhasil dibuat'
    });

  } catch (error) {
    console.error('Knowledge Graph analysis error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error tidak diketahui'
    }, { status: 500 });
  }
}
