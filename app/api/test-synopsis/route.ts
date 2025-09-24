import { NextRequest, NextResponse } from 'next/server'
import { analyzeEpisodeSynopsis } from '@/lib/gemini'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Episode Synopsis Analysis...')
    
    // Test data untuk generation pertama
    const testContext = {
      currentEpisode: {
        id: "test-episode-synopsis",
        projectId: "test-project-synopsis",
        episodeNumber: 1,
        title: "Pertemuan Pertama",
        setting: "Kafe di Jakarta",
        synopsis: "Maya, seorang mahasiswa sastra, bertemu dengan Rizky, seorang musisi indie di kafe favoritnya. Mereka terlibat dalam percakapan mendalam tentang seni dan kehidupan. Maya terkesan dengan pandangan Rizky tentang musik sebagai bahasa universal, sementara Rizky tertarik dengan cara Maya menceritakan kisah melalui tulisan. Pertemuan ini menjadi awal dari persahabatan yang akan mengubah hidup mereka.",
        script: undefined, // Belum ada script
        createdAt: new Date(),
        updatedAt: new Date()
      },
      project: {
        id: "test-project-synopsis",
        title: "Musik dan Kata",
        genre: "Drama",
        totalEpisodes: 1,
        synopsis: "Kisah tentang perjalanan dua seniman muda yang menemukan cinta dan inspirasi melalui musik dan tulisan.",
        tone: "Romantis",
        userId: "test-user",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      recentMessages: [], // Kosong untuk generation pertama
      previousEpisodes: []
    }

    const testActiveModes = {
      knowledgeGraph: false,
      styleDNA: false
    }

    console.log('📝 Episode:', testContext.currentEpisode.title)
    console.log('📖 Synopsis:', testContext.currentEpisode.synopsis)
    console.log('🎭 Project:', testContext.project.title)
    console.log('🎨 Genre:', testContext.project.genre)
    console.log('🎵 Tone:', testContext.project.tone)
    
    const result = await analyzeEpisodeSynopsis(
      testContext,
      testActiveModes,
      (step) => console.log('🔄', step)
    )
    
    console.log('\n✅ Analysis Result:')
    console.log('📊 Episode Number:', result.episode_number)
    console.log('🎬 Last Scene ID:', result.last_scene_id)
    console.log('📝 Last Scene Summary:', result.last_scene_summary)
    console.log('👥 Main Characters:', result.main_characters)
    console.log('🎭 Current Tone Style:', result.current_tone_style)
    console.log('🧵 Open Threads:', result.open_threads)
    console.log('💭 Assumptions Made:', result.assumptions_made)
    console.log('📈 Confidence Score:', result.confidence_score)
    console.log('🎨 Style DNA Used:', result.style_dna_used)
    
    // Validasi hasil
    console.log('\n🔍 Validation:')
    console.log('✅ Episode number correct:', result.episode_number === 1)
    console.log('✅ Scene ID is SCENE_1:', result.last_scene_id === 'SCENE_1')
    console.log('✅ Has main characters:', result.main_characters.length > 0)
    console.log('✅ Has open threads:', result.open_threads.length > 0)
    console.log('✅ Confidence reasonable:', result.confidence_score >= 0.5)
    
    return NextResponse.json({
      success: true,
      test: 'Episode Synopsis Analysis',
      result,
      validation: {
        episodeNumberCorrect: result.episode_number === 1,
        sceneIdCorrect: result.last_scene_id === 'SCENE_1',
        hasMainCharacters: result.main_characters.length > 0,
        hasOpenThreads: result.open_threads.length > 0,
        confidenceReasonable: result.confidence_score >= 0.5
      }
    })
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    return NextResponse.json({
      success: false,
      error: error.message,
      test: 'Episode Synopsis Analysis'
    }, { status: 500 })
  }
}
