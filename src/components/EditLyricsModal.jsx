import React, { useState } from "react";
import { X, FileText, Save, Loader, Sparkles } from "lucide-react";

export default function EditLyricsModal({ song, onClose, onSaveSuccess }) {
  if (!song) return null;

  const formatSecToMinSec = (secs) => {
    if (isNaN(secs) || secs < 0) return "[00:00]";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `[${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}]`;
  };

  // Build initial lyrics string with [MM:SS] format if lyrics exist
  const existingText = song.lyrics && song.lyrics.length > 0
    ? song.lyrics.map(l => {
        if (l.time !== undefined && l.time !== null) {
          if (/^\[\d{1,2}:\d{2}/.test(l.text)) return l.text;
          return `${formatSecToMinSec(l.time)} ${l.text}`;
        }
        return l.text;
      }).join("\n")
    : "";

  const [lyricsText, setLyricsText] = useState(existingText);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Helper to auto-generate timestamp tags for plain multiline text
  const handleAutoAddTimestamps = () => {
    if (!lyricsText.trim()) return;
    const lines = lyricsText.split("\n").map(l => l.replace(/^\[\d{1,2}:\d{2}(?:\.\d+)?\]\s*/, "").trim()).filter(Boolean);
    const totalDur = song.durationSec || 225;
    const introDelay = 6;
    const outroMargin = 8;
    const singingDuration = Math.max(totalDur - introDelay - outroMargin, lines.length * 2.5);
    const interval = singingDuration / lines.length;

    const formatted = lines.map((text, idx) => {
      const timeSec = introDelay + idx * interval;
      return `${formatSecToMinSec(timeSec)} ${text}`;
    }).join("\n");

    setLyricsText(formatted);
    setMessage({ type: "success", text: "Đã tự động căn chỉnh mốc thời gian [MM:SS] theo độ dài bài hát!" });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/songs/${song.id}/lyrics`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lyrics: lyricsText })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "Đã lưu lời bài hát đồng bộ vào MongoDB Atlas!" });
        setTimeout(() => {
          onSaveSuccess(data.data);
          onClose();
        }, 1000);
      } else {
        setMessage({ type: "error", text: data.message || "Lỗi khi lưu lời bài hát" });
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
            <FileText size={22} /> Đồng Bộ Lời Bài Hát (Karaoke LRC)
          </h3>
          <button onClick={onClose} className="control-btn" style={{ background: "rgba(255,255,255,0.1)", padding: "6px", borderRadius: "50%" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.05)", padding: "12px 16px", borderRadius: "12px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img src={song.cover} alt={song.title} style={{ width: "45px", height: "45px", borderRadius: "8px", objectFit: "cover" }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{song.title}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{song.artist} • {song.duration || "03:45"}</div>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleAutoAddTimestamps}
            style={{
              background: "rgba(162, 56, 255, 0.2)",
              border: "1px solid var(--accent-primary)",
              color: "#fff",
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Sparkles size={14} color="var(--accent-secondary)" /> Căn mốc [MM:SS] tự động
          </button>
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

        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", background: "rgba(0,0,0,0.3)", padding: "10px 12px", borderRadius: "8px", marginBottom: "12px", borderLeft: "3px solid var(--accent-secondary)" }}>
          💡 <strong>Mẹo đồng bộ chuẩn:</strong> Bạn có thể thêm mốc <code>[Phút:Giây]</code> ở đầu mỗi dòng (vd: <code>[01:04] Em ôm chặt anh vết móng tay cào</code>) để lời nhảy chính xác từng giây hát!
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <textarea 
              rows={9}
              placeholder="[00:06] Vì điều gì mà tình yêu đôi ta...&#10;[00:12] Còn mùa hè thì lạnh đi...&#10;[01:04] Em ôm chặt anh vết móng tay cào..."
              value={lyricsText}
              onChange={(e) => setLyricsText(e.target.value)}
              style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid var(--glass-border)", borderRadius: "10px", color: "#fff", outline: "none", resize: "vertical", fontSize: "0.9rem", fontFamily: "monospace", lineHeight: "1.6" }}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: "center" }}>
            {loading ? <Loader size={20} className="animate-spin" /> : <Save size={20} />}
            <span>{loading ? "Đang lưu vào MongoDB..." : "Lưu Lời & Đồng Bộ MongoDB"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
