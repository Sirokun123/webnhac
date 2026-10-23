import React from 'react';
import { X, Play, Music } from 'lucide-react';

export default function QueueDrawer({ queue, currentSong, isPlaying, onPlay, onClose }) {
  return (
    <div 
      style={{
        position: 'fixed',
        top: '70px',
        right: 0,
        bottom: '90px',
        width: '320px',
        background: 'rgba(18, 18, 32, 0.95)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid var(--border-color)',
        zIndex: 90,
        padding: '24px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Music size={18} color="var(--accent-secondary)" /> Danh Sách Hàng Chờ
        </h4>
        <button onClick={onClose} className="control-btn">
          <X size={18} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>ĐANG PHÁT</p>
        {currentSong && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(162, 56, 255, 0.2)', padding: '10px', borderRadius: '10px', border: '1px solid var(--accent-primary)' }}>
            <img src={currentSong.cover} alt={currentSong.title} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--accent-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentSong.title}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currentSong.artist}</div>
            </div>
          </div>
        )}

        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '14px' }}>TÍẾP THEO</p>
        {queue.map((song, idx) => (
          <div 
            key={song.id}
            onClick={() => onPlay(song)}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.03)' }}
          >
            <img src={song.cover} alt={song.title} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {song.title}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{song.artist}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
