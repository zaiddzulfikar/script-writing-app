import { NextRequest, NextResponse } from 'next/server';
import { analyzeScriptContext } from '@/lib/gemini';
import { ChatMessage } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Edit Message First Generation Detection...');
    
    // Test scenario: Edit message when no script exists and no assistant messages
    const mockContext = {
      project: {
        id: 'test_project',
        title: 'Musik dan Kata',
        genre: 'Drama',
        totalEpisodes: 1,
        synopsis: 'Sebuah cerita tentang persahabatan dan cinta',
        tone: 'Romantis',
        userId: 'test_user',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      currentEpisode: {
        id: 'test_episode',
        projectId: 'test_project',
        title: 'Pertemuan Pertama',
        episodeNumber: 1,
        setting: 'Kafe di Jakarta',
        synopsis: 'Maya, seorang mahasiswa sastra, bertemu dengan Rizky, seorang musisi indie di kafe favoritnya. Mereka terlibat dalam percakapan mendalam tentang seni dan kehidupan.',
        script: undefined, // No script yet
        createdAt: new Date(),
        updatedAt: new Date()
      },
      recentMessages: [
        {
          id: 'user_msg_1',
          episodeId: 'test_episode',
          role: 'user' as const,
          content: 'Buatkan script untuk pertemuan Maya dan Rizky di kafe',
          timestamp: new Date()
        }
        // No assistant messages yet
      ] as ChatMessage[],
      previousEpisodes: [],
      styleDNA: null,
      knowledgeGraph: null
    };

    const activeModes = {
      knowledgeGraph: false,
      styleDNA: false
    };

    console.log('📝 Context: Edit message scenario');
    console.log('📖 Episode:', mockContext.currentEpisode.title);
    console.log('📄 Script exists:', !!mockContext.currentEpisode.script);
    console.log('🤖 Assistant messages:', mockContext.recentMessages.filter(msg => msg.role === 'assistant').length);
    console.log('👤 User messages:', mockContext.recentMessages.filter(msg => msg.role === 'user').length);

    const thinkingSteps: string[] = [];
    
    const result = await analyzeScriptContext(
      mockContext,
      activeModes,
      (step) => {
        thinkingSteps.push(step);
        console.log('🔄 User sees:', step);
      }
    );

    console.log('✅ Analysis Result:');
    console.log('📊 Episode Number:', result.episode_number);
    console.log('🎬 Last Scene ID:', result.last_scene_id);
    console.log('📝 Last Scene Summary:', result.last_scene_summary);
    console.log('👥 Main Characters:', result.main_characters);
    console.log('🎭 Current Tone Style:', result.current_tone_style);
    console.log('🧵 Open Threads:', result.open_threads);
    console.log('💭 Assumptions Made:', result.assumptions_made);
    console.log('📈 Confidence Score:', result.confidence_score);
    console.log('🎨 Style DNA Used:', result.style_dna_used);

    // Validation
    const isFirstGeneration = result.last_scene_id === 'SCENE_1' && result.episode_number === 1;
    const hasMainCharacters = result.main_characters && result.main_characters.length > 0;
    const hasOpenThreads = result.open_threads && result.open_threads.length > 0;
    const confidenceReasonable = result.confidence_score >= 0.3 && result.confidence_score <= 1.0;

    console.log('🔍 Validation:');
    console.log('✅ First generation detected:', isFirstGeneration);
    console.log('✅ Has main characters:', hasMainCharacters);
    console.log('✅ Has open threads:', hasOpenThreads);
    console.log('✅ Confidence reasonable:', confidenceReasonable);

    return NextResponse.json({
      success: true,
      message: 'Edit message first generation detection test completed',
      result: {
        episodeNumber: result.episode_number,
        lastSceneId: result.last_scene_id,
        lastSceneSummary: result.last_scene_summary,
        mainCharacters: result.main_characters,
        currentToneStyle: result.current_tone_style,
        openThreads: result.open_threads,
        assumptionsMade: result.assumptions_made,
        confidenceScore: result.confidence_score,
        styleDnaUsed: result.style_dna_used
      },
      validation: {
        isFirstGeneration,
        hasMainCharacters,
        hasOpenThreads,
        confidenceReasonable
      },
      thinkingSteps,
      testPassed: isFirstGeneration && hasMainCharacters && hasOpenThreads && confidenceReasonable
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
