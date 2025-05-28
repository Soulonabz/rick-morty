import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth } from './firebase';
import emailjs from 'emailjs-com';
import logo from './assets/logo.png';
import { completeSignup } from './utils/signupUtils';

export default function SignupEmailVerif() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialCode = location.state?.verificationCode;

  const [timer, setTimer] = useState(120);
  const [verificationCode, setVerificationCode] = useState('');
  const [expectedCode, setExpectedCode] = useState(initialCode);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!expectedCode) {
      setError('Missing verification code. Please try signing up again.');
    }
  }, [expectedCode]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 0) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  const handleVerificationCodeChange = (e) => {
    setVerificationCode(e.target.value);
    setError('');
  };

  const handleResendEmail = async () => {
    if (timer > 0 || processing) return;
    
    setProcessing(true);
    const newCode = Math.floor(100000 + Math.random() * 900000);
    setExpectedCode(newCode);
    setTimer(120);

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
    } finally {
      setProcessing(false);
    }
  };

  const handleContinue = async () => {
    if (processing) return;
    
    setProcessing(true);
    try {
      if (verificationCode === String(expectedCode)) {
        // Mark signup as complete in Firestore
        if (auth.currentUser) {
          await completeSignup(auth.currentUser.uid);
        }
        navigate('/login');
      } else {
        setError('The verification code is incorrect. Please try again.');
      }
    } catch (error) {
      console.error('Error completing signup:', error);
      setError('An error occurred. Please try again.');
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
            <h2 className="text-2xl font-bold text-white">Verify your email</h2>
            <p className="text-zinc-400 text-sm mt-1">
              We've sent a verification code to your email
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Code Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={handleVerificationCodeChange}
              disabled={processing}
              className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-transparent transition-all duration-200"
              placeholder="Enter 6-digit code"
              maxLength={6}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-500 text-sm bg-red-500/10 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Timer Info */}
          <div className="text-center space-y-2">
            <div className="text-sm text-zinc-400">
              {timer > 0 ? (
                <>
                  Resend code in{' '}
                  <span className="text-white font-medium">
                    {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                  </span>
                </>
              ) : (
                "Didn't receive the code?"
              )}
            </div>
            <button
              onClick={handleResendEmail}
              disabled={timer > 0 || processing}
              className={`text-sm transition-colors duration-200
                ${timer > 0 || processing
                  ? 'text-zinc-600 cursor-not-allowed'
                  : 'text-red-800 hover:text-red-700 hover:underline'
                }`}
            >
              {processing ? 'Sending...' : 'Resend verification code'}
            </button>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="space-y-4 pt-4">
          <button
            onClick={handleContinue}
            disabled={!verificationCode || processing}
            className={`w-full py-3 rounded-xl font-medium transition-all duration-200 
              ${verificationCode && !processing
                ? 'bg-red-800 hover:bg-red-700 text-white'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
          >
            {processing ? 'Verifying...' : 'Continue'}
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
