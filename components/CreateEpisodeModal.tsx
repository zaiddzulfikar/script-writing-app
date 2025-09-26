'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Project } from '@/types/database'
import { generateEpisodeSuggestion, generateFallbackEpisodeSuggestion, generateEpisodeSuggestionWithMode } from '@/lib/gemini'
import AiAutoFillOptionsModal, { AutoFillMode } from './AiAutoFillOptionsModal'

const episodeSchema = z.object({
  title: z.string().min(1, 'Judul episode harus diisi'),
  synopsis: z.string().optional(),
  setting: z.string().min(1, 'Setting/Lokasi harus diisi'),
})

type EpisodeFormData = z.infer<typeof episodeSchema>

interface CreateEpisodeModalProps {
  project: Project
  onClose: () => void
  onSuccess: (newEpisodeId: string) => void
}

export default function CreateEpisodeModal({ project, onClose, onSuccess }: CreateEpisodeModalProps) {
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [episodeNumber, setEpisodeNumber] = useState(1)
  const [showAutoFillOptions, setShowAutoFillOptions] = useState(false)
  const [hasKnowledgeGraph, setHasKnowledgeGraph] = useState(false)
  const [hasStyleDNA, setHasStyleDNA] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<EpisodeFormData>({
    resolver: zodResolver(episodeSchema)
  })

  // Get next episode number and check available analyses
  useEffect(() => {
    const getNextEpisodeNumber = async () => {
      try {
        // First try with complex query, if it fails, use simple query
        let q = query(
          collection(db, 'episodes'),
          where('projectId', '==', project.id),
          where('episodeNumber', '>=', 1)
        )
        
        let querySnapshot
        try {
          querySnapshot = await getDocs(q)
        } catch (indexError) {
          console.log('Index not found, using simple query...')
          // Fallback: use simple query without episodeNumber filter
          q = query(
            collection(db, 'episodes'),
            where('projectId', '==', project.id)
          )
          querySnapshot = await getDocs(q)
        }
        
        const existingNumbers = querySnapshot.docs.map(doc => doc.data().episodeNumber)
        const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1
        setEpisodeNumber(nextNumber)
      } catch (error) {
        console.error('Error getting episode number:', error)
        setEpisodeNumber(1)
      }
    }

    const checkAvailableAnalyses = async () => {
      try {
        // Check for Knowledge Graph
        const knowledgeGraphQuery = query(
          collection(db, 'knowledgeGraphs'),
          where('projectId', '==', project.id)
        )
        const knowledgeGraphSnapshot = await getDocs(knowledgeGraphQuery)
        setHasKnowledgeGraph(!knowledgeGraphSnapshot.empty)

        // Check for Style DNA
        const styleDNAQuery = query(
          collection(db, 'styleDNA'),
          where('projectId', '==', project.id)
        )
        const styleDNASnapshot = await getDocs(styleDNAQuery)
        setHasStyleDNA(!styleDNASnapshot.empty)
      } catch (error) {
        console.error('Error checking available analyses:', error)
      }
    }

    getNextEpisodeNumber()
    checkAvailableAnalyses()
  }, [project.id])

  const handleAiAutoFill = () => {
    setShowAutoFillOptions(true)
  }

  const handleAutoFillMode = async (mode: AutoFillMode) => {
    setAiLoading(true)
    setShowAutoFillOptions(false)
    
    try {
      // Always use client-side generation since Firebase Hosting is static
      // We'll enhance the client-side generation to support different modes
      let suggestion

      if (mode === 'none') {
        // Use client-side generation without any analysis data
        suggestion = await generateEpisodeSuggestion(project, episodeNumber)
      } else {
        // For other modes, we'll use client-side generation with mode-specific context
        // This is a workaround since API routes don't work in static hosting
        suggestion = await generateEpisodeSuggestionWithMode(project, episodeNumber, mode, hasKnowledgeGraph, hasStyleDNA)
      }

      // Fill form with AI suggestion
      setValue('title', suggestion.title)
      setValue('synopsis', suggestion.synopsis)
      setValue('setting', suggestion.setting)

      const modeText = {
        'knowledge-graph': 'Knowledge Graph',
        'style-dna': 'Style DNA',
        'both': 'Knowledge Graph & Style DNA',
        'none': 'Fresh Episode'
      }

      toast.success(`Form berhasil diisi otomatis menggunakan ${modeText[mode]}!`)
    } catch (error: any) {
      console.error('Error generating AI suggestion:', error)
      
      // Use fallback if AI is not available
      if (error.message?.includes('quota') || error.message?.includes('429')) {
        const fallbackSuggestion = generateFallbackEpisodeSuggestion(project, episodeNumber)
        
        setValue('title', fallbackSuggestion.title)
        setValue('synopsis', fallbackSuggestion.synopsis)
        setValue('setting', fallbackSuggestion.setting)
        
        toast.success('Form diisi dengan template default (AI tidak tersedia)')
      } else {
        toast.error('Gagal mengisi form otomatis. Silakan coba lagi.')
      }
    } finally {
      setAiLoading(false)
    }
  }

  const onSubmit = async (data: EpisodeFormData) => {
    setLoading(true)
    try {
      const episodeData = {
        projectId: project.id,
        episodeNumber,
        title: data.title,
        synopsis: data.synopsis || '',
        setting: data.setting,
        script: '',
        status: 'draft' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const docRef = await addDoc(collection(db, 'episodes'), episodeData)
      toast.success('Episode berhasil dibuat!')
      onSuccess(docRef.id)
    } catch (error) {
      console.error('Error creating episode:', error)
      toast.error('Gagal membuat episode')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-[9998] modal-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ 
          opacity: showAutoFillOptions ? 0 : 1, 
          scale: showAutoFillOptions ? 0.8 : 1 
        }}
        transition={{ duration: 0.2 }}
        className={`bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col modal-content modal-mobile ${
          showAutoFillOptions ? 'pointer-events-none' : ''
        }`}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Buat Episode Baru</h2>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleAiAutoFill}
              disabled={aiLoading}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
              title="Pilih mode AI auto-fill untuk mengisi form episode"
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">AI Auto-Fill</span>
              <span className="sm:hidden">AI</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto mobile-scroll">
          <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Proyek:</span> {project.title}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Episode:</span> {episodeNumber}
              </p>
            </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Judul Episode
            </label>
            <input
              {...register('title')}
              type="text"
              placeholder="Contoh: Pertemuan Pertama"
              className="input-field"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sinopsis Episode (Opsional)
            </label>
            <textarea
              {...register('synopsis')}
              rows={3}
              placeholder="Ringkasan singkat tentang episode ini..."
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Setting/Lokasi
            </label>
            <input
              {...register('setting')}
              type="text"
              placeholder="Contoh: Jakarta, Sekolah, Rumah sakit"
              className="input-field"
            />
            {errors.setting && (
              <p className="text-red-500 text-sm mt-1">{errors.setting.message}</p>
            )}
          </div>



          </form>
        </div>

        <div className="flex justify-end space-x-3 p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary mobile-touch-target"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            onClick={handleSubmit(onSubmit)}
            className="btn-primary flex items-center space-x-2 mobile-touch-target"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Membuat...</span>
              </>
            ) : (
              <span>Buat Episode</span>
            )}
          </button>
        </div>
      </motion.div>

      {/* AI Auto-Fill Options Modal */}
      {showAutoFillOptions && (
        <AiAutoFillOptionsModal
          onClose={() => setShowAutoFillOptions(false)}
          onSelectMode={handleAutoFillMode}
          hasKnowledgeGraph={hasKnowledgeGraph}
          hasStyleDNA={hasStyleDNA}
          loading={aiLoading}
        />
      )}
    </div>
  )
}
