import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useColor } from 'color-thief-react';

export default function SongPlayer() {
  const location = useLocation();
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const song = location.state?.song;

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
    const onEnded = () => setIsPlaying(false);

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
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 backdrop-blur-xl bg-black/30" />

      {/* Content container */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 text-white hover:text-red-600"
        >
          ← Back
        </button>

        {/* Album Art/Logo */}
        <div className="w-64 h-64 mb-8 rounded-lg overflow-hidden shadow-2xl">
          <img 
            src={song.imageUrl} 
            alt={`${song.title} artwork`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-6">{song.title}</h1>

        {/* Progress Bar */}
        <div className="w-full max-w-md mb-6">
          <input
            type="range"
            min="0"
            max={duration}
            value={progress}
            onChange={handleProgressChange}
            className="w-full accent-red-600"
            style={{
              height: '4px',
              background: dominantColor 
                ? `linear-gradient(to right, ${dominantColor}, ${colorPalette?.[1] || dominantColor})`
                : 'linear-gradient(to right, #dc2626, #991b1b)',
              appearance: 'none',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          />
          <div className="flex justify-between text-sm mt-1 font-mono">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls: Prev, Play/Pause, Next */}
        <div className="flex items-center space-x-12 p-4 rounded-full">
          {/* Previous */}
          <button className="p-2 hover:text-red-800 transition-colors" aria-label="Previous">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="w-8 h-8"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlayback}
            className="p-2 hover:text-red-800 transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
                className="w-10 h-10"
              >
                <rect x="6" y="5" width="4" height="14" />
                <rect x="14" y="5" width="4" height="14" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
                className="w-10 h-10"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Next */}
          <button className="p-2 hover:text-red-800 transition-colors" aria-label="Next">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="w-8 h-8"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <audio ref={audioRef} onEnded={() => setIsPlaying(false)} hidden>
          <source src={song.url} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
}
