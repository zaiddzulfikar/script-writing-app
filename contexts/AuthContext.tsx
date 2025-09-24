'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { User } from '@/types/database'

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.log('⏰ Auth loading timeout - setting loading to false')
      setLoading(false)
    }, 5000) // 5 second timeout

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(loadingTimeout) // Clear timeout when auth state changes
      
      if (firebaseUser) {
        setFirebaseUser(firebaseUser)
        
        // Create user object immediately to avoid loading state
        const userObject = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
        setUser(userObject as User)
        setLoading(false)
        
        // Try to sync with Firestore in background (non-blocking)
        setTimeout(async () => {
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
            if (userDoc.exists()) {
              setUser({ id: firebaseUser.uid, ...userDoc.data() } as User)
            } else {
              // Create user document if it doesn't exist
              console.log('Creating user document:', userObject)
              await setDoc(doc(db, 'users', firebaseUser.uid), userObject)
            }
          } catch (error) {
            console.error('Error syncing user document:', error)
            // User object already set, so continue
          }
        }, 100)
      } else {
        setFirebaseUser(null)
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      clearTimeout(loadingTimeout)
      unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const register = async (email: string, password: string, displayName: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    await setDoc(doc(db, 'users', user.uid), {
      id: user.uid,
      email: user.email,
      displayName,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  const logout = async () => {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      loading,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
