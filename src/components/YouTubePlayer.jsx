import React, { useEffect, useRef, useState } from 'react';

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
    <div 
      style={{
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        width: '1px',
        height: '1px',
        opacity: 0,
        pointerEvents: 'none',
        zIndex: -9999
      }}
    >
      {/* Hidden YouTube Iframe Container */}
      <div 
        ref={containerRef}
        style={{
          width: '200px',
          height: '200px'
        }}
      />
    </div>
  );
}
