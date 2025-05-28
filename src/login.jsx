import { useState } from 'react';
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 p-4">
      <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl rounded-2xl shadow-xl p-8 space-y-8">
        {/* Logo and Header */}
        <div className="flex flex-col items-center space-y-4">
          <img src={logo} alt="TuneMusic Logo" className="w-20 h-20 rounded-full object-cover ring-2 ring-red-800/50" />
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-zinc-400 text-sm mt-1">Sign in to your account</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={processing}
              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent transition-all duration-200"
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={processing}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent transition-all duration-200"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => !processing && setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
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
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
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
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Forgot your password?
          </button>

          <div className="flex items-center gap-2 justify-center">
            <div className="h-px flex-1 bg-zinc-800"></div>
            <span className="text-xs text-zinc-500">Don't have an account?</span>
            <div className="h-px flex-1 bg-zinc-800"></div>
          </div>

          <button
            onClick={() => navigate('/signup')}
            disabled={processing}
            className="w-full py-3 rounded-xl font-medium border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 transition-all duration-200"
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
}
