import React, { useEffect, useState, useRef } from 'react';
import {
  Search,
  Bell,
  User,
  Library,
  Plus,
  ChevronDown,
  Music,
  Play,
  Shuffle,
  SkipBack,
  SkipForward,
  Mic,
  ListMusic,
  Volume2,
} from 'lucide-react';
import { auth } from './firebase'; // Your firebase config
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';

export default function Home() {
  const [userdata, setUserdata] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const navigate = useNavigate();

  // Close dropdowns if clicked outside
  const bellRef = useRef(null);
  const accountRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserdata(user);
      else setUserdata(null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setShowBellDropdown(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setShowAccountDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggleNotifications() {
    setNotificationsEnabled((prev) => !prev);
  }

  function handleLogout() {
    setIsLoggingOut(true);
    signOut(auth)
      .then(() => {
        setTimeout(() => {
          setIsLoggingOut(false);
          navigate('/login');
        }, 1500);
      })
      .catch((err) => {
        console.error('Logout error:', err);
        setIsLoggingOut(false);
      });
  }

  function toggleDarkMode() {
    setDarkMode((prev) => !prev);
  }

  if (isLoggingOut) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-white">
        <p className="text-xl">Logging out...</p>
      </div>
    );
  }

  // Dynamic classes based on darkMode
  const bgMain = darkMode ? 'bg-zinc-950' : 'bg-white';
  const textMain = darkMode ? 'text-white' : 'text-black';
  const navBg = darkMode ? 'bg-zinc-900' : 'bg-gray-200';
  const inputBg = darkMode ? 'bg-zinc-800' : 'bg-gray-100';
  const dropdownBg = darkMode ? 'bg-zinc-800' : 'bg-gray-100';
  const hoverBg = darkMode ? 'hover:bg-zinc-700' : 'hover:bg-gray-300';
  const btnBg = darkMode ? 'bg-zinc-800' : 'bg-gray-300';

  return (
    <div className={`min-h-screen flex flex-col p-2 space-y-2 ${bgMain} ${textMain}`}>
      {/* Navigation Bar */}
      <div className={`flex justify-between items-center px-4 py-2 rounded-2xl relative ${navBg}`}>
        {/* Logo */}
        <div className="w-10 h-10 rounded-full overflow-hidden">
          <img src={logo} alt="Logo" className="w-full h-full object-cover" />
        </div>

        {/* Search Box */}
        <div className={`flex items-center rounded-full px-4 py-2 w-1/2 ${inputBg}`}>
          <Search size={16} className="mr-2" />
          <input
            type="text"
            placeholder="Search"
            className={`bg-transparent outline-none w-full text-sm ${darkMode ? 'placeholder:text-zinc-400' : 'placeholder:text-gray-500'}`}
          />
        </div>

        {/* Right Icons */}
        <div className="flex items-center space-x-4">
          {/* Bell Dropdown */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setShowBellDropdown((prev) => !prev)}
              className="relative focus:outline-none"
              aria-label="Toggle notifications dropdown"
            >
              <Bell size={20} />
            </button>

            <div
              className={`absolute top-full right-0 mt-2 w-48 rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${dropdownBg}
              ${showBellDropdown ? 'opacity-100 max-h-40 py-2' : 'opacity-0 max-h-0 py-0 pointer-events-none'}`}
              style={{ zIndex: 999 }}
            >
              <button
                onClick={toggleNotifications}
                className={`w-full text-left px-4 py-2 focus:outline-none ${hoverBg}`}
              >
                {notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications'}
              </button>
            </div>
          </div>

          {/* Account Dropdown */}
          <div className="relative" ref={accountRef}>
            <button
              onClick={() => setShowAccountDropdown((prev) => !prev)}
              className={`w-8 h-8 rounded-full flex items-center justify-center focus:outline-none ${btnBg}`}
              aria-label="Toggle account dropdown"
            >
              {userdata ? (
                <img
                  src={userdata.photoURL || 'default-avatar-url'}
                  alt={userdata.displayName || 'User'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User size={16} />
              )}
            </button>

            <div
              className={`absolute top-full right-0 mt-2 w-40 rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${dropdownBg}
              ${showAccountDropdown ? 'opacity-100 max-h-40 py-2' : 'opacity-0 max-h-0 py-0 pointer-events-none'}`}
              style={{ zIndex: 999 }}
            >
              <button
                onClick={() => {
                  window.location.href = '/profile';
                }}
                className={`w-full text-left px-4 py-2 focus:outline-none ${hoverBg}`}
              >
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-red-700 hover:bg-zinc-700 focus:outline-none"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Light/Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${btnBg} focus:outline-none`}
            aria-label="Toggle light/dark mode"
          >
            {darkMode ? '🌞' : '🌙'}
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 space-x-2 overflow-hidden">
        {/* Sidebar */}
        <div className={`${navBg} rounded-2xl p-4 w-64 flex-shrink-0 overflow-y-auto space-y-4`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Library size={20} />
              <span className="font-semibold">Your Library</span>
            </div>
            <Plus size={20} />
          </div>

          <div className="flex space-x-2 text-xs">
            <button className={`${btnBg} rounded-full px-3 py-1`}>Playlists</button>
            <button className={`${btnBg} rounded-full px-3 py-1`}>Albums</button>
            <button className={`${btnBg} rounded-full px-3 py-1`}>Artists</button>
          </div>

          <div className="flex items-center justify-between">
            <Search size={16} className="cursor-pointer" />
            <div className="flex items-center space-x-1 cursor-pointer text-sm">
              <span>Recent</span>
              <ChevronDown size={14} />
            </div>
          </div>

          <div className="overflow-y-auto max-h-64 mt-2">
            <p className={`${darkMode ? 'text-zinc-400' : 'text-gray-500'} text-sm`}>Library Item 1</p>
            <p className={`${darkMode ? 'text-zinc-400' : 'text-gray-500'} text-sm`}>Library Item 2</p>
          </div>
        </div>

        {/* Main Content */}
        <div className={`${navBg} flex-1 rounded-2xl p-4 overflow-y-auto space-y-4`}>
          <div className="flex space-x-2 text-xs">
            <button className={`${btnBg} rounded-full px-3 py-1`}>All</button>
            <button className={`${btnBg} rounded-full px-3 py-1`}>Music</button>
            <button className={`${btnBg} rounded-full px-3 py-1`}>Podcasts</button>
          </div>

          <div className={`${darkMode ? 'text-zinc-400' : 'text-gray-600'} text-sm`}>
            {/* Recommended music and sections go here */}
          </div>
        </div>

        {/* Playing Bar (Right Side) */}
        <div className={`${navBg} w-80 rounded-2xl p-4 flex-shrink-0 overflow-y-auto space-y-4`}>
          <div>
            <p className="text-sm animate-marquee whitespace-nowrap overflow-hidden">Now Playing Song Title</p>
            <div className="flex items-center justify-between mt-1">
              <ChevronDown size={16} />
            </div>
          </div>

          <div className={`${inputBg} w-full h-48 rounded-lg flex items-center justify-center`}>
            <Music size={48} />
          </div>

          <div className="space-y-1">
            <p className="text-sm animate-marquee whitespace-nowrap overflow-hidden">Song Title</p>
            <div className="flex space-x-2 text-xs" style={{ color: darkMode ? '#a1a1aa' : '#4b5563' }}>
              <span>Copy Link</span>
              <span>Hide</span>
              <span>❤️</span>
            </div>
            <p className="text-xs">Artist Name</p>
          </div>

          <div className={`${inputBg} p-2 rounded-xl`}>
            <p className="text-xs font-semibold mb-2">Related Music Video</p>
            <div className="flex items-center space-x-2">
              <Music size={32} />
              <div>
                <p className="text-sm">Video Title</p>
                <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>Artist Name</p>
              </div>
            </div>
          </div>

          <div className={`${inputBg} p-2 rounded-xl`}>
            <p className="text-xs font-semibold mb-1">About Artist</p>
            <div className="flex items-center space-x-2">
              <div className={`${darkMode ? 'bg-zinc-700' : 'bg-gray-300'} w-10 h-10 rounded-full`} />
              <div>
                <p className="text-sm">Artist Name</p>
                <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>1.2M Monthly Listeners</p>
              </div>
              <button className="ml-auto bg-white text-black text-xs px-2 py-1 rounded-full">Follow</button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Player Bar */}
      <div className={`${navBg} flex items-center justify-between rounded-2xl p-2`}>
        {/* Left: Song Info */}
        <div className="flex items-center space-x-2">
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-zinc-700">
            {/* Album art */}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Song Title</span>
            <span className="text-xs text-zinc-400">Artist Name</span>
          </div>
          <button className="ml-2">
            <Play size={20} />
          </button>
        </div>

        {/* Center: Controls */}
        <div className="flex items-center space-x-4">
          <Shuffle size={20} className="cursor-pointer" />
          <SkipBack size={20} className="cursor-pointer" />
          <button className="p-3 bg-white rounded-full text-black">
            <Play size={24} />
          </button>
          <SkipForward size={20} className="cursor-pointer" />
          <Mic size={20} className="cursor-pointer" />
          <ListMusic size={20} className="cursor-pointer" />
        </div>

        {/* Right: Volume */}
        <div className="flex items-center space-x-2">
          <Volume2 size={20} />
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="50"
            className="w-24"
          />
        </div>
      </div>
    </div>
  );
}
