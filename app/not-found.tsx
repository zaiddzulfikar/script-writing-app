import { Sparkles, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-6 sm:mb-8">
          <Sparkles className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4">Halaman Tidak Ditemukan</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Halaman yang Anda cari tidak ditemukan.
          </p>
        </div>
        
        <div className="space-y-4">
          <a
            href="/"
            className="btn-primary w-full flex items-center justify-center space-x-2 py-3"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Beranda</span>
          </a>
        </div>
      </div>
    </div>
  )
}
