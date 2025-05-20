import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { auth } from './firebase';
import emailjs from 'emailjs-com';
import logo from 'C:/Users/Ryu/rick-morty/src/assets/logo.png';

export default function SignupEmailVerif() {
  const location = useLocation();
  const initialCode = location.state?.verificationCode;

  const [timer, setTimer] = useState(120);
  const [verificationCode, setVerificationCode] = useState('');
  const [expectedCode, setExpectedCode] = useState(initialCode);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!expectedCode) {
      setError('Missing verification code. Please try signing up again.');
    }
  }, [expectedCode]);

  useEffect(() => {
    if (timer <= 0) return;
    const countdown = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(countdown);
  }, [timer]);

  useEffect(() => {
    if (timer === 0) setIsResendDisabled(false);
  }, [timer]);

  const handleVerificationCodeChange = (e) => {
    setVerificationCode(e.target.value);
    setError('');
  };

  const handleResendEmail = async () => {
    const newCode = Math.floor(100000 + Math.random() * 900000);
    setExpectedCode(newCode);
    setTimer(120);
    setIsResendDisabled(true);

    const emailParams = {
      to_name: auth.currentUser?.displayName || 'New User',
      to_email: auth.currentUser?.email,
      verification_code: newCode,
    };

    try {
      await emailjs.send(
        'service_y0bjcph',
        'template_cj7glvb',
        emailParams,
        'b1fcUAopSPAyhPrEH'
      );
    } catch (error) {
      console.error('Error sending email:', error);
      setError('Failed to resend the verification email.');
    }
  };

  const handleContinue = () => {
    if (verificationCode === String(expectedCode)) {
      // Redirect to Spotify OAuth flow after successful email verification
      redirectToSpotifyOAuth();
    } else {
      setError('The verification code is incorrect. Please try again.');
    }
  };

  const redirectToSpotifyOAuth = async () => {
    try {
      // Redirect to Spotify OAuth Flow to get the access token
      window.location.href = `https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=token&redirect_uri=${encodeURIComponent('http://localhost:3000/spotify-callback')}&scope=YOUR_SCOPES`;
    } catch (error) {
      console.error('Error redirecting to Spotify OAuth:', error);
      setError('Failed to initiate Spotify OAuth flow.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-700 to-zinc-900 px-4 pt-8 text-white">
      {/* Logo and Text */}
      <div className="flex items-center mb-6 w-full">
        <img src={logo} alt="TuneMusic Logo" className="w-16 h-16 rounded-full mr-3" />
        <p className="text-2xl font-semibold">Tunemusic</p>
      </div>

      <div className="w-full border-t-2 border-zinc-500 mb-6"></div>

      <div className="flex flex-col items-center justify-center w-full">
        <h2 className="text-3xl font-semibold w-full max-w-sm mb-6 text-center">
          We've sent a verification code to your email.
        </h2>

        <div className="w-full max-w-sm mb-4">
          <input
            type="text"
            value={verificationCode}
            onChange={handleVerificationCodeChange}
            required
            className="w-full p-3 rounded-lg bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white"
            placeholder="Enter verification code"
          />
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="text-center text-gray-400 mb-6">
          {timer > 0
            ? `Resend in ${timer} seconds`
            : `You can resend the code now`}
        </div>

        <button
          onClick={handleResendEmail}
          disabled={isResendDisabled}
          className={`w-full max-w-sm py-3 rounded-full text-white font-semibold transition ${isResendDisabled ? 'bg-red-900' : 'bg-red-600 hover:bg-red-700'}`}
        >
          Resend Email?
        </button>

        <button
          onClick={handleContinue}
          disabled={!verificationCode}
          className={`w-full max-w-sm py-3 rounded-full text-white font-semibold transition mt-4 ${verificationCode ? 'bg-red-800 hover:bg-red-900' : 'bg-zinc-700 cursor-not-allowed'}`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
