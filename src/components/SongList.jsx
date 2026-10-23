import React, { useState } from "react";
import { Clock, Heart, MoreVertical, Share2, Edit3, Trash2, Plus } from "lucide-react";

export default function SongList({ songs, currentSong, isPlaying, onPlay, onToggleLike, onOpenEditSong, onShareSong, onDeleteSong, onAddSongToPlaylist, playlists = [] }) {
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [showPlaylistSubmenuId, setShowPlaylistSubmenuId] = useState(null);

  const formatDuration = (secs, fallbackStr) => {
    if (secs && !isNaN(secs) && secs > 0) {
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    }
    return fallbackStr || "03:45";
  };

  const toggleMenu = (e, songId) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === songId ? null : songId);
    setShowPlaylistSubmenuId(null);
  };

  return (
    <div 
      style={{ background: "var(--bg-card)", borderRadius: "var(--radius-md)", padding: "16px", border: "1px solid var(--border-color)", position: "relative" }}
      onClick={() => setActiveMenuId(null)}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: "0.82rem" }}>
            <th style={{ padding: "12px 16px", width: "50px" }}>#</th>
            <th style={{ padding: "12px 16px" }}>Bài hát</th>
            <th style={{ padding: "12px 16px", textAlign: "right" }}><Clock size={16} /></th>
          </tr>
        </thead>
        <tbody>
          {songs.map((song, index) => {
            const isCurrent = currentSong && currentSong.id === song.id;
            const displayDuration = formatDuration(song.durationSec, song.duration);
            const isMenuOpen = activeMenuId === song.id;

            return (
              <tr 
                key={song.id}
                onClick={() => onPlay(song)}
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                  background: isCurrent ? "rgba(162, 56, 255, 0.15)" : "transparent",
                  position: "relative"
                }}
                onMouseEnter={(e) => { if(!isCurrent) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={(e) => { if(!isCurrent) e.currentTarget.style.background = "transparent"; }}
              >
                <td style={{ padding: "12px 16px", color: isCurrent ? "var(--accent-secondary)" : "var(--text-muted)", fontWeight: 700 }}>
                  {isCurrent && isPlaying ? (
                    <span style={{ color: "var(--accent-secondary)" }}>▶</span>
                  ) : (
                    index + 1
                  )}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <img src={song.cover} alt={song.title} style={{ width: "44px", height: "44px", borderRadius: "8px", objectFit: "cover" }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: isCurrent ? "var(--accent-secondary)" : "var(--text-main)" }}>
                        {song.title}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{song.artist}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", position: "relative" }}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleLike(song.id); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: song.isLiked ? "#ff2a74" : "var(--text-muted)" }}
                    >
                      <Heart size={16} fill={song.isLiked ? "#ff2a74" : "none"} />
                    </button>

                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{displayDuration}</span>

                    {/* 3 Dots Menu Button */}
                    <button 
                      onClick={(e) => toggleMenu(e, song.id)}
                      style={{
                        background: isMenuOpen ? "rgba(255,255,255,0.15)" : "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: "4px 6px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {/* Dropdown Popup Context Menu */}
                    {isMenuOpen && (
                      <div 
                        style={{
                          position: "absolute",
                          right: "0",
                          top: "32px",
                          background: "rgba(22, 22, 38, 0.98)",
                          backdropFilter: "blur(20px)",
                          border: "1px solid var(--glass-border)",
                          borderRadius: "12px",
                          padding: "6px",
                          width: "210px",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.7)",
                          zIndex: 100,
                          textAlign: "left"
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div 
                          onClick={() => { setActiveMenuId(null); onOpenEditSong(song); }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            color: "#fff",
                            fontSize: "0.88rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "background 0.2s ease"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <Edit3 size={16} color="var(--accent-secondary)" />
                          <span>1. Chỉnh sửa bài hát</span>
                        </div>

                        <div 
                          onClick={() => { setActiveMenuId(null); onShareSong(song); }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            color: "#fff",
                            fontSize: "0.88rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "background 0.2s ease"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <Share2 size={16} color="var(--accent-primary)" />
                          <span>2. Chia sẻ liên kết</span>
                        </div>

                        {playlists.length > 0 && (
                          <div 
                            onClick={() => setShowPlaylistSubmenuId(showPlaylistSubmenuId === song.id ? null : song.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              color: "#fff",
                              fontSize: "0.88rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "background 0.2s ease"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >
                            <Plus size={16} color="#00f5d4" />
                            <span>3. Thêm vào Playlist</span>
                          </div>
                        )}

                        {showPlaylistSubmenuId === song.id && (
                          <div style={{ background: "rgba(10, 10, 20, 0.95)", padding: "4px", borderRadius: "8px", marginTop: "4px", border: "1px solid rgba(0,242,254,0.3)" }}>
                            {playlists.map(pl => (
                              <div
                                key={pl.id}
                                onClick={() => {
                                  if (onAddSongToPlaylist) onAddSongToPlaylist(pl.id, song.id);
                                  setActiveMenuId(null);
                                }}
                                style={{
                                  padding: "6px 10px",
                                  fontSize: "0.8rem",
                                  color: "#ffffff",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0, 242, 254, 0.2)"}
                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                              >
                                + {pl.title}
                              </div>
                            ))}
                          </div>
                        )}

                        <div 
                          onClick={() => { setActiveMenuId(null); onDeleteSong(song); }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            color: "#ff2a74",
                            fontSize: "0.88rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "background 0.2s ease"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,42,116,0.15)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >
                          <Trash2 size={16} color="#ff2a74" />
                          <span>4. Xóa bài hát</span>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
