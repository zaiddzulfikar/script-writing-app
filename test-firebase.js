// Test Firebase connection
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

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

async function testFirebase() {
  try {
    console.log('Testing Firebase connection...');
    
    // Test write
    const docRef = await addDoc(collection(db, 'test'), {
      message: 'Hello Firebase!',
      timestamp: new Date()
    });
    console.log('✅ Write test successful:', docRef.id);
    
    // Test read
    const querySnapshot = await getDocs(collection(db, 'test'));
    console.log('✅ Read test successful:', querySnapshot.size, 'documents');
    
    console.log('🎉 Firebase is working correctly!');
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
  }
}

testFirebase();
