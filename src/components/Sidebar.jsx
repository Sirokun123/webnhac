import React, { useState } from 'react';
import { 
  Music, Compass, TrendingUp, Radio, Mic2, Library, Plus, 
  Heart, Pin, Search, ListFilter, User, Disc, ChevronDown, ChevronRight, Sparkles 
} from 'lucide-react';

const YoutubeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#ff0000">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  likedCount, 
  playlists = [], 
  artists = [],
  selectedPlaylistId,
  selectedArtistId,
  onSelectPlaylist,
  onSelectArtist,
  onOpenCreatePlaylist,
  onTogglePinPlaylist,
  onOpenUpload, 
  onGoHome 
}) {
  const [filterType, setFilterType] = useState('all'); // 'all', 'playlist', 'artist'
  const [librarySearch, setLibrarySearch] = useState('');
  const [isLibraryOpen, setIsLibraryOpen] = useState(true);

  // Filter items based on selected filterType chip and search term
  const filteredPlaylists = playlists.filter(pl => {
    if (filterType === 'artist') return false;
    if (!librarySearch) return true;
    return pl.title.toLowerCase().includes(librarySearch.toLowerCase());
  });

  const filteredArtists = artists.filter(art => {
    if (filterType === 'playlist') return false;
    if (!librarySearch) return true;
    return art.name.toLowerCase().includes(librarySearch.toLowerCase());
  });

  return (
    <aside className="app-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Brand Logo Header */}
      <div 
        className="brand-logo"
        onClick={() => onGoHome ? onGoHome() : setActiveTab('discover')}
        style={{ cursor: 'pointer' }}
        title="Về Trang Chủ Khám Phá"
      >
        <div className="logo-icon-wrap">
          <Music size={22} color="#00f2fe" />
        </div>
        <div className="brand-text">
          <span className="brand-title">Zingify Music</span>
          <span className="brand-badge">PREMIUM AUDIO</span>
        </div>
      </div>

      {/* Top Main Navigation Menu */}
      <nav className="nav-menu" style={{ gap: '4px' }}>
        <div 
          className={`nav-item ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          <Compass size={18} />
          <span>Khám Phá</span>
        </div>

        <div 
          className={`nav-item ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
          style={{ position: 'relative' }}
        >
          <Sparkles size={18} color="#00f2fe" />
          <span style={{ fontWeight: 600 }}>Dành Riêng Cho Bạn</span>
          <span style={{ 
            marginLeft: 'auto', 
            fontSize: '0.62rem', 
            fontWeight: 800, 
            background: 'linear-gradient(135deg, #00f2fe, #4facfe)', 
            color: '#08090e', 
            padding: '2px 6px', 
            borderRadius: '6px',
            letterSpacing: '0.5px'
          }}>
            AI
          </span>
        </div>

        <div 
          className={`nav-item ${activeTab === 'youtube' ? 'active' : ''}`}
          onClick={() => setActiveTab('youtube')}
          style={{ position: 'relative' }}
        >
          <YoutubeIcon size={18} />
          <span style={{ fontWeight: 600 }}>YouTube Music</span>
          <span style={{ 
            marginLeft: 'auto', 
            fontSize: '0.62rem', 
            fontWeight: 800, 
            background: 'linear-gradient(135deg, #ff0000, #ff4e50)', 
            color: '#fff', 
            padding: '2px 6px', 
            borderRadius: '6px',
            letterSpacing: '0.5px'
          }}>
            HOT
          </span>
        </div>

        <div 
          className={`nav-item ${activeTab === 'charts' ? 'active' : ''}`}
          onClick={() => setActiveTab('charts')}
        >
          <TrendingUp size={18} />
          <span>#ZingChart Top 10</span>
        </div>

        <div 
          className={`nav-item ${activeTab === 'lyrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('lyrics')}
        >
          <Mic2 size={18} color="var(--accent-secondary)" />
          <span>Lời Bài Hát (Karaoke)</span>
        </div>

        <div 
          className={`nav-item ${activeTab === 'genres' ? 'active' : ''}`}
          onClick={() => setActiveTab('genres')}
        >
          <Radio size={18} />
          <span>Thể Loại Nhạc</span>
        </div>
      </nav>

      {/* SPOTIFY-STYLE THƯ VIỆN & PLAYLIST SIDEBAR SECTION */}
      <div style={{
        flex: 1,
        background: 'rgba(18, 20, 29, 0.65)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '14px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        overflow: 'hidden'
      }}>
        {/* Library Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
          <div 
            onClick={() => setIsLibraryOpen(!isLibraryOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', cursor: 'pointer', userSelect: 'none' }}
            title={isLibraryOpen ? "Nhấp để thu gọn Thư viện" : "Nhấp để cuộn xuống mở Thư viện"}
          >
            <Library size={20} color="#00f2fe" />
            <span style={{ fontSize: '0.98rem', fontWeight: 800, letterSpacing: '0.4px' }}>Thư viện</span>
            {isLibraryOpen ? <ChevronDown size={18} color="rgba(0, 242, 254, 0.8)" /> : <ChevronRight size={18} color="rgba(255, 255, 255, 0.5)" />}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={onOpenCreatePlaylist}
              title="Tạo Playlist mới"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 242, 254, 0.25)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Collapsible & Scrollable Library Container */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxHeight: isLibraryOpen ? '480px' : '0px',
          opacity: isLibraryOpen ? 1 : 0,
          overflow: 'hidden',
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: isLibraryOpen ? 'auto' : 'none'
        }}>
          {/* Filter Chips (Spotify style: Playlist | Nghệ sĩ) */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterType(filterType === 'playlist' ? 'all' : 'playlist')}
              style={{
                padding: '4px 12px',
                borderRadius: '16px',
                background: filterType === 'playlist' ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
                color: filterType === 'playlist' ? '#08090e' : '#ffffff',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Playlist
            </button>

            <button
              onClick={() => setFilterType(filterType === 'artist' ? 'all' : 'artist')}
              style={{
                padding: '4px 12px',
                borderRadius: '16px',
                background: filterType === 'artist' ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
                color: filterType === 'artist' ? '#08090e' : '#ffffff',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Nghệ sĩ
            </button>
          </div>

          {/* Search & Sort Indicator Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <Search size={14} style={{ cursor: 'pointer', opacity: 0.7 }} />
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              Gần đây <ListFilter size={13} />
            </span>
          </div>

          {/* Scrollable Library List Items */}
          <div style={{
            maxHeight: '340px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            paddingRight: '4px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0, 242, 254, 0.4) transparent'
          }}>
            {/* Liked Songs Item (Pinned by default) */}
            {(filterType === 'all' || filterType === 'playlist') && (
              <div
                onClick={() => setActiveTab('favorites')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: activeTab === 'favorites' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                className="spotify-lib-item"
              >
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #450af5, #c4efd9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Heart size={20} color="#ffffff" fill="#ffffff" />
                </div>

                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Bài hát đã thích
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Pin size={11} color="#00f5d4" fill="#00f5d4" /> Danh sách phát • {likedCount} bài hát
                  </p>
                </div>
              </div>
            )}

            {/* User Created Custom Playlists */}
            {filteredPlaylists.map(pl => {
              const isSelected = activeTab === 'playlist' && selectedPlaylistId === pl.id;

              return (
                <div
                  key={pl.id}
                  onClick={() => onSelectPlaylist && onSelectPlaylist(pl)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(0, 242, 254, 0.18)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    position: 'relative'
                  }}
                  className="spotify-lib-item"
                >
                  <img
                    src={pl.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'}
                    alt={pl.title}
                    style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                  />

                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ffffff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {pl.title}
                    </p>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {pl.isPinned && <Pin size={11} color="#00f5d4" fill="#00f5d4" />} Danh sách phát • {pl.author || 'Quốc Phạm'}
                    </p>
                  </div>

                  {/* Pin/Unpin Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onTogglePinPlaylist) onTogglePinPlaylist(pl.id);
                    }}
                    title={pl.isPinned ? "Bỏ ghim" : "Ghim lên đầu"}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: pl.isPinned ? '#00f5d4' : 'rgba(255, 255, 255, 0.4)',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <Pin size={14} fill={pl.isPinned ? '#00f5d4' : 'none'} />
                  </button>
                </div>
              );
            })}

            {/* Artists List Items (Spotify style) */}
            {filteredArtists.map(art => {
              const isSelected = activeTab === 'artist' && selectedArtistId === art.id;

              return (
                <div
                  key={art.id}
                  onClick={() => onSelectArtist && onSelectArtist(art)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(0, 242, 254, 0.18)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                  className="spotify-lib-item"
                >
                  <img
                    src={art.avatar || art.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80'}
                    alt={art.name}
                    style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />

                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ffffff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {art.name}
                    </p>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                      Nghệ sĩ • {art.songCount || 0} bài hát
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
