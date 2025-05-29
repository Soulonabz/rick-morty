import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase'; // Adjust path if needed
import { X } from 'lucide-react';
import logo from './assets/logo.png';

export default function SignupStep2() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const [name, setName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [gender, setGender] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showDobInfo, setShowDobInfo] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode !== null ? JSON.parse(savedMode) : true;
  });

  // Add effect to update dark mode when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedMode = localStorage.getItem('darkMode');
      setDarkMode(savedMode !== null ? JSON.parse(savedMode) : true);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isFormValid = () => {
    const dayNum = parseInt(day);
    const yearNum = parseInt(year);

    return (
      name.trim() !== '' &&
      month !== '' &&
      gender !== '' &&
      dayNum >= 1 &&
      dayNum <= 31 &&
      yearNum >= 1900 &&
      yearNum <= currentYear &&
      day.length === 2 &&
      year.length === 4
    );
  };

  const handleNext = async () => {
    if (!isFormValid() || processing) return;

    setProcessing(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          name,
          birthdate: {
            day,
            month,
            year,
          },
          gender,
        });

        navigate('/signupstep3');
      } else {
        console.error('No authenticated user found.');
      }
    } catch (error) {
      console.error('Error updating user data:', error);
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
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tell us about yourself</h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>Step 2 of 3</p>
          </div>
        </div>

        {/* Progress Line */}
        <div className="flex items-center gap-1 px-4">
          <div className="h-1 flex-1 rounded-full bg-red-800"></div>
          <div className="h-1 flex-1 rounded-full bg-red-800"></div>
          <div className="h-1 flex-1 rounded-full bg-zinc-700"></div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
              Name
            </label>
            <p className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
              This name will appear on your profile
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={processing}
              className={`w-full px-4 py-3 ${darkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-100 border-gray-300'} 
                border rounded-xl ${darkMode ? 'text-white' : 'text-gray-900'} 
                placeholder-${darkMode ? 'zinc' : 'gray'}-500 focus:outline-none focus:ring-2 focus:ring-red-800 
                focus:border-transparent transition-all duration-200`}
              placeholder="Enter your name"
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
              Date of Birth
            </label>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={2}
                placeholder="DD"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                disabled={processing}
                className={`w-full px-4 py-3 ${darkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-100 border-gray-300'} 
                  border rounded-xl ${darkMode ? 'text-white' : 'text-gray-900'} 
                  placeholder-${darkMode ? 'zinc' : 'gray'}-500 focus:outline-none focus:ring-2 focus:ring-red-800 
                  focus:border-transparent transition-all duration-200`}
              />
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                disabled={processing}
                className={`w-full px-4 py-3 ${darkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-100 border-gray-300'} 
                  border rounded-xl ${darkMode ? 'text-white' : 'text-gray-900'} 
                  placeholder-${darkMode ? 'zinc' : 'gray'}-500 focus:outline-none focus:ring-2 focus:ring-red-800 
                  focus:border-transparent transition-all duration-200 appearance-none`}
              >
                <option value="">Month</option>
                <option value="Jan">January</option>
                <option value="Feb">February</option>
                <option value="Mar">March</option>
                <option value="Apr">April</option>
                <option value="May">May</option>
                <option value="Jun">June</option>
                <option value="Jul">July</option>
                <option value="Aug">August</option>
                <option value="Sep">September</option>
                <option value="Oct">October</option>
                <option value="Nov">November</option>
                <option value="Dec">December</option>
              </select>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={4}
                placeholder="YYYY"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={processing}
                className={`w-full px-4 py-3 ${darkMode ? 'bg-zinc-800/50 border-zinc-700' : 'bg-gray-100 border-gray-300'} 
                  border rounded-xl ${darkMode ? 'text-white' : 'text-gray-900'} 
                  placeholder-${darkMode ? 'zinc' : 'gray'}-500 focus:outline-none focus:ring-2 focus:ring-red-800 
                  focus:border-transparent transition-all duration-200`}
              />
            </div>
            <p className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-gray-500'} mt-2`}>
              Why do we need your date of birth?{' '}
              <button 
                onClick={() => setShowDobInfo(true)}
                className="text-red-800 hover:text-red-700 hover:underline transition-colors"
              >
                Learn more
              </button>
            </p>
          </div>

          {/* Gender Selection */}
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
              Gender
            </label>
            <p className={`text-xs ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
              We use your gender to help personalize our content recommendations
            </p>
            <div className="space-y-2 mt-3">
              {['Male', 'Female', 'Non-binary', 'Something else', 'Prefer not to say'].map((g) => (
                <label 
                  key={g} 
                  className={`flex items-center space-x-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer
                    ${gender === g ? 'border-red-800 bg-red-800/10' : `${darkMode ? 'border-zinc-700 bg-zinc-800/30 hover:bg-zinc-800/50' : 'border-gray-300 bg-gray-100/30 hover:bg-gray-100/50'}`}
                    ${processing ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={gender === g}
                    onChange={(e) => setGender(e.target.value)}
                    disabled={processing}
                    className="hidden"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200
                    ${gender === g ? 'border-red-800 bg-red-800' : darkMode ? 'border-zinc-500' : 'border-gray-400'}
                  `}/>
                  <span className={`text-sm ${gender === g ? 'text-white' : darkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                    {g}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="space-y-4 pt-4">
          <button
            onClick={handleNext}
            disabled={!isFormValid() || processing}
            className={`w-full py-3 rounded-xl font-medium transition-all duration-200 
              ${isFormValid() && !processing
                ? 'bg-red-800 hover:bg-red-700 text-white'
                : `${darkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
              }`}
          >
            {processing ? 'Processing...' : 'Continue'}
          </button>
          
          <button
            onClick={() => navigate('/signupstep1')}
            disabled={processing}
            className={`w-full text-sm ${darkMode ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
          >
            ← Back to previous step
          </button>
        </div>
      </div>

      {/* Date of Birth Info Modal */}
      {showDobInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDobInfo(false)}
          />
          <div className={`relative w-full max-w-md ${darkMode ? 'bg-zinc-900' : 'bg-white'} rounded-2xl shadow-xl p-6 space-y-4`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Why We Need Your Date of Birth
              </h3>
              <button
                onClick={() => setShowDobInfo(false)}
                className={`${darkMode ? 'text-zinc-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={`space-y-4 text-sm ${darkMode ? 'text-zinc-300' : 'text-gray-600'}`}>
              <p>
                We collect your date of birth for several important reasons:
              </p>
              
              <div className="space-y-2">
                <p className="flex items-start gap-2">
                  <span className="text-red-800">•</span>
                  <span>To ensure you meet the minimum age requirement for using our service in your region</span>
                </p>
                
                <p className="flex items-start gap-2">
                  <span className="text-red-800">•</span>
                  <span>To provide age-appropriate content recommendations and personalize your music experience</span>
                </p>
                
                <p className="flex items-start gap-2">
                  <span className="text-red-800">•</span>
                  <span>To help us understand our user demographics and improve our service</span>
                </p>
                
                <p className="flex items-start gap-2">
                  <span className="text-red-800">•</span>
                  <span>To send you birthday wishes and special offers on your special day</span>
                </p>
              </div>

              <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-gray-500'} mt-4`}>
                Your date of birth is securely stored and protected in accordance with our privacy policy. We never share this information with third parties without your explicit consent.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
