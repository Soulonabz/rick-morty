import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase'; // Adjust the path if needed
import { doc, updateDoc } from 'firebase/firestore';
import emailjs from 'emailjs-com'; // Import emailjs
import { X } from 'lucide-react';
import logo from './assets/logo.png';
import { updateSignupProgress, cleanupIncompleteSignup } from './utils/signupUtils';

export default function SignupStep3() {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode !== null ? JSON.parse(savedMode) : true;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const savedMode = localStorage.getItem('darkMode');
      setDarkMode(savedMode !== null ? JSON.parse(savedMode) : true);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-zinc-800 to-zinc-950' : 'bg-gradient-to-br from-gray-100 to-white'} p-4`}>
      <div className={`w-full max-w-md ${darkMode ? 'bg-zinc-900/50' : 'bg-white'} backdrop-blur-xl rounded-2xl shadow-xl p-8 space-y-8`}>
        {/* Logo and Header */}
        <div className="flex flex-col items-center space-y-4">
          <img src={logo} alt="TuneMusic Logo" className="w-20 h-20 rounded-full object-cover ring-2 ring-red-800/50" />
          <div className="text-center">
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Almost there!</h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>Step 3 of 3</p>
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
            <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              Terms & Conditions
            </h3>
            <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
              Before you start enjoying Tunemusic, please read and accept our terms.
            </p>
          </div>

          <div className={`${darkMode ? 'bg-zinc-800/30' : 'bg-gray-50'} rounded-xl p-6 space-y-6`}>
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                disabled={processing}
                className={`mt-1 w-4 h-4 rounded border-${darkMode ? 'zinc-600' : 'gray-300'} text-red-800 focus:ring-red-800 focus:ring-offset-0 ${darkMode ? 'bg-zinc-800/50' : 'bg-gray-100'} transition-colors`}
              />
              <span className={`text-sm ${darkMode ? 'text-zinc-300' : 'text-gray-600'}`}>
                I agree to the Tunemusic{' '}
                <button 
                  onClick={() => setShowTerms(true)} 
                  className="text-red-800 hover:text-red-700 hover:underline transition-colors"
                >
                  Terms and Conditions of Use
                </button>{' '}
                and{' '}
                <button 
                  onClick={() => setShowPrivacy(true)}
                  className="text-red-800 hover:text-red-700 hover:underline transition-colors"
                >
                  Privacy Policy
                </button>.
              </span>
            </label>

            <div className={`text-xs ${darkMode ? 'text-zinc-500 bg-zinc-800/30' : 'text-gray-500 bg-gray-100/80'} p-4 rounded-lg`}>
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
                : `${darkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
              }`}
          >
            {processing ? 'Processing...' : 'Complete Sign Up'}
          </button>
          
          <button
            onClick={handleBackToLogin}
            disabled={processing}
            className={`w-full text-sm ${darkMode ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
          >
            Cancel signup
          </button>
        </div>
      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowTerms(false)}
          />
          <div className={`relative w-full max-w-2xl ${darkMode ? 'bg-zinc-900' : 'bg-white'} rounded-2xl shadow-xl p-6 max-h-[80vh] overflow-hidden`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Terms and Conditions of Use
              </h3>
              <button
                onClick={() => setShowTerms(false)}
                className={`${darkMode ? 'text-zinc-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={`space-y-6 text-sm ${darkMode ? 'text-zinc-300' : 'text-gray-600'} pr-6 h-[calc(80vh-8rem)] overflow-y-auto
              scrollbar-thin ${darkMode ? 'scrollbar-track-zinc-800 scrollbar-thumb-zinc-700' : 'scrollbar-track-gray-100 scrollbar-thumb-gray-300'}
              hover:scrollbar-thumb-red-800 scrollbar-thumb-rounded-full scrollbar-track-rounded-full`}>
              <section>
                <h4 className={`text-base font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>1. Acceptance of Terms</h4>
                <p>By accessing and using TuneMusic, you agree to be bound by these Terms and Conditions of Use. If you do not agree to these terms, please do not use our service.</p>
              </section>

              <section>
                <h4 className={`text-base font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>2. Service Description</h4>
                <p>TuneMusic is a music streaming service that provides users with access to a vast library of songs, playlists, and music-related content. We reserve the right to modify or discontinue any aspect of our service at any time.</p>
              </section>

              <section>
                <h4 className={`text-base font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>3. User Accounts</h4>
                <ul className="list-disc pl-4 space-y-2">
                  <li>You must provide accurate and complete information when creating an account</li>
                  <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                  <li>You must be at least 13 years old to use our service</li>
                  <li>You agree to notify us immediately of any unauthorized use of your account</li>
                </ul>
              </section>

              <section>
                <h4 className={`text-base font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>4. Content Usage Rights</h4>
                <p>All content available through TuneMusic is protected by copyright and other intellectual property rights. Users may only use the content for personal, non-commercial purposes in accordance with these terms.</p>
              </section>

              <section>
                <h4 className={`text-base font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>5. Prohibited Activities</h4>
                <ul className="list-disc pl-4 space-y-2">
                  <li>Copying, redistributing, or sharing protected content</li>
                  <li>Using the service for any illegal purpose</li>
                  <li>Attempting to circumvent any technical measures we use to provide the service</li>
                  <li>Creating multiple accounts or sharing account credentials</li>
                </ul>
              </section>

              <section>
                <h4 className={`text-base font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>6. Service Modifications</h4>
                <p>We may modify these terms or any aspect of the service at any time. Continued use of TuneMusic after such changes constitutes acceptance of the modified terms.</p>
              </section>

              <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-gray-500'} mt-4`}>
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPrivacy(false)}
          />
          <div className={`relative w-full max-w-2xl ${darkMode ? 'bg-zinc-900' : 'bg-white'} rounded-2xl shadow-xl p-6 max-h-[80vh] overflow-hidden`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Privacy Policy
              </h3>
              <button
                onClick={() => setShowPrivacy(false)}
                className={`${darkMode ? 'text-zinc-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={`space-y-6 text-sm ${darkMode ? 'text-zinc-300' : 'text-gray-600'} pr-6 h-[calc(80vh-8rem)] overflow-y-auto
              scrollbar-thin ${darkMode ? 'scrollbar-track-zinc-800 scrollbar-thumb-zinc-700' : 'scrollbar-track-gray-100 scrollbar-thumb-gray-300'}
              hover:scrollbar-thumb-red-800 scrollbar-thumb-rounded-full scrollbar-track-rounded-full`}>
              <section>
                <h4 className={`text-base font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>1. Information We Collect</h4>
                <ul className="list-disc pl-4 space-y-2">
                  <li>Account information (name, email, date of birth, gender)</li>
                  <li>Usage data (listening history, playlists, favorites)</li>
                  <li>Device information and IP addresses</li>
                  <li>Payment information (handled securely by our payment processors)</li>
                </ul>
              </section>

              <section>
                <h4 className={`text-base font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>2. How We Use Your Information</h4>
                <ul className="list-disc pl-4 space-y-2">
                  <li>To provide and personalize our music streaming service</li>
                  <li>To recommend content based on your preferences</li>
                  <li>To improve our service and develop new features</li>
                  <li>To communicate with you about your account and updates</li>
                  <li>To ensure compliance with our terms and applicable laws</li>
                </ul>
              </section>

              <section>
                <h4 className={`text-base font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>3. Data Security</h4>
                <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
              </section>

              <section>
                <h4 className={`text-base font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>4. Data Sharing</h4>
                <p>We may share your information with:</p>
                <ul className="list-disc pl-4 space-y-2">
                  <li>Service providers who assist in our operations</li>
                  <li>Analytics providers to help us improve our service</li>
                  <li>Law enforcement when required by law</li>
                </ul>
              </section>

              <section>
                <h4 className={`text-base font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>5. Your Rights</h4>
                <ul className="list-disc pl-4 space-y-2">
                  <li>Access and download your personal data</li>
                  <li>Request correction or deletion of your data</li>
                  <li>Object to processing of your data</li>
                  <li>Withdraw consent at any time</li>
                </ul>
              </section>

              <section>
                <h4 className={`text-base font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>6. Contact Us</h4>
                <p>If you have any questions about this Privacy Policy, please contact our Data Protection Officer at privacy@tunemusic.com</p>
              </section>

              <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-gray-500'} mt-4`}>
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}