import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase'; // Adjust the path if needed
import { doc, updateDoc } from 'firebase/firestore';
import emailjs from 'emailjs-com'; // Import emailjs
import logo from '../assets/logo.png';

export default function SignupStep3() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const handleSignup = async () => {
    if (!agreed || loading) return;

    setLoading(true);

    try {
      const user = currentUser;

      if (user) {
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

        // ✅ Store the verification code in localStorage
        localStorage.setItem('verificationCode', verificationCode);

        // 3. Send email using EmailJS with verification code
        const emailParams = {
          to_name: user.displayName || 'New User',
          to_email: user.email, // <-- this should match the template variable in EmailJS
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
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-700 to-zinc-900 flex flex-col items-center justify-start px-4 pt-8 text-white">
      {/* Logo */}
      <img src={logo} alt="TuneMusic Logo" className="w-24 h-24 rounded-full mb-4" />

      {/* Progress Line */}
      <div className="flex items-center w-full max-w-sm mb-6">
        <div className="flex-1 h-1 bg-[#881c22] rounded"></div>
        <div className="flex-1 h-1 bg-[#881c22] rounded mx-1"></div>
        <div className="flex-1 h-1 bg-[#881c22] rounded"></div>
      </div>

      {/* Back and Step Info */}
      <div className="w-full max-w-sm flex items-center mb-2">
        <button
          onClick={() => navigate('/signupstep2')}
          className="text-sm text-gray-300 hover:text-white"
        >
          &lt; Back
        </button>
        <p className="text-sm text-gray-400 ml-auto">Step 3 of 3</p>
      </div>

      {/* Heading */}
      <h2 className="text-lg font-semibold w-full max-w-sm mb-6">Terms & Conditions</h2>

      {/* Agreement Box */}
      <div className="w-full max-w-sm bg-zinc-800 p-4 rounded-lg text-sm text-left text-gray-300 mb-6">
        <label className="flex items-start space-x-2">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 accent-[#881c22]"
          />
          <span>
            I agree to the Tunemusic{' '}
            <a href="#" className="text-[#881c22] underline">Terms and Conditions of Use</a> and{' '}
            <a href="#" className="text-[#881c22] underline">Privacy Policy</a>.
          </span>
        </label>
      </div>

      {/* Sign Up Button */}
      <button
        onClick={handleSignup}
        disabled={!agreed || loading}
        className={`w-full max-w-sm py-3 rounded-full text-white font-semibold transition ${agreed && !loading ? 'bg-[#881c22] hover:bg-[#9c2a30]' : 'bg-zinc-700 cursor-not-allowed'}`}
      >
        {loading ? 'Processing...' : 'Sign Up'}
      </button>
    </div>
  );
}