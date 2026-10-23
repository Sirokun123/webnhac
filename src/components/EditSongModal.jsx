import React, { useState } from "react";
import { X, Edit3, Save, Loader } from "lucide-react";

export default function EditSongModal({ song, onClose, onSaveSuccess }) {
  if (!song) return null;

  const formatSecToMinSec = (secs) => {
    if (isNaN(secs) || secs < 0) return "[00:00]";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `[${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}]`;
  };

  const initialLyricsText = song.lyrics && song.lyrics.length > 0
    ? song.lyrics.map(l => (l.time !== undefined && l.time !== null ? `${formatSecToMinSec(l.time)} ${l.text}` : l.text)).join("\n")
    : "";

  const [title, setTitle] = useState(song.title || "");
  const [artist, setArtist] = useState(song.artist || "");
  const [genre, setGenre] = useState(song.genre || "Pop");
  const [cover, setCover] = useState(song.cover || "");
  const [lyricsText, setLyricsText] = useState(initialLyricsText);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/songs/${song.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          artist,
          genre,
          cover,
          lyrics: lyricsText
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Đã cập nhật bài hát vào MongoDB Atlas thành công!" });
        setTimeout(() => {
          onSaveSuccess(data.data);
          onClose();
        }, 1000);
      } else {
        setMessage({ type: "error", text: data.message || "Lỗi khi cập nhật bài hát" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Không thể kết nối với server" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", color: "var(--accent-secondary)" }}>
            <Edit3 size={22} /> Chỉnh Sửa Bài Hát
          </h3>
          <button onClick={onClose} className="control-btn" style={{ background: "rgba(255,255,255,0.1)", padding: "6px", borderRadius: "50%" }}>
            <X size={18} />
          </button>
        </div>

        {/* Header Preview card */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", background: "rgba(255,255,255,0.05)", padding: "12px 16px", borderRadius: "12px", marginBottom: "16px" }}>
          <img src={cover || song.cover} alt={title} style={{ width: "50px", height: "50px", borderRadius: "10px", objectFit: "cover", border: "1px solid var(--glass-border)" }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>{title || song.title}</div>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{artist || song.artist} • {genre}</div>
          </div>
        </div>

        {message && (
          <div style={{
            padding: "10px 14px",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "0.88rem",
            background: message.type === "success" ? "rgba(29, 185, 84, 0.2)" : "rgba(255, 42, 116, 0.2)",
            color: message.type === "success" ? "#1db954" : "#ff2a74",
            border: `1px solid ${message.type === "success" ? "#1db954" : "#ff2a74"}`
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "0.83rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Tên Bài Hát</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid var(--glass-border)", borderRadius: "8px", color: "#fff", outline: "none" }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: "0.83rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Nghệ Sĩ</label>
              <input 
                type="text" 
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid var(--glass-border)", borderRadius: "8px", color: "#fff", outline: "none" }}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ fontSize: "0.83rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Thể Loại</label>
              <select 
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", background: "rgba(30,30,50,0.9)", border: "1px solid var(--glass-border)", borderRadius: "8px", color: "#fff", outline: "none" }}
              >
                <option value="Pop">Pop</option>
                <option value="EDM">EDM</option>
                <option value="Lofi">Lofi</option>
                <option value="Rap">Rap</option>
                <option value="Ballad">Ballad</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.83rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Link Ảnh Bìa (URL)</label>
              <input 
                type="url" 
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder="https://..."
                style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid var(--glass-border)", borderRadius: "8px", color: "#fff", outline: "none" }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.83rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
              Lời Bài Hát (Sửa lại lyric):
            </label>
            <textarea 
              rows={6}
              placeholder="Nhập lời bài hát..."
              value={lyricsText}
              onChange={(e) => setLyricsText(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid var(--glass-border)", borderRadius: "8px", color: "#fff", outline: "none", resize: "vertical", fontSize: "0.9rem", lineHeight: "1.6" }}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: "center", marginTop: "6px" }}>
            {loading ? <Loader size={20} className="animate-spin" /> : <Save size={20} />}
            <span>{loading ? "Đang Lưu Vào MongoDB..." : "Lưu Thay Đổi Bài Hát"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
