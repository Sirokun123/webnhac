import React from 'react';
import { Play, Pause, Trash2, Pin, Music, Clock, Edit3 } from 'lucide-react';
import SongList from './SongList';

export default function PlaylistView({ 
  playlist, 
  currentSong, 
  isPlaying, 
  onPlay, 
  onToggleLike, 
  onOpenEditSong, 
  onShareSong, 
  onDeleteSong,
  onTogglePinPlaylist,
  onDeletePlaylist,
  onOpenEditPlaylist
}) {
  if (!playlist) return null;

  const playlistSongs = Array.isArray(playlist.songs) ? playlist.songs : [];
  const isCurrentlyPlayingThisPlaylist = currentSong && playlistSongs.some(s => (s.id || s._id) === (currentSong.id || currentSong._id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Playlist Hero Banner */}
      <div style={{
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        padding: '36px 40px',
        display: 'flex',
        alignItems: 'flex-end',
        gap: '28px',
        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(18, 20, 29, 0.95))',
        border: '1px solid rgba(0, 242, 254, 0.25)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Playlist Cover Art */}
        <img 
          src={playlist.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'}
          alt={playlist.title}
          style={{
            width: '180px',
            height: '180px',
            borderRadius: '12px',
            objectFit: 'cover',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 242, 254, 0.2)',
            flexShrink: 0
          }}
        />

        {/* Playlist Details */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#00f2fe', letterSpacing: '1.2px' }}>
            DANH SÁCH PHÁT CÁ NHÂN
          </span>

          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#ffffff', margin: 0, letterSpacing: '1px' }}>
            {playlist.title}
          </h1>

          <p style={{ fontSize: '0.92rem', color: 'rgba(255, 255, 255, 0.75)', margin: 0 }}>
            {playlist.description || 'Danh sách bài hát yêu thích do bạn biên soạn.'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Tác giả: <strong style={{ color: '#ffffff' }}>{playlist.author || 'Quốc Phạm'}</strong> • {playlistSongs.length} Bài hát
            </span>
          </div>

          {/* Action Buttons Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '16px' }}>
            <button
              onClick={() => {
                if (playlistSongs.length > 0) onPlay(playlistSongs[0]);
              }}
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00f2fe, #00f5d4)',
                border: 'none',
                color: '#08090e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 0 25px rgba(0, 242, 254, 0.5)',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {isCurrentlyPlayingThisPlaylist && isPlaying ? <Pause size={24} fill="#08090e" /> : <Play size={24} fill="#08090e" style={{ marginLeft: '3px' }} />}
            </button>

            <button
              onClick={() => onOpenEditPlaylist && onOpenEditPlaylist(playlist)}
              style={{
                padding: '10px 18px',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Edit3 size={16} color="#00f2fe" /> Chỉnh Sửa Playlist
            </button>

            <button
              onClick={() => onTogglePinPlaylist && onTogglePinPlaylist(playlist.id)}
              style={{
                padding: '10px 18px',
                borderRadius: '20px',
                background: playlist.isPinned ? 'rgba(0, 245, 212, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                border: playlist.isPinned ? '1px solid #00f5d4' : '1px solid rgba(255, 255, 255, 0.15)',
                color: playlist.isPinned ? '#00f5d4' : '#ffffff',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Pin size={16} fill={playlist.isPinned ? '#00f5d4' : 'none'} />
              {playlist.isPinned ? 'Đã Ghim' : 'Ghim Playlist'}
            </button>

            <button
              onClick={() => onDeletePlaylist && onDeletePlaylist(playlist.id)}
              style={{
                padding: '10px 18px',
                borderRadius: '20px',
                background: 'rgba(255, 42, 116, 0.15)',
                border: '1px solid rgba(255, 42, 116, 0.4)',
                color: '#ff2a74',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Trash2 size={16} /> Xóa Playlist
            </button>
          </div>
        </div>
      </div>

      {/* Playlist Songs Section */}
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>
          Bài hát trong Playlist ({playlistSongs.length})
        </h3>

        {playlistSongs.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px border-color' }}>
            <Music size={40} color="var(--accent-secondary)" style={{ opacity: 0.6, marginBottom: '12px' }} />
            <p style={{ fontSize: '1.1rem', color: '#ffffff', fontWeight: 700 }}>Playlist này chưa có bài hát nào.</p>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '6px' }}>Nhấp vào menu 3 chấm của bất kỳ bài hát nào để thêm vào Playlist này!</p>
          </div>
        ) : (
          <SongList 
            songs={playlistSongs}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlay={onPlay}
            onToggleLike={onToggleLike}
            onOpenEditSong={onOpenEditSong}
            onShareSong={onShareSong}
            onDeleteSong={onDeleteSong}
          />
        )}
      </div>
    </div>
  );
}
