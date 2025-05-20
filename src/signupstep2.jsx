import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase'; // Adjust path if needed
import logo from './assets/logo.png';

export default function SignupStep2() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const [name, setName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [gender, setGender] = useState('');

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
    if (isFormValid()) {
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
        <div className="flex-1 h-1 bg-[#881c22] rounded mx-1"></div>
        <div className="flex-1 h-1 bg-zinc-500 rounded"></div>
      </div>

      {/* Back and Step Info */}
      <div className="w-full max-w-sm flex items-center mb-2">
        <button
          onClick={() => navigate('/signupstep1')}
          className="text-sm text-gray-300 hover:text-white"
        >
          &lt; Back
        </button>
        <p className="text-sm text-gray-400 ml-auto">Step 2 of 3</p>
      </div>

      {/* Heading */}
      <h2 className="text-lg font-semibold w-full max-w-sm mb-6">Tell us about yourself?</h2>

      {/* Name Input */}
      <div className="w-full max-w-sm mb-4">
        <label className="block text-sm mb-1 text-gray-300">Name</label>
        <p className="text-xs text-gray-400 mb-2">
          This name will appear on your profile.
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 rounded-lg bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white"
          required
        />
      </div>

      {/* Date of Birth */}
      <div className="w-full max-w-sm mb-4">
        <label className="block text-sm mb-1 text-gray-300">Date of Birth</label>
        <div className="flex space-x-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={2}
            autoComplete="bday-day"
            required
            placeholder="dd"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="w-1/3 p-3 rounded-lg bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white"
          />
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            required
            className="w-1/3 p-3 rounded-lg bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white"
          >
            <option value="">Month</option>
            <option>Jan</option>
            <option>Feb</option>
            <option>Mar</option>
            <option>Apr</option>
            <option>May</option>
            <option>Jun</option>
            <option>Jul</option>
            <option>Aug</option>
            <option>Sep</option>
            <option>Oct</option>
            <option>Nov</option>
            <option>Dec</option>
          </select>
          <input
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={4}
            autoComplete="bday-year"
            required
            placeholder="yyyy"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-1/3 p-3 rounded-lg bg-zinc-800 text-white focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Why do we need your date of birth?{' '}
          <span className="text-red-800 cursor-pointer hover:underline">Learn more.</span>
        </p>
      </div>

      {/* Gender Selection */}
      <div className="w-full max-w-sm mb-6">
        <label className="block text-sm mb-1 text-gray-300">Gender</label>
        <p className="text-xs text-gray-400 mb-2">
          We use your gender to help personalize our content recommendations for you.
        </p>
        <div className="space-y-2">
          {['Male', 'Female', 'Non-binary', 'Something else', 'Prefer not to say'].map((g) => (
            <label key={g} className="flex items-center space-x-2">
              <input
                required
                type="radio"
                name="gender"
                value={g}
                checked={gender === g}
                onChange={(e) => setGender(e.target.value)}
                className="form-radio text-red-800"
              />
              <span>{g}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={!isFormValid()}
        className={`w-full max-w-sm py-3 rounded-full text-white font-semibold transition ${
          isFormValid() ? 'bg-red-800 hover:bg-red-900' : 'bg-zinc-700 cursor-not-allowed'
        }`}
      >
        Next
      </button>
    </div>
  );
}
