'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Brain, Palette, Sparkles, FileText, Loader2 } from 'lucide-react'

export type AutoFillMode = 'knowledge-graph' | 'style-dna' | 'both' | 'none'

interface AiAutoFillOptionsModalProps {
  onClose: () => void
  onSelectMode: (mode: AutoFillMode) => void
  hasKnowledgeGraph: boolean
  hasStyleDNA: boolean
  loading?: boolean
}

export default function AiAutoFillOptionsModal({ 
  onClose, 
  onSelectMode, 
  hasKnowledgeGraph, 
  hasStyleDNA,
  loading = false 
}: AiAutoFillOptionsModalProps) {
  const [selectedMode, setSelectedMode] = useState<AutoFillMode | null>(null)

  const options = [
    {
      id: 'knowledge-graph' as AutoFillMode,
      title: 'Knowledge Graph',
      description: 'Menggunakan karakter, lokasi, dan plot dari analisis naskah sebelumnya',
      icon: Brain,
      available: hasKnowledgeGraph,
      color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
      disabledColor: 'bg-gray-50 border-gray-200 text-gray-400'
    },
    {
      id: 'style-dna' as AutoFillMode,
      title: 'Style DNA',
      description: 'Menggunakan gaya penulisan, tema, dan karakteristik dari analisis naskah sebelumnya',
      icon: Palette,
      available: hasStyleDNA,
      color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
      disabledColor: 'bg-gray-50 border-gray-200 text-gray-400'
    },
    {
      id: 'both' as AutoFillMode,
      title: 'Keduanya',
      description: 'Menggunakan Knowledge Graph dan Style DNA untuk hasil yang paling konsisten',
      icon: Sparkles,
      available: hasKnowledgeGraph && hasStyleDNA,
      color: 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-purple-100',
      disabledColor: 'bg-gray-50 border-gray-200 text-gray-400'
    },
    {
      id: 'none' as AutoFillMode,
      title: 'Tidak Menggunakan',
      description: 'Membuat episode yang benar-benar fresh tanpa referensi analisis sebelumnya',
      icon: FileText,
      available: true,
      color: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
      disabledColor: 'bg-gray-50 border-gray-200 text-gray-400'
    }
  ]

  const handleSelectMode = (mode: AutoFillMode) => {
    setSelectedMode(mode)
    onSelectMode(mode)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-[9999]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col autofill-modal-content modal-mobile"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Pilih Mode AI Auto-Fill</h2>
            <p className="text-sm text-gray-600 mt-1">
              Pilih bagaimana AI akan mengisi form episode baru
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 mobile-scroll">
          <div className="grid gap-4">
            {options.map((option) => {
              const Icon = option.icon
              const isAvailable = option.available
              const isSelected = selectedMode === option.id
              const isDisabled = !isAvailable || loading
              
              return (
                <motion.button
                  key={option.id}
                  onClick={() => isAvailable && !loading && handleSelectMode(option.id)}
                  disabled={isDisabled}
                  className={`
                    relative p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 text-left mobile-touch-target
                    ${isAvailable 
                      ? option.color 
                      : option.disabledColor
                    }
                    ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                    ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  whileHover={!isDisabled ? { scale: 1.02 } : {}}
                  whileTap={!isDisabled ? { scale: 0.98 } : {}}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`
                      p-2 rounded-lg
                      ${isAvailable 
                        ? 'bg-white bg-opacity-50' 
                        : 'bg-gray-100'
                      }
                    `}>
                      <Icon className={`h-5 w-5 ${isAvailable ? '' : 'text-gray-400'}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className={`font-medium ${isAvailable ? '' : 'text-gray-400'}`}>
                          {option.title}
                        </h3>
                        {!isAvailable && (
                          <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded">
                            Tidak tersedia
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${isAvailable ? 'text-gray-600' : 'text-gray-400'}`}>
                        {option.description}
                      </p>
                    </div>

                    {loading && selectedMode === option.id && (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      </div>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Status Information */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Status Analisis Tersedia:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Brain className={`h-4 w-4 ${hasKnowledgeGraph ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className={hasKnowledgeGraph ? 'text-gray-700' : 'text-gray-500'}>
                  Knowledge Graph: {hasKnowledgeGraph ? 'Tersedia' : 'Belum tersedia'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Palette className={`h-4 w-4 ${hasStyleDNA ? 'text-purple-500' : 'text-gray-400'}`} />
                <span className={hasStyleDNA ? 'text-gray-700' : 'text-gray-500'}>
                  Style DNA: {hasStyleDNA ? 'Tersedia' : 'Belum tersedia'}
                </span>
              </div>
            </div>
            {!hasKnowledgeGraph && !hasStyleDNA && (
              <p className="text-xs text-gray-500 mt-2">
                💡 Upload dan analisis naskah terlebih dahulu untuk menggunakan fitur Knowledge Graph dan Style DNA
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
