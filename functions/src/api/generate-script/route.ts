import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'

export const runtime = 'nodejs'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const {
      projectId,
      episodeId,
      userMessage,
      activeModes = { knowledgeGraph: false, styleDNA: false },
      generationMode = 'scene-by-scene'
    } = await request.json()

    if (!projectId || !episodeId || !userMessage) {
      return NextResponse.json({ success: false, error: 'Missing required parameters' }, { status: 400 })
    }

    // Fetch context: project, episode, messages, analyses
    const [episodesSnap, messagesSnap, sdSnap, kgSnap, projectSnap] = await Promise.all([
      getDocs(query(collection(db, 'episodes'), where('projectId', '==', projectId))),
      getDocs(query(collection(db, 'chatMessages'), where('episodeId', '==', episodeId))),
      getDocs(query(collection(db, 'styleDNA'), where('projectId', '==', projectId))),
      getDocs(query(collection(db, 'knowledgeGraphs'), where('projectId', '==', projectId))),
      getDocs(query(collection(db, 'projects'), where('id', '==', projectId)))
    ])

    const episodes = episodesSnap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() || new Date(0) })) as any[]
    episodes.sort((a, b) => a.episodeNumber - b.episodeNumber)
    const currentEpisode = episodes.find(e => e.id === episodeId) || episodes.find(e => e.episodeNumber === Math.max(...episodes.map(x => x.episodeNumber)))
    const previousEpisodes = episodes.filter(e => e.episodeNumber < (currentEpisode?.episodeNumber || 9999))

    const recentMessages = messagesSnap.docs
      .map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate?.() || new Date(0) }))
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-10)

    const styleDNAs = sdSnap.docs.map(d => d.data())
    const combinedStyleDNA = styleDNAs.length > 0 ? styleDNAs[0] : null
    const knowledgeGraph = kgSnap.docs[0]?.data() || null
    const project = projectSnap.docs[0]?.data() || {}

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 32768, // Increased for longer scripts
        topP: 0.8,
        topK: 40
      }
    })

    const modesText = activeModes.knowledgeGraph && activeModes.styleDNA ? 'KOMBINASI (Knowledge Graph + Style DNA)' :
                     activeModes.knowledgeGraph ? 'KNOWLEDGE GRAPH' :
                     activeModes.styleDNA ? 'STYLE DNA' : 'NORMAL'

    const styleText = combinedStyleDNA 
      ? `STYLE DNA:\n- Voice: ${(combinedStyleDNA.voice || []).join(', ')}\n- Themes: ${(combinedStyleDNA.themes || []).join(', ')}\n- Characters: ${(combinedStyleDNA.characters || []).join(', ')}\n- Narrative: ${(combinedStyleDNA.narrative || []).join(', ')}\n- Dialog: ${(combinedStyleDNA.dialog || []).join(', ')}\n- Strengths: ${(combinedStyleDNA.strengths || []).join(', ')}\n- Examples: ${(combinedStyleDNA.examples || []).join(', ')}\n- Confidence: ${combinedStyleDNA.confidence || 0}%`
      : ''

    const kgText = knowledgeGraph
      ? `KNOWLEDGE GRAPH:\n- Entities: ${(knowledgeGraph.entities || []).slice(0,5).map((e:any)=>e.name).join(', ')}\n- Relationships: ${(knowledgeGraph.relationships || []).slice(0,3).map((r:any)=>`${r.from}-${r.to}(${r.type})`).join(', ')}`
      : ''

    const prevEpisodesText = previousEpisodes.slice(-3).map((e:any)=>`Episode ${e.episodeNumber}: ${e.title || ''}`).join('\n')
    const recentUserMsgs = recentMessages.filter((m:any)=>m.role==='user').slice(-5).map((m:any)=>m.content).join(' \n')

    const prompt = `Anda adalah AI penulis script. ${modesText}.\nProyek: ${project.title || ''} (${project.genre || ''}, tone: ${project.tone || ''})\nEpisode ${currentEpisode?.episodeNumber || ''}: ${currentEpisode?.title || ''}\n${styleText}\n${kgText}\nEpisode sebelumnya:\n${prevEpisodesText}\nPesan user terbaru: ${recentUserMsgs}\n\nInstruksi generasi (${generationMode}):\n- Jika KOMBINASI: patuhi KG untuk karakter/relasi/timeline dan ikuti Style DNA untuk gaya.\n- Jika KG saja: patuhi KG, JANGAN buat karakter/lokasi baru.\n- Jika Style DNA saja: fokus gaya penulisan, jangan ubah gaya.\n- Jika Normal: gunakan semua konteks seimbang.\n- Output gunakan format screenplay ringkas.\n\nUser: ${userMessage}\nAssistant:`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    return NextResponse.json({ success: true, text, context: { hasStyleDNA: !!combinedStyleDNA, hasKnowledgeGraph: !!knowledgeGraph, styleDNACount: styleDNAs.length } })
  } catch (error: any) {
    console.error('generate-script error:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 })
  }
}
