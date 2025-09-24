/**
 * Test script untuk menguji implementasi context recap dan script analysis antar chunking
 * 
 * Fitur yang diuji:
 * 1. ChunkAnalysis interface
 * 2. analyzeChunkContent function
 * 3. generateContextRecap function
 * 4. Modified generateLongScriptInChunks function
 */

const { 
  analyzeChunkContent, 
  generateContextRecap,
  generateLongScriptInChunks 
} = require('./lib/gemini.ts');

// Mock data untuk testing
const mockChunkContent = `
INT. RUMAH MAYA - PAGI

Maya (25) bangun dari tidur, terlihat lelah. Dia melihat jam di dinding.

MAYA
(berbisik)
Hari ini harus berbeda...

Dia bangun dan berjalan ke jendela, melihat ke luar.

CUT TO:

EXT. JALAN RAYA - PAGI

Maya berjalan dengan langkah tegas, seolah-olah memiliki tujuan yang jelas.

MAYA
(voice over)
Setiap langkah membawaku lebih dekat ke kebenaran.

DISSOLVE TO:

INT. KANTOR - SIANG

Maya duduk di meja kerjanya, menatap layar komputer dengan konsentrasi penuh.

MAYA
(berpikir keras)
Apa yang sebenarnya terjadi di sini?

FADE TO:

INT. RUMAH MAYA - MALAM

Maya kembali ke rumah, terlihat frustrasi. Dia melempar tas ke sofa.

MAYA
(marah)
Ini tidak masuk akal!

Dia duduk di sofa, menutup wajah dengan kedua tangannya.
`;

const mockPreviousChunks = [
  {
    chunkIndex: 0,
    chunkContent: "INT. RUMAH - PAGI\nMaya bangun...",
    sceneCount: 3,
    characterAppearances: ["Maya"],
    plotDevelopments: ["Maya memulai hari baru", "Maya memiliki tujuan"],
    emotionalTone: "determined",
    keyEvents: ["Maya bangun", "Maya berjalan", "Maya ke kantor"],
    openThreads: ["Maya mencari kebenaran", "Konflik di kantor"],
    transitionPoints: ["CUT TO:", "DISSOLVE TO:", "FADE TO:"],
    confidenceScore: 0.8
  },
  {
    chunkIndex: 1,
    chunkContent: "INT. KANTOR - SIANG\nMaya bekerja...",
    sceneCount: 2,
    characterAppearances: ["Maya", "Boss"],
    plotDevelopments: ["Maya bekerja keras", "Konflik dengan boss"],
    emotionalTone: "frustrated",
    keyEvents: ["Maya bekerja", "Konflik dengan boss", "Maya pulang"],
    openThreads: ["Konflik dengan boss", "Maya mencari jawaban"],
    transitionPoints: ["CUT TO:", "FADE TO:"],
    confidenceScore: 0.9
  }
];

async function testChunkAnalysis() {
  console.log('🧪 Testing Chunk Analysis...');
  
  try {
    const analysis = await analyzeChunkContent(mockChunkContent, 0);
    
    console.log('✅ Chunk Analysis Results:');
    console.log(`- Chunk Index: ${analysis.chunkIndex}`);
    console.log(`- Scene Count: ${analysis.sceneCount}`);
    console.log(`- Characters: ${analysis.characterAppearances.join(', ')}`);
    console.log(`- Plot Developments: ${analysis.plotDevelopments.join('; ')}`);
    console.log(`- Emotional Tone: ${analysis.emotionalTone}`);
    console.log(`- Key Events: ${analysis.keyEvents.join('; ')}`);
    console.log(`- Open Threads: ${analysis.openThreads.join('; ')}`);
    console.log(`- Transition Points: ${analysis.transitionPoints.join('; ')}`);
    console.log(`- Confidence Score: ${analysis.confidenceScore}`);
    
    return analysis;
  } catch (error) {
    console.error('❌ Chunk Analysis Error:', error);
    return null;
  }
}

async function testContextRecap() {
  console.log('\n🧪 Testing Context Recap...');
  
  try {
    const recap = await generateContextRecap(mockPreviousChunks, 80);
    
    console.log('✅ Context Recap Results:');
    console.log(recap);
    
    return recap;
  } catch (error) {
    console.error('❌ Context Recap Error:', error);
    return null;
  }
}

async function testFullChunking() {
  console.log('\n🧪 Testing Full Chunking with Analysis...');
  
  try {
    // Mock context
    const mockContext = {
      project: {
        title: "Test Project",
        genre: "Drama",
        tone: "Serious",
        synopsis: "Test synopsis"
      },
      currentEpisode: {
        title: "Test Episode",
        episodeNumber: 1,
        setting: "Test Setting"
      },
      previousEpisodes: [],
      recentMessages: [],
      styleDNA: null,
      knowledgeGraph: null
    };
    
    const mockActiveModes = {
      knowledgeGraph: false,
      styleDNA: false,
      openMode: false
    };
    
    const mockUserMessage = "Buat script 80 halaman tentang Maya yang mencari kebenaran";
    
    const thinkingSteps = [];
    const onThinkingStep = (step) => {
      thinkingSteps.push(step);
      console.log(`💭 ${step}`);
    };
    
    const result = await generateLongScriptInChunks(
      mockUserMessage,
      mockContext,
      mockActiveModes,
      80,
      onThinkingStep
    );
    
    console.log('✅ Full Chunking Results:');
    console.log(`- Script Length: ${result.length} characters`);
    console.log(`- Thinking Steps: ${thinkingSteps.length}`);
    console.log(`- First 500 chars: ${result.substring(0, 500)}...`);
    
    return result;
  } catch (error) {
    console.error('❌ Full Chunking Error:', error);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Chunking Analysis Tests...\n');
  
  // Test 1: Chunk Analysis
  const analysisResult = await testChunkAnalysis();
  
  // Test 2: Context Recap
  const recapResult = await testContextRecap();
  
  // Test 3: Full Chunking (commented out for now to avoid API calls)
  // const chunkingResult = await testFullChunking();
  
  console.log('\n📊 Test Summary:');
  console.log(`- Chunk Analysis: ${analysisResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`- Context Recap: ${recapResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`- Full Chunking: ⏸️ SKIPPED (to avoid API calls)`);
  
  console.log('\n🎉 Tests completed!');
}

// Run tests
runTests().catch(console.error);
