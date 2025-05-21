import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Eye, EyeOff } from 'lucide-react';
import logo from './assets/logo.png';

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false); // 👈 added

  const handleLogin = async () => {
    setProcessing(true); // 👈 start processing
    try {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      let emailToUse = identifier;

      if (!emailPattern.test(identifier)) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', identifier));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError('No user found with that username.');
          setProcessing(false); // 👈 stop processing
          return;
        }

        emailToUse = querySnapshot.docs[0].data().email;
      }

      await signInWithEmailAndPassword(auth, emailToUse, password);
      navigate('/home');
    } catch (err) {
      console.error(err);
      setError('Invalid login credentials.');
    } finally {
      setProcessing(false); // 👈 stop processing
    }
  };

  const handleSpotifyLogin = () => {
    const clientId = 'd8d0a3f7b4d3409e8e199cc1c5b11bad';
    const redirectUri = 'http://127.0.0.1:5175/callback';
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-read-collaborative'
    ];

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(scopes.join(' '))}`;

    window.location.href = authUrl;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-700 to-zinc-900 px-4">
      <div className="bg-zinc-900 p-8 rounded-2xl shadow-lg w-full max-w-sm text-white text-center space-y-6">
        <img src={logo} alt="TuneMusic Logo" className="w-15 h-15 mx-auto rounded-full object-cover" />
        <h2 className="text-2xl font-semibold">Login to Tunemusic</h2>

        <div className="space-y-3">
          <div
            onClick={handleSpotifyLogin}
            className="bg-green-600 rounded-full py-2 cursor-pointer hover:bg-green-700 transition"
          >
            Continue with Spotify
          </div>
        </div>

        <div className="flex items-center justify-center text-zinc-500 my-4">
          <hr className="flex-grow border-zinc-700" />
          <span className="px-2 text-sm">Use Email</span>
          <hr className="flex-grow border-zinc-700" />
        </div>

        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="Email"
          className="w-full px-4 py-2 rounded-md bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white"
        />

        <div className="relative mt-3">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-2 pr-12 rounded-md bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={processing}
          className={`w-full ${
            processing ? 'bg-zinc-700 cursor-not-allowed' : 'bg-red-800 hover:bg-red-900'
          } transition py-3 rounded-full mt-4`}
        >
          {processing ? 'Processing...' : 'Login'}
        </button>

        <p className="text-sm text-zinc-400">
          Not a member yet?{' '}
          <span className="text-red-900 cursor-pointer hover:underline">
            <Link to="/signup">Sign up to Tunemusic.</Link>
          </span>
        </p>
      </div>
    </div>
  );
}
