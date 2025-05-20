// SignupStep1.js

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { auth, db } from './firebase';  // Correctly import 'auth' and 'db' from 'firebase.js'
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import logo from 'C:/Users/Ryu/rick-morty/src/assets/logo.png';

export default function SignupStep1() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Password validation checks
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumberOrSpecial = /[\d\W]/.test(password);
  const hasTenChars = password.length >= 10;

  const allValid = hasLetter && hasNumberOrSpecial && hasTenChars;

  // Handle password update in Firebase Authentication and Firestore
  const handleSubmit = async () => {
    const user = auth.currentUser;

    if (user && allValid) {
      try {
        // Update the password in Firebase Authentication
        await updatePassword(user, password);

        // Update the password in Firestore (assuming you have a user collection with a 'password' field)
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          password: password // Replace the temporary password with the new one
        });

        // Proceed to the next step
        navigate('/signupstep2');
      } catch (error) {
        console.error('Error updating password: ', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-700 to-zinc-900 flex flex-col items-center justify-start px-4 pt-8 text-white">
      {/* Logo */}
      <img src={logo} alt="TuneMusic Logo" className="w-24 h-24 rounded-full mb-4" />

      {/* Progress Line */}
      <div className="flex items-center w-full max-w-sm mb-6">
        <div className="flex-1 h-1 bg-[#881c22] rounded"></div>
        <div className="flex-1 h-1 bg-zinc-500 rounded mx-1"></div>
        <div className="flex-1 h-1 bg-zinc-500 rounded"></div>
      </div>

      {/* Back and Step Info */}
      <div className="w-full max-w-sm flex items-center mb-2">
        <button
          onClick={() => navigate('/signup')}
          className="text-sm text-gray-300 hover:text-white"
        >
          &lt; Back
        </button>
        <p className="text-sm text-gray-400 ml-auto">Step 1 of 3</p>
      </div>

      {/* Heading */}
      <h2 className="text-lg font-semibold w-full max-w-sm mb-6">Create a password</h2>

      {/* Password Input */}
      <div className="w-full max-w-sm mb-2 relative">
        <label className="block text-sm mb-1 text-gray-300">Password</label>
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded-lg bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white pr-10"
        />
        <div
          className="absolute top-[38px] right-3 text-gray-400 cursor-pointer"
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </div>
      </div>

      {/* Password Rules */}
      <div className="text-sm w-full max-w-sm text-left text-gray-400 space-y-1 mb-6">
        <div className="flex items-center space-x-2">
          <span>{hasLetter ? '✅' : '❌'}</span>
          <span>1 letter</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>{hasNumberOrSpecial ? '✅' : '❌'}</span>
          <span>1 number or special character (e.g. # ? ! &)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>{hasTenChars ? '✅' : '❌'}</span>
          <span>At least 10 characters</span>
        </div>
      </div>

      {/* Next Button */}
      <button
        onClick={handleSubmit}
        disabled={!allValid}
        className={`w-full max-w-sm py-3 rounded-full text-white font-semibold transition-colors duration-200 ${
          allValid
            ? 'bg-red-800 hover:bg-red-900 active:bg-zinc-700'
            : 'bg-zinc-700 cursor-not-allowed opacity-50'
        }`}
      >
        Next
      </button>
    </div>
  );
}