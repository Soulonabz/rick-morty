import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function SignupCaptcha() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-700 to-zinc-900 px-4 pt-8 text-white">
      {/* Logo and Text */}
      <div className="flex items-center mb-6 w-full">
        <img src={logo} alt="TuneMusic Logo" className="w-16 h-16 rounded-full mr-3" />
        <p className="text-2xl font-semibold">Tunemusic</p>
      </div>

      {/* Solid line */}
      <div className="w-full border-t-2 border-zinc-500 mb-6"></div>

      {/* Centered Content */}
      <div className="flex flex-col items-center justify-center w-full">
        {/* Heading */}
        <h2 className="text-3xl font-semibold w-full max-w-sm mb-6 text-center">
          We need to make sure that you're a human
        </h2>

        {/* CAPTCHA box (placeholder div for now) */}
        <div className="w-full max-w-sm bg-zinc-800 rounded-xl h-32 flex items-center justify-center text-gray-400 mb-6 border border-zinc-600">
          CAPTCHA Box Placeholder
        </div>

        {/* Continue button */}
        <button
          onClick={() => navigate('/signupemailverif')}
          className="w-40 max-w-sm py-3 rounded-full text-white font-semibold transition bg-[#881c22] hover:bg-[#9c2a30]"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
