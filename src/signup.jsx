import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import logo from './assets/logo.png';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode !== null ? JSON.parse(savedMode) : true;
  });

  // Add effect to update dark mode when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedMode = localStorage.getItem('darkMode');
      setDarkMode(savedMode !== null ? JSON.parse(savedMode) : true);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (processing) return;

    setError('');
    setProcessing(true);

    try {
      console.log('Starting signup process...');
      // Create temporary password for initial auth
      const temporaryPassword = Math.random().toString(36).slice(-12);
      console.log('Attempting to create user account...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, temporaryPassword);
      const user = userCredential.user;
      console.log('User account created successfully:', user.uid);

      // Create user document in Firestore
      console.log('Creating user document in Firestore...');
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        createdAt: new Date().toISOString(),
        signupComplete: false,
        signupStep: 'email'
      });
      console.log('User document created successfully');

      // Wait for auth state to be fully ready
      console.log('Waiting for auth state to be fully ready...');
      await new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
          if (currentUser && currentUser.uid === user.uid) {
            unsubscribe();
            resolve();
          }
        });
      });

      console.log('Auth state is ready, navigating to /signupstep1...');
      navigate('/signupstep1', { replace: true });
    } catch (error) {
      console.error('Detailed signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered');
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection');
      } else {
        setError(`Failed to create account: ${error.message}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-zinc-800 to-zinc-950' : 'bg-gradient-to-br from-gray-100 to-white'} p-4`}>
      <div className={`w-full max-w-md ${darkMode ? 'bg-zinc-900/50' : 'bg-white'} backdrop-blur-xl rounded-2xl shadow-xl p-8 space-y-8`}>
        {/* Logo and Header */}
        <div className="flex flex-col items-center space-y-4">
          <img src={logo} alt="TuneMusic Logo" className="w-20 h-20 rounded-full object-cover ring-2 ring-red-800/50" />
          <div className="text-center">
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Create an account</h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>Join TuneMusic today</p>
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          {/* Email Input */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={processing}
              className={`w-full px-4 py-3 ${darkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-100 border-gray-300'} 
                border rounded-xl ${darkMode ? 'text-white' : 'text-gray-900'} 
                placeholder-${darkMode ? 'zinc' : 'gray'}-500 focus:outline-none focus:ring-2 focus:ring-red-800 
                focus:border-transparent transition-all duration-200`}
              placeholder="Enter your email"
              required
            />
            <p className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
              We'll send you email updates and notifications
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-500 text-sm bg-red-500/10 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={processing || !email}
            className={`w-full py-3 rounded-xl font-medium transition-all duration-200 
              ${email && !processing
                ? 'bg-red-800 hover:bg-red-700 text-white'
                : `${darkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
              }`}
          >
            {processing ? 'Creating account...' : 'Continue'}
          </button>
        </form>

        {/* Links */}
        <div className="space-y-4 text-center">
          <div className="flex items-center gap-2 justify-center">
            <div className={`h-px flex-1 ${darkMode ? 'bg-zinc-800' : 'bg-gray-200'}`}></div>
            <span className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Already have an account?</span>
            <div className={`h-px flex-1 ${darkMode ? 'bg-zinc-800' : 'bg-gray-200'}`}></div>
          </div>

          <button
            onClick={() => navigate('/login')}
            disabled={processing}
            className={`w-full py-3 rounded-xl font-medium border transition-all duration-200
              ${darkMode 
                ? 'border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600' 
                : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'}`}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
