import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, createUserWithEmailAndPassword, setDoc, doc } from './firebase'; // Import Firebase functions

import logo from './assets/logo.png';

export default function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false); // NEW

  // Firebase auth and Firestore
  const handleSignup = async () => {
    setProcessing(true); // NEW
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, 'temporarypassword');
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        createdAt: new Date(),
      });

      navigate('/signupstep1');
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false); // NEW
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-700 to-zinc-900 px-4">
      <div className="bg-zinc-900 p-8 rounded-2xl shadow-lg w-full max-w-sm text-white text-center space-y-6">
        <img src={logo} alt="TuneMusic Logo" className="w-15 h-15 mx-auto rounded-full object-cover" />
        <h2 className="text-2xl font-semibold">Become a member to start listening</h2>

        <input
          type="text"
          placeholder="name@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 rounded-md bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Updated Button */}
        <button
          onClick={handleSignup}
          disabled={processing}
          className={`w-full ${
            processing ? 'bg-zinc-700 cursor-not-allowed' : 'bg-red-800 hover:bg-red-900'
          } transition py-3 rounded-full`}
        >
          {processing ? 'Processing...' : 'Next'}
        </button>

        <div className="flex items-center justify-center text-zinc-500 my-4">
          <hr className="flex-grow border-zinc-700" />
          <span className="px-2 text-sm">or</span>
          <hr className="flex-grow border-zinc-700" />
        </div>

        <p className="text-sm text-zinc-400">
          Already have an account?{' '}
          <span className="text-red-900 cursor-pointer hover:underline">
            <Link to="/login">Log in here.</Link>
          </span>
        </p>
      </div>
    </div>
  );
}
