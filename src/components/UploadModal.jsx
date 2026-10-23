import React, { useState, useEffect } from "react";
import { X, Loader, Sparkles, ListPlus, Wand2, CheckCircle2, Music, Check, ShieldCheck } from "lucide-react";

const YoutubeIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const SpotifyIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#1DB954">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.503 17.306c-.218.358-.687.474-1.045.256-2.87-1.754-6.48-2.15-10.735-1.176-.41.094-.822-.162-.916-.572-.094-.41.162-.822.572-.916 4.654-1.064 8.647-.611 11.868 1.363.358.218.474.687.256 1.045zm1.467-3.262c-.274.446-.86.589-1.306.315-3.287-2.02-8.298-2.607-12.186-1.427-.5.152-1.029-.133-1.181-.633-.152-.5.133-1.029.633-1.181 4.436-1.346 9.963-.7 13.725 1.616.446.274.589.86.315 1.306zm.126-3.41c-3.943-2.34-10.443-2.556-14.228-1.408-.605.184-1.246-.164-1.43-.769-.184-.605.164-1.246.769-1.43 4.341-1.318 11.517-1.067 16.03 1.611.545.324.726 1.03.402 1.575-.324.545-1.03.726-1.575.402z" />
  </svg>
);

export default function UploadModal({ onClose, onUploadSuccess }) {
  const [activeTab, setActiveTab] = useState("youtube"); // "youtube" | "bulk" | "spotify"
  
  // Single YouTube state
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("Pop");
  const [coverUrl, setCoverUrl] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [autoFetching, setAutoFetching] = useState(false);
  const [autoFetchMsg, setAutoFetchMsg] = useState("");

  // Bulk YouTube / Playlist state
  const [bulkUrls, setBulkUrls] = useState("");
  const [bulkPreviewTracks, setBulkPreviewTracks] = useState([]);

  // Spotify state
  const [spotifyUrl, setSpotifyUrl] = useState("");

  // Global loading & error state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ytApiStatus, setYtApiStatus] = useState(null);

  useEffect(() => {
    fetch("/api/youtube/status")
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data && data.success) {
          setYtApiStatus(data);
        }
      })
      .catch(() => {});
  }, []);

  // Helper YT Extract
  const extractYtId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Helper Spotify Extract
  const extractSpotifyId = (url) => {
    if (!url) return null;
    const str = url.trim();
    const uriMatch = str.match(/spotify:(?:track|album):([a-zA-Z0-9]{15,35})/);
    if (uriMatch) return uriMatch[1];
    const urlMatch = str.match(/open\.spotify\.com\/(?:[a-zA-Z0-9-]+\/)?(?:track|album)\/([a-zA-Z0-9]{15,35})/);
    if (urlMatch) return urlMatch[1];
    if (str.includes('/track/') || str.includes('/album/')) {
      const parts = str.split(/\/(?:track|album)\//);
      if (parts.length > 1) {
        const id = parts[1].split('?')[0].split('/')[0].split('#')[0];
        if (id && id.length >= 15) return id;
      }
    }
    return null;
  };

  const previewYtId = extractYtId(youtubeUrl);
  const [calculatedOffset, setCalculatedOffset] = useState(0);

  // Reset shared metadata state on tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
    setAutoFetchMsg("");
  };

  // 1. Auto-Fetch Metadata & Lyrics from YouTube URL
  const handleAutoFetchYT = async (urlToFetch) => {
    const targetUrl = urlToFetch || youtubeUrl;
    if (!targetUrl) return;
    setAutoFetching(true);
    setAutoFetchMsg("Đang bóc tách Tên, Ca sĩ, Intro & Lời nhạc YouTube...");
    setError(null);

    try {
      const res = await fetch("/api/music/extract-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeUrl: targetUrl })
      });
      let result = null;
      try { result = await res.json(); } catch (e) {}

      if (res.ok && result && result.success && result.data) {
        const { title: fTitle, artist: fArtist, genre: fGenre, thumbnail: fCover, lyrics: fLyrics, calculatedOffset: fOffset, musicStartTime: fStartTime } = result.data;
        if (fTitle) setTitle(fTitle);
        if (fArtist) setArtist(fArtist);
        if (fGenre) setGenre(fGenre);
        if (fCover) setCoverUrl(fCover);
        if (fLyrics) setLyrics(fLyrics);
        if (typeof fOffset === 'number') setCalculatedOffset(fOffset);

        let msg = fLyrics 
          ? `✨ Bóc tách Tên: '${fTitle}', Ca sĩ: '${fArtist}' & tải Lời Bài Hát thành công!`
          : `✨ Bóc tách Tên: '${fTitle}', Ca sĩ: '${fArtist}' thành công! (Thử nhấn "Thử tìm lại lời" bên dưới)`;
        if (fStartTime > 0) {
          msg += ` [Intro: ${fStartTime.toFixed(1)}s]`;
        }
        setAutoFetchMsg(msg);
      } else {
        setAutoFetchMsg(result?.error || result?.message || "Không thể tự động lấy thông tin video.");
      }
    } catch (e) {
      console.error(e);
      setAutoFetchMsg("Lỗi khi phân tích thông tin.");
    } finally {
      setAutoFetching(false);
    }
  };

  // 2. Auto-Fetch Metadata & Lyrics from Spotify URL
  const handleAutoFetchSpotify = async (urlToFetch) => {
    const targetUrl = urlToFetch || spotifyUrl;
    if (!targetUrl) return;
    setAutoFetching(true);
    setAutoFetchMsg("Đang bóc tách Tên, Ca sĩ, Ảnh bìa & Lời bài hát từ Spotify...");
    setError(null);

    try {
      const res = await fetch("/api/spotify/extract-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotifyUrl: targetUrl })
      });
      let result = null;
      try { result = await res.json(); } catch (e) {}

      if (res.ok && result && result.success && result.data) {
        const { title: fTitle, artist: fArtist, genre: fGenre, thumbnail: fCover, lyrics: fLyrics } = result.data;
        if (fTitle) setTitle(fTitle);
        if (fArtist) setArtist(fArtist);
        if (fGenre) setGenre(fGenre);
        if (fCover) setCoverUrl(fCover);
        if (fLyrics) setLyrics(fLyrics);

        const msg = fLyrics 
          ? `✨ Bóc tách Tên: '${fTitle}', Ca sĩ: '${fArtist}' & tải Lời Bài Hát Spotify thành công!`
          : `✨ Bóc tách Tên: '${fTitle}', Ca sĩ: '${fArtist}' thành công! (Thử nhấn "Thử tìm lại lời" bên dưới)`;
        setAutoFetchMsg(msg);
      } else {
        setAutoFetchMsg(result?.error || result?.message || "Không thể tự động lấy thông tin bài hát Spotify.");
      }
    } catch (e) {
      console.error(e);
      setAutoFetchMsg("Lỗi khi phân tích thông tin Spotify.");
    } finally {
      setAutoFetching(false);
    }
  };

  // 3. Auto-Fetch & Preview Bulk Playlist Links (YouTube & Spotify)
  const handleAutoFetchBulk = async (urlsToFetch) => {
    const targetUrls = urlsToFetch || bulkUrls;
    if (!targetUrls || !targetUrls.trim()) {
      setError("Vui lòng dán liên kết Playlist hoặc danh sách bài hát trước khi phân tích!");
      return;
    }
    setAutoFetching(true);
    setAutoFetchMsg("Đang quét danh sách & phân tích tất cả bài hát trong Playlist...");
    setError(null);

    try {
      const res = await fetch("/api/playlist/extract-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: targetUrls })
      });
      let result = null;
      try { result = await res.json(); } catch (e) {}

      if (res.ok && result && result.success && Array.isArray(result.data)) {
        setBulkPreviewTracks(result.data);
        setAutoFetchMsg(`✨ Đã bóc tách thành công ${result.data.length} bài hát trong Playlist! (Xem danh sách bên dưới)`);
      } else {
        setAutoFetchMsg(result?.error || result?.message || "Không thể tự động phân tích Playlist này.");
      }
    } catch (e) {
      console.error(e);
      setAutoFetchMsg("Lỗi khi quét thông tin Playlist.");
    } finally {
      setAutoFetching(false);
    }
  };

  // Re-fetch Lyrics from LRCLIB based on manual or updated Title & Artist
  const handleRefetchLyrics = async () => {
    if (!title) {
      setError("Vui lòng nhập tên bài hát trước khi tìm lời!");
      return;
    }
    setAutoFetching(true);
    setAutoFetchMsg("Đang tìm lời bài hát trên LRCLIB...");

    try {
      const res = await fetch("/api/music/fetch-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, artist })
      });
      let result = null;
      try { result = await res.json(); } catch (e) {}

      if (res.ok && result && result.success && result.lyrics) {
        setLyrics(result.lyrics);
        setAutoFetchMsg("✨ Đã tìm thấy và tải lời bài hát Karaoke thành công!");
      } else {
        setAutoFetchMsg("Chưa tìm thấy lời bài hát khớp trên LRCLIB. Bạn có thể tự dán lời!");
      }
    } catch (err) {
      console.error(err);
      setAutoFetchMsg("Lỗi khi kết nối tới dịch vụ lời nhạc.");
    } finally {
      setAutoFetching(false);
    }
  };

  // Single YouTube Submit
  const handleYoutubeSubmit = async (e) => {
    e.preventDefault();
    if (!youtubeUrl) {
      setError("Vui lòng dán liên kết YouTube!");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeUrl, title, artist, genre, lyrics, coverUrl, calculatedOffset })
      });
      let data = null;
      try { data = await res.json(); } catch (e) {}

      if (res.ok && data && data.success) {
        onUploadSuccess(data.data);
        onClose();
      } else {
        setError(data?.message || "Lỗi khi thêm bài hát YouTube");
      }
    } catch (err) {
      setError("Không thể kết nối tới server.");
    } finally {
      setLoading(false);
    }
  };

  // Bulk Playlist Submit (YouTube & Spotify)
  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!bulkUrls || !bulkUrls.trim()) {
      setError("Vui lòng dán liên kết Playlist hoặc danh sách link YouTube / Spotify!");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/youtube/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: bulkUrls, genre })
      });
      let data = null;
      try { data = await res.json(); } catch (e) {}

      if (res.ok && data && data.success && Array.isArray(data.data)) {
        onUploadSuccess(data.data[0]);
        window.location.reload();
      } else {
        setError(data?.message || "Lỗi khi nhập danh sách bài hát");
      }
    } catch (err) {
      setError("Không thể kết nối tới server.");
    } finally {
      setLoading(false);
    }
  };

  // Spotify Submit
  const handleSpotifySubmit = async (e) => {
    e.preventDefault();
    if (!spotifyUrl) {
      setError("Vui lòng dán liên kết bài hát Spotify!");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/spotify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotifyUrl, title, artist, genre, lyrics, coverUrl })
      });
      let data = null;
      try { data = await res.json(); } catch (e) {}

      if (res.ok && data && data.success) {
        onUploadSuccess(data.data);
        onClose();
      } else {
        setError(data?.message || "Lỗi khi thêm bài hát Spotify");
      }
    } catch (err) {
      setError("Không thể kết nối tới server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-secondary)" }}>
            <Sparkles size={20} /> Thêm Bài Hát Mới
          </h3>
          <button onClick={onClose} className="control-btn" style={{ background: "rgba(255,255,255,0.1)", padding: "6px", borderRadius: "50%" }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", gap: "8px", background: "rgba(0,0,0,0.4)", padding: "5px", borderRadius: "12px", marginBottom: "18px" }}>
          <button
            type="button"
            onClick={() => handleTabChange("youtube")}
            style={{
              flex: 1,
              padding: "9px 10px",
              borderRadius: "8px",
              border: "none",
              background: activeTab === "youtube" ? "linear-gradient(135deg, #ff0000, #ff4e50)" : "transparent",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.2s ease"
            }}
          >
            <YoutubeIcon size={16} /> 1 Bài YouTube
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("bulk")}
            style={{
              flex: 1,
              padding: "9px 10px",
              borderRadius: "8px",
              border: "none",
              background: activeTab === "bulk" ? "linear-gradient(135deg, #00f2fe, #00f5d4)" : "transparent",
              color: activeTab === "bulk" ? "#08090e" : "#fff",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.2s ease"
            }}
          >
            <ListPlus size={16} /> Nhập Playlist (Nhiều bài)
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("spotify")}
            style={{
              flex: 1,
              padding: "9px 10px",
              borderRadius: "8px",
              border: "none",
              background: activeTab === "spotify" ? "#1DB954" : "transparent",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.82rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.2s ease"
            }}
          >
            <SpotifyIcon size={16} /> Link Spotify
          </button>
        </div>

        {/* YouTube API v3 Status Badge */}
        {activeTab !== "spotify" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", padding: "6px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.78rem" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", color: ytApiStatus?.connected ? "#10b981" : "#f59e0b", fontWeight: 500 }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: ytApiStatus?.connected ? "#10b981" : "#f59e0b", display: "inline-block", boxShadow: ytApiStatus?.connected ? "0 0 6px #10b981" : "none" }}></span>
              {ytApiStatus?.connected ? `YouTube Data API v3: Đã kết nối (${ytApiStatus.apiKeyMasked})` : "YouTube Engine: oEmbed (Thêm YOUTUBE_API_KEY trong .env để mở khóa v3)"}
            </span>
          </div>
        )}

        {error && (
          <div style={{ background: "rgba(255, 42, 116, 0.15)", border: "1px solid #ff2a74", color: "#ff2a74", padding: "10px 14px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        {/* ================= TAB 1: SINGLE YOUTUBE ================= */}
        {activeTab === "youtube" && (
          <form onSubmit={handleYoutubeSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                Liên kết YouTube (Video / Shorts):
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input 
                  type="text" 
                  className="modal-input"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    setYoutubeUrl(url);
                    if (extractYtId(url)) {
                      handleAutoFetchYT(url);
                    }
                  }}
                  style={{ flex: 1, color: "#ffffff", fontWeight: 500 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => handleAutoFetchYT()}
                  disabled={autoFetching || !youtubeUrl}
                  style={{
                    padding: "0 14px",
                    borderRadius: "12px",
                    border: "1px solid var(--accent-cyan)",
                    background: "rgba(0, 242, 254, 0.15)",
                    color: "#00f2fe",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    whiteSpace: "nowrap"
                  }}
                >
                  {autoFetching ? <Loader size={14} className="spin" /> : <Wand2 size={14} />}
                  Tự động điền
                </button>
              </div>

              {autoFetchMsg && (
                <p style={{ fontSize: "0.75rem", color: "#00f5d4", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <CheckCircle2 size={13} /> {autoFetchMsg}
                </p>
              )}
            </div>

            {/* Live Thumbnail Preview */}
            {(coverUrl || previewYtId) && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.04)", padding: "10px 14px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                <img 
                  src={coverUrl || `https://img.youtube.com/vi/${previewYtId}/hqdefault.jpg`} 
                  alt="Preview" 
                  style={{ width: "56px", height: "56px", borderRadius: "8px", objectFit: "cover" }}
                />
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <p style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {title || `YouTube Video (${previewYtId})`}
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <YoutubeIcon size={14} /> {artist || "YouTube Artist"}
                  </p>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "4px" }}>Tên bài hát:</label>
                <input 
                  type="text" 
                  className="modal-input"
                  placeholder="Tên bài hát..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: "100%", color: "#ffffff", fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "4px" }}>Nghệ sĩ / Ca sĩ:</label>
                <input 
                  type="text" 
                  className="modal-input"
                  placeholder="Tên ca sĩ..."
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  style={{ width: "100%", color: "#ffffff", fontWeight: 600 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "4px" }}>Thể loại nhạc:</label>
              <select 
                value={genre} 
                onChange={(e) => setGenre(e.target.value)}
                className="modal-input"
                style={{ width: "100%", color: "#ffffff", fontWeight: 600 }}
              >
                <option value="Pop">Pop / V-Pop</option>
                <option value="Ballad">Chill / Ballad</option>
                <option value="Remix">Remix / EDM</option>
                <option value="Rap">Rap / HipHop</option>
                <option value="Rock">Rock / Indie</option>
              </select>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                  Lời bài hát (Tự động tải từ LRCLIB hoặc chép tay):
                </label>
                <button
                  type="button"
                  onClick={handleRefetchLyrics}
                  disabled={autoFetching || !title}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "14px",
                    border: "1px solid var(--accent-cyan)",
                    background: "rgba(0, 242, 254, 0.15)",
                    color: "#00f2fe",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  {autoFetching ? <Loader size={12} className="spin" /> : <Wand2 size={12} />} Thử tìm lại lời
                </button>
              </div>
              <textarea 
                rows={4}
                placeholder="Lời bài hát sẽ tự động điền tại đây..."
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                className="modal-input"
                style={{ width: "100%", color: "#ffffff", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <Loader size={18} className="spin" /> : "Thêm Bài Hát"}
              </button>
            </div>
          </form>
        )}

        {/* ================= TAB 2: BULK PLAYLIST IMPORT (YOUTUBE & SPOTIFY) ================= */}
        {activeTab === "bulk" && (
          <form onSubmit={handleBulkSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "0.85rem", color: "#00f2fe", fontWeight: 700 }}>
                  Dán Link Playlist YouTube, Spotify hoặc nhiều Link:
                </label>
                <button
                  type="button"
                  onClick={() => handleAutoFetchBulk()}
                  disabled={autoFetching || !bulkUrls}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "14px",
                    border: "1px solid var(--accent-cyan)",
                    background: "rgba(0, 242, 254, 0.15)",
                    color: "#00f2fe",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  {autoFetching ? <Loader size={12} className="spin" /> : <Wand2 size={12} />} Phân tích Playlist
                </button>
              </div>

              <textarea 
                rows={5}
                placeholder={`Dán 1 link Playlist YouTube: https://www.youtube.com/playlist?list=...\nHoặc link Playlist Spotify: https://open.spotify.com/playlist/...\nHoặc dán nhiều link YouTube / Spotify (mỗi link 1 dòng)...`}
                value={bulkUrls}
                onChange={(e) => {
                  setBulkUrls(e.target.value);
                  setBulkPreviewTracks([]);
                }}
                className="modal-input"
                style={{ width: "100%", color: "#ffffff", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
                required
              />

              {autoFetchMsg ? (
                <p style={{ fontSize: "0.75rem", color: "#00f5d4", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <CheckCircle2 size={13} /> {autoFetchMsg}
                </p>
              ) : (
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "6px" }}>
                  💡 Tự động phân tích tất cả link YouTube & Spotify, tự lấy Tên, Ca sĩ, Ảnh bìa & Lời bài hát!
                </p>
              )}
            </div>

            {/* Playlist Track Preview List */}
            {bulkPreviewTracks.length > 0 && (
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 700 }}>
                  📋 Bài hát đã tìm thấy ({bulkPreviewTracks.length} bài):
                </label>
                <div style={{ maxHeight: "160px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", background: "rgba(0,0,0,0.3)", padding: "8px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                  {bulkPreviewTracks.map((t, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 8px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
                      <img src={t.cover} alt={t.title} style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover" }} />
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {idx + 1}. {t.title}
                        </p>
                        <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {t.artist}
                        </p>
                      </div>
                      {t.source === "spotify" ? <SpotifyIcon size={16} /> : <YoutubeIcon size={16} />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "4px" }}>Thể loại mặc định cho Playlist:</label>
              <select 
                value={genre} 
                onChange={(e) => setGenre(e.target.value)}
                className="modal-input"
                style={{ width: "100%", color: "#ffffff", fontWeight: 600 }}
              >
                <option value="Pop">Pop / V-Pop</option>
                <option value="Ballad">Chill / Ballad</option>
                <option value="Remix">Remix / EDM</option>
                <option value="Rap">Rap / HipHop</option>
                <option value="Rock">Rock / Indie</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
              <button type="submit" className="btn-primary" disabled={loading} style={{ background: "linear-gradient(135deg, #00f2fe, #00f5d4)", color: "#08090e" }}>
                {loading ? <Loader size={18} className="spin" /> : `⚡ Nhập Hàng Loạt ${bulkPreviewTracks.length > 0 ? `(${bulkPreviewTracks.length} bài)` : ""} Vào Thư Viện`}
              </button>
            </div>
          </form>
        )}

        {/* ================= TAB 3: SPOTIFY TRACK (WITH AUTO-FILL & AUTO-LYRICS) ================= */}
        {activeTab === "spotify" && (
          <form onSubmit={handleSpotifySubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                Liên kết bài hát Spotify:
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input 
                  type="text" 
                  className="modal-input"
                  placeholder="https://open.spotify.com/track/..."
                  value={spotifyUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    setSpotifyUrl(url);
                    if (extractSpotifyId(url)) {
                      handleAutoFetchSpotify(url);
                    }
                  }}
                  style={{ flex: 1, color: "#ffffff", fontWeight: 500 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => handleAutoFetchSpotify()}
                  disabled={autoFetching || !spotifyUrl}
                  style={{
                    padding: "0 14px",
                    borderRadius: "12px",
                    border: "1px solid #1DB954",
                    background: "rgba(29, 185, 84, 0.15)",
                    color: "#1DB954",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    whiteSpace: "nowrap"
                  }}
                >
                  {autoFetching ? <Loader size={14} className="spin" /> : <Wand2 size={14} />}
                  Tự động điền
                </button>
              </div>

              {autoFetchMsg && (
                <p style={{ fontSize: "0.75rem", color: "#1DB954", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <CheckCircle2 size={13} /> {autoFetchMsg}
                </p>
              )}
            </div>

            {/* Spotify Album Cover & Info Preview Card */}
            {(coverUrl || title) && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(29, 185, 84, 0.08)", padding: "10px 14px", borderRadius: "12px", border: "1px solid rgba(29, 185, 84, 0.3)" }}>
                <img 
                  src={coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80"} 
                  alt="Spotify Cover Preview" 
                  style={{ width: "56px", height: "56px", borderRadius: "8px", objectFit: "cover" }}
                />
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <p style={{ fontSize: "0.88rem", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {title || "Spotify Track"}
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <SpotifyIcon size={14} /> {artist || "Spotify Artist"}
                  </p>
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "4px" }}>Tên bài hát:</label>
                <input 
                  type="text" 
                  className="modal-input"
                  placeholder="Tên bài hát..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: "100%", color: "#ffffff", fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "4px" }}>Nghệ sĩ / Ca sĩ:</label>
                <input 
                  type="text" 
                  className="modal-input"
                  placeholder="Tên ca sĩ..."
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  style={{ width: "100%", color: "#ffffff", fontWeight: 600 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "4px" }}>Thể loại nhạc:</label>
              <select 
                value={genre} 
                onChange={(e) => setGenre(e.target.value)}
                className="modal-input"
                style={{ width: "100%", color: "#ffffff", fontWeight: 600 }}
              >
                <option value="Pop">Pop / V-Pop</option>
                <option value="Ballad">Chill / Ballad</option>
                <option value="Remix">Remix / EDM</option>
                <option value="Rap">Rap / HipHop</option>
                <option value="Rock">Rock / Indie</option>
              </select>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                  Lời bài hát (Tự động tải từ LRCLIB hoặc chép tay):
                </label>
                <button
                  type="button"
                  onClick={handleRefetchLyrics}
                  disabled={autoFetching || !title}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "14px",
                    border: "1px solid #1DB954",
                    background: "rgba(29, 185, 84, 0.15)",
                    color: "#1DB954",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  {autoFetching ? <Loader size={12} className="spin" /> : <Wand2 size={12} />} Thử tìm lại lời
                </button>
              </div>
              <textarea 
                rows={4}
                placeholder="Lời bài hát sẽ tự động điền tại đây..."
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                className="modal-input"
                style={{ width: "100%", color: "#ffffff", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
              <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
              <button type="submit" className="btn-primary" disabled={loading} style={{ background: "#1DB954" }}>
                {loading ? <Loader size={18} className="spin" /> : "Thêm Bài Hát Spotify"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
