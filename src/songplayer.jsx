import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useColor } from 'color-thief-react';
import { songs } from './data/songs.jsx';

export default function SongPlayer() {
  const location = useLocation();
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [songHistory, setSongHistory] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);

  const song = location.state?.song;

  // Add current song to history when it changes
  useEffect(() => {
    if (song) {
      setSongHistory(prev => {
        const newHistory = [...prev];
        newHistory[currentSongIndex] = song;
        return newHistory;
      });
    }
  }, [song, currentSongIndex]);

  // Function to get a random song
  const getRandomSong = () => {
    const availableSongs = songs.filter(s => s.id !== song?.id);
    const randomIndex = Math.floor(Math.random() * availableSongs.length);
    return availableSongs[randomIndex];
  };

  // Function to play next random song
  const playNextSong = () => {
    const nextSong = getRandomSong();
    setCurrentSongIndex(prev => prev + 1);
    navigate('/songplayer', { state: { song: nextSong }, replace: true });
  };

  // Function to play previous song
  const playPreviousSong = () => {
    if (currentSongIndex > 0) {
      const previousSong = songHistory[currentSongIndex - 1];
      setCurrentSongIndex(prev => prev - 1);
      navigate('/songplayer', { state: { song: previousSong }, replace: true });
    }
  };

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
    if (song && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [song]);

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

      {/* Content container */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 flex items-center space-x-2 text-white/80 hover:text-white transition-colors group"
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
            disabled={currentSongIndex === 0}
            className={`p-3 rounded-full transition-all transform hover:scale-110 active:scale-95
              ${currentSongIndex === 0 
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

      {/* Audio Element */}
      <audio ref={audioRef}>
        <source src={song.url} type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}
