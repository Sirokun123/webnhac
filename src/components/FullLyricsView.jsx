import React, { useEffect, useRef, useState } from "react";
import { 
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, 
  Volume2, VolumeX, MoreHorizontal, Zap, CheckCircle2, Sparkles 
} from "lucide-react";

export default function FullLyricsView({ 
  currentSong, 
  isPlaying, 
  onTogglePlay, 
  onNext, 
  onPrev, 
  currentTime, 
  durationSec, 
  onSeek,
  volume = 0.8,
  onVolumeChange,
  isShuffle,
  onToggleShuffle,
  isRepeat,
  onToggleRepeat,
  onSongUpdate
}) {
  const activeLineRef = useRef(null);

  // Dynamic extracted theme color state (RGB)
  const [themeColor, setThemeColor] = useState({ r: 0, g: 242, b: 254 });
  const [syncMsg, setSyncMsg] = useState("");

  // Extract dominant color from song cover art
  useEffect(() => {
    if (!currentSong?.cover) return;

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = currentSong.cover;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = 40;
        canvas.height = 40;
        ctx.drawImage(img, 0, 0, 40, 40);
        const data = ctx.getImageData(0, 0, 40, 40).data;

        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          const pr = data[i];
          const pg = data[i + 1];
          const pb = data[i + 2];
          const alpha = data[i + 3];

          const brightness = (pr + pg + pb) / 3;
          if (alpha > 128 && brightness > 20 && brightness < 240) {
            r += pr;
            g += pg;
            b += pb;
            count++;
          }
        }

        if (count > 0) {
          setThemeColor({
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(b / count)
          });
          return;
        }
      } catch (e) {
        // Fallback on cross-origin image policy
      }
      fallbackHashColor(currentSong.title || currentSong.cover);
    };

    img.onerror = () => {
      fallbackHashColor(currentSong.title || currentSong.cover);
    };

    function fallbackHashColor(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const h = Math.abs(hash) % 360;
      const s = 0.65, l = 0.55;
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs((h / 60) % 2 - 1));
      const m = l - c / 2;
      let r = 0, g = 0, b = 0;
      if (h < 60) { r = c; g = x; b = 0; }
      else if (h < 120) { r = x; g = c; b = 0; }
      else if (h < 180) { r = 0; g = c; b = x; }
      else if (h < 240) { r = 0; g = x; b = c; }
      else if (h < 300) { r = x; g = 0; b = c; }
      else { r = c; g = 0; b = x; }

      setThemeColor({
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
      });
    }
  }, [currentSong?.cover, currentSong?.title]);

  if (!currentSong) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>
        <p>Chưa có bài hát nào được chọn.</p>
      </div>
    );
  }

  // Format lyrics array
  const lyricsList = Array.isArray(currentSong.lyrics) && currentSong.lyrics.length > 0
    ? currentSong.lyrics
    : [
        { time: 0, text: "She's forgotten her car keys" },
        { time: 5, text: "And the flowers for her friends" },
        { time: 10, text: "They say she's a harpy" },
        { time: 15, text: "But she is on her meds" },
        { time: 20, text: "'Cause you're holdin' onto someone who's special" },
        { time: 25, text: "🎶 " + currentSong.title + " - " + currentSong.artist }
      ];

  const currentOffset = currentSong.offset || 0;

  // Calculate active lyric line index based on current playback time + calculated offset
  let activeIndex = 0;
  for (let i = 0; i < lyricsList.length; i++) {
    const rawTime = typeof lyricsList[i] === "object" && lyricsList[i].time !== undefined
      ? lyricsList[i].time
      : (i * (durationSec / Math.max(lyricsList.length, 1)));
    
    // Apply song time offset
    const effectiveTime = Math.max(0, rawTime + currentOffset);
    
    if (currentTime >= effectiveTime) {
      activeIndex = i;
    }
  }

  // Auto-scroll to active lyric line
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }, [activeIndex]);

  // 1-Click Quick Offset Sync Handler
  const handleSyncFirstLine = async () => {
    if (!currentSong || lyricsList.length === 0) return;

    const firstLyricTime = typeof lyricsList[0] === "object" && lyricsList[0].time !== undefined
      ? lyricsList[0].time
      : 0;

    const calculatedOffset = currentTime - firstLyricTime;

    try {
      const res = await fetch(`/api/songs/${currentSong.id}/offset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offset: calculatedOffset })
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (onSongUpdate) {
          onSongUpdate(data.data);
        }
        setSyncMsg(`⚡ Đã căn nhịp & lưu Database thành công! (${calculatedOffset > 0 ? '+' : ''}${calculatedOffset.toFixed(1)}s)`);
        setTimeout(() => setSyncMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
      setSyncMsg(`⚡ Lỗi khi lưu căn nhịp vào database`);
      setTimeout(() => setSyncMsg(""), 4000);
    }
  };

  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false);

  const handleAutoFetchLyrics = async () => {
    if (!currentSong?.id || isFetchingLyrics) return;
    setIsFetchingLyrics(true);
    setSyncMsg("⏳ Đang cào phụ đề YouTube & LRCLIB...");
    try {
      const res = await fetch(`/api/songs/${currentSong.id}/refresh-lyrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeId: currentSong.youtubeId })
      });
      const data = await res.json();
      if (data && data.success && data.data) {
        if (onSongUpdate) {
          onSongUpdate(data.data);
        }
        setSyncMsg(`✓ ${data.message}`);
      } else {
        setSyncMsg(data?.message || "Không tìm thấy phụ đề tự động");
      }
    } catch (e) {
      setSyncMsg("Lỗi khi tải phụ đề tự động");
    } finally {
      setIsFetchingLyrics(false);
      setTimeout(() => setSyncMsg(""), 4500);
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const formatRemainingTime = (secs, dur) => {
    const remaining = Math.max(0, (dur || 0) - (secs || 0));
    return `-${formatTime(remaining)}`;
  };

  // Color values derived from extracted RGB theme color
  const { r, g, b } = themeColor;
  const mainRgb = `rgb(${r}, ${g}, ${b})`;
  const darkRgb = `rgba(${Math.max(6, Math.round(r * 0.08))}, ${Math.max(8, Math.round(g * 0.08))}, ${Math.max(14, Math.round(b * 0.08))}, 0.96)`;
  const bgGradient = `radial-gradient(circle at 35% 45%, rgba(${r}, ${g}, ${b}, 0.45) 0%, ${darkRgb} 85%)`;
  const ringGlow = `0 0 45px rgba(${r}, ${g}, ${b}, 0.75), 0 0 90px rgba(${r}, ${g}, ${b}, 0.35)`;
  const activeLyricGlow = `0 0 25px rgba(${r}, ${g}, ${b}, 0.8), 0 0 40px rgba(255, 255, 255, 0.9)`;

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100%",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "36px 48px",
      background: darkRgb,
      transition: "background 0.8s ease"
    }}>
      {/* Dynamic Blurred Album Art Background */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `url(${currentSong.cover})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: "blur(65px) brightness(0.4) saturate(170%)",
        transform: "scale(1.25)",
        zIndex: 0,
        transition: "background-image 0.8s ease"
      }} />

      {/* Dynamic Color Tint Overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: bgGradient,
        zIndex: 1,
        transition: "background 0.8s ease"
      }} />

      {/* Main Content Layout Grid */}
      <div style={{
        position: "relative",
        zIndex: 2,
        width: "100%",
        maxWidth: "1150px",
        height: "100%",
        display: "grid",
        gridTemplateColumns: "360px 1fr",
        gap: "60px",
        alignItems: "center"
      }}>

        {/* LEFT COLUMN: Dynamic Theme Player Widget */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "20px",
          width: "100%"
        }}>
          {/* Circular Album Cover with Dynamic Color Ring */}
          <div style={{
            position: "relative",
            width: "210px",
            height: "210px",
            borderRadius: "50%",
            padding: "4px",
            background: `linear-gradient(135deg, ${mainRgb}, rgba(255, 255, 255, 0.8))`,
            boxShadow: ringGlow,
            flexShrink: 0,
            transition: "all 0.8s ease"
          }}>
            <img 
              src={currentSong.cover} 
              alt={currentSong.title}
              className={`track-disk ${isPlaying ? 'playing' : ''}`}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover",
                border: "3px solid #08090e"
              }}
            />
          </div>

          {/* Song Metadata */}
          <div style={{ width: "100%", padding: "0 10px" }}>
            <div className="marquee-title-container" style={{ marginBottom: "4px" }}>
              <h1 
                className={currentSong.title.length > 18 ? "marquee-title-full" : ""}
                style={{
                  fontSize: "1.65rem",
                  fontWeight: 900,
                  color: "#ffffff",
                  whiteSpace: "nowrap",
                  letterSpacing: "1.2px",
                  display: "inline-block"
                }}
                title={currentSong.title}
              >
                {currentSong.title}
              </h1>
            </div>
            
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              color: "rgba(255, 255, 255, 0.75)",
              fontSize: "0.92rem",
              fontWeight: 600
            }}>
              <span>{currentSong.artist}</span>
              <MoreHorizontal size={16} style={{ cursor: "pointer", opacity: 0.8 }} />
            </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                <button
                  onClick={handleSyncFirstLine}
                  title="Bấm khi ca sĩ vừa cất từ đầu tiên để đồng bộ mốc thời gian lời hát 100%"
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    border: `1px solid ${mainRgb}`,
                    background: `rgba(${r}, ${g}, ${b}, 0.25)`,
                    color: "#ffffff",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: `0 0 15px rgba(${r}, ${g}, ${b}, 0.35)`,
                    transition: "all 0.2s ease"
                  }}
                >
                  <Zap size={13} color="#00f2fe" /> Căn Nhịp Dòng Đầu
                </button>

                <button
                  onClick={handleAutoFetchLyrics}
                  disabled={isFetchingLyrics}
                  title="Tự động cào phụ đề tiếng Việt từ video YouTube hoặc thư viện LRCLIB"
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    border: "1px solid rgba(0, 242, 254, 0.45)",
                    background: "rgba(0, 242, 254, 0.16)",
                    color: "#00f2fe",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    cursor: isFetchingLyrics ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 0 15px rgba(0, 242, 254, 0.25)",
                    transition: "all 0.2s ease"
                  }}
                >
                  <Sparkles size={13} color="#00f2fe" /> {isFetchingLyrics ? "Đang cào phụ đề..." : "⚡ Cào Lời YouTube (CC)"}
                </button>
              </div>

              {syncMsg && (
                <span style={{ fontSize: "0.74rem", color: "#00f5d4", marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <CheckCircle2 size={12} /> {syncMsg}
                </span>
              )}
            </div>
          </div>

          {/* Progress Seekbar */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "6px" }}>
            <div className="slider-container" style={{ width: "100%" }}>
              <input 
                type="range"
                className="custom-range"
                min={0}
                max={durationSec || 100}
                value={currentTime || 0}
                onChange={(e) => onSeek && onSeek(parseFloat(e.target.value))}
                style={{
                  height: "4px",
                  background: "rgba(255, 255, 255, 0.25)"
                }}
              />
            </div>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              fontSize: "0.76rem",
              color: "rgba(255, 255, 255, 0.65)",
              fontFamily: "var(--font-mono)"
            }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatRemainingTime(currentTime, durationSec)}</span>
            </div>
          </div>

          {/* Controls Row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            width: "100%"
          }}>
            <button 
              className={`control-btn ${isShuffle ? 'active' : ''}`}
              onClick={onToggleShuffle}
              style={{ color: isShuffle ? mainRgb : "rgba(255, 255, 255, 0.8)" }}
            >
              <Shuffle size={18} />
            </button>

            <button 
              className="control-btn"
              onClick={onPrev}
              style={{ color: "rgba(255, 255, 255, 0.9)" }}
            >
              <SkipBack size={20} />
            </button>

            {/* Play/Pause Wavy White Circle Pill */}
            <button 
              onClick={onTogglePlay}
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "#ffffff",
                color: "#08090e",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: `0 0 25px rgba(255, 255, 255, 0.6), 0 0 45px rgba(${r}, ${g}, ${b}, 0.4)`,
                transition: "transform 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              {isPlaying ? <Pause size={22} fill="#08090e" /> : <Play size={22} fill="#08090e" style={{ marginLeft: "3px" }} />}
            </button>

            <button 
              className="control-btn"
              onClick={onNext}
              style={{ color: "rgba(255, 255, 255, 0.9)" }}
            >
              <SkipForward size={20} />
            </button>

            <button 
              className={`control-btn ${isRepeat ? 'active' : ''}`}
              onClick={onToggleRepeat}
              style={{ color: isRepeat ? mainRgb : "rgba(255, 255, 255, 0.8)" }}
            >
              <Repeat size={18} />
            </button>
          </div>

          {/* Volume Slider Bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "100%",
            marginTop: "2px"
          }}>
            <button 
              onClick={() => onVolumeChange && onVolumeChange(volume === 0 ? 0.8 : 0)}
              style={{ background: "none", border: "none", color: "rgba(255, 255, 255, 0.8)", cursor: "pointer", padding: 0 }}
            >
              {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input 
              type="range"
              className="custom-range"
              min={0}
              max={1}
              step={0.02}
              value={volume}
              onChange={(e) => onVolumeChange && onVolumeChange(parseFloat(e.target.value))}
              style={{ flex: 1, height: "4px" }}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: Synchronized Karaoke Lyrics */}
        <div style={{
          height: "460px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          paddingRight: "20px",
          scrollbarWidth: "none"
        }}>
          {lyricsList.map((lineItem, idx) => {
            const text = typeof lineItem === "string" ? lineItem : lineItem.text;
            const isActive = idx === activeIndex;

            return (
              <div 
                key={idx}
                ref={isActive ? activeLineRef : null}
                style={{
                  fontSize: isActive ? "1.9rem" : "1.45rem",
                  fontWeight: isActive ? 900 : 600,
                  color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.45)",
                  transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                  textShadow: isActive ? activeLyricGlow : "none",
                  transform: isActive ? "scale(1.02) translateX(6px)" : "scale(1)",
                  cursor: "pointer"
                }}
                onClick={() => {
                  if (typeof lineItem === "object" && lineItem.time !== undefined && onSeek) {
                    onSeek(lineItem.time);
                  }
                }}
              >
                {text}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
