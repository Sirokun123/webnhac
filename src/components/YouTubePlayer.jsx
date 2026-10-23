import React, { useEffect, useRef, useState } from 'react';
import { Disc, AlertCircle } from 'lucide-react';

export default function YouTubePlayer({ 
  youtubeId, 
  isPlaying, 
  volume, 
  coverUrl,
  seekTargetTime,
  onStateChange, 
  onTimeUpdate,
  onDurationChange,
  onEnded,
  onErrorFallback
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const isReadyRef = useRef(false);
  const loadedVideoIdRef = useRef(null);
  const intervalRef = useRef(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Initialize YouTube Iframe Player ONCE
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }

    const initPlayer = () => {
      if (!containerRef.current || playerRef.current) return;
      if (!window.YT || !window.YT.Player) return;

      try {
        playerRef.current = new window.YT.Player(containerRef.current, {
          height: '200',
          width: '200',
          videoId: youtubeId || '',
          playerVars: {
            autoplay: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin
          },
          events: {
            onReady: (event) => {
              isReadyRef.current = true;
              loadedVideoIdRef.current = youtubeId;
              setAutoplayBlocked(false);
              event.target.setVolume(volume * 100);
              if (isPlaying) {
                const p = event.target.playVideo();
                if (p && p.catch) {
                  p.catch(() => setAutoplayBlocked(true));
                }
              }
              const dur = event.target.getDuration?.();
              if (dur && dur > 0 && onDurationChange) onDurationChange(dur);
            },
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setAutoplayBlocked(false);
                if (onStateChange) onStateChange(true);
                const dur = event.target.getDuration?.();
                if (dur && dur > 0 && onDurationChange) onDurationChange(dur);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                if (onStateChange) onStateChange(false);
              } else if (event.data === window.YT.PlayerState.ENDED) {
                if (onStateChange) onStateChange(false);
                if (onEnded) onEnded();
              }
            },
            onError: (err) => {
              console.log('YouTube Error Code:', err.data);
              if (onErrorFallback) onErrorFallback();
            }
          }
        });
      } catch (err) {
        console.error('YT init error:', err);
        if (onErrorFallback) onErrorFallback();
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (playerRef.current && playerRef.current.destroy) {
        try { playerRef.current.destroy(); } catch (e) {}
        playerRef.current = null;
      }
      isReadyRef.current = false;
      loadedVideoIdRef.current = null;
    };
  }, []);

  // FAST SWITCH VIDEO: If player is ready, call loadVideoById (takes ~100ms instead of 2.5s reload)
  useEffect(() => {
    if (!youtubeId) return;

    if (isReadyRef.current && playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      if (loadedVideoIdRef.current !== youtubeId) {
        loadedVideoIdRef.current = youtubeId;
        try {
          playerRef.current.loadVideoById({ videoId: youtubeId, startSeconds: 0 });
          if (isPlaying) {
            playerRef.current.playVideo();
          }
        } catch (e) {
          console.warn('loadVideoById failed, fallback:', e);
        }
      }
    }
  }, [youtubeId, isPlaying]);

  // Handle Play/Pause
  useEffect(() => {
    if (playerRef.current && playerRef.current.playVideo && playerRef.current.pauseVideo) {
      try {
        if (isPlaying) {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      } catch (e) {}
    }
  }, [isPlaying]);

  // Handle Volume
  useEffect(() => {
    if (playerRef.current && playerRef.current.setVolume) {
      try {
        playerRef.current.setVolume(volume * 100);
      } catch (e) {}
    }
  }, [volume]);

  // Handle Seeking
  useEffect(() => {
    if (seekTargetTime !== null && seekTargetTime !== undefined && playerRef.current && playerRef.current.seekTo) {
      try {
        playerRef.current.seekTo(seekTargetTime, true);
      } catch (e) {
        console.log('YT seek error:', e);
      }
    }
  }, [seekTargetTime]);

  // Track Current Time interval
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          try {
            const t = playerRef.current.getCurrentTime();
            if (t !== undefined && onTimeUpdate) {
              onTimeUpdate(t);
            }
          } catch (e) {}
        }
      }, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, onTimeUpdate]);

  const handleManualPlay = () => {
    setAutoplayBlocked(false);
    if (playerRef.current && playerRef.current.playVideo) {
      playerRef.current.playVideo();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',
      left: '24px',
      width: '180px',
      height: '180px',
      borderRadius: '50%',
      overflow: 'hidden',
      boxShadow: '0 12px 35px rgba(0,0,0,0.8), 0 0 20px rgba(162, 56, 255, 0.4)',
      border: '3px solid var(--accent-primary)',
      zIndex: 99,
      background: '#0a0a12',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Hidden YouTube Iframe Container */}
      <div 
        ref={containerRef}
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          width: '200px',
          height: '200px',
          pointerEvents: 'none'
        }}
      />

      {/* Decorative Vinyl Disk Cover */}
      <div 
        className={`track-disk ${isPlaying ? 'playing' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          backgroundImage: `url(${coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80"})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative'
        }}
      >
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '40px',
          height: '40px',
          background: '#08090e',
          borderRadius: '50%',
          border: '3px solid #00f2fe',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 10px rgba(0, 242, 254, 0.5)'
        }}>
          <Disc size={18} color="#00f2fe" />
        </div>
      </div>

      {/* Autoplay block notification overlay */}
      {autoplayBlocked && (
        <div 
          onClick={handleManualPlay}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: '10px',
            textAlign: 'center',
            zIndex: 10
          }}
        >
          <AlertCircle size={28} color="#00f2fe" style={{ marginBottom: '4px' }} />
          <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 700 }}>
            Nhấn để phát nhạc
          </span>
        </div>
      )}
    </div>
  );
}
