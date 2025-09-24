'use client'

import { useState, useEffect, useRef } from 'react'
import './project-detail.css'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Plus, 
  MessageSquare, 
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  Eye
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { Project, Episode, ChatMessage } from '@/types/database'
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  orderBy,
  onSnapshot,
  deleteDoc,
  updateDoc
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import ChatInterface from '@/components/ChatInterface'
import CreateEpisodeModal from '@/components/CreateEpisodeModal'
import PDFExtractor from '@/components/PDFExtractor'
import ScriptAnalysis from '@/components/ScriptAnalysis'
import AnalysisHistory from '@/components/AnalysisHistory'
import AnalysisViewer from '@/components/AnalysisViewer'

export default function ProjectDetailPage() {
  const [project, setProject] = useState<Project | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateEpisode, setShowCreateEpisode] = useState(false)
  const [showPDFExtractor, setShowPDFExtractor] = useState(false)
  const [showScriptAnalysis, setShowScriptAnalysis] = useState(false)
  const [showAnalysisHistory, setShowAnalysisHistory] = useState(false)
  const [showAnalysisViewer, setShowAnalysisViewer] = useState(false)
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null)
  const [scripts, setScripts] = useState<any[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<{type: 'episode' | 'project' | null, id: string | null}>({type: null, id: null})
  const [showFullProjectInfo, setShowFullProjectInfo] = useState(false)
  const [pendingNewEpisodeId, setPendingNewEpisodeId] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [lastSelectedEpisodeId, setLastSelectedEpisodeId] = useState<string | null>(null)
  const [episodeSelectionLocked, setEpisodeSelectionLocked] = useState(false)
  const episodeSelectionRef = useRef<string | null>(null)
  const lastSnapshotTimeRef = useRef<number>(0)
  const { user } = useAuth()
  const router = useRouter()
  const [projectId, setProjectId] = useState<string>('')
  
  // Mobile responsive state
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [showMobileProjectInfo, setShowMobileProjectInfo] = useState(false)
  

  useEffect(() => {
    // Get project ID and episode ID from URL query parameters
    const urlParams = new URLSearchParams(window.location.search)
    const id = urlParams.get('id')
    const episodeId = urlParams.get('episodeId')
    
    if (id) {
      setProjectId(id)
      if (episodeId) {
        // If we have an episode ID, we'll select it once episodes are loaded
        setPendingNewEpisodeId(episodeId)
        setLastSelectedEpisodeId(episodeId)
        episodeSelectionRef.current = episodeId
        setIsInitialLoad(false) // We have a specific episode to load
        setEpisodeSelectionLocked(true) // Lock selection to prevent auto-redirect
      }
    } else {
      router.push('/dashboard')
    }
  }, [router])

  // Mobile responsive detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Mobile touch interactions
  useEffect(() => {
    if (!isMobile) return

    const handleTouchStart = (e: TouchEvent) => {
      // Add touch feedback for better mobile UX
      const target = e.target as HTMLElement
      if (target.closest('button, [role="button"]')) {
        target.style.transform = 'scale(0.98)'
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('button, [role="button"]')) {
        target.style.transform = 'scale(1)'
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isMobile])

  useEffect(() => {
    if (projectId && user) {
      fetchProject()
      fetchEpisodes()
      fetchScripts()
    }
  }, [projectId, user])


  // Handle ESC key to close delete confirmation and status dropdown
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteConfirm.type) {
          setDeleteConfirm({type: null, id: null})
        }
      }
    }
    
    const handleClickOutside = (e: MouseEvent) => {
      // Handle click outside if needed
    }
    
    if (deleteConfirm.type) {
      document.addEventListener('keydown', handleEsc)
      document.addEventListener('click', handleClickOutside)
      return () => {
        document.removeEventListener('keydown', handleEsc)
        document.removeEventListener('click', handleClickOutside)
      }
    }
  }, [deleteConfirm.type])

  // Timeout mechanism to reset episode selection lock if it gets stuck
  useEffect(() => {
    if (episodeSelectionLocked && pendingNewEpisodeId) {
      const timeout = setTimeout(() => {
        console.log('⚠️ Episode selection timeout - resetting lock after 15 seconds')
        console.log('Current state:', {
          episodeSelectionLocked,
          pendingNewEpisodeId,
          selectedEpisode: selectedEpisode?.id,
          episodesCount: episodes.length
        })
        
        // Only reset if the episode is still not found after timeout
        const episodeExists = episodes.some(ep => ep.id === pendingNewEpisodeId)
        if (!episodeExists) {
          console.log('❌ Episode still not found after timeout, resetting state')
          setEpisodeSelectionLocked(false)
          setPendingNewEpisodeId(null)
          setIsInitialLoad(true) // Allow auto-selection again
        } else {
          console.log('✅ Episode found during timeout, keeping current state')
        }
      }, 15000) // 15 second timeout (increased from 10)
      
      return () => clearTimeout(timeout)
    }
  }, [episodeSelectionLocked, pendingNewEpisodeId, selectedEpisode, episodes.length])

  const fetchProject = async () => {
    try {
      const projectDoc = await getDoc(doc(db, 'projects', projectId))
      if (projectDoc.exists()) {
        const projectData = {
          id: projectDoc.id,
          ...projectDoc.data(),
          createdAt: projectDoc.data().createdAt.toDate(),
          updatedAt: projectDoc.data().updatedAt.toDate()
        } as Project
        setProject(projectData)
      } else {
        toast.error('Proyek tidak ditemukan')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      toast.error('Gagal memuat proyek')
    }
  }

  const fetchEpisodes = async () => {
    try {
      // Set loading timeout to prevent infinite loading
      const loadingTimeout = setTimeout(() => {
        console.log('⏰ Episode loading timeout - setting loading to false')
        setLoading(false)
      }, 10000) // 10 second timeout
      
      // Use simple query first to avoid index issues
      const q = query(
        collection(db, 'episodes'),
        where('projectId', '==', projectId)
      )
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log('📡 onSnapshot triggered, processing data...')
        
        // Debouncing: Prevent rapid successive calls
        const now = Date.now()
        const timeSinceLastSnapshot = now - lastSnapshotTimeRef.current
        if (timeSinceLastSnapshot < 300) { // Increased to 300ms
          console.log('⏱️ Debouncing onSnapshot call (too soon after last call)')
          return
        }
        lastSnapshotTimeRef.current = now
        
        console.log('=== EPISODES SNAPSHOT DEBUG ===')
        console.log('episodeSelectionLocked:', episodeSelectionLocked)
        console.log('isInitialLoad:', isInitialLoad)
        console.log('selectedEpisode:', selectedEpisode?.id)
        console.log('pendingNewEpisodeId:', pendingNewEpisodeId)
        console.log('lastSelectedEpisodeId:', lastSelectedEpisodeId)
        console.log('episodeSelectionRef.current:', episodeSelectionRef.current)
        const episodesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate()
        })) as Episode[]
        
        // Sort by episodeNumber in memory
        episodesData.sort((a, b) => a.episodeNumber - b.episodeNumber)
        
        setEpisodes(episodesData)
        clearTimeout(loadingTimeout) // Clear timeout when data is loaded
        
        // FUNDAMENTAL SOLUTION: Complete episode selection isolation with ref tracking
        
        // 1. HIGHEST PRIORITY: Handle pending new episode selection
        if (pendingNewEpisodeId && episodesData.length > 0) {
          console.log('=== CONDITION 1: HANDLING PENDING EPISODE SELECTION ===')
          console.log('Handling pending episode selection:', pendingNewEpisodeId)
          console.log('Current episodeSelectionLocked:', episodeSelectionLocked)
          console.log('Current selectedEpisode:', selectedEpisode?.id)
          console.log('Available episodes:', episodesData.map(ep => ({ id: ep.id, number: ep.episodeNumber })))
          
          let targetEpisode: Episode | undefined
          
          if (pendingNewEpisodeId === 'first') {
            // Special case: select first episode
            console.log('Selecting first episode as requested')
            targetEpisode = episodesData[0]
          } else {
            // Regular case: find specific episode by ID
            targetEpisode = episodesData.find(ep => ep.id === pendingNewEpisodeId)
          }
          
          if (targetEpisode) {
            console.log('✅ Found target episode, selecting it:', targetEpisode.id)
            console.log('Episode details:', { id: targetEpisode.id, number: targetEpisode.episodeNumber, title: targetEpisode.title })
            
            setSelectedEpisode(targetEpisode)
            setLastSelectedEpisodeId(targetEpisode.id)
            episodeSelectionRef.current = targetEpisode.id
            setPendingNewEpisodeId(null)
            setIsInitialLoad(false)
            setEpisodeSelectionLocked(true) // Lock selection
            console.log('🔒 Episode selection locked after pending episode selection')
            
            // Update URL to include episode ID
            const url = new URL(window.location.href)
            url.searchParams.set('episodeId', targetEpisode.id)
            window.history.replaceState({}, '', url.toString())
            console.log('🔗 URL updated with episode ID:', targetEpisode.id)
            
            setLoading(false)
            return // Exit early
          } else {
            console.log('⏳ Target episode not found yet, waiting for it')
            console.log('Looking for episode ID:', pendingNewEpisodeId)
            console.log('Available episode IDs:', episodesData.map(ep => ep.id))
            // If target episode not found yet, wait for it - don't auto-select episode 1
            setLoading(false)
            return // Exit early - wait for the episode to appear
          }
        }
        
        // 2. If episode selection is locked AND no pending episode, do NOTHING - just update episodes list
        if (episodeSelectionLocked && !pendingNewEpisodeId) {
          console.log('=== CONDITION 2: EPISODE SELECTION LOCKED (NO PENDING) ===')
          console.log('🔒 Episode selection is locked, skipping auto-selection logic')
          console.log('Current selected episode:', selectedEpisode?.id)
          console.log('Episodes available:', episodesData.length)
          console.log('Available episodes:', episodesData.map(ep => ({ id: ep.id, number: ep.episodeNumber })))
          
          // Only update the selected episode data if it exists, but don't change selection
          if (selectedEpisode && episodesData.length > 0) {
            const currentSelectedEpisode = episodesData.find(ep => ep.id === selectedEpisode.id)
            if (currentSelectedEpisode) {
              // Only update if the episode data actually changed
              if (JSON.stringify(currentSelectedEpisode) !== JSON.stringify(selectedEpisode)) {
                console.log('📝 Updating locked episode data without changing selection:', currentSelectedEpisode.id)
                console.log('Episode data updated for:', currentSelectedEpisode.id)
                setSelectedEpisode(currentSelectedEpisode) // Update data only
              } else {
                console.log('✅ Episode data unchanged, no update needed')
              }
            } else {
              console.log('⚠️ Selected episode not found in current episodes list, keeping selection')
            }
          }
          setLoading(false)
          return // Exit early - NO OTHER LOGIC RUNS
        }
        
        // 3. Only auto-select on initial load when no episode is selected AND no pending episode
        if (isInitialLoad && episodesData.length > 0 && !selectedEpisode && !pendingNewEpisodeId) {
          console.log('=== CONDITION 3: AUTO-SELECT FIRST EPISODE ON INITIAL LOAD ===')
          console.log('🚀 Auto-selecting first episode on initial load:', episodesData[0].id)
          console.log('Episode details:', { id: episodesData[0].id, number: episodesData[0].episodeNumber, title: episodesData[0].title })
          
          setSelectedEpisode(episodesData[0])
          setLastSelectedEpisodeId(episodesData[0].id)
          episodeSelectionRef.current = episodesData[0].id
          setIsInitialLoad(false)
          setEpisodeSelectionLocked(true) // Lock selection after initial load
          
          // Update URL to include episode ID
          const url = new URL(window.location.href)
          url.searchParams.set('episodeId', episodesData[0].id)
          window.history.replaceState({}, '', url.toString())
          console.log('🔗 URL updated with first episode ID:', episodesData[0].id)
          console.log('🔒 Episode selection locked after initial load')
          
          setLoading(false)
          return // Exit early
        }
        
        // 4. If we have a selected episode, update it with latest data
        if (selectedEpisode && episodesData.length > 0) {
          console.log('=== CONDITION 4: UPDATE SELECTED EPISODE DATA ===')
          const currentSelectedEpisode = episodesData.find(ep => ep.id === selectedEpisode.id)
          if (currentSelectedEpisode) {
            console.log('📝 Updating selected episode data:', currentSelectedEpisode.id)
            console.log('Episode details:', { id: currentSelectedEpisode.id, number: currentSelectedEpisode.episodeNumber, title: currentSelectedEpisode.title })
            // Update the selected episode with the latest data
            setSelectedEpisode(currentSelectedEpisode)
          } else {
            console.log('⚠️ Selected episode not found in episodes data, keeping current selection')
            console.log('Selected episode ID:', selectedEpisode.id)
            console.log('Available episode IDs:', episodesData.map(ep => ep.id))
          }
          // DO NOT auto-select first episode if selected episode doesn't exist
          // This prevents the auto-redirect to episode 1
        }
        
        // 5. Fallback: If no episodes and no selection, set loading to false
        if (episodesData.length === 0 && !selectedEpisode && !pendingNewEpisodeId) {
          console.log('=== CONDITION 5: NO EPISODES FOUND ===')
          console.log('No episodes found for project, setting loading to false')
          console.log('episodesData.length:', episodesData.length)
          console.log('selectedEpisode: none')
          console.log('pendingNewEpisodeId:', pendingNewEpisodeId)
          setLoading(false)
          return
        }
        
        // 6. If we have episodes but no selection and no pending episode, and not initial load
        if (episodesData.length > 0 && !selectedEpisode && !pendingNewEpisodeId && !isInitialLoad) {
          console.log('=== CONDITION 6: EPISODES EXIST BUT NO SELECTION ===')
          console.log('Episodes exist but no selection made, setting loading to false')
          console.log('Available episodes:', episodesData.map(ep => ({ id: ep.id, number: ep.episodeNumber })))
          setLoading(false)
          return
        }
        
        console.log('=== END OF EPISODE SELECTION LOGIC ===')
        console.log('Final state - selectedEpisode:', selectedEpisode?.id, 'episodeSelectionLocked:', episodeSelectionLocked)
        
        setLoading(false)
      }, (error) => {
        console.error('Error in episodes snapshot:', error)
        setLoading(false)
      })

      return unsubscribe
    } catch (error) {
      console.error('Error fetching episodes:', error)
      toast.error('Gagal memuat episode')
      setLoading(false)
    }
  }

  const fetchScripts = async () => {
    if (!user?.id) return;
    
    try {
      // Read directly from Firestore to avoid API JSON parse errors in static prod
      const q = query(
        collection(db, 'scripts'),
        where('userId', '==', user.id)
      )
      const snapshot = await getDocs(q)
      const allScripts = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
      const filtered = allScripts
        .filter(s => s.projectId === projectId)
        .sort((a, b) => {
          const aDate = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : a.createdAt?.toDate?.()?.getTime?.() ?? 0
          const bDate = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : b.createdAt?.toDate?.()?.getTime?.() ?? 0
          return bDate - aDate
        })
      setScripts(filtered)
    } catch (error) {
      console.error('Error loading scripts:', error);
    }
  };

  const handleScriptsUpdate = () => {
    fetchScripts();
  };

  const handleViewAnalysis = (analysis: any) => {
    // Close history modal and open analysis viewer with the selected analysis
    setShowAnalysisHistory(false);
    setSelectedAnalysis(analysis);
    setShowAnalysisViewer(true);
  };

  const handleCloseAnalysisViewer = () => {
    setShowAnalysisViewer(false);
    setSelectedAnalysis(null);
  };

  const handleAnalysisDeleted = () => {
    // Refresh analysis history when an analysis is deleted
    // This will be handled by the AnalysisHistory component itself
  };

  const handleEpisodeSelect = (episode: Episode) => {
    setSelectedEpisode(episode)
    setLastSelectedEpisodeId(episode.id)
    episodeSelectionRef.current = episode.id
    setIsInitialLoad(false)
    setEpisodeSelectionLocked(true)
    
    const url = new URL(window.location.href)
    url.searchParams.set('episodeId', episode.id)
    window.history.replaceState({}, '', url.toString())
  }

  const handleEpisodeCreated = (newEpisodeId: string) => {
    console.log('=== EPISODE CREATED DEBUG ===')
    console.log('New episode ID:', newEpisodeId)
    console.log('Current episodeSelectionLocked:', episodeSelectionLocked)
    console.log('Current selectedEpisode:', selectedEpisode?.id)
    
    setShowCreateEpisode(false)
    setPendingNewEpisodeId(newEpisodeId)
    
    // Keep episode selection locked to prevent race conditions
    // The onSnapshot will handle the episode selection when it appears
    setEpisodeSelectionLocked(true)
    setIsInitialLoad(false)
    
    // Update URL to include the new episode ID
    const url = new URL(window.location.href)
    url.searchParams.set('episodeId', newEpisodeId)
    window.history.replaceState({}, '', url.toString())
    
    console.log('URL updated with episodeId:', newEpisodeId)
    console.log('Episode selection unlocked for new episode selection')
    console.log('Waiting for onSnapshot to handle episode selection...')
    
    // Episodes will be updated automatically via onSnapshot
    // The new episode will be selected and then locked again
  }

  const deleteEpisode = async (episodeId: string) => {
    try {
      // Delete episode
      await deleteDoc(doc(db, 'episodes', episodeId))
      
      // Delete related chat messages
      const messagesQuery = query(
        collection(db, 'chatMessages'),
        where('episodeId', '==', episodeId)
      )
      const messagesSnapshot = await getDocs(messagesQuery)
      
      const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref))
      await Promise.all(deletePromises)
      
      // If deleted episode was selected, clear selection
      if (selectedEpisode?.id === episodeId) {
        setSelectedEpisode(null)
      }
      
      toast.success('Episode berhasil dihapus')
      setDeleteConfirm({type: null, id: null})
    } catch (error) {
      console.error('Error deleting episode:', error)
      toast.error('Gagal menghapus episode')
    }
  }

  const deleteProject = async () => {
    try {
      // Delete all episodes first
      const episodesQuery = query(
        collection(db, 'episodes'),
        where('projectId', '==', projectId)
      )
      const episodesSnapshot = await getDocs(episodesQuery)
      
      for (const episodeDoc of episodesSnapshot.docs) {
        const episodeId = episodeDoc.id
        
        // Delete chat messages for this episode
        const messagesQuery = query(
          collection(db, 'chatMessages'),
          where('episodeId', '==', episodeId)
        )
        const messagesSnapshot = await getDocs(messagesQuery)
        
        const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref))
        await Promise.all(deletePromises)
        
        // Delete episode
        await deleteDoc(episodeDoc.ref)
      }
      
      // Delete project
      await deleteDoc(doc(db, 'projects', projectId))
      
      toast.success('Proyek berhasil dihapus')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Gagal menghapus proyek')
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-gray-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Proyek tidak ditemukan</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn-primary"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="project-detail-container">
      {isMobile ? (
        // Mobile Layout
        <div className="mobile-layout">
          {/* Mobile Header */}
        <div className="mobile-header">
          <div className="mobile-header-content">
            <div className="mobile-header-left">
              <button
                onClick={() => router.push('/dashboard')}
                className="mobile-back-button touch-feedback"
                title="Kembali ke Dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="mobile-project-title">
                  {project.title}
                </h1>
                <p className="mobile-episode-count">
                  {episodes.length}/{project.totalEpisodes} Episode
                </p>
              </div>
            </div>
            <div className="mobile-header-right">
              <button
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                className="mobile-menu-button touch-feedback"
                title="Menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setDeleteConfirm({type: 'project', id: projectId})}
                className="mobile-delete-button touch-feedback"
                title="Hapus Proyek"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

          {/* Mobile Sidebar Overlay */}
          {showMobileSidebar && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mobile-sidebar-overlay motion-fade-initial motion-fade-animate motion-fade-exit" 
              onClick={() => setShowMobileSidebar(false)}
            >
              <motion.div 
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="mobile-sidebar-content motion-slide-left-initial motion-slide-left-animate motion-slide-left-exit motion-slide-left-transition"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mobile-sidebar-header">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="mobile-sidebar-title">Menu</h2>
                    <button
                      onClick={() => setShowMobileSidebar(false)}
                      className="mobile-sidebar-close touch-feedback"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-4">
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Genre</span>
                        <span className="text-sm font-medium text-gray-700">{project.genre}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 border border-gray-200">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Episode</span>
                        <span className="text-sm font-medium text-gray-700">{episodes.length}/{project.totalEpisodes}</span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {setShowPDFExtractor(true); setShowMobileSidebar(false)}}
                          className="mobile-action-button mobile-action-button-blue"
                        >
                          <FileText className="h-4 w-4 text-gray-500 group-hover:text-blue-600" />
                          <span className="whitespace-nowrap">Upload Naskah</span>
                        </button>
                        
                        <button
                          onClick={() => {setShowScriptAnalysis(true); setShowMobileSidebar(false)}}
                          className="mobile-action-button mobile-action-button-purple"
                        >
                          <Sparkles className="h-4 w-4 text-gray-500 group-hover:text-purple-600" />
                          <span className="whitespace-nowrap">Analisis Naskah</span>
                        </button>
                        
                        <button
                          onClick={() => {setShowAnalysisHistory(true); setShowMobileSidebar(false)}}
                          className="mobile-action-button mobile-action-button-green"
                        >
                          <Eye className="h-4 w-4 text-gray-500 group-hover:text-green-600" />
                          <span className="whitespace-nowrap">Lihat Analisis</span>
                        </button>
                        
                        <button
                          onClick={() => setShowMobileProjectInfo(!showMobileProjectInfo)}
                          className="group flex items-center justify-center space-x-1 text-xs font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-3 transition-all duration-200 shadow-sm hover:shadow-md touch-manipulation"
                        >
                          <span className="whitespace-nowrap">{showMobileProjectInfo ? 'Sembunyikan Detail' : 'Tampilkan Detail'}</span>
                          {showMobileProjectInfo ? (
                            <ChevronUp className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500 group-hover:text-gray-700" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Expandable Content */}
                    {showMobileProjectInfo && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-2 space-y-3 max-h-96 overflow-y-auto pr-2 motion-expand-initial motion-expand-animate motion-expand-exit motion-expand-transition"
                      >
                        <div className="mobile-project-info">
                          <div>
                            <p className="mobile-project-info-title">Tone</p>
                            <p className="mobile-project-info-tone">{project.tone}</p>
                          </div>
                        </div>
                        
                        {project.synopsis && (
                          <div className="mobile-project-info">
                            <h4 className="mobile-project-info-title">Sinopsis</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">{project.synopsis}</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Episodes List */}
                <div className="mobile-episodes-list">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="mobile-episodes-title">Episode</h2>
                      <button
                        onClick={() => {setShowCreateEpisode(true); setShowMobileSidebar(false)}}
                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl p-2.5 transition-all duration-200 touch-manipulation"
                        title="Tambah Episode"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {episodes.length === 0 ? (
                        <div className="mobile-empty-state">
                          <MessageSquare className="mobile-empty-icon" />
                          <p className="mobile-empty-title">Belum ada episode</p>
                          <button
                            onClick={() => {setShowCreateEpisode(true); setShowMobileSidebar(false)}}
                            className="mobile-create-episode touch-feedback"
                          >
                            Buat Episode Pertama
                          </button>
                        </div>
                      ) : (
                        episodes.map((episode) => (
                          <motion.div
                            key={episode.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`mobile-episode-item motion-slide-initial motion-slide-animate motion-slide-transition touch-feedback ${
                              selectedEpisode?.id === episode.id 
                                ? 'mobile-episode-item-selected' 
                                : 'mobile-episode-item-unselected'
                            }`}
                            onClick={() => {
                              handleEpisodeSelect(episode)
                              setShowMobileSidebar(false)
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="mobile-episode-number">
                                  Episode {episode.episodeNumber}
                                </span>
                                {selectedEpisode?.id === episode.id && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              <p className="mobile-episode-title">
                                {episode.title}
                              </p>
                              {episode.setting && (
                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                  {episode.setting}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteConfirm({type: 'episode', id: episode.id})
                              }}
                              className="mobile-episode-delete touch-feedback"
                              title="Hapus Episode"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Project Info */}
                <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
                  <div className="text-xs text-gray-500">
                    <p>Dibuat: {project.createdAt.toLocaleDateString('id-ID')}</p>
                    <p>Diupdate: {project.updatedAt.toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Mobile Main Content */}
          <div className="main-content">
            {selectedEpisode ? (
              <ChatInterface 
                project={project}
                episode={selectedEpisode}
              />
            ) : (
              <div className="desktop-empty-state">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Pilih Episode
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Pilih episode dari menu untuk mulai mengembangkan naskah
                  </p>
                  {episodes.length === 0 && (
                    <button
                      onClick={() => setShowCreateEpisode(true)}
                      className="btn-primary"
                    >
                      Buat Episode Pertama
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Desktop Layout
        <div className="flex">
          {/* Desktop Sidebar */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col sticky top-0 h-screen">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 sticky top-0 z-20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200"
                  title="Kembali ke Dashboard"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  {project.title}
                </h1>
              </div>
              <button
                onClick={() => setDeleteConfirm({type: 'project', id: projectId})}
                className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg p-2 transition-all duration-200"
                title="Hapus Proyek"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            
            <div className="text-sm text-gray-600 space-y-3">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Genre</span>
                  <span className="text-sm font-medium text-gray-700">{project.genre}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Episode</span>
                  <span className="text-sm font-medium text-gray-700">{episodes.length}/{project.totalEpisodes}</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-4 space-y-3">
                {/* Primary Actions - 2x2 Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowPDFExtractor(true)}
                    className="group flex items-center justify-center space-x-1.5 text-xs font-medium text-gray-700 hover:text-blue-700 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg px-2.5 py-2 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <FileText className="h-3.5 w-3.5 text-gray-500 group-hover:text-blue-600" />
                    <span className="whitespace-nowrap">Upload Naskah</span>
                  </button>
                  
                  <button
                    onClick={() => setShowScriptAnalysis(true)}
                    className="group flex items-center justify-center space-x-1.5 text-xs font-medium text-gray-700 hover:text-purple-700 bg-white hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-lg px-2.5 py-2 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-gray-500 group-hover:text-purple-600" />
                    <span className="whitespace-nowrap">Analisis Naskah</span>
                  </button>
                  
                  <button
                    onClick={() => setShowAnalysisHistory(true)}
                    className="group flex items-center justify-center space-x-1.5 text-xs font-medium text-gray-700 hover:text-green-700 bg-white hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-lg px-2.5 py-2 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Eye className="h-3.5 w-3.5 text-gray-500 group-hover:text-green-600" />
                    <span className="whitespace-nowrap">Lihat Analisis</span>
                  </button>
                  
                  <button
                    onClick={() => setShowFullProjectInfo(!showFullProjectInfo)}
                    className="group flex items-center justify-center space-x-1 text-xs font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-lg px-2.5 py-2 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <span className="whitespace-nowrap">{showFullProjectInfo ? 'Sembunyikan Detail' : 'Tampilkan Detail'}</span>
                    {showFullProjectInfo ? (
                      <ChevronUp className="h-3.5 w-3.5 text-gray-500 group-hover:text-gray-700" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-gray-500 group-hover:text-gray-700" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Expandable Content */}
              <div className="mt-2">
                
                {showFullProjectInfo && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-2 space-y-2 max-h-96 overflow-y-auto pr-2 motion-expand-initial motion-expand-animate motion-expand-exit motion-expand-transition"
                  >
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tone</p>
                        <p className="text-sm font-medium text-gray-700 leading-relaxed">{project.tone}</p>
                      </div>
                    </div>
                    
                    {project.synopsis && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sinopsis</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{project.synopsis}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Episodes List */}
          <div className="desktop-episodes-list">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="desktop-episodes-title">Episode</h2>
                <button
                  onClick={() => setShowCreateEpisode(true)}
                  className="desktop-add-episode-button"
                  title="Tambah Episode"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-1">
                {episodes.map((episode) => (
                  <div
                    key={episode.id}
                    className={`desktop-episode-item ${
                      selectedEpisode?.id === episode.id ? 'desktop-episode-item-selected' : 'desktop-episode-item-unselected'
                    }`}
                  >
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                      console.log('=== MANUAL EPISODE SELECTION ===')
                      console.log('Manually selecting episode:', episode.id)
                      console.log('Episode details:', { id: episode.id, number: episode.episodeNumber, title: episode.title })
                      console.log('Current selectedEpisode before:', selectedEpisode?.id)
                      console.log('Current episodeSelectionLocked before:', episodeSelectionLocked)
                      
                      setSelectedEpisode(episode)
                      setLastSelectedEpisodeId(episode.id)
                      episodeSelectionRef.current = episode.id
                      setIsInitialLoad(false) // Mark that we're no longer in initial load
                      setEpisodeSelectionLocked(true) // Lock selection when manually selecting
                      
                      console.log('Episode selection locked after manual selection')
                      console.log('New selectedEpisode:', episode.id)
                      
                      // Update URL to include episode ID
                      const url = new URL(window.location.href)
                      url.searchParams.set('episodeId', episode.id)
                      window.history.replaceState({}, '', url.toString())
                      console.log('URL updated to:', url.toString())
                    }}
                    >
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        Episode {episode.episodeNumber}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {episode.title}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteConfirm({type: 'episode', id: episode.id})
                        }}
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg p-1 transition-all duration-200"
                        title="Hapus Episode"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Project Info */}
          <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
            <div className="text-xs text-gray-500">
              <p>Dibuat: {project.createdAt.toLocaleDateString('id-ID')}</p>
              <p>Diupdate: {project.updatedAt.toLocaleDateString('id-ID')}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {selectedEpisode ? (
            <ChatInterface 
              project={project}
              episode={selectedEpisode}
            />
          ) : (
            <div className="desktop-empty-state">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Pilih Episode
                </h3>
                <p className="text-gray-500 mb-4">
                  Pilih episode dari sidebar untuk mulai mengembangkan naskah
                </p>
                {episodes.length === 0 && (
                  <button
                    onClick={() => setShowCreateEpisode(true)}
                    className="btn-primary"
                  >
                    Buat Episode Pertama
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Create Episode Modal */}
      {showCreateEpisode && (
        <CreateEpisodeModal
          project={project}
          onClose={() => setShowCreateEpisode(false)}
          onSuccess={handleEpisodeCreated}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.type && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDeleteConfirm({type: null, id: null})
            }
          }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl motion-scale-initial motion-scale-animate motion-scale-exit"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Konfirmasi Hapus
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                {deleteConfirm.type === 'project' 
                  ? 'Apakah Anda yakin ingin menghapus proyek ini?'
                  : 'Apakah Anda yakin ingin menghapus episode ini?'
                }
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ Tindakan ini tidak dapat dibatalkan!
                </p>
                <p className="text-sm text-red-700 mt-1">
                  {deleteConfirm.type === 'project' 
                    ? 'Semua episode dan chat akan ikut terhapus.'
                    : 'Semua chat akan ikut terhapus.'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm({type: null, id: null})}
                className="flex-1 btn-secondary"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'project') {
                    deleteProject()
                  } else if (deleteConfirm.type === 'episode' && deleteConfirm.id) {
                    deleteEpisode(deleteConfirm.id)
                  }
                }}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Ya, Hapus
              </button>
            </div>
          </motion.div>
        </div>
      )}


      {/* PDF Extractor Modal */}
      {showPDFExtractor && project && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
               <h2 className="modal-title">Ekstraktor PDF - {project.title}</h2>
              <button
                onClick={() => setShowPDFExtractor(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200 flex-shrink-0"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <PDFExtractor projectId={project.id} />
            </div>
          </div>
        </div>
      )}

      {/* Script Analysis Modal */}
      {showScriptAnalysis && project && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-large">
            <div className="modal-header">
               <h2 className="modal-title">Analisis Naskah - {project.title}</h2>
              <button
                onClick={() => setShowScriptAnalysis(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200 flex-shrink-0"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <ScriptAnalysis 
                projectId={project.id} 
                scripts={scripts}
                onScriptsUpdate={handleScriptsUpdate}
              />
            </div>
          </div>
        </div>
      )}

      {/* Analysis History Modal */}
      {showAnalysisHistory && project && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
               <h2 className="modal-title">Hasil Analisis - {project.title}</h2>
              <button
                onClick={() => setShowAnalysisHistory(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200 flex-shrink-0"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <AnalysisHistory 
                projectId={project.id} 
                onViewAnalysis={handleViewAnalysis}
                onAnalysisDeleted={handleAnalysisDeleted}
              />
            </div>
          </div>
        </div>
      )}

      {/* Analysis Viewer Modal */}
      {showAnalysisViewer && selectedAnalysis && (
        <AnalysisViewer 
          analysis={selectedAnalysis} 
          onClose={handleCloseAnalysisViewer}
        />
      )}

    </div>
  )
}

