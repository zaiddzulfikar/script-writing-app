'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Sparkles, 
  Calendar, 
  Clock, 
  Users, 
  LogOut,
  Settings,
  Play
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { Project } from '@/types/database'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  orderBy 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import CreateProjectModal from '@/components/CreateProjectModal'

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      fetchProjects()
    }
  }, [user])

  const fetchProjects = async () => {
    if (!user) return
    
    try {
      // Use simple query without orderBy to avoid index issues
      const q = query(
        collection(db, 'projects'),
        where('userId', '==', user.id)
      )
      
      const querySnapshot = await getDocs(q)
      const projectsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Project[]
      
      // Sort by createdAt in memory
      projectsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      
      setProjects(projectsData)
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Gagal memuat proyek')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/auth/login')
    } catch (error) {
      toast.error('Gagal logout')
    }
  }

  const handleProjectCreated = () => {
    setShowCreateModal(false)
    fetchProjects()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-gray-900 flex-shrink-0" />
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Emtek Script Generation</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-600 hidden sm:block">Halo, {user?.displayName}</span>
              <button
                onClick={handleLogout}
                className="btn-ghost flex items-center space-x-1 text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-8"
        >
          <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">
            Selamat Datang, {user?.displayName}!
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Kelola proyek naskah Anda dan mulai menulis dengan bantuan AI
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 sm:mb-8 flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2 w-full sm:w-auto justify-center"
          >
            <Plus className="h-5 w-5" />
            <span>Buat Proyek Baru</span>
          </button>
          
        </motion.div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center py-12"
          >
            <Sparkles className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Belum ada proyek
            </h3>
            <p className="text-gray-500 mb-4">
              Mulai dengan membuat proyek script pertama Anda
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Buat Proyek Pertama
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="card hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/projects/project?id=${project.id}&episodeId=first`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {project.title}
                  </h3>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs min-w-[80px] text-center whitespace-nowrap overflow-hidden text-ellipsis">
                    {project.genre}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {project.synopsis}
                </p>
                
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{project.totalEpisodes} episode</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Dibuat {project.createdAt.toLocaleDateString('id-ID')}
                    </span>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        // Navigate to project page with first episode selected
                        router.push(`/projects/project?id=${project.id}&episodeId=first`)
                      }}
                      className="btn-secondary flex items-center space-x-1 text-sm"
                    >
                      <Play className="h-3 w-3" />
                      <span>Buka</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleProjectCreated}
        />
      )}
    </div>
  )
}
