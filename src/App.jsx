import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import PlayerBar from "./components/PlayerBar";
import SongCard from "./components/SongCard";
import SongList from "./components/SongList";
import TopCharts from "./components/TopCharts";
import GenreGrid from "./components/GenreGrid";
import LyricsModal from "./components/LyricsModal";
import FullLyricsView from "./components/FullLyricsView";
import UploadModal from "./components/UploadModal";
import QueueDrawer from "./components/QueueDrawer";
import YouTubePlayer from "./components/YouTubePlayer";
import EditSongModal from "./components/EditSongModal";
import PlaylistView from "./components/PlaylistView";
import CreatePlaylistModal from "./components/CreatePlaylistModal";
import ArtistView from "./components/ArtistView";
import EditPlaylistModal from "./components/EditPlaylistModal";
import EditArtistModal from "./components/EditArtistModal";
import YouTubeMusicView from "./components/YouTubeMusicView";
import AuthModal from "./components/AuthModal";
import RecommendationsView from "./components/RecommendationsView";
import ChillStarryCanvas from "./components/ChillStarryCanvas";
import { Play, Sparkles, Heart, Volume2, Search, Loader2, Flame, Moon } from "lucide-react";

export default function App() {
  const [songs, setSongs] = useState([]);
  const [activeTab, setActiveTab] = useState("discover"); // discover, youtube, charts, lyrics, genres, favorites
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [isChillMode, setIsChillMode] = useState(false);
  const [ytTrendingSongs, setYtTrendingSongs] = useState([]);
  const [ytSearchResults, setYtSearchResults] = useState([]);
  const [isSearchingYt, setIsSearchingYt] = useState(false);

  // Authentication & Personalized Recommendations State
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [recommendations, setRecommendations] = useState({ mostPlayed: [], forYou: [], topArtists: [] });
  const [loadingRecs, setLoadingRecs] = useState(false);

  // Tab Navigation History State
  const [navHistory, setNavHistory] = useState(["discover"]);
  const [navIndex, setNavIndex] = useState(0);

  // Switch tab and track history
  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    const newHistory = navHistory.slice(0, navIndex + 1);
    newHistory.push(newTab);
    setNavHistory(newHistory);
    setNavIndex(newHistory.length - 1);
    setActiveTab(newTab);
    setSelectedGenre("All");
  };

  const handleGoBack = () => {
    if (navIndex > 0) {
      const prevIndex = navIndex - 1;
      setNavIndex(prevIndex);
      setActiveTab(navHistory[prevIndex]);
    }
  };

  const handleGoForward = () => {
    if (navIndex < navHistory.length - 1) {
      const nextIndex = navIndex + 1;
      setNavIndex(nextIndex);
      setActiveTab(navHistory[nextIndex]);
    }
  };

  const handleGoHome = () => {
    setSearchTerm("");
    setSelectedGenre("All");
    handleTabChange("discover");
  };
  
  // Audio state
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [seekTargetTime, setSeekTargetTime] = useState(null);
  const [volume, setVolume] = useState(0.8);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  // Modals & Drawers state
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  // Edit Song, Playlist & Artist Modals State
  const [showEditSongModal, setShowEditSongModal] = useState(false);
  const [editingSongTarget, setEditingSongTarget] = useState(null);

  const [showEditPlaylistModal, setShowEditPlaylistModal] = useState(false);
  const [editingPlaylistTarget, setEditingPlaylistTarget] = useState(null);

  const [showEditArtistModal, setShowEditArtistModal] = useState(false);
  const [editingArtistTarget, setEditingArtistTarget] = useState(null);

  const [toastMessage, setToastMessage] = useState("");

  const audioRef = useRef(new Audio());

  // Helper format time MM:SS
  const formatTimeStr = (secs) => {
    if (!secs || isNaN(secs) || secs < 0) return "03:45";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Fetch songs safely from Express server
  const fetchSongs = async () => {
    try {
      const res = await fetch("/api/songs");
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        // Strict deduplication to ensure unique songs
        const unique = [];
        const seen = new Set();
        for (const s of data.data) {
          const key = s.youtubeId 
            ? `yt_${s.youtubeId}` 
            : `t_${s.title?.trim().toLowerCase()}_${s.artist?.trim().toLowerCase()}`;
          if (!seen.has(key) && !seen.has(s.id)) {
            seen.add(key);
            if (s.id) seen.add(s.id);
            unique.push(s);
          }
        }
        setSongs(unique);
        if (!currentSong && unique.length > 0) {
          const firstSong = unique[0];
          setCurrentSong(firstSong);
          setDurationSec(firstSong.durationSec || 45);
          if (!firstSong.isYouTube) {
            audioRef.current.src = firstSong.audioUrl;
          }
        }
      }
    } catch (err) {
      console.error("Failed to load songs from API:", err);
    }
  };

  // Playlist state
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);

  // Artist state
  const [artists, setArtists] = useState([]);
  const [selectedArtistData, setSelectedArtistData] = useState(null);

  const fetchPlaylists = async () => {
    try {
      const res = await fetch("/api/playlists");
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        setPlaylists(data.data);
      }
    } catch (err) {
      console.error("Failed to load playlists:", err);
    }
  };

  const fetchArtists = async () => {
    try {
      const res = await fetch("/api/artists");
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        setArtists(data.data);
      }
    } catch (err) {
      console.error("Failed to load artists:", err);
    }
  };

  const fetchYtTrending = async () => {
    try {
      const res = await fetch("/api/youtube/trending?region=VN&max=16");
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        setYtTrendingSongs(data.data);
      }
    } catch (e) {
      console.warn("Could not load YouTube trending:", e);
    }
  };

  // Fetch Personalized Recommendations
  const fetchRecommendations = async () => {
    try {
      setLoadingRecs(true);
      const token = localStorage.getItem('zingify_token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/users/recommendations', { headers });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success && data.data) {
        setRecommendations(data.data);
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoadingRecs(false);
    }
  };

  // Verify stored JWT session
  const checkCurrentUser = async () => {
    const token = localStorage.getItem('zingify_token');
    if (!token) {
      fetchRecommendations();
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.success && data.user) {
        setCurrentUser(data.user);
      } else {
        localStorage.removeItem('zingify_token');
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Session check error:', err);
    } finally {
      fetchRecommendations();
    }
  };

  const handleAuthSuccess = (user, token) => {
    setCurrentUser(user);
    setToastMessage(`Xin chào, ${user.name}! Đã kích hoạt đề xuất cá nhân hoá`);
    setTimeout(() => setToastMessage(""), 3500);
    fetchRecommendations();
  };

  const handleLogout = () => {
    localStorage.removeItem('zingify_token');
    setCurrentUser(null);
    setToastMessage("Đã đăng xuất tài khoản thành công");
    setTimeout(() => setToastMessage(""), 3000);
    fetchRecommendations();
  };

  // Track playback to update watch/listen statistics in account
  const trackSongListen = (song) => {
    const token = localStorage.getItem('zingify_token');
    if (!token || !song) return;

    const yId = song.youtubeId || (typeof song.id === 'string' && song.id.startsWith('yt_') ? song.id.replace('yt_', '') : null);
    const sId = !yId && song.id && !String(song.id).startsWith('rec_') && !String(song.id).startsWith('hist_') ? song.id : null;

    fetch('/api/auth/track-listen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        songId: sId,
        youtubeId: yId,
        title: song.title,
        artist: song.artist,
        cover: song.cover,
        genre: song.genre || 'Pop',
        duration: song.duration,
        durationSec: song.durationSec,
        isYouTube: song.isYouTube !== false || !!yId
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.success) {
        // Silently refresh recommendations in background
        fetchRecommendations();
      }
    })
    .catch(err => console.warn('Track listen warn:', err.message));
  };

  useEffect(() => {
    fetchSongs();
    fetchPlaylists();
    fetchArtists();
    fetchYtTrending();
    checkCurrentUser();
  }, []);

  // Live YouTube search debounce effect
  useEffect(() => {
    if (!searchTerm || !searchTerm.trim()) {
      setYtSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingYt(true);
      try {
        const res = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchTerm.trim())}&max=12`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data)) {
          setYtSearchResults(data.data);
        }
      } catch (err) {
        console.error("Live YT Search Error:", err);
      } finally {
        setIsSearchingYt(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectArtist = async (artistObj) => {
    try {
      const res = await fetch(`/api/artists/${artistObj.id || artistObj._id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setSelectedArtistData(data.data);
      } else {
        setSelectedArtistData({ artist: artistObj, songs: songs.filter(s => s.artist === artistObj.name) });
      }
    } catch (err) {
      setSelectedArtistData({ artist: artistObj, songs: songs.filter(s => s.artist === artistObj.name) });
    }
    handleTabChange("artist");
  };

  const handleSelectPlaylist = (playlist) => {
    setSelectedPlaylist(playlist);
    handleTabChange("playlist");
  };

  const handleTogglePinPlaylist = async (playlistId) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}/pin`, { method: "POST" });
      const data = await res.json();
      if (data.success && data.data) {
        setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, isPinned: data.data.isPinned } : p).sort((a, b) => b.isPinned - a.isPinned));
        if (selectedPlaylist && selectedPlaylist.id === playlistId) {
          setSelectedPlaylist(prev => ({ ...prev, isPinned: data.data.isPinned }));
        }
        setToastMessage(data.message);
        setTimeout(() => setToastMessage(""), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePlaylistSuccess = (newPlaylist) => {
    setPlaylists(prev => [newPlaylist, ...prev]);
    setSelectedPlaylist(newPlaylist);
    handleTabChange("playlist");
    setToastMessage(`Đã tạo Playlist "${newPlaylist.title}" thành công!`);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleAddSongToPlaylist = async (playlistId, songId) => {
    try {
      const res = await fetch(`/api/playlists/${playlistId}/songs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setPlaylists(prev => prev.map(p => p.id === playlistId ? data.data : p));
        if (selectedPlaylist && selectedPlaylist.id === playlistId) {
          setSelectedPlaylist(data.data);
        }
        setToastMessage(data.message);
        setTimeout(() => setToastMessage(""), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa Playlist này khỏi thư viện?")) return;
    try {
      const res = await fetch(`/api/playlists/${playlistId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setPlaylists(prev => prev.filter(p => p.id !== playlistId));
        setSelectedPlaylist(null);
        handleGoHome();
        setToastMessage("Đã xóa Playlist thành công!");
        setTimeout(() => setToastMessage(""), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Standard HTML5 Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      if (!currentSong?.isYouTube) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (!currentSong?.isYouTube && audio.duration && !isNaN(audio.duration)) {
        const dur = Math.floor(audio.duration);
        setDurationSec(dur);
        updateSongDuration(currentSong?.id, dur);
      }
    };

    const handleEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        safePlayAudio();
      } else {
        handleNext();
      }
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentSong, isRepeat, songs]);

  // Dynamic Duration Updater for active song
  const updateSongDuration = (songId, durationInSeconds) => {
    if (!songId || !durationInSeconds) return;
    const formatted = formatTimeStr(durationInSeconds);
    setSongs(prev => prev.map(s => s.id === songId ? { ...s, durationSec: Math.floor(durationInSeconds), duration: formatted } : s));
    if (currentSong && currentSong.id === songId) {
      setCurrentSong(prev => ({ ...prev, durationSec: Math.floor(durationInSeconds), duration: formatted }));
    }
  };

  // Sync Audio Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Safe HTML5 Audio Play
  const safePlayAudio = () => {
    if (!audioRef.current.src && currentSong && !currentSong.isYouTube) {
      audioRef.current.src = currentSong.audioUrl;
    }
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch(err => {
          console.log("Autoplay restriction:", err);
          setIsPlaying(false);
        });
    }
  };

  const safePauseAudio = () => {
    try {
      audioRef.current.pause();
      setIsPlaying(false);
    } catch (e) {}
  };

  // Đưa bài hát vừa chọn lên vị trí đầu tiên (ở trước các bài khác) & loại bỏ trùng lặp
  const promoteSongToTop = (song) => {
    if (!song) return;
    setSongs(prev => {
      const targetId = song.id;
      const targetYt = song.youtubeId;
      const normTitle = (song.title || "").trim().toLowerCase();
      const normArtist = (song.artist || "").trim().toLowerCase();

      const matchesSong = (s) => {
        if (!s) return false;
        if (targetId && s.id === targetId) return true;
        if (targetYt && s.youtubeId === targetYt) return true;
        const sTitle = (s.title || "").trim().toLowerCase();
        const sArtist = (s.artist || "").trim().toLowerCase();
        if (normTitle && sTitle === normTitle && normArtist && sArtist === normArtist) return true;
        return false;
      };

      // Tìm thông tin bài hát hiện có để giữ lại data đầy đủ nhất
      const existing = prev.find(matchesSong);

      const songToPlace = existing 
        ? { ...existing, ...song, lastPlayedAt: new Date().toISOString() } 
        : { ...song, lastPlayedAt: new Date().toISOString() };

      // Lọc bỏ tất cả bản sao của bài hát này trong danh sách còn lại
      const remaining = prev.filter(s => !matchesSong(s));

      return [songToPlace, ...remaining];
    });

    // Đồng bộ thời điểm nghe lên backend MongoDB Atlas
    fetch("/api/songs/record-play", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: song.id,
        youtubeId: song.youtubeId,
        title: song.title,
        artist: song.artist
      })
    }).catch(() => {});
  };

  // Handle Play Song
  const handlePlaySong = (song) => {
    // Đưa bài hát lên đầu danh sách ngay khi nghe
    promoteSongToTop(song);

    if (currentSong && currentSong.id === song.id) {
      if (isPlaying) {
        if (!song.isYouTube) safePauseAudio();
        else setIsPlaying(false);
      } else {
        if (!song.isYouTube) safePlayAudio();
        else setIsPlaying(true);
      }
    } else {
      safePauseAudio();
      setCurrentSong(song);
      setCurrentTime(0);
      setSeekTargetTime(null);
      setDurationSec(song.durationSec || 45);

      if (song.isYouTube) {
        setIsPlaying(true);
      } else {
        audioRef.current.src = song.audioUrl;
        safePlayAudio();
      }

      // Track playback statistics in user account
      trackSongListen(song);
    }
  };

  const handleTogglePlay = () => {
    if (!currentSong) return;
    if (isPlaying) {
      if (!currentSong.isYouTube) safePauseAudio();
      else setIsPlaying(false);
    } else {
      if (!currentSong.isYouTube) safePlayAudio();
      else setIsPlaying(true);
    }
  };

  // YouTube error fallback
  const handleYtErrorFallback = () => {
    if (currentSong) {
      audioRef.current.src = "/uploads/cat_doi_noi_sau.wav";
      safePlayAudio();
    }
  };

  // Instant 1-Click Play & Background Auto-Save (0ms Delay)
  const handlePlayYouTubeTrack = (track) => {
    const vId = track.videoId || track.youtubeId || track.id;
    if (!vId) return;

    // 1. INSTANT ZERO-DELAY PLAYBACK: Play immediately without waiting for server response
    const activeTrack = {
      id: `yt_${vId}`,
      title: track.title,
      artist: track.artist || track.channelTitle || "YouTube Artist",
      cover: track.cover || `https://img.youtube.com/vi/${vId}/hqdefault.jpg`,
      youtubeId: vId,
      isYouTube: true,
      duration: track.duration || "03:45",
      durationSec: track.durationSec || 225,
      lyrics: []
    };

    handlePlaySong(activeTrack);
    setToastMessage(`🎶 Đang phát: "${track.title}"`);
    setTimeout(() => setToastMessage(""), 2500);

    // 2. BACKGROUND SYNC: Save to MongoDB Atlas & fetch lyrics silently in background
    fetch("/api/youtube/play-or-create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId: vId,
        title: track.title,
        artist: track.artist || track.channelTitle,
        cover: track.cover,
        duration: track.duration,
        durationSec: track.durationSec
      })
    })
    .then(res => res.json())
    .then(result => {
      if (result && result.success && result.data) {
        const songDoc = result.data;
        // Seamlessly update active lyrics and metadata without restarting audio
        setCurrentSong(prev => (prev?.youtubeId === vId ? { ...prev, ...songDoc, isYouTube: true } : prev));
        // Add to library at top without duplication
        setSongs(prev => {
          const remaining = prev.filter(s => 
            s.id !== songDoc.id && 
            s.youtubeId !== songDoc.youtubeId && 
            !(s.title?.trim().toLowerCase() === songDoc.title?.trim().toLowerCase() && s.artist?.trim().toLowerCase() === songDoc.artist?.trim().toLowerCase())
          );
          return [songDoc, ...remaining];
        });
      }
    })
    .catch(err => console.warn("Background sync warning:", err.message));
  };

  // Next / Prev Song (with Smart Continuous YouTube Autoplay)
  const handleNext = () => {
    if (songs.length === 0) {
      if (ytTrendingSongs.length > 0) {
        handlePlayYouTubeTrack(ytTrendingSongs[0]);
      }
      return;
    }
    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * songs.length);
    } else {
      const currentIndex = songs.findIndex(s => s.id === currentSong?.id);
      nextIndex = (currentIndex + 1) % songs.length;

      // If finished local songs and have trending YouTube music, autoplay fresh YouTube track
      if (currentIndex === songs.length - 1 && ytTrendingSongs.length > 0) {
        const freshYt = ytTrendingSongs.find(t => !songs.some(s => s.youtubeId === (t.videoId || t.id)));
        if (freshYt) {
          handlePlayYouTubeTrack(freshYt);
          return;
        }
      }
    }
    handlePlaySong(songs[nextIndex]);
  };

  const handlePrev = () => {
    if (songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === currentSong?.id);
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    handlePlaySong(songs[prevIndex]);
  };

  // Handle Seeking
  const handleSeek = (newTime) => {
    setCurrentTime(newTime);
    if (currentSong?.isYouTube) {
      setSeekTargetTime(newTime);
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = newTime;
      }
    }
  };

  // Toggle Like via API
  const handleToggleLike = async (songId) => {
    try {
      const res = await fetch(`/api/songs/${songId}/like`, { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success) {
        setSongs(prev => prev.map(s => s.id === songId ? { ...s, isLiked: data.isLiked } : s));
        if (currentSong && currentSong.id === songId) {
          setCurrentSong(prev => ({ ...prev, isLiked: data.isLiked }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3-dots Menu Handlers
  const handleOpenEditSong = (song) => {
    setEditingSongTarget(song);
    setShowEditSongModal(true);
  };

  const handleSongSaveSuccess = (updatedSong) => {
    setSongs(prev => prev.map(s => s.id === updatedSong.id ? updatedSong : s));
    if (currentSong && currentSong.id === updatedSong.id) {
      setCurrentSong(updatedSong);
    }
    setToastMessage(`Đã cập nhật bài hát "${updatedSong.title}" vào cơ sở dữ liệu!`);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleOpenEditPlaylist = (playlist) => {
    setEditingPlaylistTarget(playlist);
    setShowEditPlaylistModal(true);
  };

  const handlePlaylistSaveSuccess = (updatedPlaylist) => {
    setPlaylists(prev => prev.map(p => (p.id === updatedPlaylist.id || p._id === updatedPlaylist._id) ? updatedPlaylist : p));
    if (selectedPlaylist && (selectedPlaylist.id === updatedPlaylist.id || selectedPlaylist._id === updatedPlaylist._id)) {
      setSelectedPlaylist(updatedPlaylist);
    }
    setToastMessage(`Đã cập nhật Playlist "${updatedPlaylist.title}"!`);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleOpenEditArtist = () => {
    if (selectedArtistData && selectedArtistData.artist) {
      setEditingArtistTarget(selectedArtistData.artist);
      setShowEditArtistModal(true);
    }
  };

  const handleArtistSaveSuccess = (updatedArtist) => {
    setArtists(prev => prev.map(a => (a.id === updatedArtist.id || a._id === updatedArtist._id) ? updatedArtist : a));
    if (selectedArtistData && selectedArtistData.artist && (selectedArtistData.artist.id === updatedArtist.id || selectedArtistData.artist._id === updatedArtist._id)) {
      setSelectedArtistData(prev => ({
        ...prev,
        artist: updatedArtist
      }));
    }
    fetchSongs();
    setToastMessage(`Đã cập nhật thông tin nghệ sĩ "${updatedArtist.name}"!`);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleDeleteArtist = async (artistToDelete) => {
    try {
      const targetId = artistToDelete.id || artistToDelete._id;
      const res = await fetch(`/api/artists/${targetId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setArtists(prev => prev.filter(a => (a.id || a._id) !== targetId));
        if (selectedArtistData && (selectedArtistData.artist?.id === targetId || selectedArtistData.artist?._id === targetId)) {
          setSelectedArtistData(null);
          handleGoHome();
        }
        setToastMessage(`Đã xóa nghệ sĩ "${artistToDelete.name}" thành công!`);
        setTimeout(() => setToastMessage(""), 3500);
      }
    } catch (err) {
      console.error("Delete artist error:", err);
    }
  };

  const handleDeleteSong = async (song) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài hát "${song.title}" khỏi thư viện?`)) return;
    try {
      const res = await fetch(`/api/songs/${song.id}`, { method: "DELETE" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setSongs(prev => prev.filter(s => s.id !== song.id));
        if (currentSong && currentSong.id === song.id) {
          const remaining = songs.filter(s => s.id !== song.id);
          if (remaining.length > 0) handlePlaySong(remaining[0]);
          else setCurrentSong(null);
        }
        setToastMessage(`Đã xóa bài hát "${song.title}" khỏi MongoDB!`);
        setTimeout(() => setToastMessage(""), 3500);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleShareSong = (song) => {
    const shareUrl = `${window.location.origin}/?songId=${song.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setToastMessage(`Đã sao chép liên kết bài hát: "${song.title}" vào bộ nhớ tạm!`);
      setTimeout(() => setToastMessage(""), 3500);
    }
  };

  // Upload callback
  const handleUploadSuccess = (newSong) => {
    setSongs(prev => [newSong, ...prev]);
    handlePlaySong(newSong);
  };

  // Filtered Songs
  // Filtered Songs
  const getFilteredSongs = () => {
    let list = Array.isArray(songs) ? [...songs] : [];
    if (searchTerm && searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(s => {
        if (!s) return false;
        const title = (s.title || "").toLowerCase();
        const artist = (s.artist || "").toLowerCase();
        const genre = (s.genre || "").toLowerCase();
        return title.includes(q) || artist.includes(q) || genre.includes(q);
      });
    }

    if (activeTab === "favorites") {
      list = list.filter(s => s && s.isLiked);
    }

    if (selectedGenre !== "All") {
      const target = (selectedGenre || "").toLowerCase();
      list = list.filter(s => {
        if (!s) return false;
        const g = (s.genre || "").toLowerCase();
        return g.includes(target) || target.includes(g);
      });
    }

    // Đảm bảo không trùng lặp: Mỗi bài hát chỉ hiển thị đúng 1 lần
    const unique = [];
    const seen = new Set();
    for (const song of list) {
      if (!song) continue;
      const title = (song.title || "").trim().toLowerCase();
      const artist = (song.artist || "").trim().toLowerCase();
      const key = song.youtubeId 
        ? `yt_${song.youtubeId}` 
        : `t_${title}_${artist}`;
      const sid = song.id ? String(song.id) : null;
      if (!seen.has(key) && (!sid || !seen.has(sid))) {
        seen.add(key);
        if (sid) seen.add(sid);
        unique.push(song);
      }
    }

    return unique;
  };

  const filteredSongs = getFilteredSongs();
  const likedSongsCount = songs.filter(s => s.isLiked).length;

  const moodFilters = [
    { id: "All", label: "✨ Tất Cả" },
    { id: "Pop", label: "🔥 Pop / V-Pop" },
    { id: "Ballad", label: "🌙 Chill & Ballad" },
    { id: "Remix", label: "⚡ EDM / Remix" },
    { id: "Rap", label: "🎤 Rap / HipHop" }
  ];

  return (
    <div className={`app-container ${isChillMode ? 'chill-mode-active' : ''}`}>
      {/* Bầu trời sao đêm & sao băng rơi (Chill Mode Canvas Engine) */}
      <ChillStarryCanvas isChillMode={isChillMode} isPlaying={isPlaying} />

      {/* YouTube Vinyl Record Disk Player */}
      {currentSong?.isYouTube && currentSong.youtubeId && (
        <YouTubePlayer 
          youtubeId={currentSong.youtubeId}
          coverUrl={currentSong.cover}
          isPlaying={isPlaying}
          volume={volume}
          seekTargetTime={seekTargetTime}
          onStateChange={(playing) => setIsPlaying(playing)}
          onTimeUpdate={(time) => setCurrentTime(time)}
          onDurationChange={(dur) => {
            setDurationSec(Math.floor(dur));
            updateSongDuration(currentSong.id, dur);
          }}
          onEnded={handleNext}
          onErrorFallback={handleYtErrorFallback}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onGoHome={handleGoHome}
        likedCount={likedSongsCount}
        totalSongs={songs.length}
        playlists={playlists}
        artists={artists}
        selectedPlaylistId={selectedPlaylist?.id}
        selectedArtistId={selectedArtistData?.artist?.id}
        onSelectPlaylist={handleSelectPlaylist}
        onSelectArtist={handleSelectArtist}
        onOpenCreatePlaylist={() => setShowCreatePlaylistModal(true)}
        onTogglePinPlaylist={handleTogglePinPlaylist}
        onOpenUpload={() => setShowUpload(true)}
      />

      {/* Header */}
      <Header 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onOpenUpload={() => setShowUpload(true)}
        canGoBack={navIndex > 0}
        canGoForward={navIndex < navHistory.length - 1}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        currentUser={currentUser}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onSelectRecommendationsTab={() => handleTabChange("recommendations")}
        isChillMode={isChillMode}
        onToggleChillMode={() => {
          setIsChillMode(prev => {
            const next = !prev;
            setToastMessage(next ? "🌌 Đã bật Chế độ Chill: Bầu trời sao đêm & sao băng rơi" : "🌙 Đã tắt Chế độ Chill");
            setTimeout(() => setToastMessage(""), 3000);
            return next;
          });
        }}
      />

      {/* Main View Area */}
      <main className="app-main">
        {/* Tab 1: Discover */}
        {activeTab === "discover" && !searchTerm && (
          <>
            {/* Hero Banner - Featured Music Showcase */}
            <div className="hero-banner">
              <div className="hero-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: "0.75rem", background: "rgba(0, 242, 254, 0.15)", border: "1px solid rgba(0, 242, 254, 0.3)", color: "#00f2fe", padding: "4px 12px", borderRadius: "14px", fontWeight: 700, letterSpacing: "0.8px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Volume2 size={13} color="#00f2fe" /> BÀI HÁT NỔI BẬT KHUYÊN NGHE
                  </span>
                </div>

                <h1>{currentSong ? currentSong.title : "Âm Thầm Bên Em"}</h1>
                <p>Thưởng thức giai điệu âm thanh sống động mượt mà với chất lượng cao trên Zingify Music.</p>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button 
                    className="btn-primary"
                    onClick={() => songs.length > 0 && handlePlaySong(currentSong || songs[0])}
                  >
                    <Play size={18} fill="#08090e" /> {isPlaying ? "Đang Phát Nhạc" : "Nghe Nhạc Ngay"}
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={() => setActiveTab("lyrics")}
                  >
                    <Sparkles size={16} color="#00f5d4" /> Lời Bài Hát (Karaoke)
                  </button>
                </div>
              </div>

              {/* Glowing Vinyl Album Cover Disk */}
              <div style={{ position: 'relative', width: '145px', height: '145px', flexShrink: 0 }}>
                <img 
                  src={currentSong?.cover || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80"}
                  alt="Cover"
                  className={`track-disk ${isPlaying ? 'playing' : ''}`}
                  style={{ width: '145px', height: '145px', borderRadius: '50%', boxShadow: '0 0 30px rgba(0, 242, 254, 0.4)', border: '2px solid rgba(0, 242, 254, 0.6)' }}
                />
              </div>
            </div>

            {/* Quick Mood / Genre Filter Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', margin: '8px 0 12px 0' }}>
              {moodFilters.map(filter => {
                const isActive = selectedGenre === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => {
                      setSelectedGenre(filter.id);
                      if (filter.id === "Ballad") {
                        setIsChillMode(true);
                        setToastMessage("🌌 Đã kích hoạt Mode Chill: Bầu trời sao đêm & sao băng rơi");
                        setTimeout(() => setToastMessage(""), 3000);
                      }
                    }}
                    style={{
                      height: "38px",
                      padding: "0 22px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "20px",
                      border: isActive ? "1px solid #00f2fe" : "1px solid var(--border-color)",
                      background: isActive ? "linear-gradient(135deg, rgba(0, 242, 254, 0.22), rgba(0, 245, 212, 0.12))" : "rgba(255, 255, 255, 0.05)",
                      color: isActive ? "#00f2fe" : "var(--text-muted)",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      boxShadow: isActive ? "0 0 15px rgba(0, 242, 254, 0.25)" : "none",
                      transition: "all 0.25s ease",
                      boxSizing: "border-box"
                    }}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            {/* Trending Cards Section */}
            <div>
              <div className="section-header">
                <h3 className="section-title">
                  <Sparkles color="var(--accent-secondary)" /> 
                  {selectedGenre === "All" ? "Bài Hát Nổi Bật" : `Thể Loại: ${selectedGenre}`}
                </h3>
              </div>

              <div className="cards-grid">
                {filteredSongs.map(song => (
                  <SongCard 
                    key={song.id}
                    song={song}
                    currentSong={currentSong}
                    isPlaying={isPlaying}
                    onPlay={handlePlaySong}
                    onToggleLike={handleToggleLike}
                  />
                ))}
              </div>
            </div>

            {/* 🔥 NGHE LẠI NHIỀU NHẤT (Dựa trên lịch sử xem của tài khoản) */}
            {recommendations?.mostPlayed?.length > 0 && (
              <div style={{ margin: "24px 0" }}>
                <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 className="section-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "8px", background: "linear-gradient(135deg, #ff4e50, #f9d423)" }}>
                      <Flame size={14} color="#fff" />
                    </span>
                    <span style={{ background: "linear-gradient(90deg, #ff6b6b, #fca5a5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800 }}>
                      Nghe Lại Nhiều Nhất
                    </span>
                    <span style={{ fontSize: "0.68rem", background: "rgba(255, 78, 80, 0.15)", color: "#ff6b6b", border: "1px solid rgba(255, 78, 80, 0.4)", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                      {currentUser ? `Dành riêng cho ${currentUser.name}` : 'Lịch sử xem của bạn'}
                    </span>
                  </h3>
                  <button 
                    className="btn-secondary"
                    onClick={() => handleTabChange("recommendations")}
                    style={{ fontSize: "0.8rem", padding: "6px 14px", border: "1px solid rgba(0, 242, 254, 0.4)", color: "#00f2fe" }}
                  >
                    Xem Toàn Bộ Đề Xuất →
                  </button>
                </div>

                <div className="cards-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                  {recommendations.mostPlayed.slice(0, 6).map((track, idx) => {
                    const vId = track.youtubeId;
                    const isThisPlaying = currentSong && (
                      (vId && currentSong.youtubeId === vId) ||
                      (currentSong.id === track.id)
                    ) && isPlaying;

                    return (
                      <div 
                        key={track.id || idx}
                        onClick={() => {
                          if (track.isYouTube || vId) {
                            handlePlayYouTubeTrack(track);
                          } else {
                            handlePlaySong(track);
                          }
                        }}
                        style={{
                          background: isThisPlaying ? "rgba(255, 78, 80, 0.15)" : "rgba(24, 26, 38, 0.75)",
                          border: isThisPlaying ? "1px solid #ff4e50" : "1px solid var(--border-color)",
                          borderRadius: "14px",
                          padding: "12px",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          transition: "all 0.25s ease",
                          boxShadow: isThisPlaying ? "0 0 18px rgba(255, 78, 80, 0.3)" : "none"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.borderColor = "#00f2fe";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.borderColor = isThisPlaying ? "#ff4e50" : "var(--border-color)";
                        }}
                      >
                        <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: "10px", overflow: "hidden", background: "#000" }}>
                          <img 
                            src={track.cover || `https://img.youtube.com/vi/${vId}/hqdefault.jpg`} 
                            alt={track.title}
                            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
                            loading="lazy"
                          />
                          <div style={{
                            position: "absolute",
                            top: "6px",
                            left: "6px",
                            background: "rgba(0, 0, 0, 0.8)",
                            color: "#ff6b6b",
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            padding: "2px 7px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px"
                          }}>
                            <Flame size={11} color="#ff4e50" />
                            <span>{track.playCount ? `Đã xem ${track.playCount} lần` : 'Đã xem'}</span>
                          </div>
                          {track.duration && (
                            <span style={{ position: "absolute", bottom: "6px", right: "6px", background: "rgba(0,0,0,0.8)", color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>
                              {track.duration}
                            </span>
                          )}
                        </div>

                        <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: isThisPlaying ? "#00f2fe" : "#fff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={track.title}>
                          {track.title}
                        </h4>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px" }}>
                            {track.artist}
                          </span>
                          <span style={{ fontSize: "0.68rem", color: "#00f2fe", background: "rgba(0, 242, 254, 0.12)", padding: "1px 6px", borderRadius: "4px" }}>
                            Phát Lại
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 🔥 YouTube Trending Music Section (Online Music Hub) */}
            {ytTrendingSongs.length > 0 && (
              <div style={{ margin: "24px 0" }}>
                <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <h3 className="section-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "22px", height: "22px", borderRadius: "50%", background: "#ff0000" }}>
                      <Play size={11} fill="#fff" color="#fff" style={{ marginLeft: "1px" }} />
                    </span>
                    <span style={{ background: "linear-gradient(90deg, #ff4e50, #f9d423)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800 }}>
                      🔥 Thịnh Hành YouTube Music Việt Nam
                    </span>
                    <span style={{ fontSize: "0.68rem", background: "rgba(255,0,0,0.15)", color: "#ff4e50", border: "1px solid rgba(255,0,0,0.3)", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                      LIVE V3
                    </span>
                  </h3>
                  <button 
                    className="btn-secondary"
                    onClick={() => handleTabChange("youtube")}
                    style={{ fontSize: "0.8rem", padding: "6px 14px", border: "1px solid rgba(255,0,0,0.4)", color: "#ff4e50" }}
                  >
                    Khám Phá Toàn Bộ YouTube →
                  </button>
                </div>

                <div className="cards-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                  {ytTrendingSongs.slice(0, 8).map(track => {
                    const vId = track.videoId || track.youtubeId || track.id;
                    const isThisPlaying = (currentSong?.youtubeId === vId && isPlaying);
                    return (
                      <div 
                        key={vId}
                        onClick={() => handlePlayYouTubeTrack(track)}
                        style={{
                          background: isThisPlaying ? "rgba(255, 0, 0, 0.15)" : "rgba(24, 26, 38, 0.75)",
                          borderRadius: "14px",
                          border: isThisPlaying ? "1px solid #ff0000" : "1px solid var(--border-color)",
                          padding: "12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          cursor: "pointer",
                          transition: "all 0.25s ease",
                          boxShadow: isThisPlaying ? "0 0 15px rgba(255,0,0,0.35)" : "none"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.borderColor = "#ff4e50";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.borderColor = isThisPlaying ? "#ff0000" : "var(--border-color)";
                        }}
                      >
                        <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: "10px", overflow: "hidden", background: "#000" }}>
                          <img 
                            src={track.cover || `https://img.youtube.com/vi/${vId}/hqdefault.jpg`} 
                            alt={track.title}
                            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
                            loading="lazy"
                          />
                          {track.duration && (
                            <span style={{ position: "absolute", bottom: "6px", right: "6px", background: "rgba(0,0,0,0.8)", color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>
                              {track.duration}
                            </span>
                          )}
                          <div style={{
                            position: "absolute",
                            top: 0, left: 0, width: "100%", height: "100%",
                            background: "rgba(0,0,0,0.3)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            opacity: isThisPlaying ? 1 : 0,
                            transition: "opacity 0.2s ease"
                          }}
                          className="hover-play-overlay"
                          >
                            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "linear-gradient(135deg, #ff0000, #ff4e50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Play size={18} fill="#fff" color="#fff" style={{ marginLeft: "2px" }} />
                            </div>
                          </div>
                        </div>

                        <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: isThisPlaying ? "#ff4e50" : "#fff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={track.title}>
                          {track.title}
                        </h4>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px" }}>
                            {track.channelTitle || track.artist}
                          </span>
                          <span style={{ fontSize: "0.68rem", color: "#ff4e50", background: "rgba(255,0,0,0.12)", padding: "1px 6px", borderRadius: "4px" }}>
                            Phát Ngay
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Songs Table */}
            <div>
              <div className="section-header">
                <h3 className="section-title">
                  🎵 Thư Viện Tất Cả Bài Hát ({filteredSongs.length})
                </h3>
                {filteredSongs.length > 0 && (
                  <button 
                    className="btn-secondary"
                    onClick={() => handlePlaySong(filteredSongs[0])}
                    style={{ fontSize: "0.8rem", padding: "6px 14px" }}
                  >
                    <Play size={14} fill="currentColor" /> Phát Tất Cả
                  </button>
                )}
              </div>
              <SongList 
                songs={filteredSongs}
                currentSong={currentSong}
                isPlaying={isPlaying}
                onPlay={handlePlaySong}
                onToggleLike={handleToggleLike}
                onOpenEditSong={handleOpenEditSong}
                onShareSong={handleShareSong}
                onDeleteSong={handleDeleteSong}
                onAddSongToPlaylist={handleAddSongToPlaylist}
                playlists={playlists}
              />
            </div>
          </>
        )}

        {/* Tab: Personalized Recommendations */}
        {activeTab === "recommendations" && !searchTerm && (
          <RecommendationsView 
            currentUser={currentUser}
            recommendations={recommendations}
            loading={loadingRecs}
            onRefresh={fetchRecommendations}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlaySong={handlePlaySong}
            onPlayYouTubeTrack={handlePlayYouTubeTrack}
            onOpenAuthModal={() => setShowAuthModal(true)}
          />
        )}

        {/* Tab: YouTube Music Discovery Hub */}
        {activeTab === "youtube" && !searchTerm && (
          <YouTubeMusicView 
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlayYouTubeTrack={handlePlayYouTubeTrack}
          />
        )}

        {/* Tab 2: Top Charts */}
        {activeTab === "charts" && (
          <TopCharts 
            songs={songs}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlay={handlePlaySong}
          />
        )}

        {/* Tab 3: Fullscreen Lyrics Page */}
        {activeTab === "lyrics" && (
          <FullLyricsView 
            currentSong={currentSong}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onNext={handleNext}
            onPrev={handlePrev}
            currentTime={currentTime}
            durationSec={durationSec}
            onSeek={handleSeek}
            volume={volume}
            onVolumeChange={setVolume}
            isShuffle={isShuffle}
            onToggleShuffle={() => setIsShuffle(!isShuffle)}
            isRepeat={isRepeat}
            onToggleRepeat={() => setIsRepeat(!isRepeat)}
            onSongUpdate={(updatedSong) => {
              setSongs(prev => prev.map(s => s.id === updatedSong.id ? updatedSong : s));
              setCurrentSong(updatedSong);
            }}
          />
        )}

        {/* Tab 4: Genres */}
        {activeTab === "genres" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
            <GenreGrid onSelectGenre={(g) => setSelectedGenre(g)} />
            
            {selectedGenre !== "All" && (
              <div>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "16px", color: "var(--accent-secondary)" }}>
                  Thể Loại: {selectedGenre} ({filteredSongs.length} bài)
                </h3>
                <SongList 
                  songs={filteredSongs}
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  onPlay={handlePlaySong}
                  onToggleLike={handleToggleLike}
                  onOpenEditSong={handleOpenEditSong}
                  onShareSong={handleShareSong}
                  onDeleteSong={handleDeleteSong}
                  onAddSongToPlaylist={handleAddSongToPlaylist}
                  playlists={playlists}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Favorites */}
        {activeTab === "favorites" && (
          <div>
            <div className="section-header">
              <h3 className="section-title">
                <Heart color="#ff2a74" fill="#ff2a74" /> Danh Sách Nhạc Yêu Thích ({filteredSongs.length})
              </h3>
            </div>
            {filteredSongs.length === 0 ? (
              <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
                <p style={{ fontSize: "1.2rem" }}>Bạn chưa thích bài hát nào.</p>
                <p style={{ fontSize: "0.9rem", marginTop: "8px" }}>Hãy nhấp vào biểu tượng trái tim ở bất kỳ bài hát nào để thêm vào đây!</p>
              </div>
            ) : (
              <SongList 
                songs={filteredSongs}
                currentSong={currentSong}
                isPlaying={isPlaying}
                onPlay={handlePlaySong}
                onToggleLike={handleToggleLike}
                onOpenEditSong={handleOpenEditSong}
                onShareSong={handleShareSong}
                onDeleteSong={handleDeleteSong}
                onAddSongToPlaylist={handleAddSongToPlaylist}
                playlists={playlists}
              />
            )}
          </div>
        )}

        {/* Tab 6: Custom Playlist View */}
        {activeTab === "playlist" && selectedPlaylist && (
          <PlaylistView 
            playlist={selectedPlaylist}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlay={handlePlaySong}
            onToggleLike={handleToggleLike}
            onOpenEditSong={handleOpenEditSong}
            onShareSong={handleShareSong}
            onDeleteSong={handleDeleteSong}
            onTogglePinPlaylist={handleTogglePinPlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            onOpenEditPlaylist={handleOpenEditPlaylist}
          />
        )}

        {/* Tab 7: Artist Profile View */}
        {activeTab === "artist" && selectedArtistData && (
          <ArtistView 
            artistData={selectedArtistData}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlay={handlePlaySong}
            onToggleLike={handleToggleLike}
            onOpenEditSong={handleOpenEditSong}
            onShareSong={handleShareSong}
            onDeleteSong={handleDeleteSong}
            onAddSongToPlaylist={handleAddSongToPlaylist}
            playlists={playlists}
            onOpenEditArtist={handleOpenEditArtist}
            onDeleteArtist={handleDeleteArtist}
          />
        )}

        {/* Search Results Filter (Dual: Local Library + Live YouTube Music) */}
        {searchTerm && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* 1. Local Library Results */}
            <div>
              <div className="section-header">
                <h3 className="section-title">
                  📁 Trong Thư Viện Của Bạn ({filteredSongs.length} bài)
                </h3>
              </div>
              {filteredSongs.length > 0 ? (
                <SongList 
                  songs={filteredSongs}
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  onPlay={handlePlaySong}
                  onToggleLike={handleToggleLike}
                  onOpenEditSong={handleOpenEditSong}
                  onShareSong={handleShareSong}
                  onDeleteSong={handleDeleteSong}
                  onAddSongToPlaylist={handleAddSongToPlaylist}
                  playlists={playlists}
                />
              ) : (
                <div style={{ padding: "16px 20px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", color: "var(--text-muted)", fontSize: "0.88rem", border: "1px dashed var(--border-color)" }}>
                  Chưa có bài hát này trong thư viện máy chủ. Đang tìm kiếm trực tiếp trên YouTube bên dưới!
                </div>
              )}
            </div>

            {/* 2. Live YouTube Online Search Results */}
            <div>
              <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h3 className="section-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "22px", height: "22px", borderRadius: "50%", background: "#ff0000" }}>
                    <Play size={10} fill="#fff" color="#fff" style={{ marginLeft: "1px" }} />
                  </span>
                  <span style={{ background: "linear-gradient(90deg, #ff4e50, #f9d423)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800 }}>
                    🎬 Kho Nhạc Trực Tuyến YouTube ({ytSearchResults.length} bài)
                  </span>
                  {isSearchingYt && <Loader2 size={16} color="#ff4e50" className="spin" />}
                </h3>
              </div>

              {isSearchingYt && ytSearchResults.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-muted)", padding: "24px 0" }}>
                  <Loader2 size={20} color="#ff0000" className="spin" />
                  <span>Đang tìm kiếm trực tiếp trên YouTube Data API v3...</span>
                </div>
              ) : ytSearchResults.length > 0 ? (
                <div className="cards-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "16px" }}>
                  {ytSearchResults.map(track => {
                    const vId = track.videoId || track.youtubeId || track.id;
                    const isThisPlaying = (currentSong?.youtubeId === vId && isPlaying);
                    return (
                      <div 
                        key={vId}
                        onClick={() => handlePlayYouTubeTrack(track)}
                        style={{
                          background: isThisPlaying ? "rgba(255, 0, 0, 0.15)" : "rgba(24, 26, 38, 0.8)",
                          borderRadius: "14px",
                          border: isThisPlaying ? "1px solid #ff0000" : "1px solid var(--border-color)",
                          padding: "12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          cursor: "pointer",
                          transition: "all 0.25s ease",
                          boxShadow: isThisPlaying ? "0 0 15px rgba(255,0,0,0.35)" : "none"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.borderColor = "#ff4e50";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.borderColor = isThisPlaying ? "#ff0000" : "var(--border-color)";
                        }}
                      >
                        <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: "10px", overflow: "hidden", background: "#000" }}>
                          <img 
                            src={track.cover || `https://img.youtube.com/vi/${vId}/hqdefault.jpg`} 
                            alt={track.title}
                            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
                            loading="lazy"
                          />
                          {track.duration && (
                            <span style={{ position: "absolute", bottom: "6px", right: "6px", background: "rgba(0,0,0,0.8)", color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>
                              {track.duration}
                            </span>
                          )}
                          <div style={{
                            position: "absolute",
                            top: 0, left: 0, width: "100%", height: "100%",
                            background: "rgba(0,0,0,0.3)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            opacity: isThisPlaying ? 1 : 0,
                            transition: "opacity 0.2s ease"
                          }}
                          className="hover-play-overlay"
                          >
                            <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "linear-gradient(135deg, #ff0000, #ff4e50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Play size={18} fill="#fff" color="#fff" style={{ marginLeft: "2px" }} />
                            </div>
                          </div>
                        </div>

                        <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: isThisPlaying ? "#ff4e50" : "#fff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={track.title}>
                          {track.title}
                        </h4>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px" }}>
                            {track.channelTitle || track.artist}
                          </span>
                          <span style={{ fontSize: "0.68rem", color: "#ff4e50", background: "rgba(255,0,0,0.12)", padding: "1px 6px", borderRadius: "4px" }}>
                            Phát Ngay
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ color: "var(--text-muted)", fontSize: "0.88rem", padding: "10px 0" }}>
                  {isSearchingYt ? "Đang tìm kiếm..." : `Không tìm thấy thêm bài hát trên YouTube với từ khóa "${searchTerm}".`}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Sticky Player */}
      <PlayerBar 
        currentSong={currentSong}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        currentTime={currentTime}
        durationSec={durationSec}
        onSeek={handleSeek}
        volume={volume}
        onVolumeChange={setVolume}
        isShuffle={isShuffle}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        isRepeat={isRepeat}
        onToggleRepeat={() => setIsRepeat(!isRepeat)}
        onToggleLike={handleToggleLike}
        onOpenLyrics={() => setActiveTab("lyrics")}
        onToggleQueue={() => setShowQueue(!showQueue)}
      />

      {/* Modals */}
      {showLyricsModal && (
        <LyricsModal 
          currentSong={currentSong}
          currentTime={currentTime}
          onClose={() => setShowLyricsModal(false)}
        />
      )}

      {showUpload && (
        <UploadModal 
          onClose={() => setShowUpload(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {showCreatePlaylistModal && (
        <CreatePlaylistModal 
          onClose={() => setShowCreatePlaylistModal(false)}
          onCreateSuccess={handleCreatePlaylistSuccess}
        />
      )}

      {showQueue && (
        <QueueDrawer 
          queue={songs}
          currentSong={currentSong}
          isPlaying={isPlaying}
          onPlay={handlePlaySong}
          onClose={() => setShowQueue(false)}
        />
      )}

      {/* Edit Song Modal */}
      {showEditSongModal && editingSongTarget && (
        <EditSongModal 
          song={editingSongTarget}
          onClose={() => { setShowEditSongModal(false); setEditingSongTarget(null); }}
          onSaveSuccess={handleSongSaveSuccess}
        />
      )}

      {/* Edit Playlist Modal */}
      {showEditPlaylistModal && editingPlaylistTarget && (
        <EditPlaylistModal 
          playlist={editingPlaylistTarget}
          onClose={() => { setShowEditPlaylistModal(false); setEditingPlaylistTarget(null); }}
          onSaveSuccess={handlePlaylistSaveSuccess}
        />
      )}

      {/* Edit Artist Modal */}
      {showEditArtistModal && editingArtistTarget && (
        <EditArtistModal 
          artist={editingArtistTarget}
          onClose={() => { setShowEditArtistModal(false); setEditingArtistTarget(null); }}
          onSaveSuccess={handleArtistSaveSuccess}
          onDeleteSuccess={handleDeleteArtist}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: "fixed",
          bottom: "100px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(162, 56, 255, 0.95)",
          backdropFilter: "blur(12px)",
          color: "#fff",
          padding: "12px 24px",
          borderRadius: "30px",
          fontWeight: 600,
          fontSize: "0.92rem",
          boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          border: "1px solid rgba(255,255,255,0.2)"
        }}>
          <span>✨ {toastMessage}</span>
        </div>
      )}
    </div>
  );
}
