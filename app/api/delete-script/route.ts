import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, deleteDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest) {
  try {
    const { scriptId, userId } = await request.json();
    
    if (!scriptId || !userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing required parameters: scriptId, userId' 
      }, { status: 400 });
    }

    console.log(`🗑️ Deleting script with ID: ${scriptId} for user: ${userId}`);

    // Check if the script exists and belongs to the user
    const scriptRef = doc(db, 'scripts', scriptId);
    const scriptDoc = await getDoc(scriptRef);
    
    if (!scriptDoc.exists()) {
      return NextResponse.json({ 
        success: false,
        error: 'Script not found' 
      }, { status: 404 });
    }

    const scriptData = scriptDoc.data();
    if (scriptData.userId !== userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized: You can only delete your own scripts' 
      }, { status: 403 });
    }

    // Find and delete related analyses (Style DNA and Knowledge Graph)
    const styleDNAQuery = query(
      collection(db, 'styleDNA'),
      where('scriptId', '==', scriptId),
      where('userId', '==', userId)
    );
    
    const knowledgeGraphQuery = query(
      collection(db, 'knowledgeGraphs'),
      where('scriptId', '==', scriptId),
      where('userId', '==', userId)
    );

    const [styleDNASnapshot, knowledgeGraphSnapshot] = await Promise.all([
      getDocs(styleDNAQuery),
      getDocs(knowledgeGraphQuery)
    ]);

    // Delete related Style DNA analyses
    const styleDNADeletions = styleDNASnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    // Delete related Knowledge Graph analyses
    const knowledgeGraphDeletions = knowledgeGraphSnapshot.docs.map(doc => deleteDoc(doc.ref));

    // Delete the script
    const scriptDeletion = deleteDoc(scriptRef);

    // Execute all deletions
    await Promise.all([
      ...styleDNADeletions,
      ...knowledgeGraphDeletions,
      scriptDeletion
    ]);

    const totalAnalysesDeleted = styleDNASnapshot.docs.length + knowledgeGraphSnapshot.docs.length;
    
    console.log(`✅ Successfully deleted script with ID: ${scriptId}`);
    console.log(`✅ Also deleted ${totalAnalysesDeleted} related analyses`);

    return NextResponse.json({
      success: true,
      message: `Script and ${totalAnalysesDeleted} related analyses deleted successfully`,
      deletedAnalyses: totalAnalysesDeleted
    });

  } catch (error) {
    console.error('Error deleting script:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
