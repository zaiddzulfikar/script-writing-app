// Test Firestore indexes
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, query, where, orderBy, getDocs } = require('firebase/firestore');

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

async function testIndexes() {
  try {
    console.log('🔍 Testing Firestore indexes...');
    
    // Sign in with existing user
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      'test@example.com', 
      'testpassword123'
    );
    
    console.log('✅ Authentication successful:', userCredential.user.email);
    
    // Test projects query with orderBy
    console.log('📊 Testing projects query with orderBy...');
    try {
      const projectsQuery = query(
        collection(db, 'projects'),
        where('userId', '==', userCredential.user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const projectsSnapshot = await getDocs(projectsQuery);
      console.log('✅ Projects query with orderBy successful:', projectsSnapshot.size, 'projects');
    } catch (error) {
      console.log('❌ Projects query with orderBy failed:', error.message);
      console.log('🔧 Please create index for projects collection');
    }
    
    // Test episodes query with orderBy
    console.log('📺 Testing episodes query with orderBy...');
    try {
      const episodesQuery = query(
        collection(db, 'episodes'),
        where('projectId', '==', 'test-project-id'),
        orderBy('episodeNumber', 'asc')
      );
      
      const episodesSnapshot = await getDocs(episodesQuery);
      console.log('✅ Episodes query with orderBy successful:', episodesSnapshot.size, 'episodes');
    } catch (error) {
      console.log('❌ Episodes query with orderBy failed:', error.message);
      console.log('🔧 Please create index for episodes collection');
    }
    
    console.log('🎉 Index testing completed!');
    
  } catch (error) {
    console.error('❌ Index test failed:', error.message);
  }
}

testIndexes();
