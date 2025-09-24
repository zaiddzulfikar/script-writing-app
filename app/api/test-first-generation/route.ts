import { NextRequest, NextResponse } from 'next/server'
import { analyzeScriptContext } from '@/lib/gemini'
import { ChatMessage } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing First Generation Detection...')
    
    // Test data untuk generation pertama (kosong)
    const firstGenerationContext = {
      currentEpisode: {
        id: "test-episode-1",
        projectId: "test-project-1",
        episodeNumber: 1,
        title: "Pertemuan Pertama",
        setting: "Kafe di Jakarta",
        synopsis: "Maya, seorang mahasiswa sastra, bertemu dengan Rizky, seorang musisi indie di kafe favoritnya. Mereka terlibat dalam percakapan mendalam tentang seni dan kehidupan.",
        script: undefined, // Belum ada script
        createdAt: new Date(),
        updatedAt: new Date()
      },
      project: {
        id: "test-project-1",
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

    // Test data untuk generation kedua (ada chat history)
    const secondGenerationContext = {
      currentEpisode: {
        id: "test-episode-2",
        projectId: "test-project-2",
        episodeNumber: 1,
        title: "Pertemuan Pertama",
        setting: "Kafe di Jakarta",
        synopsis: "Maya, seorang mahasiswa sastra, bertemu dengan Rizky, seorang musisi indie di kafe favoritnya.",
        script: "FADE IN:\n\nINT. KAFE - SIANG\n\nMaya duduk di meja dekat jendela, menulis di laptopnya.", // Sudah ada script
        createdAt: new Date(),
        updatedAt: new Date()
      },
      project: {
        id: "test-project-2",
        title: "Musik dan Kata",
        genre: "Drama",
        totalEpisodes: 1,
        synopsis: "Kisah tentang perjalanan dua seniman muda yang menemukan cinta dan inspirasi melalui musik dan tulisan.",
        tone: "Romantis",
        userId: "test-user",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      recentMessages: [
        { 
          id: "msg-1",
          episodeId: "test-episode-2",
          role: 'user' as const, 
          content: 'Buatkan script untuk pertemuan Maya dan Rizky',
          timestamp: new Date()
        },
        { 
          id: "msg-2",
          episodeId: "test-episode-2",
          role: 'assistant' as const, 
          content: 'FADE IN:\n\nINT. KAFE - SIANG\n\nMaya duduk di meja dekat jendela, menulis di laptopnya.',
          timestamp: new Date()
        }
      ] as ChatMessage[],
      previousEpisodes: []
    }

    const testActiveModes = {
      knowledgeGraph: false,
      styleDNA: false
    }

    console.log('📝 Testing First Generation (should use synopsis analysis)...')
    const firstResult = await analyzeScriptContext(
      firstGenerationContext,
      testActiveModes,
      (step) => console.log('🔄 First Gen:', step)
    )
    
    console.log('📝 Testing Second Generation (should use context analysis)...')
    const secondResult = await analyzeScriptContext(
      secondGenerationContext,
      testActiveModes,
      (step) => console.log('🔄 Second Gen:', step)
    )
    
    console.log('\n✅ First Generation Result:')
    console.log('📊 Episode Number:', firstResult.episode_number)
    console.log('🎬 Last Scene ID:', firstResult.last_scene_id)
    console.log('👥 Main Characters:', firstResult.main_characters)
    console.log('📈 Confidence Score:', firstResult.confidence_score)
    
    console.log('\n✅ Second Generation Result:')
    console.log('📊 Episode Number:', secondResult.episode_number)
    console.log('🎬 Last Scene ID:', secondResult.last_scene_id)
    console.log('👥 Main Characters:', secondResult.main_characters)
    console.log('📈 Confidence Score:', secondResult.confidence_score)
    
    // Validasi hasil
    const firstGenValidation = {
      isFirstGeneration: firstResult.last_scene_id === 'SCENE_1',
      hasMainCharacters: firstResult.main_characters.length > 0,
      confidenceReasonable: firstResult.confidence_score >= 0.5
    }
    
    const secondGenValidation = {
      isSecondGeneration: secondResult.last_scene_id !== 'SCENE_1' && secondResult.last_scene_id !== 'UNKNOWN',
      hasMainCharacters: secondResult.main_characters.length >= 0,
      confidenceReasonable: secondResult.confidence_score >= 0.3
    }
    
    return NextResponse.json({
      success: true,
      test: 'First Generation Detection',
      results: {
        firstGeneration: {
          result: firstResult,
          validation: firstGenValidation
        },
        secondGeneration: {
          result: secondResult,
          validation: secondGenValidation
        }
      },
      summary: {
        firstGenDetected: firstGenValidation.isFirstGeneration,
        secondGenDetected: secondGenValidation.isSecondGeneration,
        bothValid: firstGenValidation.confidenceReasonable && secondGenValidation.confidenceReasonable
      }
    })
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    return NextResponse.json({
      success: false,
      error: error.message,
      test: 'First Generation Detection'
    }, { status: 500 })
  }
}
