import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Search,
  Bell,
  User,
  Library,
  Plus,
  ChevronDown,
  Music,
  Sun,
  Moon,
} from 'lucide-react';
import { auth } from './firebase'; // Your firebase config
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';
import { artists } from './data/artist.jsx';
import { songs } from './data/songs.jsx'
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

const Home = () => {
  const [userdata, setUserdata] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    return saved ? JSON.parse(saved) : false;
  });
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode !== null ? JSON.parse(savedMode) : true;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredResults, setFilteredResults] = useState([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [randomSongs, setRandomSongs] = useState([]);
  const [randomArtists, setRandomArtists] = useState([]);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [mixedContent, setMixedContent] = useState([]);
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      const savedHistory = localStorage.getItem('searchHistory');
      return savedHistory ? JSON.parse(savedHistory) : [];
    } catch (error) {
      console.error('Error loading search history:', error);
      return [];
    }
  });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [lastCheckedSongsCount, setLastCheckedSongsCount] = useState(() => {
    const saved = localStorage.getItem('lastCheckedSongsCount');
    return saved ? JSON.parse(saved) : songs.length;
  });
  const [userDocData, setUserDocData] = useState(null);

  const navigate = useNavigate();

  // Function to get songs by artist ID
  const getArtistSongs = useCallback((artistId) => {
    return songs.filter(song => song.artistId === artistId);
  }, []);

  // Close dropdowns if clicked outside
  const bellRef = useRef(null);
  const accountRef = useRef(null);
  const searchRef = useRef(null);

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
  const getRandomSongs = useCallback(() => {
    const shuffled = [...songs].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 8);
  }, []);

  // Function to get random artists
  const getRandomArtists = useCallback(() => {
    const shuffled = [...artists].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 8);
  }, []);

  // Function to get mixed content
  const getMixedContent = useCallback(() => {
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
  }, []);

  // Optimize search with debouncing
  const handleSearch = (term) => {
    if (term.trim() === '') {
      setFilteredResults([]);
      return;
    }

    const searchTerm = term.toLowerCase();
    const combined = [
      ...artists.map(a => ({
        id: a.id,
        searchText: a.name.toLowerCase(),
        displayText: a.name,
        image: a.image,
        type: "artist",
        fullData: a,
      })),
      ...songs.map(s => ({
        id: s.id,
        searchText: s.title.toLowerCase(),
        displayText: s.title,
        image: s.imageUrl,
        type: "song",
        fullData: s,
        artistId: s.artistId,
        url: s.url,
        imageUrl: s.imageUrl,
        title: s.title
      })),
    ];

    const filtered = combined.filter(item =>
      item.searchText.includes(searchTerm)
    );

    setFilteredResults(filtered);
  };

  // Update search term with optimized handler
  const updateSearchTerm = (value) => {
    setSearchTerm(value);
    handleSearch(value);
  };

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Optimize random content generation with memoization
  const getRandomContent = useCallback(() => {
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
  }, [selectedTab, getRandomSongs, getRandomArtists, getMixedContent]);

  // Update random content when tab changes
  useEffect(() => {
    getRandomContent();
  }, [selectedTab]); // Only re-run when selectedTab changes

  // Optimize image loading for content
  useEffect(() => {
    const imagesToLoad = [];

    // Collect all images that need to be loaded
    if (selectedTab === 'music') {
      randomSongs.forEach(song => {
        if (song.imageUrl) {
          imagesToLoad.push(song.imageUrl);
        }
      });
    } else if (selectedTab === 'artists') {
      randomArtists.forEach(artist => {
        if (artist.image) {
          imagesToLoad.push(artist.image);
        }
      });
    } else if (selectedTab === 'all') {
      mixedContent.forEach(item => {
        if (item.image) {
          imagesToLoad.push(item.image);
        }
      });
    }

    // Preload images
    imagesToLoad.forEach(imageUrl => {
      const imgElement = new Image();
      imgElement.src = imageUrl;
    });
  }, [selectedTab, randomSongs, randomArtists, mixedContent]);

  // Optimize navigation with throttling
  const handleSongClick = (song) => {
    // Add song to history before navigating
    const historyItem = {
      id: song.id,
      displayText: song.title,
      type: 'song',
      image: song.imageUrl,
      fullData: song
    };

    const newHistory = [
      historyItem,
      ...searchHistory.filter(h => h.id !== song.id)
    ].slice(0, 5);

    setSearchHistory(newHistory);
    try {
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }

    // Navigate to song player
    navigate('/songplayer', { state: { song } });
  };

  const handleArtistClick = (artist) => {
    setSelectedArtist(artist);
    setIsSearchFocused(false);
    setSearchTerm('');
    setFilteredResults([]);
  };

  // Optimize mixed content click handling
  const handleMixedItemClick = (item) => {
    if (item.type === 'song') {
      // Find the actual song from the songs array
      const actualSong = songs.find(s => s.id === item.id) || item;
      handleSongClick(actualSong);
    } else if (item.type === 'artist') {
      handleArtistClick(item);
    }
  };

  // Optimize search history management
  const handleSelectItem = (item) => {
    if (!item) {
      // Clear all functionality
      setSearchHistory([]);
      localStorage.removeItem('searchHistory');
      setIsSearchFocused(false);
      return;
    }

    // For songs, get the complete song data
    let fullData = item.fullData;
    if (item.type === 'song') {
      // Try to find the complete song data
      const completeSong = songs.find(s => s.id === item.id);
      fullData = completeSong || item.fullData || item;
    }

    const historyItem = {
      id: item.id,
      displayText: item.displayText || item.title || item.name,
      type: item.type,
      image: item.type === 'song' ? (fullData?.imageUrl || item.image) : item.image,
      fullData: fullData
    };

    // Update both state and localStorage
    const newHistory = [
      historyItem,
      ...searchHistory.filter(h => h.id !== item.id)
    ].slice(0, 5);

    setSearchHistory(newHistory);
    try {
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }

    setIsSearchFocused(false);
    setSearchTerm('');
    setFilteredResults([]);

    if (item.type === 'song') {
      handleSongClick(fullData);
    } else {
      handleArtistClick(item.fullData || item);
    }
  };

  // Save search history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }, [searchHistory]);

  useEffect(() => {
    localStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled));
  }, [notificationsEnabled]);

  useEffect(() => {
    const newSongsCount = songs.length - lastCheckedSongsCount;
    
    if (notificationsEnabled && newSongsCount > 0) {
      // Show notification for new songs
      const notification = new Notification('New Songs Added!', {
        body: `${newSongsCount} new song${newSongsCount > 1 ? 's' : ''} added to the library`,
        icon: logo
      });

      // Update last checked count
      setLastCheckedSongsCount(songs.length);
      localStorage.setItem('lastCheckedSongsCount', JSON.stringify(songs.length));
    }
  }, [songs.length, lastCheckedSongsCount, notificationsEnabled]);

  const enableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        setLastCheckedSongsCount(songs.length);
        localStorage.setItem('lastCheckedSongsCount', JSON.stringify(songs.length));
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  function toggleNotifications() {
    if (!notificationsEnabled) {
      enableNotifications();
    } else {
      setNotificationsEnabled(false);
    }
    setShowBellDropdown(false);
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function handleLogout() {
    setIsLoggingOut(true);
    signOut(auth)
      .then(() => {
        setTimeout(() => {
          navigate('/login');
          setIsLoggingOut(false);
        }, 1000);
      })
      .catch((error) => {
        console.error('Error logging out:', error);
        setIsLoggingOut(false);
      });
  }

  // Add navigation handler for profile
  function handleProfileClick() {
    navigate('/profile');
    setShowAccountDropdown(false);
  }

  function toggleDarkMode() {
    setDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      return newMode;
    });
  }

  // Add auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserdata(user);
        // Fetch additional user data from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setUserDocData(docSnap.data());
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUserdata(null);
        setUserDocData(null);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    // Update document class for global dark mode styling
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
          <div className="relative flex-1 max-w-2xl mx-4" ref={searchRef}>
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
                onChange={(e) => updateSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
              />
            </div>

            {/* Search Results or History Dropdown */}
            {((filteredResults.length > 0 && searchTerm) || (isSearchFocused && searchHistory.length > 0 && !searchTerm)) && (
              <div className="absolute w-full mt-2 rounded-xl shadow-xl overflow-hidden
                backdrop-blur-xl border animate-in fade-in slide-in-from-top-2
                ${darkMode ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white/95 border-gray-200'}
                z-[60]">
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                  <div className="py-2">
                    {/* Show search history when no search term */}
                    {!searchTerm && searchHistory.length > 0 && (
                      <>
                        <div className="px-4 py-2">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                              Recent Searches
                            </p>
                            <button
                              onClick={() => handleSelectItem(null)}
                              className="text-xs text-red-500 hover:text-red-400"
                            >
                              Clear All
                            </button>
                          </div>
                        </div>
                        {searchHistory.map((item) => (
                          <button
                            key={`history-${item.id}`}
                            onClick={() => handleSelectItem(item)}
                            className={`w-full flex items-center space-x-3 px-4 py-2.5 transition-colors
                              ${darkMode 
                                ? 'hover:bg-zinc-800/50 text-white' 
                                : 'hover:bg-gray-100 text-gray-900'}`}
                          >
                            {/* Item Image */}
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={item.image}
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

                            {/* History Icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 flex-shrink-0 ${darkMode ? 'text-zinc-400' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        ))}
                        <div className="h-px bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent my-2" />
                      </>
                    )}

                    {/* Show search results when there's a search term */}
                    {searchTerm && filteredResults.map((item) => (
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
          <div className="flex items-center space-x-2">
            {/* Bell Dropdown */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setShowBellDropdown((prev) => !prev)}
                className="relative p-2 rounded-xl focus:outline-none hover:bg-white/5 transition-colors"
                aria-label="Toggle notifications dropdown"
              >
                <div className="relative">
                  <Bell size={20} className={notificationsEnabled ? 'text-white' : 'text-white/60'} />
                  {notificationsEnabled && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </div>
              </button>

              <div
                className={`absolute top-full right-0 mt-2 w-72 rounded-xl shadow-lg overflow-hidden transition-all duration-300
                  ${darkMode ? 'bg-zinc-900/95 border border-zinc-800' : 'bg-white/95 border border-gray-200'}
                  backdrop-blur-xl
                  ${showBellDropdown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Notifications
                    </h3>
                    <button
                      onClick={toggleNotifications}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
                        ${notificationsEnabled 
                          ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                          : 'bg-white/5 text-white hover:bg-white/10'}`}
                    >
                      {notificationsEnabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                  
                  <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                    {notificationsEnabled 
                      ? 'You will be notified when new songs are added to the library.'
                      : 'Enable notifications to get alerts when new songs are added.'}
                  </p>

                  {/* Last Updated */}
                  <div className="mt-3 pt-3 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500">
                      Last checked: {lastCheckedSongsCount} songs
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Dropdown */}
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setShowAccountDropdown((prev) => !prev)}
                className={`relative p-2 rounded-xl focus:outline-none hover:bg-white/5 transition-colors
                  overflow-hidden group`}
                aria-label="Toggle account dropdown"
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-gradient-to-br from-red-500 to-red-700">
                  {userdata?.photoURL ? (
                    <img
                      src={userdata.photoURL}
                      alt={userDocData?.name || userdata?.displayName || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <User size={16} />
                    </div>
                  )}
                </div>
              </button>

              <div
                className={`absolute top-full right-0 mt-2 w-56 rounded-xl shadow-lg overflow-hidden
                  backdrop-blur-xl border transition-all duration-300
                  ${darkMode ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white/95 border-gray-200'}
                  ${showAccountDropdown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}
              >
                {/* User Info */}
                <div className="p-4 border-b border-zinc-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-red-500 to-red-700">
                      {userdata?.photoURL ? (
                        <img
                          src={userdata.photoURL}
                          alt={userDocData?.name || userdata?.displayName || 'User'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                          <User size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {userDocData?.name || userdata?.displayName || 'User'}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">
                        {userDocData?.email || userdata?.email || 'No email provided'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center space-x-3 p-2 rounded-lg text-left
                      text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <User size={16} />
                    <span className="text-sm">Profile</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 p-2 rounded-lg text-left
                      text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span className="text-sm">
                      {isLoggingOut ? 'Logging out...' : 'Log out'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-xl focus:outline-none transition-colors
                ${darkMode 
                  ? 'text-zinc-400 hover:text-white hover:bg-white/5' 
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'}`}
              aria-label="Toggle light/dark mode"
            >
              {darkMode ? (
                <Sun size={20} className="transition-transform hover:rotate-45" />
              ) : (
                <Moon size={20} className="transition-transform hover:-rotate-12" />
              )}
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
};

export default Home;