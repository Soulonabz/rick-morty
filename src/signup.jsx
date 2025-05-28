import { useState } from 'react';
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

  const handleSignup = async (e) => {
    e.preventDefault();
    if (processing) return;

    setProcessing(true);
    setError('');

    try {
      // Create user in Firebase Auth with a temporary password
      // This will be updated in SignupStep1
      const temporaryPassword = Math.random().toString(36).slice(-12);
      const userCredential = await createUserWithEmailAndPassword(auth, email, temporaryPassword);
      const user = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        createdAt: new Date().toISOString(),
        // Other fields will be added in subsequent steps
      });

      // Proceed to step 1 where user will set their password
      navigate('/signupstep1');
    } catch (error) {
      console.error('Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please try logging in instead.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('An error occurred during signup. Please try again.');
      }
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
            <h2 className="text-2xl font-bold text-white">Create your account</h2>
            <p className="text-zinc-400 text-sm mt-1">Start your musical journey today</p>
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
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
            <p className="text-xs text-zinc-500">
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
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
          >
            {processing ? 'Creating account...' : 'Continue'}
          </button>
        </form>

        {/* Links */}
        <div className="space-y-4 text-center">
          <div className="flex items-center gap-2 justify-center">
            <div className="h-px flex-1 bg-zinc-800"></div>
            <span className="text-xs text-zinc-500">Already have an account?</span>
            <div className="h-px flex-1 bg-zinc-800"></div>
          </div>

          <button
            onClick={() => navigate('/login')}
            disabled={processing}
            className="w-full py-3 rounded-xl font-medium border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 transition-all duration-200"
          >
            Sign in instead
          </button>
        </div>
      </div>
    </div>
  );
}
