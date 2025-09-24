// Test Firestore with proper authentication
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, addDoc, getDocs, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyB79O8FP5SiVzt8m9lvwSYPjP_-J0Bwxnk",
  authDomain: "emtek-script-generation.firebaseapp.com",
  projectId: "emtek-script-generation",
  storageBucket: "emtek-script-generation.firebasestorage.app",
  messagingSenderId: "532934715727",
  appId: "1:532934715727:web:3d03ef178ac6a4051afd3a",
  measurementId: "G-TQSTVPQX6P"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testFirestoreWithAuth() {
  try {
    console.log('🔍 Testing Firestore with authentication...');
    
    // Sign in with existing user
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      'test@example.com', 
      'testpassword123'
    );
    
    console.log('✅ Authentication successful:', userCredential.user.email);
    
    // Test creating a user document
    const userData = {
      id: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await setDoc(doc(db, 'users', userCredential.user.uid), userData);
    console.log('✅ User document created successfully');
    
    // Test creating a project
    const projectData = {
      title: 'Test Project',
      description: 'Test Description',
      genre: 'Drama',
      totalEpisodes: 5,
      durationPerEpisode: 30,
      targetAudience: 'Adults',
      synopsis: 'Test synopsis',
      mainCharacters: ['Character 1', 'Character 2'],
      setting: 'Test Setting',
      tone: 'Serious',
      additionalNotes: 'Test notes',
      userId: userCredential.user.uid,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const projectRef = await addDoc(collection(db, 'projects'), projectData);
    console.log('✅ Project created successfully:', projectRef.id);
    
    // Test reading projects
    const projectsSnapshot = await getDocs(collection(db, 'projects'));
    console.log('✅ Projects read successfully:', projectsSnapshot.size, 'projects found');
    
    console.log('🎉 All Firestore tests passed!');
    
  } catch (error) {
    console.error('❌ Firestore test failed:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'permission-denied') {
      console.error('🔧 Please update Firestore security rules to allow authenticated users');
    } else if (error.code === 'auth/user-not-found') {
      console.error('🔧 Please create a test user first');
    }
  }
}

testFirestoreWithAuth();
