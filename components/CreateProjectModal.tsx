'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Sparkles, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { generateProjectSuggestion } from '@/lib/gemini'

const projectSchema = z.object({
  title: z.string().min(1, 'Judul harus diisi'),
  genre: z.string().min(1, 'Genre harus dipilih'),
  totalEpisodes: z.number().min(1, 'Minimal 1 episode').max(100, 'Maksimal 100 episode'),
  synopsis: z.string().min(1, 'Sinopsis harus diisi'),
  tone: z.string().min(1, 'Tone harus dipilih'),
})

type ProjectFormData = z.infer<typeof projectSchema>

const genres = [
  'Romance', 'Drama', 'Komedi', 'Thriller', 'Misteri', 'Keluarga', 'Remaja', 'Horror', 'Action', 'Fantasi'
]

const tones = [
  'Serius', 'Lucu', 'Romantis', 'Menegangkan', 'Emosional', 'Inspiratif', 'Dramatis', 'Ringan'
]

interface CreateProjectModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateProjectModal({ onClose, onSuccess }: CreateProjectModalProps) {
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema)
  })

  const handleAiAutoFill = async () => {
    setAiLoading(true)
    try {
      // Generate project suggestion using server API
      const suggestion = await generateProjectSuggestion()
      
      // Fill form with AI suggestion
      setValue('title', suggestion.title)
      setValue('genre', suggestion.genre)
      setValue('tone', suggestion.tone)
      setValue('totalEpisodes', suggestion.totalEpisodes)
      setValue('synopsis', suggestion.synopsis)
      
      toast.success('Form berhasil diisi otomatis oleh AI!')
    } catch (error: any) {
      console.error('Error generating AI suggestion:', error)
      toast.error('Gagal mengisi form otomatis. Silakan coba lagi.')
    } finally {
      setAiLoading(false)
    }
  }

  const onSubmit = async (data: ProjectFormData) => {
    if (!user) return

    setLoading(true)
    try {
      const projectData = {
        title: data.title,
        genre: data.genre,
        totalEpisodes: data.totalEpisodes,
        synopsis: data.synopsis,
        tone: data.tone,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      console.log('Creating project with data:', projectData)
      const projectRef = await addDoc(collection(db, 'projects'), projectData)
      
      toast.success('Proyek berhasil dibuat!')
      onSuccess()
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error(`Gagal membuat proyek: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-[9999] modal-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto modal-content modal-mobile"
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Buat Proyek Baru</h2>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleAiAutoFill}
              disabled={aiLoading}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Isi Otomatis oleh AI</span>
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
          



          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Judul Proyek
            </label>
            <input
              {...register('title')}
              type="text"
              placeholder="Contoh: Cinta di Kampus"
              className="input-field"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>


          {/* Genre & Tone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Genre
              </label>
              <select {...register('genre')} className="input-field pr-10">
                <option value="">Pilih Genre</option>
                {genres.map((genre) => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
              {errors.genre && (
                <p className="text-red-500 text-sm mt-1">{errors.genre.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tone
              </label>
              <select {...register('tone')} className="input-field pr-10">
                <option value="">Pilih Tone</option>
                {tones.map((tone) => (
                  <option key={tone} value={tone}>{tone}</option>
                ))}
              </select>
              {errors.tone && (
                <p className="text-red-500 text-sm mt-1">{errors.tone.message}</p>
              )}
            </div>
          </div>

          {/* Episodes & Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jumlah Episode
            </label>
            <input
              {...register('totalEpisodes', { valueAsNumber: true })}
              type="number"
              min="1"
              max="100"
              placeholder="12"
              className="input-field"
            />
            {errors.totalEpisodes && (
              <p className="text-red-500 text-sm mt-1">{errors.totalEpisodes.message}</p>
            )}
          </div>


          {/* Synopsis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sinopsis
            </label>
            <textarea
              {...register('synopsis')}
              rows={4}
              placeholder="Ceritakan ringkasan cerita proyek Anda..."
              className="input-field"
            />
            {errors.synopsis && (
              <p className="text-red-500 text-sm mt-1">{errors.synopsis.message}</p>
            )}
          </div>




            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
                className="btn-primary flex items-center space-x-2 mobile-touch-target"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Membuat...</span>
                  </>
                ) : (
                  <span>Buat Proyek</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
