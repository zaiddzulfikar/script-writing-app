import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, deleteDoc, getDoc } from "firebase/firestore";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest) {
  try {
    const { analysisId, analysisType, userId } = await request.json();
    
    if (!analysisId || !analysisType || !userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Parameter yang diperlukan tidak ditemukan: analysisId, analysisType, userId' 
      }, { status: 400 });
    }

    console.log(`🗑️ Deleting ${analysisType} with ID: ${analysisId} for user: ${userId}`);

    // Determine collection name based on analysis type
    const collectionName = analysisType === 'style-dna' ? 'styleDNA' : 'knowledgeGraphs';
    
    // Check if the analysis exists and belongs to the user
    const analysisRef = doc(db, collectionName, analysisId);
    const analysisDoc = await getDoc(analysisRef);
    
    if (!analysisDoc.exists()) {
      return NextResponse.json({ 
        success: false,
        error: 'Analisis tidak ditemukan' 
      }, { status: 404 });
    }

    const analysisData = analysisDoc.data();
    if (analysisData.userId !== userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Tidak diizinkan: Anda hanya dapat menghapus analisis Anda sendiri' 
      }, { status: 403 });
    }

    // Delete the analysis
    await deleteDoc(analysisRef);
    
    console.log(`✅ Successfully deleted ${analysisType} with ID: ${analysisId}`);

    return NextResponse.json({
      success: true,
      message: `${analysisType === 'style-dna' ? 'Style DNA' : 'Knowledge Graph'} berhasil dihapus`
    });

  } catch (error) {
    console.error('Error deleting analysis:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
