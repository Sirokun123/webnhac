import React from 'react';
import { Play, Pause, TrendingUp, Trophy } from 'lucide-react';

export default function TopCharts({ songs, currentSong, isPlaying, onPlay }) {
  const getRankColor = (rank) => {
    if (rank === 1) return '#ffb703'; // Gold
    if (rank === 2) return '#e0e0e0'; // Silver
    if (rank === 3) return '#cd7f32'; // Bronze
    return 'var(--text-muted)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ background: 'linear-gradient(135deg, rgba(162, 56, 255, 0.3), rgba(0, 242, 254, 0.15))', padding: '24px 30px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(135deg, #a238ff, #00f2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Trophy size={32} color="#ffb703" /> #ZingChart Top 10
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Bảng xếp hạng âm nhạc hot nhất thời điểm hiện tại</p>
        </div>
        <TrendingUp size={48} color="rgba(255, 255, 255, 0.2)" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {songs.slice(0, 10).map((song, index) => {
          const rank = index + 1;
          const isCurrent = currentSong && currentSong.id === song.id;

          return (
            <div 
              key={song.id}
              onClick={() => onPlay(song)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                background: isCurrent ? 'rgba(162, 56, 255, 0.2)' : 'var(--bg-card)',
                border: isCurrent ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.25s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: getRankColor(rank), width: '36px', textAlign: 'center' }}>
                  0{rank}
                </span>

                <img src={song.cover} alt={song.title} style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover' }} />

                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: isCurrent ? 'var(--accent-secondary)' : 'var(--text-main)' }}>
                    {song.title}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{song.artist}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {(song.views / 1000000).toFixed(1)}M lượt nghe
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)' }}>▲ Hot Trend</div>
                </div>

                <button 
                  className="control-play"
                  style={{ width: '40px', height: '40px' }}
                  onClick={(e) => { e.stopPropagation(); onPlay(song); }}
                >
                  {isCurrent && isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
