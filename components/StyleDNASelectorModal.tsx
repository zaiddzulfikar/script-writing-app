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
  const [selectedStyleDNA, setSelectedStyleDNA] = useState<StyleDNA | null | undefined>(undefined)
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
    console.log('🎨 Style DNA selected:', styleDNA ? styleDNA.id : 'null (no Style DNA)')
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
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-gray-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Palette className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Pilih Style DNA</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Pilih Style DNA yang ingin digunakan untuk chat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loadingStyleDNAs ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Memuat Style DNA...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* No Style DNA Option */}
              <motion.button
                onClick={() => handleSelect(null)}
                disabled={loading}
                className={`
                  w-full p-4 rounded-xl border-2 transition-all duration-200 text-left group
                  ${selectedStyleDNA === undefined 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm'
                  }
                  ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                `}
                whileHover={!loading ? { scale: 1.01 } : {}}
                whileTap={!loading ? { scale: 0.99 } : {}}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`
                      p-3 rounded-xl transition-colors
                      ${selectedStyleDNA === undefined 
                        ? 'bg-blue-100' 
                        : 'bg-gray-100 group-hover:bg-blue-100'
                      }
                    `}>
                      <X className={`h-5 w-5 ${
                        selectedStyleDNA === undefined ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'
                      }`} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold text-lg ${
                        selectedStyleDNA === undefined ? 'text-blue-900' : 'text-gray-900 group-hover:text-blue-900'
                      }`}>
                        Tidak menggunakan Style DNA
                      </h3>
                      {selectedStyleDNA === undefined && (
                        <div className="p-1 bg-blue-500 rounded-full">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <p className={`text-sm mt-1 ${
                      selectedStyleDNA === undefined ? 'text-blue-700' : 'text-gray-500 group-hover:text-blue-700'
                    }`}>
                      Chat tanpa Style DNA - menggunakan AI default
                    </p>
                  </div>
                </div>
              </motion.button>

              {/* Style DNA Options */}
              {styleDNAs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 rounded-2xl w-fit mx-auto mb-4">
                    <Palette className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Style DNA</h3>
                  <p className="text-gray-500">
                    Analisis naskah terlebih dahulu untuk membuat Style DNA
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
              {styleDNAs.map((styleDNA) => (
                <motion.button
                  key={styleDNA.id}
                  onClick={() => handleSelect(styleDNA)}
                  disabled={loading}
                  className={`
                    w-full p-4 rounded-xl border-2 transition-all duration-200 text-left group
                    ${selectedStyleDNA?.id === styleDNA.id 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm'
                    }
                    ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                  `}
                  whileHover={!loading ? { scale: 1.01 } : {}}
                  whileTap={!loading ? { scale: 0.99 } : {}}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`
                        p-3 rounded-xl transition-colors
                        ${selectedStyleDNA?.id === styleDNA.id 
                          ? 'bg-blue-100' 
                          : 'bg-gray-100 group-hover:bg-blue-100'
                        }
                      `}>
                        <Palette className={`h-5 w-5 ${
                          selectedStyleDNA?.id === styleDNA.id ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'
                        }`} />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-semibold text-lg ${
                          selectedStyleDNA?.id === styleDNA.id ? 'text-blue-900' : 'text-gray-900 group-hover:text-blue-900'
                        }`}>
                          {scriptNames[styleDNA.scriptId] || styleDNA.thematicVoice?.thematicVoice || 'Style DNA'}
                        </h3>
                        {selectedStyleDNA?.id === styleDNA.id && (
                          <div className="p-1 bg-blue-500 rounded-full">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <p className={`text-sm mt-1 ${
                        selectedStyleDNA?.id === styleDNA.id ? 'text-blue-700' : 'text-gray-500 group-hover:text-blue-700'
                      }`}>
                        {styleDNA.thematicVoice?.messagePhilosophy?.[0] || 'Style DNA untuk proyek ini'}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-3 text-xs">
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
                          selectedStyleDNA?.id === styleDNA.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(styleDNA.createdAt)}</span>
                        </div>
                        {styleDNA.scriptId && (
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
                            selectedStyleDNA?.id === styleDNA.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <Eye className="h-3 w-3" />
                            <span>ID: {styleDNA.scriptId.slice(0, 8)}...</span>
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

        {(styleDNAs.length > 0 || selectedStyleDNA !== undefined) && (
          <div className="flex justify-between items-center p-6 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
            <div className="text-sm text-gray-500">
              {selectedStyleDNA ? (
                <span className="flex items-center space-x-2">
                  <Palette className="h-4 w-4 text-blue-500" />
                  <span>Style DNA terpilih: <span className="font-medium text-gray-700">
                    {scriptNames[selectedStyleDNA.scriptId] || selectedStyleDNA.thematicVoice?.thematicVoice || 'Style DNA'}
                  </span></span>
                </span>
              ) : selectedStyleDNA === null ? (
                <span className="flex items-center space-x-2">
                  <X className="h-4 w-4 text-gray-500" />
                  <span>Mode: <span className="font-medium text-gray-700">Tanpa Style DNA</span></span>
                </span>
              ) : (
                <span>Pilih Style DNA untuk melanjutkan</span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                disabled={loading}
              >
                Batal
              </button>
              <button
                onClick={() => selectedStyleDNA && handleSelect(selectedStyleDNA)}
                disabled={!selectedStyleDNA || loading}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 hover:shadow-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        )}
      </motion.div>
    </div>
  )
}
