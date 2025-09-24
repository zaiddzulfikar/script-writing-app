'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, Users, Clock, MapPin, Heart } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-600"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900 flex-shrink-0" />
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Emtek Script Generation</h1>
            </div>
            <nav className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <a
                href="/auth/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors px-2 sm:px-4 py-2 text-sm sm:text-base"
              >
                Masuk
              </a>
              <a
                href="/auth/register"
                className="btn-primary px-3 sm:px-4 py-2 text-sm sm:text-base"
              >
                Daftar
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
              Generate Naskah
              <span className="text-gray-600"> dengan AI</span>
            </h2>
            <p className="text-base sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto">
              Buat naskah film, sinetron, dan original series profesional dengan bantuan AI. 
              Cukup masukkan ide Anda, dan dapatkan naskah lengkap yang siap produksi dalam hitungan menit.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <a
                href="/auth/register"
                className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 w-full sm:w-auto"
              >
                Mulai Sekarang
              </a>
              <a
                href="/auth/login"
                className="btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 w-full sm:w-auto"
              >
                Masuk
              </a>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-16"
          >
            <div className="card text-center">
              <Sparkles className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Script Lengkap</h3>
              <p className="text-gray-600">Dapatkan script dengan dialog, narasi, dan direction yang lengkap</p>
            </div>
            <div className="card text-center">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Karakter Dinamis</h3>
              <p className="text-gray-600">AI akan membuat karakter yang menarik dan sesuai dengan tema</p>
            </div>
            <div className="card text-center">
              <Clock className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Cepat & Efisien</h3>
              <p className="text-gray-600">Generate script dalam hitungan menit, bukan hari</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Cara Kerja
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              Proses yang sederhana untuk menghasilkan script berkualitas tinggi
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                step: '1',
                title: 'Buat Proyek',
                description: 'Definisikan genre, karakter, dan setting cerita Anda'
              },
              {
                step: '2',
                title: 'Buat Episode',
                description: 'Buat episode-episode dengan struktur yang terorganisir'
              },
              {
                step: '3',
                title: 'Chat dengan AI',
                description: 'Berinteraksi dengan AI untuk mengembangkan script per episode'
              },
              {
                step: '4',
                title: 'Export Script',
                description: 'Download script final yang siap untuk produksi'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-lg sm:text-xl font-bold">Emtek Script Generation</span>
          </div>
          <p className="text-sm sm:text-base text-gray-400">
            Powered by Google Gemini AI • Built with Next.js & Firebase
          </p>
        </div>
      </footer>
    </div>
  )
}
