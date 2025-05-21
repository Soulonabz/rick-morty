import { useEffect, useRef, useState } from "react";

export default function TestingGrounds() {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio());

  useEffect(() => {
    setCurrentSong({
      id: 85,
      title: "Fist Degree",
      artistId: 29,
      url: "/audio/fist.mp3",
      cover: ""
    });
  }, []);

  // Set the audio source when the song changes (but don't play yet)
  useEffect(() => {
    if (currentSong?.url) {
      audioRef.current.src = currentSong.url;
    }
  }, [currentSong]);

  const handlePlay = () => {
    audioRef.current.play()
      .then(() => setIsPlaying(true))
      .catch(err => console.error("Audio play error:", err));
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-2">Test Audio Player</h1>
      <p>Now playing: {currentSong?.title}</p>
      <p>Status: {isPlaying ? "Playing" : "Paused"}</p>
      <button
        onClick={handlePlay}
        className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Play
      </button>
      <audio ref={audioRef} controls className="mt-2" />
    </div>
  );
}
