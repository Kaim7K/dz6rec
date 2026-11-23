import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from "react";

const PlayerContext = createContext(null);
export const usePlayer = () => useContext(PlayerContext);

export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [current, setCurrent] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    if (!current && audioRef.current?.hasAttribute("src")) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
      setIsPlaying(false);
      setProgress(0);
      setDuration(0);
    }
    if (current?.track?.audio_url && audioRef.current) {
      audioRef.current.src = current.track.audio_url;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [current]);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  const play = useCallback((track, project, q) => {
    setCurrent({ track, project });
    if (q) setQueue(q.filter(item => item.audio_url));
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {}); }
  }, [isPlaying, current]);

  const removeFromPlayback = (trackId, version = null, updatedTrack = null) => {
    setQueue(rows => version
      ? rows.map(row => updatedTrack && row.id === trackId ? updatedTrack : row).filter(row => row.audio_url)
      : rows.filter(row => row.id !== trackId));
    setCurrent(previous => {
      if (previous?.track.id !== trackId) return previous;
      const playing = previous.track;
      const matches = !version || (playing.current_version_id
        ? playing.current_version_id === version.id
        : !!playing.audio_url && playing.audio_url === version.audio_url);
      return matches ? null : previous;
    });
  };

  const seek = useCallback((t) => { if (audioRef.current) { audioRef.current.currentTime = t; setProgress(t); } }, []);

  const playIndex = useCallback((idx) => {
    if (!queue.length || !current) return;
    const i = shuffle ? Math.floor(Math.random() * queue.length) : idx;
    setCurrent({ track: queue[i], project: current.project });
  }, [queue, current, shuffle]);

  const next = useCallback(() => {
    if (!queue.length || !current) return;
    const idx = queue.findIndex((t) => t.id === current.track.id);
    playIndex((idx + 1) % queue.length);
  }, [queue, current, playIndex]);

  const prev = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) { audioRef.current.currentTime = 0; return; }
    if (!queue.length || !current) return;
    const idx = queue.findIndex((t) => t.id === current.track.id);
    playIndex((idx - 1 + queue.length) % queue.length);
  }, [queue, current, playIndex]);

  const value = { current, isPlaying, progress, duration, volume, repeat, shuffle, queue, play, togglePlay, seek, next, prev, setVolume, setRepeat, setShuffle, removeFromPlayback };
  return (
    <PlayerContext.Provider value={value}>
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => { if (repeat) { audioRef.current.currentTime = 0; audioRef.current.play(); } else next(); }}
      />
      {children}
    </PlayerContext.Provider>
  );
}
