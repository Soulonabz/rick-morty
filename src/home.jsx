import React, { useEffect, useState, useRef } from 'react';
import {
  Search,
  Bell,
  User,
  Library,
  Plus,
  ChevronDown,
  Music,
} from 'lucide-react';
import { auth } from './firebase'; // Your firebase config
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';
import { artists } from './data/artist.jsx';
import { songs } from './data/songs.jsx'

export default function Home() {
  const [userdata, setUserdata] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredResults, setFilteredResults] = useState([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [randomSongs, setRandomSongs] = useState([]);
  const [randomArtists, setRandomArtists] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [mixedContent, setMixedContent] = useState([]);

  const navigate = useNavigate();

  // Close dropdowns if clicked outside
  const bellRef = useRef(null);
  const accountRef = useRef(null);

  // Move scrollbar styles inside component
  const scrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
      background: ${darkMode ? 'rgba(39, 39, 42, 0.1)' : 'rgba(228, 228, 231, 0.1)'};
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: ${darkMode ? 'rgba(161, 161, 170, 0.3)' : 'rgba(113, 113, 122, 0.3)'};
      border-radius: 3px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: ${darkMode ? 'rgba(161, 161, 170, 0.5)' : 'rgba(113, 113, 122, 0.5)'};
    }
  `;

  // Function to get random songs
  const getRandomSongs = () => {
    const shuffled = [...songs].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 8);
  };

  // Function to get random artists
  const getRandomArtists = () => {
    const shuffled = [...artists].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 8);
  };

  // Function to get mixed content
  const getMixedContent = () => {
    const randomSongs = [...songs].sort(() => 0.5 - Math.random()).slice(0, 6);
    const randomArtists = [...artists].sort(() => 0.5 - Math.random()).slice(0, 6);
    
    const mixed = [...randomSongs.map(song => ({
      ...song,
      type: 'song',
      displayTitle: song.title,
      image: song.imageUrl
    })), ...randomArtists.map(artist => ({
      ...artist,
      type: 'artist',
      displayTitle: artist.name,
      image: artist.image
    }))].sort(() => 0.5 - Math.random());

    return mixed;
  };

  // Update random content when tab changes
  useEffect(() => {
    if (selectedTab === 'music') {
      setRandomSongs(getRandomSongs());
      setSelectedArtist(null);
    } else if (selectedTab === 'artists') {
      setRandomArtists(getRandomArtists());
      setSelectedArtist(null);
    } else if (selectedTab === 'all') {
      setMixedContent(getMixedContent());
      setSelectedArtist(null);
    }
  }, [selectedTab]);

  // Function to handle song click
  const handleSongClick = (song) => {
    navigate('/songplayer', { state: { song } });
  };

  // Function to handle artist click
  const handleArtistClick = (artist) => {
    setSelectedArtist(artist);
  };

  // Function to get artist's songs
  const getArtistSongs = (artistId) => {
    return songs.filter(song => song.artistId === artistId);
  };

  // Handle mixed content item click
  const handleMixedItemClick = (item) => {
    if (item.type === 'song') {
      handleSongClick(item);
    } else if (item.type === 'artist') {
      handleArtistClick(item);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredResults([]);
      return;
    }

    const combined = [
      ...artists.map(a => ({
        id: a.id,
        searchText: a.name.toLowerCase(),
        displayText: a.name,
        image: a.image,
        type: "artist",
      })),
      ...songs.map(s => ({
        id: s.id,
        searchText: s.title.toLowerCase(),
        displayText: s.title,
        type: "song",
        fullData: s,
      })),
    ];

    const filtered = combined.filter(item =>
      item.searchText.includes(searchTerm.toLowerCase())
    );

    setFilteredResults(filtered);
  }, [searchTerm]);

  const handleSelectItem = (item) => {
    if (item.type === "song") {
      navigate('/songplayer', { state: { song: item.fullData } });
    }
    setSearchTerm('');
    setFilteredResults([]);
  };

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

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
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
    <>
      <style>{scrollbarStyles}</style>
      <div className={`min-h-screen flex flex-col p-2 space-y-2 ${bgMain} ${textMain}`}>
        {/* Navigation Bar */}
        <div className={`flex justify-between items-center px-4 py-2 rounded-2xl relative ${navBg} z-50`}>
          {/* Logo */}
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <img src={logo} alt="Logo" className="w-full h-full object-cover" />
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-2xl mx-4">
            <div className={`flex items-center rounded-xl ${darkMode ? 'bg-zinc-800/50' : 'bg-gray-100'} 
              border ${darkMode ? 'border-zinc-700/50' : 'border-gray-200'}
              backdrop-blur-sm transition-all duration-200
              focus-within:ring-2 focus-within:ring-red-800/50 focus-within:border-transparent`}>
              <Search className={`w-5 h-5 ml-4 ${darkMode ? 'text-zinc-400' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="Search songs or artists..."
                className={`w-full py-3 px-3 bg-transparent outline-none text-sm
                  ${darkMode ? 'text-white placeholder:text-zinc-400' : 'text-gray-900 placeholder:text-gray-500'}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Search Results Dropdown */}
            {filteredResults.length > 0 && (
              <div className="absolute w-full mt-2 rounded-xl shadow-xl overflow-hidden
                backdrop-blur-xl border animate-in fade-in slide-in-from-top-2
                ${darkMode ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white/95 border-gray-200'}
                z-[60]">
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                  <div className="py-2">
                    {filteredResults.map((item) => (
                      <button
                        key={`${item.type}-${item.id}`}
                        onClick={() => handleSelectItem(item)}
                        className={`w-full flex items-center space-x-3 px-4 py-2.5 transition-colors
                          ${darkMode 
                            ? 'hover:bg-zinc-800/50 text-white' 
                            : 'hover:bg-gray-100 text-gray-900'}`}
                      >
                        {/* Item Image */}
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.type === 'song' ? item.fullData?.imageUrl : item.image}
                            alt={item.displayText}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">
                            {item.displayText}
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                            {capitalizeFirstLetter(item.type)}
                          </p>
                        </div>

                        {/* Icon */}
                        {item.type === 'song' ? (
                          <Music className={`w-4 h-4 flex-shrink-0 ${darkMode ? 'text-zinc-400' : 'text-gray-400'}`} />
                        ) : (
                          <User className={`w-4 h-4 flex-shrink-0 ${darkMode ? 'text-zinc-400' : 'text-gray-400'}`} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-4 z-50">
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

        {/* Main Content */}
        <div className={`${navBg} flex-1 rounded-2xl p-4 overflow-hidden z-0`}>
          {/* Tabs Navigation */}
          <div className="flex space-x-2 mb-6">
            <button 
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                ${selectedTab === 'all' 
                  ? 'bg-red-800 text-white shadow-lg shadow-red-800/30' 
                  : `${btnBg} hover:bg-opacity-80`}`}
              onClick={() => setSelectedTab('all')}
            >
              All
            </button>
            <button 
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                ${selectedTab === 'music' 
                  ? 'bg-red-800 text-white shadow-lg shadow-red-800/30' 
                  : `${btnBg} hover:bg-opacity-80`}`}
              onClick={() => setSelectedTab('music')}
            >
              Music
            </button>
            <button 
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                ${selectedTab === 'artists' 
                  ? 'bg-red-800 text-white shadow-lg shadow-red-800/30' 
                  : `${btnBg} hover:bg-opacity-80`}`}
              onClick={() => setSelectedTab('artists')}
            >
              Artists
            </button>
          </div>

          {/* Content Area */}
          <div className="h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar">
            <div className={`${darkMode ? 'text-zinc-400' : 'text-gray-600'} space-y-6`}>
              {/* All Tab Content */}
              {selectedTab === 'all' && !selectedArtist && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {mixedContent.map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      onClick={() => handleMixedItemClick(item)}
                      className={`group relative overflow-hidden rounded-2xl ${darkMode ? 'bg-zinc-800/50' : 'bg-gray-100'} 
                        p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
                        backdrop-blur-sm border border-transparent hover:border-red-800/20`}
                    >
                      <div className="aspect-square rounded-xl overflow-hidden mb-4">
                        <img 
                          src={item.image} 
                          alt={item.displayTitle}
                          className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="space-y-1">
                        <h3 className={`font-medium truncate ${darkMode ? 'text-white' : 'text-black'}`}>
                          {item.displayTitle}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {item.type === 'song' ? 'Song' : 'Artist'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Artist View */}
              {selectedTab === 'all' && selectedArtist && (
                <div className="space-y-6">
                  <button 
                    onClick={() => setSelectedArtist(null)}
                    className="inline-flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
                  >
                    <span>←</span>
                    <span>Back to All</span>
                  </button>
                  
                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Artist Info */}
                    <div className="lg:w-1/3">
                      <div className="sticky top-4 space-y-4">
                        <div className="rounded-2xl overflow-hidden shadow-xl">
                          <img 
                            src={selectedArtist.image} 
                            alt={selectedArtist.name}
                            className="w-full aspect-square object-cover"
                          />
                        </div>
                        <div className="space-y-2">
                          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                            {selectedArtist.name}
                          </h2>
                          <p className="text-gray-500 leading-relaxed">{selectedArtist.bio}</p>
                        </div>
                      </div>
                    </div>

                    {/* Artist Songs */}
                    <div className="lg:w-2/3 space-y-4">
                      <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>
                        Songs
                      </h3>
                      <div className="grid gap-4">
                        {getArtistSongs(selectedArtist.id).map((song) => (
                          <div
                            key={song.id}
                            onClick={() => handleSongClick(song)}
                            className={`group flex items-center space-x-4 p-4 rounded-xl transition-all duration-200
                              ${darkMode 
                                ? 'bg-zinc-800/50 hover:bg-zinc-700/50' 
                                : 'bg-gray-100 hover:bg-gray-200'} 
                              backdrop-blur-sm cursor-pointer hover:shadow-lg`}
                          >
                            <div className="h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
                              <img 
                                src={song.imageUrl} 
                                alt={song.title}
                                className="h-full w-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-medium truncate ${darkMode ? 'text-white' : 'text-black'}`}>
                                {song.title}
                              </h4>
                              <p className="text-sm text-gray-500 mt-1">
                                {selectedArtist.name}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Music Grid */}
              {selectedTab === 'music' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {randomSongs.map((song) => {
                    const artist = artists.find(a => a.id === song.artistId);
                    return (
                      <div
                        key={song.id}
                        onClick={() => handleSongClick(song)}
                        className={`group relative overflow-hidden rounded-2xl ${darkMode ? 'bg-zinc-800/50' : 'bg-gray-100'} 
                          p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
                          backdrop-blur-sm border border-transparent hover:border-red-800/20`}
                      >
                        <div className="aspect-square rounded-xl overflow-hidden mb-4">
                          <img 
                            src={song.imageUrl} 
                            alt={song.title}
                            className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div className="space-y-1">
                          <h3 className={`font-medium truncate ${darkMode ? 'text-white' : 'text-black'}`}>
                            {song.title}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">
                            {artist ? artist.name : 'Unknown Artist'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Artists Grid */}
              {selectedTab === 'artists' && !selectedArtist && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {randomArtists.map((artist) => (
                    <div
                      key={artist.id}
                      onClick={() => handleArtistClick(artist)}
                      className={`group relative overflow-hidden rounded-2xl ${darkMode ? 'bg-zinc-800/50' : 'bg-gray-100'} 
                        p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
                        backdrop-blur-sm border border-transparent hover:border-red-800/20`}
                    >
                      <div className="aspect-square rounded-xl overflow-hidden mb-4">
                        <img 
                          src={artist.image} 
                          alt={artist.name}
                          className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="space-y-1">
                        <h3 className={`font-medium truncate ${darkMode ? 'text-white' : 'text-black'}`}>
                          {artist.name}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">Artist</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Artist View in Artists Tab */}
              {selectedTab === 'artists' && selectedArtist && (
                <div className="space-y-6">
                  <button 
                    onClick={() => setSelectedArtist(null)}
                    className="inline-flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
                  >
                    <span>←</span>
                    <span>Back to Artists</span>
                  </button>
                  
                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Artist Info */}
                    <div className="lg:w-1/3">
                      <div className="sticky top-4 space-y-4">
                        <div className="rounded-2xl overflow-hidden shadow-xl">
                          <img 
                            src={selectedArtist.image} 
                            alt={selectedArtist.name}
                            className="w-full aspect-square object-cover"
                          />
                        </div>
                        <div className="space-y-2">
                          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-black'}`}>
                            {selectedArtist.name}
                          </h2>
                          <p className="text-gray-500 leading-relaxed">{selectedArtist.bio}</p>
                        </div>
                      </div>
                    </div>

                    {/* Artist Songs */}
                    <div className="lg:w-2/3 space-y-4">
                      <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>
                        Songs
                      </h3>
                      <div className="grid gap-4">
                        {getArtistSongs(selectedArtist.id).map((song) => (
                          <div
                            key={song.id}
                            onClick={() => handleSongClick(song)}
                            className={`group flex items-center space-x-4 p-4 rounded-xl transition-all duration-200
                              ${darkMode 
                                ? 'bg-zinc-800/50 hover:bg-zinc-700/50' 
                                : 'bg-gray-100 hover:bg-gray-200'} 
                              backdrop-blur-sm cursor-pointer hover:shadow-lg`}
                          >
                            <div className="h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
                              <img 
                                src={song.imageUrl} 
                                alt={song.title}
                                className="h-full w-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-medium truncate ${darkMode ? 'text-white' : 'text-black'}`}>
                                {song.title}
                              </h4>
                              <p className="text-sm text-gray-500 mt-1">
                                {selectedArtist.name}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}