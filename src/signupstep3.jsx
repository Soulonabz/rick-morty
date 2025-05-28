import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase'; // Adjust the path if needed
import { doc, updateDoc } from 'firebase/firestore';
import emailjs from 'emailjs-com'; // Import emailjs
import logo from './assets/logo.png';
import { updateSignupProgress, cleanupIncompleteSignup } from './utils/signupUtils';

export default function SignupStep3() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Function to generate a random 6-digit verification code
  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit number
  };

  const handleBackToLogin = async () => {
    if (processing) return;
    
    setProcessing(true);
    try {
      if (auth.currentUser) {
        await cleanupIncompleteSignup(auth.currentUser.uid);
      }
      navigate('/login');
    } catch (error) {
      console.error('Error cleaning up signup:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleSignup = async () => {
    if (!agreed || processing) return;

    setProcessing(true);

    try {
      const user = currentUser;

      if (user) {
        // Update signup progress
        await updateSignupProgress(user.uid, 'verification');

        if (!user.email) {
          console.error('No email found for current user!');
          return;
        }

        // 1. Update Firestore with terms
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          terms: 'accepted',
        });

        // 2. Generate verification code
        const verificationCode = generateVerificationCode();

        // Store the verification code in localStorage
        localStorage.setItem('verificationCode', verificationCode);

        // 3. Send email using EmailJS with verification code
        const emailParams = {
          to_name: user.displayName || 'New User',
          to_email: user.email,
          verification_code: verificationCode,
        };

        try {
          const response = await emailjs.send(
            'service_y0bjcph',
            'template_cj7glvb',
            emailParams,
            'b1fcUAopSPAyhPrEH'
          );
          console.log('Email sent successfully:', response);

          // 4. Navigate to email verification screen
          navigate('/signupemailverif', { state: { verificationCode } });
        } catch (error) {
          console.error('Email sending failed:', error);
        }
      } else {
        console.error('No authenticated user found.');
      }
    } catch (error) {
      console.error('Signup Step 3 Error:', error.message);
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
            <h2 className="text-2xl font-bold text-white">Almost there!</h2>
            <p className="text-zinc-400 text-sm mt-1">Step 3 of 3</p>
          </div>
        </div>

        {/* Progress Line */}
        <div className="flex items-center gap-1 px-4">
          <div className="h-1 flex-1 rounded-full bg-red-800"></div>
          <div className="h-1 flex-1 rounded-full bg-red-800"></div>
          <div className="h-1 flex-1 rounded-full bg-red-800"></div>
        </div>

        {/* Terms Section */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-white mb-2">
              Terms & Conditions
            </h3>
            <p className="text-sm text-zinc-400">
              Before you start enjoying Tunemusic, please read and accept our terms.
            </p>
          </div>

          <div className="bg-zinc-800/30 rounded-xl p-6 space-y-6">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                disabled={processing}
                className="mt-1 w-4 h-4 rounded border-zinc-600 text-red-800 focus:ring-red-800 focus:ring-offset-0 bg-zinc-800/50 transition-colors"
              />
              <span className="text-sm text-zinc-300">
                I agree to the Tunemusic{' '}
                <a href="#" className="text-red-800 hover:text-red-700 hover:underline transition-colors">
                  Terms and Conditions of Use
                </a>{' '}
                and{' '}
                <a href="#" className="text-red-800 hover:text-red-700 hover:underline transition-colors">
                  Privacy Policy
                </a>.
              </span>
            </label>

            <div className="text-xs text-zinc-500 bg-zinc-800/30 p-4 rounded-lg">
              By accepting, you confirm that you have read and understood our terms,
              including how we collect, use, and share your data. You can adjust your
              preferences at any time in your account settings.
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="space-y-4 pt-4">
          <button
            onClick={handleSignup}
            disabled={!agreed || processing}
            className={`w-full py-3 rounded-xl font-medium transition-all duration-200 
              ${agreed && !processing
                ? 'bg-red-800 hover:bg-red-700 text-white'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
          >
            {processing ? 'Processing...' : 'Complete Sign Up'}
          </button>
          
          <button
            onClick={handleBackToLogin}
            disabled={processing}
            className="w-full text-zinc-400 hover:text-white transition-colors text-sm"
          >
            Cancel signup
          </button>
        </div>
      </div>
    </div>
  );
}