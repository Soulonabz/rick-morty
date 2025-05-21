import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { songs } from './data'; // wherever your song list is

export default function SongPlayer() {
  const { id } = useParams();
  const [song, setSong] = useState(null);

  useEffect(() => {
    const foundSong = songs.find((s) => s.id === id);
    setSong(foundSong);
  }, [id]);

  if (!song) return <p className="text-white">Song not found</p>;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <h1 className="text-3xl font-bold mb-4">{song.title}</h1>
      <audio
        controls
        autoPlay
        className="w-full max-w-md"
        src={song.url}
        onError={(e) => console.error('Audio error', e)}
      />
      <p className="mt-4">{song.artist}</p>
    </div>
  );
}