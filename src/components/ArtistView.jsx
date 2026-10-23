import React from 'react';
import { Play, Pause, CheckCircle2, Music, User, Edit3, Trash2 } from 'lucide-react';
import SongList from './SongList';

export default function ArtistView({ 
  artistData, 
  currentSong, 
  isPlaying, 
  onPlay, 
  onToggleLike, 
  onOpenEditSong, 
  onShareSong, 
  onDeleteSong,
  onAddSongToPlaylist,
  playlists,
  onOpenEditArtist,
  onDeleteArtist
}) {
  if (!artistData || !artistData.artist) return null;

  const { artist, songs = [] } = artistData;
  const isCurrentlyPlayingArtist = currentSong && songs.some(s => (s.id || s._id) === (currentSong.id || currentSong._id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Artist Profile Hero Banner */}
      <div style={{
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        padding: '40px 48px',
        display: 'flex',
        alignItems: 'center',
        gap: '32px',
        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.22), rgba(18, 20, 29, 0.95))',
        border: '1px solid rgba(0, 242, 254, 0.3)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden'
      }}>
        {/* Circle Artist Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img 
            src={artist.avatar || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80'}
            alt={artist.name}
            style={{
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '4px solid rgba(0, 242, 254, 0.8)',
              boxShadow: '0 0 35px rgba(0, 242, 254, 0.4)'
            }}
          />
        </div>

        {/* Artist Bio & Info */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00f2fe', fontSize: '0.84rem', fontWeight: 800, letterSpacing: '1px' }}>
            <CheckCircle2 size={16} color="#00f2fe" /> NGHỆ SĨ ĐÃ XÁC NHẬN
          </div>

          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '1px' }}>
            {artist.name}
          </h1>

          <p style={{ fontSize: '0.92rem', color: 'rgba(255, 255, 255, 0.75)', margin: 0 }}>
            {artist.bio || `Tất cả bài hát phát hành của ${artist.name} trên Zingify Music.`}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Tổng số bài hát: <strong style={{ color: '#ffffff' }}>{songs.length} Bài</strong>
            </span>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
            <button
              onClick={() => {
                if (songs.length > 0) onPlay(songs[0]);
              }}
              style={{
                height: '48px',
                padding: '0 28px',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #00f2fe, #00f5d4)',
                border: 'none',
                color: '#08090e',
                fontWeight: 800,
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 0 25px rgba(0, 242, 254, 0.5)',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isCurrentlyPlayingArtist && isPlaying ? <Pause size={20} fill="#08090e" /> : <Play size={20} fill="#08090e" />}
              {isCurrentlyPlayingArtist && isPlaying ? 'Tạm Dừng' : 'Phát Tất Cả Bài Hát'}
            </button>

            <button
              onClick={onOpenEditArtist}
              style={{
                height: '48px',
                padding: '0 24px',
                borderRadius: '24px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <Edit3 size={18} color="#00f2fe" /> Chỉnh Sửa Hồ Sơ
            </button>

            <button
              onClick={() => {
                if (window.confirm(`Bạn có chắc chắn muốn xóa nghệ sĩ "${artist.name}" khỏi thư viện?`)) {
                  if (onDeleteArtist) onDeleteArtist(artist);
                }
              }}
              style={{
                height: '48px',
                padding: '0 20px',
                borderRadius: '24px',
                background: 'rgba(255, 42, 116, 0.15)',
                border: '1px solid rgba(255, 42, 116, 0.4)',
                color: '#ff2a74',
                fontWeight: 700,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={18} /> Xóa Nghệ Sĩ
            </button>
          </div>
        </div>
      </div>

      {/* Artist Songs Section */}
      <div>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>
          Danh sách bài hát của {artist.name} ({songs.length})
        </h3>

        {songs.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px border-color' }}>
            <Music size={40} color="var(--accent-secondary)" style={{ opacity: 0.6, marginBottom: '12px' }} />
            <p style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 700 }}>Chưa có bài hát nào của nghệ sĩ này.</p>
          </div>
        ) : (
          <SongList 
            songs={songs}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlay={onPlay}
            onToggleLike={onToggleLike}
            onOpenEditSong={onOpenEditSong}
            onShareSong={onShareSong}
            onDeleteSong={onDeleteSong}
            onAddSongToPlaylist={onAddSongToPlaylist}
            playlists={playlists}
          />
        )}
      </div>
    </div>
  );
}
