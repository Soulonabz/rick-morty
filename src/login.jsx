import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import { Eye, EyeOff } from 'lucide-react';
import logo from './assets/logo.png';
import { checkSignupComplete } from './utils/signupUtils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const handleLogin = async (e) => {
    e.preventDefault();
    if (processing) return;

    setProcessing(true);
    setError('');

    try {
      // Attempt to sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if signup was completed
      const isSignupComplete = await checkSignupComplete(userCredential.user.uid);
      
      if (!isSignupComplete) {
        // Sign out the user
        await auth.signOut();
        setError('Please complete the signup process before logging in.');
        return;
      }

      // If signup was completed, proceed with login
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid email or password');
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
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Welcome back</h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>Sign in to your account</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
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
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={processing}
                className={`w-full px-4 py-3 ${darkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-100 border-gray-300'} 
                  border rounded-xl ${darkMode ? 'text-white' : 'text-gray-900'} 
                  placeholder-${darkMode ? 'zinc' : 'gray'}-500 focus:outline-none focus:ring-2 focus:ring-red-800 
                  focus:border-transparent transition-all duration-200`}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => !processing && setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-zinc-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
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
            disabled={processing || !email || !password}
            className={`w-full py-3 rounded-xl font-medium transition-all duration-200 
              ${email && password && !processing
                ? 'bg-red-800 hover:bg-red-700 text-white'
                : `${darkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
              }`}
          >
            {processing ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Links */}
        <div className="space-y-4 text-center">
          <button
            onClick={() => navigate('/forgot-password')}
            disabled={processing}
            className={`text-sm ${darkMode ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
          >
            Forgot your password?
          </button>

          <div className="flex items-center gap-2 justify-center">
            <div className={`h-px flex-1 ${darkMode ? 'bg-zinc-800' : 'bg-gray-200'}`}></div>
            <span className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Don't have an account?</span>
            <div className={`h-px flex-1 ${darkMode ? 'bg-zinc-800' : 'bg-gray-200'}`}></div>
          </div>

          <button
            onClick={() => navigate('/signup')}
            disabled={processing}
            className={`w-full py-3 rounded-xl font-medium border transition-all duration-200
              ${darkMode 
                ? 'border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600' 
                : 'border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400'}`}
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
}
