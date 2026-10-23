import React, { useEffect, useRef } from 'react';
import { X, Mic } from 'lucide-react';

export default function LyricsModal({ currentSong, currentTime, onClose }) {
  const containerRef = useRef(null);

  if (!currentSong) return null;

  const lyrics = currentSong.lyrics || [];

  // Find active line index based on current audio time
  let activeIndex = 0;
  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime >= lyrics[i].time) {
      activeIndex = i;
    }
  }

  useEffect(() => {
    if (containerRef.current) {
      const activeEl = containerRef.current.children[activeIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeIndex]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="lyrics-modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px' }}>
          <img 
            src={currentSong.cover} 
            alt={currentSong.title}
            style={{ width: '280px', height: '280px', borderRadius: '20px', objectFit: 'cover', boxShadow: '0 15px 40px rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.1)' }}
          />
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{currentSong.title}</h2>
            <p style={{ fontSize: '1.1rem', color: 'var(--accent-secondary)', marginTop: '4px' }}>{currentSong.artist}</p>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
              <Mic size={20} /> Lời Bài Hát Realtime (Karaoke)
            </span>
            <button onClick={onClose} className="control-btn" style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '50%' }}>
              <X size={20} />
            </button>
          </div>

          <div className="lyrics-container" ref={containerRef}>
            {lyrics.map((line, idx) => (
              <div 
                key={idx} 
                className={`lyric-line ${idx === activeIndex ? 'active' : ''}`}
              >
                {line.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
