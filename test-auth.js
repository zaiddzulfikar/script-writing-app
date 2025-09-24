// Test Firebase Authentication
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

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

async function testAuthentication() {
  try {
    console.log('🔍 Testing Firebase Authentication...');
    
    // Test creating a user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      'test@example.com', 
      'testpassword123'
    );
    
    console.log('✅ Authentication test successful!');
    console.log('👤 User created:', userCredential.user.email);
    console.log('🆔 User ID:', userCredential.user.uid);
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  Email already exists - this is actually good!');
      console.log('✅ Authentication is working correctly.');
    } else {
      console.error('🔧 Please check:');
      console.error('   - Authentication is enabled in Firebase Console');
      console.error('   - Email/Password provider is enabled');
      console.error('   - Project configuration is correct');
    }
  }
}

testAuthentication();
