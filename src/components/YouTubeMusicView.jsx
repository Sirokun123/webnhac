import React, { useState, useEffect } from 'react';
import { Play, Sparkles, TrendingUp, Search, Flame, Globe2, Music, Loader2, Volume2, CheckCircle2 } from 'lucide-react';

const YoutubeIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#ff0000">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export default function YouTubeMusicView({ 
  currentSong, 
  isPlaying, 
  onPlayYouTubeTrack 
}) {
  const [activeCategory, setActiveCategory] = useState('VN'); // 'VN', 'GLOBAL', 'REMIX', 'CHILL'
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ytSearchInput, setYtSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState(null);

  // Quick search keywords
  const popularKeywords = ["Sơn Tùng M-TP", "HIEUTHUHAI", "RHYDER", "Vũ", "Remix TikTok Hot", "Taylor Swift", "Lofi Chill"];

  // Fetch trending by category
  useEffect(() => {
    let isMounted = true;
    const fetchCategory = async () => {
      setLoading(true);
      try {
        let endpoint = '/api/youtube/trending?region=VN&max=24';
        if (activeCategory === 'GLOBAL') {
          endpoint = '/api/youtube/trending?region=US&max=24';
        } else if (activeCategory === 'REMIX') {
          endpoint = '/api/youtube/search?q=remix+viet+nam+hot+trend&max=20';
        } else if (activeCategory === 'CHILL') {
          endpoint = '/api/youtube/search?q=lofi+chill+acoustic+viet+nam&max=20';
        }

        const res = await fetch(endpoint);
        const data = await res.json();
        if (isMounted && data && data.success && Array.isArray(data.data)) {
          setTracks(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch YouTube music:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCategory();
    return () => { isMounted = false; };
  }, [activeCategory]);

  // Handle direct search
  const handleSearch = async (query) => {
    const q = query || ytSearchInput;
    if (!q || !q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(q.trim())}&max=20`);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        setSearchResults(data.data);
      }
    } catch (err) {
      console.error('YouTube search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleTrackClick = async (track) => {
    setPlayingVideoId(track.videoId || track.youtubeId || track.id);
    if (onPlayYouTubeTrack) {
      await onPlayYouTubeTrack(track);
    }
    setPlayingVideoId(null);
  };

  const formatViews = (views) => {
    if (!views) return 'Nhiều lượt nghe';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M lượt xem`;
    if (views >= 1000) return `${Math.floor(views / 1000)}K lượt xem`;
    return `${views} lượt xem`;
  };

  const displayedTracks = searchResults.length > 0 ? searchResults : tracks;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Hero Banner */}
      <div 
        style={{
          background: 'linear-gradient(135deg, rgba(255, 0, 0, 0.22) 0%, rgba(30, 20, 45, 0.85) 60%, rgba(10, 12, 18, 0.95) 100%)',
          borderRadius: '16px',
          padding: '28px 32px',
          border: '1px solid rgba(255, 0, 0, 0.35)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 32px rgba(255, 0, 0, 0.15)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ maxWidth: '640px', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'rgba(255,0,0,0.2)', border: '1px solid rgba(255,0,0,0.4)', borderRadius: '20px', color: '#ff4e50', fontSize: '0.78rem', fontWeight: 800, marginBottom: '12px' }}>
            <YoutubeIcon size={14} /> KHO NHẠC TRỰC TUYẾN YOUTUBE MUSIC
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#fff', margin: '0 0 10px 0', lineHeight: 1.2 }}>
            Hàng Triệu Bản Nhạc Trực Tuyến
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
            Nghe bất kỳ bài hát nào từ YouTube với âm thanh chất lượng cao, đồng bộ lời bài hát Karaoke (LRCLIB), tự động bóc tách bản quyền không giới hạn.
          </p>
        </div>

        {/* Decorative Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 2 }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff0000, #ff4e50)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px rgba(255, 0, 0, 0.6)'
          }}>
            <YoutubeIcon size={40} />
          </div>
        </div>
      </div>

      {/* YouTube Live Search Bar */}
      <div style={{
        background: 'rgba(18, 20, 29, 0.75)',
        padding: '16px 20px',
        borderRadius: '14px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
          style={{ display: 'flex', gap: '10px' }}
        >
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            padding: '0 14px'
          }}>
            <Search size={18} color="#ff4e50" />
            <input 
              type="text"
              placeholder="Tìm kiếm mọi bài hát, ca sĩ, remix trên YouTube (Ví dụ: Sơn Tùng, Đen Vâu, HIEUTHUHAI, Lofi...)"
              value={ytSearchInput}
              onChange={(e) => setYtSearchInput(e.target.value)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: '0.92rem',
                padding: '12px 0'
              }}
            />
            {ytSearchInput && (
              <button 
                type="button"
                onClick={() => { setYtSearchInput(''); setSearchResults([]); }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
              >
                ✕
              </button>
            )}
          </div>
          <button 
            type="submit"
            disabled={searching}
            style={{
              background: 'linear-gradient(135deg, #ff0000, #ff4e50)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '0 24px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 0 15px rgba(255,0,0,0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            {searching ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
            <span>Tìm Trên YouTube</span>
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>Gợi ý:</span>
          {popularKeywords.map((kw, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setYtSearchInput(kw);
                handleSearch(kw);
              }}
              style={{
                fontSize: '0.78rem',
                padding: '4px 10px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#e2e8f0',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,0,0,0.15)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
            >
              {kw}
            </button>
          ))}
        </div>
      </div>

      {/* Categories Tabs & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setSearchResults([]); setActiveCategory('VN'); }}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              border: (activeCategory === 'VN' && searchResults.length === 0) ? '1px solid #ff0000' : '1px solid var(--border-color)',
              background: (activeCategory === 'VN' && searchResults.length === 0) ? 'linear-gradient(135deg, rgba(255,0,0,0.25), rgba(255,78,80,0.15))' : 'rgba(255,255,255,0.05)',
              color: (activeCategory === 'VN' && searchResults.length === 0) ? '#ff4e50' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Flame size={15} color="#ff4e50" /> 🔥 Thịnh Hành Việt Nam
          </button>

          <button
            onClick={() => { setSearchResults([]); setActiveCategory('GLOBAL'); }}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              border: (activeCategory === 'GLOBAL' && searchResults.length === 0) ? '1px solid #00f2fe' : '1px solid var(--border-color)',
              background: (activeCategory === 'GLOBAL' && searchResults.length === 0) ? 'linear-gradient(135deg, rgba(0,242,254,0.2), rgba(0,245,212,0.1))' : 'rgba(255,255,255,0.05)',
              color: (activeCategory === 'GLOBAL' && searchResults.length === 0) ? '#00f2fe' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Globe2 size={15} color="#00f2fe" /> 🌍 Top Quốc Tế
          </button>

          <button
            onClick={() => { setSearchResults([]); setActiveCategory('REMIX'); }}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              border: (activeCategory === 'REMIX' && searchResults.length === 0) ? '1px solid #ff007f' : '1px solid var(--border-color)',
              background: (activeCategory === 'REMIX' && searchResults.length === 0) ? 'linear-gradient(135deg, rgba(255,0,127,0.2), rgba(255,78,80,0.1))' : 'rgba(255,255,255,0.05)',
              color: (activeCategory === 'REMIX' && searchResults.length === 0) ? '#ff007f' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ⚡ EDM / Remix Hot Trend
          </button>

          <button
            onClick={() => { setSearchResults([]); setActiveCategory('CHILL'); }}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              border: (activeCategory === 'CHILL' && searchResults.length === 0) ? '1px solid #a855f7' : '1px solid var(--border-color)',
              background: (activeCategory === 'CHILL' && searchResults.length === 0) ? 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(147,51,234,0.1))' : 'rgba(255,255,255,0.05)',
              color: (activeCategory === 'CHILL' && searchResults.length === 0) ? '#c084fc' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🌙 Lofi & Acoustic Chill
          </button>
        </div>

        {searchResults.length > 0 && (
          <span style={{ fontSize: '0.82rem', color: '#00f5d4', fontWeight: 600 }}>
            Đang hiển thị {searchResults.length} kết quả tìm kiếm cho "{ytSearchInput}"
          </span>
        )}
      </div>

      {/* Loading Skeleton */}
      {(loading || searching) && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '14px' }}>
          <Loader2 size={36} color="#ff0000" className="spin" />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {searching ? 'Đang tìm kiếm trực tiếp trên YouTube Data API v3...' : 'Đang tải danh sách bài hát thịnh hành từ YouTube...'}
          </span>
        </div>
      )}

      {/* Cards Grid */}
      {!loading && !searching && (
        <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '18px' }}>
          {displayedTracks.map((track, idx) => {
            const vId = track.videoId || track.youtubeId || track.id;
            const isThisPlaying = (currentSong?.youtubeId === vId && isPlaying);
            const isThisLoading = (playingVideoId === vId);

            return (
              <div 
                key={vId || idx}
                onClick={() => handleTrackClick(track)}
                style={{
                  background: isThisPlaying ? 'rgba(255, 0, 0, 0.12)' : 'rgba(24, 26, 38, 0.75)',
                  borderRadius: '14px',
                  border: isThisPlaying ? '1px solid #ff0000' : '1px solid var(--border-color)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.25s ease',
                  boxShadow: isThisPlaying ? '0 0 20px rgba(255, 0, 0, 0.3)' : '0 4px 16px rgba(0,0,0,0.25)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = '#ff4e50';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = isThisPlaying ? '#ff0000' : 'var(--border-color)';
                }}
              >
                {/* Thumbnail Image Container */}
                <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: '10px', overflow: 'hidden', background: '#000' }}>
                  <img 
                    src={track.cover || `https://img.youtube.com/vi/${vId}/hqdefault.jpg`} 
                    alt={track.title}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    loading="lazy"
                  />

                  {/* Duration Badge */}
                  {track.duration && (
                    <span style={{
                      position: 'absolute',
                      bottom: '6px',
                      right: '6px',
                      background: 'rgba(0,0,0,0.8)',
                      color: '#fff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {track.duration}
                    </span>
                  )}

                  {/* Play Overlay Button */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isThisPlaying || isThisLoading ? 1 : 0,
                    transition: 'opacity 0.2s ease'
                  }}
                  className="hover-play-overlay"
                  >
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ff0000, #ff4e50)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 15px rgba(255, 0, 0, 0.6)'
                    }}>
                      {isThisLoading ? (
                        <Loader2 size={20} color="#fff" className="spin" />
                      ) : isThisPlaying ? (
                        <Volume2 size={20} color="#fff" />
                      ) : (
                        <Play size={20} fill="#fff" color="#fff" style={{ marginLeft: '2px' }} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Track Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h4 
                    title={track.title}
                    style={{
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      color: isThisPlaying ? '#ff4e50' : '#fff',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {track.title}
                  </h4>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <span 
                      title={track.channelTitle || track.artist}
                      style={{
                        fontSize: '0.76rem',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {track.channelTitle || track.artist}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#ff4e50', background: 'rgba(255,0,0,0.1)', padding: '1px 5px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                      YouTube
                    </span>
                  </div>

                  {track.views > 0 && (
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>
                      {formatViews(track.views)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
