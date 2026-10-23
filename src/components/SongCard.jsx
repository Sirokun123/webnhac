import React from 'react';
import { Play, Pause, Heart } from 'lucide-react';

export default function SongCard({ song, currentSong, isPlaying, onPlay, onToggleLike }) {
  const isCurrent = currentSong && currentSong.id === song.id;

  return (
    <div className="music-card" onClick={() => onPlay(song)}>
      <div className="card-cover-wrapper">
        <img src={song.cover} alt={song.title} className="card-cover" />
        <button className="card-play-btn" onClick={(e) => { e.stopPropagation(); onPlay(song); }}>
          {isCurrent && isPlaying ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: '3px' }} />}
        </button>
      </div>

      <div className="card-info">
        <div className="title" style={{ color: isCurrent ? 'var(--accent-secondary)' : 'var(--text-main)' }}>
          {song.title}
        </div>
        <div className="artist">{song.artist}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
        <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '10px', color: 'var(--text-muted)' }}>
          {song.genre}
        </span>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleLike(song.id); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: song.isLiked ? '#ff2a74' : 'var(--text-muted)' }}
        >
          <Heart size={16} fill={song.isLiked ? '#ff2a74' : 'none'} />
        </button>
      </div>
    </div>
  );
}
