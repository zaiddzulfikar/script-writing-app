import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(_request: NextRequest) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })
    const prompt = `Buatkan ide proyek script untuk sinetron/drama Indonesia yang menarik. Berikan response dalam format JSON:
{
  "title": "Judul proyek yang menarik",
  "genre": "Romance|Drama|Komedi|Thriller|Misteri|Keluarga|Remaja|Horror|Action|Fantasi",
  "tone": "Serius|Lucu|Romantis|Menegangkan|Emosional|Inspiratif|Dramatis|Ringan",
  "totalEpisodes": 8-20,
  "synopsis": "Sinopsis detail"
}
Pastikan semua dalam bahasa Indonesia.`
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in response');
    }
    
    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 })
  }
}


