// SignupStep1.js

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { auth, db } from './firebase';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import logo from './assets/logo.png';

export default function SignupStep1() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  // Password validation checks
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumberOrSpecial = /[\d\W]/.test(password);
  const hasTenChars = password.length >= 10;

  const allValid = hasLetter && hasNumberOrSpecial && hasTenChars;

  // Handle password update in Firebase Authentication and Firestore
  const handleSubmit = async () => {
    if (!allValid || processing) return;
    
    setProcessing(true);
    const user = auth.currentUser;

    if (user) {
      try {
        // Update the password in Firebase Authentication
        await updatePassword(user, password);

        // Update the password in Firestore
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          password: password
        });

        // Proceed to the next step
        navigate('/signupstep2');
      } catch (error) {
        console.error('Error updating password: ', error);
      } finally {
        setProcessing(false);
      }
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
            <p className="text-zinc-400 text-sm mt-1">Step 1 of 3</p>
          </div>
        </div>

        {/* Progress Line */}
        <div className="flex items-center gap-1 px-4">
          <div className="h-1 flex-1 rounded-full bg-red-800"></div>
          <div className="h-1 flex-1 rounded-full bg-zinc-700"></div>
          <div className="h-1 flex-1 rounded-full bg-zinc-700"></div>
        </div>

        {/* Password Section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">
              Create a password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={processing}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent transition-all duration-200"
                placeholder="Enter your password"
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

          {/* Password Requirements */}
          <div className="space-y-3 bg-zinc-800/30 rounded-xl p-4">
            <h3 className="text-sm font-medium text-zinc-300">Password requirements:</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {hasLetter ? (
                  <Check size={16} className="text-green-500" />
                ) : (
                  <X size={16} className="text-red-500" />
                )}
                <span className={hasLetter ? "text-zinc-300" : "text-zinc-500"}>
                  At least 1 letter
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {hasNumberOrSpecial ? (
                  <Check size={16} className="text-green-500" />
                ) : (
                  <X size={16} className="text-red-500" />
                )}
                <span className={hasNumberOrSpecial ? "text-zinc-300" : "text-zinc-500"}>
                  1 number or special character
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {hasTenChars ? (
                  <Check size={16} className="text-green-500" />
                ) : (
                  <X size={16} className="text-red-500" />
                )}
                <span className={hasTenChars ? "text-zinc-300" : "text-zinc-500"}>
                  Minimum 10 characters
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="space-y-4 pt-4">
          <button
            onClick={handleSubmit}
            disabled={!allValid || processing}
            className={`w-full py-3 rounded-xl font-medium transition-all duration-200 
              ${allValid && !processing
                ? 'bg-red-800 hover:bg-red-700 text-white'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
          >
            {processing ? 'Processing...' : 'Continue'}
          </button>
          
          <button
            onClick={() => navigate('/signup')}
            disabled={processing}
            className="w-full text-zinc-400 hover:text-white transition-colors text-sm"
          >
            ← Back to signup
          </button>
        </div>
      </div>
    </div>
  );
}