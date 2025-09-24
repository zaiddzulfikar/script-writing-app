// Test Firebase Firestore connection
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs } = require('firebase/firestore');

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
const db = getFirestore(app);

async function testDatabase() {
  try {
    console.log('🔍 Testing Firebase Firestore connection...');
    
    // Test write operation
    const docRef = await addDoc(collection(db, 'test'), {
      message: 'Database test successful!',
      timestamp: new Date(),
      testId: Math.random().toString(36).substr(2, 9)
    });
    console.log('✅ Write test successful! Document ID:', docRef.id);
    
    // Test read operation
    const querySnapshot = await getDocs(collection(db, 'test'));
    console.log('✅ Read test successful! Found', querySnapshot.size, 'documents');
    
    console.log('🎉 Firebase Firestore is working correctly!');
    console.log('📊 Database is ready for the application.');
    
  } catch (error) {
    console.error('❌ Firebase test failed:', error.message);
    console.error('🔧 Please check:');
    console.error('   - Firebase project is active');
    console.error('   - Firestore Database is created');
    console.error('   - Authentication is enabled');
    console.error('   - Network connection is stable');
  }
}

testDatabase();
