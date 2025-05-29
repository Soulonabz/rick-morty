import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import { useColor } from 'color-thief-react';
import { songs } from './data/songs.jsx';
import Equalizer, { FREQUENCY_BANDS } from './utils/equalizer';
import { artists } from './data/artist.jsx';

const SongPlayer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const equalizerRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [songHistory, setSongHistory] = useState([]);
  const [eqValues, setEqValues] = useState(FREQUENCY_BANDS.map(() => 0));
  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [volume, setVolume] = useState(1);

  const song = location.state?.song;

  // Update song history when a new song is loaded
  useEffect(() => {
    if (song) {
      setSongHistory(prev => {
        // Don't add if it's the same as the last song
        if (prev.length > 0 && prev[prev.length - 1].id === song.id) {
          console.log('Same song, not adding to history:', song.title);
          return prev;
        }
        console.log('Adding song to history:', song.title);
        return [...prev, song];
      });
    }
  }, [song]);

  // Initialize Web Audio API and Equalizer
  useEffect(() => {
    const initializeAudio = () => {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      if (audioRef.current && !sourceNodeRef.current) {
        sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        equalizerRef.current = new Equalizer(audioContextRef.current, sourceNodeRef.current);
        equalizerRef.current.connectToDestination();
      }
    };

    const handleInitialize = () => {
      initializeAudio();
      document.removeEventListener('click', handleInitialize);
    };

    document.addEventListener('click', handleInitialize);

    return () => {
      document.removeEventListener('click', handleInitialize);
      if (equalizerRef.current) {
        equalizerRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }
    };
  }, []);

  // Load audio when song changes
  useEffect(() => {
    if (song && audioRef.current) {
      audioRef.current.load();
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((error) => {
          console.log('Playback failed:', error);
          setIsPlaying(false);
        });
    }
  }, [song]);

  // Handle equalizer changes
  const handleEqChange = useCallback((index, value) => {
    setEqValues(prev => {
      const newValues = [...prev];
      newValues[index] = value;
      return newValues;
    });
    if (equalizerRef.current) {
      equalizerRef.current.setGain(index, value);
    }
    setSelectedPreset('custom');
  }, []);

  // Apply equalizer preset
  const applyPreset = useCallback((preset) => {
    if (equalizerRef.current) {
      equalizerRef.current.applyPreset(preset);
      // Update UI values based on preset
      const newValues = [...eqValues];
      switch (preset) {
        case 'bass-boost':
          newValues.forEach((_, index) => {
            if (index < 3) newValues[index] = 7;
            else if (index < 5) newValues[index] = 3;
            else newValues[index] = 0;
          });
          break;
        case 'treble-boost':
          newValues.forEach((_, index) => {
            if (index > 6) newValues[index] = 7;
            else if (index > 4) newValues[index] = 3;
            else newValues[index] = 0;
          });
          break;
        case 'vocal-boost':
          newValues.forEach((_, index) => {
            if (index > 2 && index < 6) newValues[index] = 5;
            else newValues[index] = 0;
          });
          break;
        default:
          newValues.fill(0);
      }
      setEqValues(newValues);
      setSelectedPreset(preset);
    }
  }, [eqValues]);

  // Get random song excluding current and previous songs
  const getRandomSong = useCallback(() => {
    const availableSongs = songs.filter(s => 
      s.id !== song?.id && 
      !songHistory.some(h => h.id === s.id)
    );
    const randomIndex = Math.floor(Math.random() * availableSongs.length);
    return availableSongs[randomIndex] || songs[Math.floor(Math.random() * songs.length)];
  }, [song, songHistory]);

  // Navigation handlers
  const playNextSong = useCallback(() => {
    const nextSong = getRandomSong();
    console.log('Playing next song:', nextSong.title);
    navigate('/songplayer', { state: { song: nextSong }, replace: true });
  }, [getRandomSong, navigate]);

  const playPreviousSong = useCallback(() => {
    console.log('Current history length:', songHistory.length);
    if (songHistory.length > 1) {
      const previousSong = songHistory[songHistory.length - 2];
      console.log('Playing previous song:', previousSong.title);
      setSongHistory(prev => prev.slice(0, -1));
      navigate('/songplayer', { state: { song: previousSong }, replace: true });
    } else {
      console.log('Not enough songs in history to go back');
    }
  }, [songHistory, navigate]);

  // Optimize image loading with resource optimizer
  useEffect(() => {
    if (song?.imageUrl) {
      const imgElement = new Image();
      imgElement.src = song.imageUrl;
    }
  }, [song]);

  // Get dominant color from album art
  const { data: dominantColor } = useColor(song?.imageUrl, 'hex', {
    crossOrigin: 'anonymous',
    quality: 10
  });

  // Get color palette
  const { data: colorPalette } = useColor(song?.imageUrl, 'palette', {
    crossOrigin: 'anonymous',
    quality: 10,
    colorCount: 4
  });

  // Create gradient style
  const gradientStyle = {
    background: dominantColor 
      ? `linear-gradient(to bottom, ${dominantColor} 0%, #000000 100%)`
      : 'linear-gradient(to bottom, #1a1a1a 0%, #000000 100%)',
    minHeight: '100vh',
    width: '100%'
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => setProgress(audio.currentTime);
    const setAudioDuration = () => setDuration(audio.duration);
    const onEnded = () => {
      setIsPlaying(false);
      playNextSong(); // Auto-play next random song when current song ends
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", setAudioDuration);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", setAudioDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (sec) => {
    if (isNaN(sec)) return "00:00";
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleProgressChange = (e) => {
    const newTime = e.target.value;
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  };

  // Add volume handler function
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Get artist information
  const artist = song ? artists.find(a => a.id === song.artistId) : null;

  if (!song) {
    return (
      <p className="text-white p-4">
        No song data found. Please go back and select a song.
      </p>
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center px-4 py-12 text-white relative overflow-hidden"
      style={gradientStyle}
    >
      {/* Glassmorphism overlay with animated gradient */}
      <div className="absolute inset-0 backdrop-blur-2xl bg-gradient-to-b from-black/30 via-black/50 to-black/80" />

      {/* Back Button - Moved outside and above the content container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors group"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back</span>
        </button>
      </div>

      {/* Content container with equalizer */}
      <div className="relative z-10 w-full max-w-6xl mx-auto flex">
        {/* Equalizer Panel - Left Side */}
        <div className="w-80 mr-8 flex-shrink-0">
          <div className={`p-6 rounded-2xl backdrop-blur-xl bg-black/30 border border-white/10`}>
            <h3 className="text-lg font-semibold mb-4">Equalizer</h3>
            
            {/* Preset Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-8">
              {['flat', 'bass-boost', 'treble-boost', 'vocal-boost'].map(preset => (
                <button
                  key={preset}
                  onClick={() => applyPreset(preset)}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${selectedPreset === preset
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                      : 'bg-white/10 hover:bg-white/20 text-white/80'
                    }`}
                >
                  {preset.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </button>
              ))}
            </div>

            {/* Frequency Bands Labels */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-white/90">Frequency Bands</span>
                <span className="text-xs text-white/60">Adjustment: ±12dB</span>
              </div>
              <div className="h-px bg-gradient-to-r from-white/5 via-white/10 to-white/5" />
            </div>

            {/* Frequency Sliders */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
              {FREQUENCY_BANDS.map((freq, index) => {
                // Get frequency label
                const freqLabel = freq < 1000 
                  ? `${freq}Hz`
                  : `${(freq / 1000).toFixed(1)}kHz`;

                // Get frequency range label
                const getRangeLabel = (freq) => {
                  if (freq <= 60) return 'Sub Bass';
                  if (freq <= 250) return 'Bass';
                  if (freq <= 500) return 'Low Mids';
                  if (freq <= 2000) return 'Mids';
                  if (freq <= 4000) return 'Upper Mids';
                  if (freq <= 8000) return 'Presence';
                  return 'Brilliance';
                };

                return (
                  <div key={freq} className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-white/90">{freqLabel}</span>
                        <span className="text-[10px] text-white/50">{getRangeLabel(freq)}</span>
                      </div>
                      <span className={`text-xs font-medium ${
                        eqValues[index] === 0 
                          ? 'text-white/40' 
                          : eqValues[index] > 0 
                            ? 'text-green-400' 
                            : 'text-red-400'
                      }`}>
                        {eqValues[index] > 0 ? `+${eqValues[index]}` : eqValues[index]}dB
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={eqValues[index]}
                      onChange={(e) => handleEqChange(index, parseFloat(e.target.value))}
                      className="w-full accent-red-600 h-1.5 rounded-lg appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:w-3
                        [&::-webkit-slider-thumb]:h-3
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-red-600
                        [&::-webkit-slider-thumb]:shadow-lg
                        [&::-webkit-slider-thumb]:shadow-red-600/20
                        [&::-webkit-slider-thumb]:border-2
                        [&::-webkit-slider-thumb]:border-red-700
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-runnable-track]:bg-white/10
                        [&::-webkit-slider-runnable-track]:rounded-full"
                    />
                  </div>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-white/5 via-white/10 to-white/5 mb-6" />

            {/* Volume Control */}
            <div className="flex items-center space-x-3">
              {/* Volume Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className={`w-5 h-5 flex-shrink-0 ${volume === 0 ? 'text-red-500' : 'text-white/80'}`}
              >
                {volume === 0 ? (
                  <path d="M13.5 7.5v9a.75.75 0 001.167.623l6.333-3.922a.75.75 0 000-1.248L14.667 6.876A.75.75 0 0013.5 7.5z" />
                ) : volume < 0.5 ? (
                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                ) : (
                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                )}
              </svg>

              {/* Volume Slider */}
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer
                    accent-red-600
                    [&::-webkit-slider-thumb]:w-3
                    [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-red-600
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-webkit-slider-thumb]:shadow-red-600/20
                    [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-red-700
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-runnable-track]:bg-white/10
                    [&::-webkit-slider-runnable-track]:rounded-full"
                />
              </div>

              {/* Volume Percentage */}
              <span className="text-xs font-medium text-white/80 w-10 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => applyPreset('flat')}
              className="w-full mt-6 py-2 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 
                text-white/60 hover:text-white/80 transition-all duration-200"
            >
              Reset All Bands
            </button>
          </div>
        </div>

        {/* Main Content - Center */}
        <div className="flex-1 flex flex-col items-center">
          {/* Album Art/Logo with floating animation */}
          <div className="relative w-72 h-72 mb-12">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl transform rotate-6 scale-[1.02]" />
            <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 backdrop-blur-3xl">
              <img 
                src={song.imageUrl} 
                alt={`${song.title} artwork`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>

          {/* Title with gradient text */}
          <h1 
            className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r"
            style={{
              backgroundImage: `linear-gradient(to right, ${colorPalette?.[0] || 'white'}, ${colorPalette?.[1] || 'white'})`
            }}
          >
            {song.title}
          </h1>

          {/* Progress Bar Container */}
          <div className="w-full max-w-md mb-8">
            <div className="relative w-full h-1 bg-white/10 rounded-full overflow-hidden">
              {/* Progress Background */}
              <div 
                className="absolute inset-y-0 left-0 transition-all duration-150"
                style={{
                  width: `${(progress / duration) * 100}%`,
                  background: dominantColor 
                    ? `linear-gradient(to right, ${dominantColor}, ${colorPalette?.[1] || dominantColor})`
                    : 'linear-gradient(to right, #dc2626, #991b1b)',
                }}
              />
              {/* Interactive Slider */}
              <input
                type="range"
                min="0"
                max={duration}
                value={progress}
                onChange={handleProgressChange}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
            
            {/* Time Display */}
            <div className="flex justify-between text-sm mt-2 font-medium text-white/70">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls Container */}
          <div className="flex items-center justify-center space-x-8">
            {/* Previous Button */}
            <button 
              onClick={playPreviousSong}
              disabled={songHistory.length <= 1}
              className={`p-3 rounded-full transition-all transform hover:scale-110 active:scale-95
                ${songHistory.length <= 1
                  ? 'text-white/30 cursor-not-allowed' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              aria-label="Previous song"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={togglePlayback}
              className={`p-4 rounded-full transition-all transform hover:scale-110 active:scale-95
                ${isPlaying ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
              aria-label={isPlaying ? "Pause" : "Play"}
              style={{
                boxShadow: isPlaying ? `0 0 30px ${dominantColor || '#dc2626'}` : 'none'
              }}
            >
              {isPlaying ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8"
                >
                  <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8"
                >
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" />
                </svg>
              )}
            </button>

            {/* Next Button */}
            <button 
              onClick={playNextSong}
              className="p-3 rounded-full text-white/80 transition-all transform hover:scale-110 
                hover:text-white hover:bg-white/10 active:scale-95"
              aria-label="Next song"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-8 h-8"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Artist Info Panel - Right Side */}
        <div className="w-80 ml-8 flex-shrink-0">
          <div className={`p-6 rounded-2xl backdrop-blur-xl bg-black/30 border border-white/10 sticky top-4`}>
            {/* Artist Name */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Artist</h3>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden">
                  <img 
                    src={artist?.image} 
                    alt={artist?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xl font-semibold text-white">{artist?.name}</p>
                </div>
              </div>
            </div>

            {/* Artist Biography */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Artist Biography</h3>
              <div className="h-px bg-gradient-to-r from-white/5 via-white/10 to-white/5 mb-4" />
              <p className="text-sm leading-relaxed text-white/80">
                {artist?.bio || 'Biography not available'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Element */}
      <audio ref={audioRef}>
        <source src={song.url} type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default SongPlayer;
