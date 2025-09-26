'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Palette, Calendar, Eye, Check } from 'lucide-react'
import { collection, query, where, getDocs, orderBy, getDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { StyleDNA } from '@/types/style-dna'

interface StyleDNASelectorModalProps {
  projectId: string
  onClose: () => void
  onSelect: (styleDNA: StyleDNA | null) => void
  loading?: boolean
}

export default function StyleDNASelectorModal({ 
  projectId, 
  onClose, 
  onSelect, 
  loading = false 
}: StyleDNASelectorModalProps) {
  const [styleDNAs, setStyleDNAs] = useState<StyleDNA[]>([])
  const [loadingStyleDNAs, setLoadingStyleDNAs] = useState(true)
  const [selectedStyleDNA, setSelectedStyleDNA] = useState<StyleDNA | null>(null)
  const [scriptNames, setScriptNames] = useState<{[key: string]: string}>({})

  // Load Style DNAs for the project
  useEffect(() => {
    const loadStyleDNAs = async () => {
      try {
        setLoadingStyleDNAs(true)
        const q = query(
          collection(db, 'styleDNA'),
          where('projectId', '==', projectId),
          orderBy('createdAt', 'desc')
        )
        
        const querySnapshot = await getDocs(q)
        const styleDNAs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        })) as StyleDNA[]
        
        // Load script names for each Style DNA
        const scriptNamesMap: {[key: string]: string} = {}
        for (const styleDNA of styleDNAs) {
          if (styleDNA.scriptId) {
            try {
              const scriptDoc = await getDoc(doc(db, 'scripts', styleDNA.scriptId))
              if (scriptDoc.exists()) {
                const scriptData = scriptDoc.data()
                scriptNamesMap[styleDNA.scriptId] = scriptData.fileName || 'Unknown Script'
              }
            } catch (error) {
              console.error('Error loading script name:', error)
              scriptNamesMap[styleDNA.scriptId] = 'Unknown Script'
            }
          }
        }
        
        setScriptNames(scriptNamesMap)
        setStyleDNAs(styleDNAs)
      } catch (error) {
        console.error('Error loading Style DNAs:', error)
      } finally {
        setLoadingStyleDNAs(false)
      }
    }

    if (projectId) {
      loadStyleDNAs()
    }
  }, [projectId])

  const handleSelect = (styleDNA: StyleDNA | null) => {
    setSelectedStyleDNA(styleDNA)
    onSelect(styleDNA)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-2 sm:p-4 z-[9999]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Pilih Style DNA</h2>
            <p className="text-sm text-gray-600 mt-1">
              Pilih Style DNA yang ingin digunakan untuk chat
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

        <div className="flex-1 overflow-y-auto p-6">
          {loadingStyleDNAs ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Memuat Style DNA...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* No Style DNA Option */}
              <motion.button
                onClick={() => handleSelect(null)}
                disabled={loading}
                className={`
                  w-full p-4 rounded-lg border-2 transition-all duration-200 text-left
                  ${selectedStyleDNA === null 
                    ? 'border-red-500 bg-red-50 ring-2 ring-red-500 ring-offset-2' 
                    : 'border-gray-200 bg-white hover:border-red-300 hover:bg-red-50'
                  }
                  ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                `}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`
                      p-2 rounded-lg
                      ${selectedStyleDNA === null 
                        ? 'bg-red-100' 
                        : 'bg-gray-100'
                      }
                    `}>
                      <X className={`h-5 w-5 ${
                        selectedStyleDNA === null ? 'text-red-600' : 'text-gray-600'
                      }`} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium ${
                        selectedStyleDNA === null ? 'text-red-900' : 'text-gray-900'
                      }`}>
                        Tidak menggunakan Style DNA
                      </h3>
                      {selectedStyleDNA === null && (
                        <Check className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    
                    <p className={`text-sm mt-1 ${
                      selectedStyleDNA === null ? 'text-red-700' : 'text-gray-600'
                    }`}>
                      Chat tanpa Style DNA - menggunakan AI default
                    </p>
                  </div>
                </div>
              </motion.button>

              {/* Style DNA Options */}
              {styleDNAs.length === 0 ? (
                <div className="text-center py-8">
                  <Palette className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">
                    Belum ada Style DNA yang tersedia
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
              {styleDNAs.map((styleDNA) => (
                <motion.button
                  key={styleDNA.id}
                  onClick={() => handleSelect(styleDNA)}
                  disabled={loading}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all duration-200 text-left
                    ${selectedStyleDNA?.id === styleDNA.id 
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-offset-2' 
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                    }
                    ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                  `}
                  whileHover={!loading ? { scale: 1.02 } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`
                        p-2 rounded-lg
                        ${selectedStyleDNA?.id === styleDNA.id 
                          ? 'bg-blue-100' 
                          : 'bg-gray-100'
                        }
                      `}>
                        <Palette className={`h-5 w-5 ${
                          selectedStyleDNA?.id === styleDNA.id ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${
                          selectedStyleDNA?.id === styleDNA.id ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {scriptNames[styleDNA.scriptId] || styleDNA.thematicVoice?.thematicVoice || 'Style DNA'}
                        </h3>
                        {selectedStyleDNA?.id === styleDNA.id && (
                          <Check className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      
                      <p className={`text-sm mt-1 ${
                        selectedStyleDNA?.id === styleDNA.id ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        {styleDNA.thematicVoice?.messagePhilosophy?.[0] || 'Style DNA untuk proyek ini'}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(styleDNA.createdAt)}</span>
                        </div>
                        {styleDNA.scriptId && (
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>Script ID: {styleDNA.scriptId.slice(0, 8)}...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
                </div>
              )}
            </div>
          )}
        </div>

        {(styleDNAs.length > 0 || selectedStyleDNA !== null) && (
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Batal
            </button>
            <button
              onClick={() => selectedStyleDNA && handleSelect(selectedStyleDNA)}
              disabled={!selectedStyleDNA || loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Palette className="h-4 w-4" />
                  <span>Gunakan Style DNA</span>
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
