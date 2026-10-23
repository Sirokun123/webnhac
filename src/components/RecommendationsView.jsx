import React from 'react';
import { Sparkles, Flame, Play, Pause, Music, RefreshCw, UserCheck, LogIn, Heart } from 'lucide-react';

const YoutubeIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#ff0000">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export default function RecommendationsView({
  currentUser,
  recommendations,
  loading,
  onRefresh,
  currentSong,
  isPlaying,
  onPlaySong,
  onPlayYouTubeTrack,
  onOpenAuthModal
}) {
  const mostPlayed = recommendations?.mostPlayed || [];
  const forYou = recommendations?.forYou || [];
  const topArtists = recommendations?.topArtists || [];
  const totalListened = recommendations?.totalListened || 0;

  const handlePlayItem = (item) => {
    if (item.isYouTube || item.youtubeId) {
      onPlayYouTubeTrack({
        id: item.youtubeId || item.id,
        videoId: item.youtubeId,
        youtubeId: item.youtubeId,
        title: item.title,
        artist: item.artist,
        cover: item.cover,
        duration: item.duration,
        durationSec: item.durationSec
      });
    } else {
      onPlaySong(item);
    }
  };

  return (
    <div className="recommendations-container" style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '50px' }}>
      {/* Hero Banner */}
      <div style={{
        position: 'relative',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.22) 0%, rgba(0, 242, 254, 0.18) 50%, rgba(255, 42, 116, 0.12) 100%)',
        border: '1px solid rgba(0, 242, 254, 0.3)',
        padding: '32px 28px',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4), inset 0 0 30px rgba(0, 242, 254, 0.1)'
      }}>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #a855f7, #6366f1)',
              color: '#ffffff',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.5px',
              marginBottom: '12px'
            }}>
              <Sparkles size={14} />
              AI RECOMMENDATION ENGINE
            </div>
            <h1 style={{ margin: 0, fontSize: '2.1rem', fontWeight: 900, letterSpacing: '0.4px', color: '#ffffff' }}>
              {currentUser ? `Dành Riêng Cho ${currentUser.name}` : 'Đề Xuất Cá Nhân Hoá'}
            </h1>
            <p style={{ margin: '8px 0 0 0', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.94rem', maxWidth: '620px', lineHeight: 1.5 }}>
              Hệ thống tự động học từ các video và bài hát tài khoản của bạn xem nhiều nhất. Càng nghe nhiều, các đề xuất sẽ càng chuẩn xác theo đúng gu của bạn.
            </p>

            {/* Quick Stats & Top Artists Tags */}
            {currentUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '6px 14px',
                  borderRadius: '12px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#00f2fe'
                }}>
                  <Flame size={16} color="#ff4e50" />
                  <span>Đã ghi nhận: {totalListened} bài hát/video</span>
                </div>

                {topArtists.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>Nghệ sĩ bạn hay nghe:</span>
                    {topArtists.map((artist, idx) => (
                      <span key={idx} style={{
                        background: 'rgba(168, 85, 247, 0.25)',
                        border: '1px solid rgba(168, 85, 247, 0.5)',
                        color: '#e9d5ff',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.78rem',
                        fontWeight: 700
                      }}>
                        {artist}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onRefresh}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
            >
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
              <span>Làm mới đề xuất</span>
            </button>
          </div>
        </div>
      </div>

      {/* Guest Mode Callout */}
      {!currentUser && (
        <div style={{
          background: 'rgba(0, 242, 254, 0.08)',
          border: '1px dashed rgba(0, 242, 254, 0.4)',
          borderRadius: '18px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#00f2fe' }}>
              Bạn đang ở chế độ Khách (Chưa đăng nhập)
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.86rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              Đăng nhập hoặc tạo tài khoản để hệ thống lưu số lần xem các video/bài hát và đề xuất chính xác theo sở thích riêng của bạn!
            </p>
          </div>
          <button
            onClick={onOpenAuthModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
              color: '#08090e',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(0, 242, 254, 0.3)'
            }}
          >
            <LogIn size={18} />
            <span>Đăng Nhập / Đăng Ký Ngay</span>
          </button>
        </div>
      )}

      {/* SECTION 1: NGHE LẠI NHIỀU NHẤT (Most Played / Watched) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #ff4e50, #f9d423)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(255, 78, 80, 0.35)'
            }}>
              <Flame size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                Nghe Lại Nhiều Nhất
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {currentUser 
                  ? 'Các video và bài hát tài khoản của bạn xem/nghe với tần suất cao nhất'
                  : 'Đăng nhập và phát nhạc để xem thống kê số lần nghe của bạn'}
              </p>
            </div>
          </div>
        </div>

        {mostPlayed.length > 0 ? (
          <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '18px' }}>
            {mostPlayed.map((track, idx) => {
              const isThisPlaying = currentSong && (
                (track.youtubeId && currentSong.youtubeId === track.youtubeId) ||
                (currentSong.id === track.id)
              ) && isPlaying;

              return (
                <div
                  key={track.id || idx}
                  onClick={() => handlePlayItem(track)}
                  style={{
                    background: isThisPlaying ? 'rgba(255, 78, 80, 0.14)' : 'rgba(24, 26, 38, 0.75)',
                    borderRadius: '16px',
                    border: isThisPlaying ? '1px solid #ff4e50' : '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.25s ease',
                    boxShadow: isThisPlaying ? '0 0 20px rgba(255, 78, 80, 0.3)' : '0 4px 16px rgba(0, 0, 0, 0.25)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = '#00f2fe';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = isThisPlaying ? '#ff4e50' : 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  {/* Image Container with Badges */}
                  <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: '10px', overflow: 'hidden', background: '#000' }}>
                    <img
                      src={track.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80'}
                      alt={track.title}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />

                    {/* Play count badge */}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      background: 'rgba(0, 0, 0, 0.75)',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(255, 78, 80, 0.6)',
                      color: '#ff6b6b',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Flame size={12} color="#ff4e50" />
                      <span>{track.playCount ? `Đã xem ${track.playCount} lần` : 'Đã nghe'}</span>
                    </div>

                    {/* YouTube pill */}
                    {track.isYouTube && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(4px)',
                        padding: '3px 6px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <YoutubeIcon size={14} />
                      </div>
                    )}

                    {/* Play hover button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayItem(track);
                      }}
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
                        border: 'none',
                        color: '#08090e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0, 242, 254, 0.4)'
                      }}
                    >
                      {isThisPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
                    </button>
                  </div>

                  {/* Title & Artist */}
                  <div style={{ overflow: 'hidden' }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: isThisPlaying ? '#00f2fe' : '#ffffff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {track.title}
                    </h4>
                    <p style={{
                      margin: '4px 0 0 0',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {track.artist}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '36px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            <Flame size={32} color="#ff4e50" style={{ margin: '0 auto 10px auto', opacity: 0.6 }} />
            <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: '#ffffff' }}>
              Chưa có bài hát nào được xem nhiều lần
            </p>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.82rem' }}>
              Hãy phát các video YouTube hoặc bài hát bạn thích, hệ thống sẽ tự động xếp hạng video bạn xem nhiều nhất ở đây!
            </p>
          </div>
        )}
      </div>

      {/* SECTION 2: DÀNH RIÊNG CHO BẠN (Personalized Discovery) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(0, 242, 254, 0.35)'
            }}>
              <Sparkles size={20} color="#08090e" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                Đề Xuất Khám Phá Mới
              </h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Các bài hát và video được AI tuyển chọn dựa trên nghệ sĩ bạn quan tâm
              </p>
            </div>
          </div>
        </div>

        <div className="cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '18px' }}>
          {forYou.map((track, idx) => {
            const isThisPlaying = currentSong && (
              (track.youtubeId && currentSong.youtubeId === track.youtubeId) ||
              (currentSong.id === track.id)
            ) && isPlaying;

            return (
              <div
                key={track.id || idx}
                onClick={() => handlePlayItem(track)}
                style={{
                  background: isThisPlaying ? 'rgba(0, 242, 254, 0.12)' : 'rgba(24, 26, 38, 0.75)',
                  borderRadius: '16px',
                  border: isThisPlaying ? '1px solid #00f2fe' : '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.25s ease',
                  boxShadow: isThisPlaying ? '0 0 20px rgba(0, 242, 254, 0.3)' : '0 4px 16px rgba(0, 0, 0, 0.25)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = '#00f2fe';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = isThisPlaying ? '#00f2fe' : 'rgba(255, 255, 255, 0.08)';
                }}
              >
                {/* Image Container with Badges */}
                <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: '10px', overflow: 'hidden', background: '#000' }}>
                  <img
                    src={track.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80'}
                    alt={track.title}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />

                  {/* Recommendation Reason Badge */}
                  {track.badge && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      background: 'rgba(5, 7, 15, 0.85)',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(0, 242, 254, 0.5)',
                      color: '#00f2fe',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '8px'
                    }}>
                      {track.badge}
                    </div>
                  )}

                  {/* YouTube pill */}
                  {track.isYouTube && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(0, 0, 0, 0.75)',
                      backdropFilter: 'blur(4px)',
                      padding: '3px 6px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <YoutubeIcon size={14} />
                    </div>
                  )}

                  {/* Play hover button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayItem(track);
                    }}
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
                      border: 'none',
                      color: '#08090e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0, 242, 254, 0.4)'
                    }}
                  >
                    {isThisPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
                  </button>
                </div>

                {/* Title & Artist */}
                <div style={{ overflow: 'hidden' }}>
                  <h4 style={{
                    margin: 0,
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: isThisPlaying ? '#00f2fe' : '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {track.title}
                  </h4>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {track.artist}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
