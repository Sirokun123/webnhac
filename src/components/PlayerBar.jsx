import React from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, 
  Volume2, VolumeX, Heart, Mic2, ListMusic 
} from 'lucide-react';

export default function PlayerBar({ 
  currentSong, isPlaying, onTogglePlay, onNext, onPrev, 
  currentTime, durationSec, onSeek, volume, onVolumeChange,
  isShuffle, onToggleShuffle, isRepeat, onToggleRepeat,
  onToggleLike, onOpenLyrics, onOpenVisualizer, onToggleQueue
}) {
  if (!currentSong) return null;

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <footer className="app-player">
      {/* Track Info */}
      <div className="player-track-info">
        <img 
          src={currentSong.cover} 
          alt={currentSong.title}
          className={`track-disk ${isPlaying ? 'playing' : ''}`}
        />
        <div className="track-text">
          <div className="marquee-title-container">
            <div 
              className={`title ${currentSong.title.length > 16 ? 'marquee-title-bar' : ''}`}
              title={currentSong.title}
            >
              {currentSong.title}
            </div>
          </div>
          <div className="artist">{currentSong.artist}</div>
        </div>
        <button 
          onClick={() => onToggleLike(currentSong.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: currentSong.isLiked ? '#ff2a74' : 'var(--text-muted)' }}
        >
          <Heart size={18} fill={currentSong.isLiked ? '#ff2a74' : 'none'} />
        </button>
      </div>

      {/* Center Player Controls & Seekbar */}
      <div className="player-center">
        <div className="controls-row">
          <button 
            className={`control-btn ${isShuffle ? 'active' : ''}`}
            onClick={onToggleShuffle}
            title="Phát ngẫu nhiên"
          >
            <Shuffle size={18} />
          </button>

          <button className="control-btn" onClick={onPrev} title="Bài trước">
            <SkipBack size={22} />
          </button>

          <button className="control-play" onClick={onTogglePlay} title={isPlaying ? 'Tạm dừng' : 'Phát'}>
            {isPlaying ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: '3px' }} />}
          </button>

          <button className="control-btn" onClick={onNext} title="Bài tiếp">
            <SkipForward size={22} />
          </button>

          <button 
            className={`control-btn ${isRepeat ? 'active' : ''}`}
            onClick={onToggleRepeat}
            title="Lặp lại"
          >
            <Repeat size={18} />
          </button>
        </div>

        <div className="progress-row">
          <span className="time-text">{formatTime(currentTime)}</span>
          <div className="slider-container">
            <input 
              type="range" 
              className="custom-range"
              min={0}
              max={durationSec || 100}
              value={currentTime || 0}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
            />
          </div>
          <span className="time-text">{formatTime(durationSec)}</span>
        </div>
      </div>

      {/* Right Tools (Volume, Karaoke Lyrics, Queue) */}
      <div className="player-right">
        <button 
          className="control-btn"
          onClick={onOpenLyrics}
          title="Lời bài hát (Karaoke)"
          style={{ color: 'var(--accent-secondary)' }}
        >
          <Mic2 size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="control-btn"
            onClick={() => onVolumeChange(volume === 0 ? 0.8 : 0)}
          >
            {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input 
            type="range"
            className="custom-range"
            style={{ width: '80px' }}
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          />
        </div>

        <button 
          className="control-btn"
          onClick={onToggleQueue}
          title="Hàng chờ phát nhạc"
        >
          <ListMusic size={20} />
        </button>
      </div>
    </footer>
  );
}
