import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import axios from 'axios';
import { YoutubeTranscript } from 'youtube-transcript';
import { connectDB } from './config/db.js';
import {
  getYouTubeApiKey,
  getYouTubeVideoDetails,
  getYouTubePlaylistItems,
  getYouTubeTrendingMusic,
  searchYouTubeVideos,
  verifyYouTubeApiKey,
  extractPlaylistId
} from './config/youtube.js';
import Song from './models/Song.js';
import Playlist from './models/Playlist.js';
import Artist from './models/Artist.js';
import User from './models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import initialSongs from './data/songs.js';

// Helper: Find or Create Artist by name (Relational 1-N Model)
async function findOrCreateArtist(artistName, coverHint = null) {
  if (!artistName || !artistName.trim()) return null;
  const nameClean = artistName.trim();
  
  try {
    const escapedName = nameClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let artist = await Artist.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, 'i') }
    });

    if (!artist) {
      const avatarUrl = coverHint || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80';
      artist = await Artist.create({
        name: nameClean,
        avatar: avatarUrl,
        bio: `Nghệ sĩ ${nameClean} - Âm nhạc phát hành trên Zingify Music`
      });
      console.log(`[Artist DB] Auto Find-or-Create Artist document for: "${nameClean}"`);
    }

    return artist;
  } catch (err) {
    console.error(`findOrCreateArtist error for ${artistName}:`, err.message);
    return null;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas Database
connectDB().then(async () => {
  try {
    const count = await Song.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding initial songs to MongoDB Atlas...');
      await Song.insertMany(initialSongs);
      console.log('✅ Initial songs seeded to MongoDB Atlas successfully!');
    }
  } catch (err) {
    console.error('Seeding error:', err);
  }
});

// Check YouTube API Key Status
const initialYtKey = getYouTubeApiKey();
if (initialYtKey) {
  verifyYouTubeApiKey().then(res => {
    if (res.connected) {
      console.log(`🎬 YouTube Data API v3 Connected! (Key: ${res.apiKeyMasked})`);
    } else {
      console.log(`⚠️ YouTube Data API v3 Warning: ${res.error || res.message}`);
    }
  });
} else {
  console.log(`ℹ️ YouTube Data API Key chưa có trong .env (đang dùng fallback oEmbed). Thêm YOUTUBE_API_KEY để kích hoạt v3 API.`);
}

// Helper function to extract YouTube Video ID

// Helper function to parse LRC timestamps or spread plain text lyrics evenly
function parseLyrics(lyricsInput, songDurationSec = 225) {
  if (!lyricsInput) return [];
  if (Array.isArray(lyricsInput)) {
    // If array of objects already, check if they need recalculation (e.g. if all time values are idx * 5)
    const all5sStep = lyricsInput.every((item, idx) => item.time === idx * 5);
    if (!all5sStep) return lyricsInput;
    lyricsInput = lyricsInput.map(item => item.text).join("\n");
  }
  if (typeof lyricsInput !== "string") return [];

  const lines = lyricsInput.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  // Match LRC format timestamps: [MM:SS] or [MM:SS.xx]
  const lrcRegex = /^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/;
  let hasTimestamps = false;
  const parsed = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(lrcRegex);
    if (match) {
      hasTimestamps = true;
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const millis = match[3] ? parseFloat("0." + match[3]) : 0;
      const timeInSec = minutes * 60 + seconds + millis;
      parsed.push({
        time: Math.round(timeInSec * 10) / 10,
        text: match[4] || ""
      });
    }
  }

  if (hasTimestamps && parsed.length > 0) {
    return parsed.sort((a, b) => a.time - b.time);
  }

  // Fallback for plain multiline text (no [MM:SS] timestamps):
  // Evenly distribute lyrics across actual song duration
  const totalDur = songDurationSec > 20 ? songDurationSec : 225;
  const introDelay = 6;
  const outroMargin = 8;
  const singingDuration = Math.max(totalDur - introDelay - outroMargin, lines.length * 2.5);
  const interval = singingDuration / lines.length;

  return lines.map((text, idx) => ({
    time: Math.round((introDelay + idx * interval) * 10) / 10,
    text: text
  }));
}


// Helper function to extract Spotify Track ID
function extractSpotifyId(url) {
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
}

// Helper to extract Spotify Track metadata via oEmbed & Page Scraper
async function extractSpotifyInfo(spotifyUrl) {
  let title = '';
  let artist = '';
  let cover = '';
  const spotifyId = extractSpotifyId(spotifyUrl);

  if (!spotifyId) {
    return { spotifyId: null, title: '', artist: '', cover: '' };
  }

  // 1. Try Spotify oEmbed endpoint
  try {
    const oembedRes = await axios.get(`https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`, { timeout: 4000 });
    if (oembedRes.data) {
      title = oembedRes.data.title || '';
      cover = oembedRes.data.thumbnail_url || '';
    }
  } catch (e) {
    console.log('[Spotify oEmbed Info]:', e.message);
  }

  // 2. Try scraping Spotify track page meta tags
  try {
    const pageRes = await axios.get(spotifyUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 5000
    });
    const html = pageRes.data;
    if (!title) {
      const ogTitle = (html.match(/<meta property="og:title" content="([^"]+)"/) || [])[1];
      if (ogTitle) title = ogTitle;
    }
    if (!cover) {
      const ogImage = (html.match(/<meta property="og:image" content="([^"]+)"/) || [])[1];
      if (ogImage) cover = ogImage;
    }
    const ogDesc = (html.match(/<meta property="og:description" content="([^"]+)"/) || [])[1];
    if (ogDesc) {
      const parts = ogDesc.split('·').map(s => s.trim());
      if (parts.length > 0 && parts[0]) {
        artist = parts[0];
      }
    }
  } catch (e) {
    console.log('[Spotify Page Scraping Info]:', e.message);
  }

  return { 
    spotifyId, 
    title: title || `Spotify Track (${spotifyId})`, 
    artist: artist || 'Spotify Artist', 
    cover: cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80' 
  };
}

// Helper to extract Spotify Track IDs from text or playlists
async function extractAllSpotifyTrackIds(inputStr) {
  if (!inputStr) return [];
  const trackIds = new Set();

  // Direct track links
  const matches = [...inputStr.matchAll(/open\.spotify\.com\/(?:[a-zA-Z0-9-]+\/)?track\/([a-zA-Z0-9]+)/g)];
  for (const m of matches) {
    if (m[1]) trackIds.add(m[1]);
  }

  // Playlist links: fetch HTML and extract track IDs
  const playlistMatches = [...inputStr.matchAll(/open\.spotify\.com\/(?:[a-zA-Z0-9-]+\/)?playlist\/([a-zA-Z0-9]+)/g)];
  for (const pm of playlistMatches) {
    try {
      const playlistUrl = `https://open.spotify.com/playlist/${pm[1]}`;
      const pageRes = await axios.get(playlistUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        timeout: 5000
      });
      const html = pageRes.data;
      const foundTracks = [...html.matchAll(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/g)].map(m => m[1]);
      foundTracks.forEach(id => trackIds.add(id));
    } catch (e) {
      console.log(`[Spotify Playlist Fetch Warning for ${pm[1]}]:`, e.message);
    }
  }

  return Array.from(trackIds);
}

function extractYouTubeId(url) {
  if (!url) return null;
  const str = url.trim();
  
  if (str.includes('v=')) {
    const parts = str.split('v=')[1];
    if (parts) {
      const id = parts.split('&')[0].split('?')[0].split('#')[0];
      if (id && id.length >= 5) return id;
    }
  }

  const regExp = /(?:youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/)([a-zA-Z0-9_-]{5,25})/;
  const match = str.match(regExp);
  if (match && match[1]) return match[1];

  if (/^[a-zA-Z0-9_-]{5,25}$/.test(str)) return str;

  const fallback = str.match(/([a-zA-Z0-9_-]{11})/);
  return fallback ? fallback[1] : null;
}

// Fetch intro music offset from SponsorBlock API (music_offtopic category)
async function getMusicStartTime(videoId) {
  if (!videoId) return 0;
  try {
    const url = `https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}&categories=["music_offtopic"]`;
    const response = await axios.get(url, { timeout: 1200 });
    const segments = response.data;

    if (Array.isArray(segments)) {
      const introSegment = segments.find(seg => seg.segment && seg.segment[0] < 30);
      if (introSegment) {
        const musicStartsAt = introSegment.segment[1];
        console.log(`[SponsorBlock] Intro music_offtopic detected! Music starts at: ${musicStartsAt}s for video ${videoId}`);
        return musicStartsAt;
      }
    }
    return 0;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(`[SponsorBlock] Video ${videoId} has no intro data (404), default music start = 0s.`);
    } else {
      console.error('[SponsorBlock] Error fetching segments:', error.message);
    }
    return 0;
  }
}


// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded audio and cover images statically
app.use('/uploads', express.static(uploadDir));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage });

// ==========================================
// AUTHENTICATION & USER MANAGEMENT
// ==========================================
const JWT_SECRET = process.env.JWT_SECRET || 'zingify_jwt_super_secret_key_2026';

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để tiếp tục' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại hoặc đã bị xoá' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
  }
};

// Optional auth middleware (identifies user if token is present, otherwise continues as guest)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) req.user = user;
    }
  } catch (e) {
    // Guest fallback
  }
  next();
};

// POST /api/auth/register - Register new account
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền họ tên, email và mật khẩu' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email này đã được đăng ký. Vui lòng đăng nhập.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const coolAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80'
    ];
    const avatar = coolAvatars[Math.floor(Math.random() * coolAvatars.length)];

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      avatar
    });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      token,
      user
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký' });
  }
});

// POST /api/auth/login - User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập' });
  }
});

// GET /api/auth/me - Current User Info
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// POST /api/auth/track-listen - Record listen & watch count for user
app.post('/api/auth/track-listen', authenticateToken, async (req, res) => {
  try {
    const { songId, youtubeId, title, artist, cover, genre, duration, durationSec, isYouTube } = req.body;
    if (!title && !youtubeId && !songId) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bài hát' });
    }

    const user = req.user;
    if (!user.playHistory) {
      user.playHistory = [];
    }

    // Match existing song in playHistory
    const targetIdx = user.playHistory.findIndex(item => {
      if (youtubeId && item.youtubeId && item.youtubeId === youtubeId) return true;
      if (songId && item.songId && item.songId === songId) return true;
      if (title && item.title && item.title.trim().toLowerCase() === title.trim().toLowerCase()) return true;
      return false;
    });

    let currentPlayCount = 1;
    if (targetIdx !== -1) {
      user.playHistory[targetIdx].playCount = (user.playHistory[targetIdx].playCount || 1) + 1;
      user.playHistory[targetIdx].lastPlayedAt = new Date();
      if (cover && !user.playHistory[targetIdx].cover) user.playHistory[targetIdx].cover = cover;
      if (artist && (!user.playHistory[targetIdx].artist || user.playHistory[targetIdx].artist === 'YouTube Artist')) {
        user.playHistory[targetIdx].artist = artist;
      }
      currentPlayCount = user.playHistory[targetIdx].playCount;
    } else {
      user.playHistory.unshift({
        songId: songId || null,
        youtubeId: youtubeId || null,
        title: title || 'Video âm nhạc',
        artist: artist || 'YouTube Artist',
        cover: cover || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : ''),
        genre: genre || 'Pop',
        duration: duration || '03:45',
        durationSec: durationSec || 225,
        isYouTube: isYouTube !== false,
        playCount: 1,
        lastPlayedAt: new Date()
      });
      currentPlayCount = 1;
    }

    // Keep history clean & capped at 200 tracks
    if (user.playHistory.length > 200) {
      user.playHistory.sort((a, b) => (b.playCount * 1000000000 + new Date(b.lastPlayedAt).getTime()) - (a.playCount * 1000000000 + new Date(a.lastPlayedAt).getTime()));
      user.playHistory = user.playHistory.slice(0, 200);
    }

    await user.save();

    res.json({
      success: true,
      playCount: currentPlayCount,
      totalListened: user.playHistory.length
    });
  } catch (error) {
    console.error('Track Listen Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi ghi nhận lịch sử' });
  }
});

// GET /api/users/recommendations - Personalized Recommendations based on watch count & preferences
app.get('/api/users/recommendations', optionalAuth, async (req, res) => {
  try {
    const user = req.user;

    // Helper to get fallback trending tracks
    const getFallbackRecommendations = async () => {
      const ytTrending = await getYouTubeTrendingMusic('VN', 12);
      const dbSongs = await Song.find().sort({ views: -1 }).limit(10);
      const combined = [
        ...ytTrending.map(t => ({
          id: `yt_${t.videoId}`,
          youtubeId: t.videoId,
          title: t.title,
          artist: t.artist,
          cover: t.cover,
          duration: t.duration,
          durationSec: t.durationSec,
          isYouTube: true,
          badge: 'Xu hướng YouTube'
        })),
        ...dbSongs.map(s => ({
          id: s._id.toString(),
          title: s.title,
          artist: s.artist,
          cover: s.cover,
          audioUrl: s.audioUrl,
          youtubeId: s.youtubeId,
          isYouTube: s.isYouTube,
          duration: s.duration,
          durationSec: s.durationSec,
          views: s.views,
          badge: 'Thịnh hành'
        }))
      ];
      return combined.slice(0, 16);
    };

    // If guest or no user
    if (!user || !user.playHistory || user.playHistory.length === 0) {
      const fallback = await getFallbackRecommendations();
      return res.json({
        success: true,
        isPersonalized: false,
        message: 'Hãy nghe bài hát để nhận đề xuất riêng cho bạn',
        data: {
          mostPlayed: [],
          forYou: fallback,
          topArtists: []
        }
      });
    }

    // 1. NGHE LẠI NHIỀU NHẤT (Most Played / On Repeat)
    // Sort songs by playCount descending, then lastPlayedAt descending
    const sortedHistory = [...user.playHistory].sort((a, b) => {
      if (b.playCount !== a.playCount) return b.playCount - a.playCount;
      return new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime();
    });

    const mostPlayed = sortedHistory.slice(0, 15).map(item => ({
      id: item.songId || (item.youtubeId ? `yt_${item.youtubeId}` : `hist_${item.title}`),
      songId: item.songId,
      youtubeId: item.youtubeId,
      title: item.title,
      artist: item.artist,
      cover: item.cover || (item.youtubeId ? `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg` : ''),
      duration: item.duration || '03:45',
      durationSec: item.durationSec || 225,
      isYouTube: item.isYouTube !== false,
      playCount: item.playCount || 1,
      lastPlayedAt: item.lastPlayedAt,
      badge: item.playCount >= 2 ? `🔥 Đã xem ${item.playCount} lần` : `🎧 Đã xem 1 lần`
    }));

    // 2. DÀNH RIÊNG CHO BẠN (Personalized Discovery)
    // Extract top preferred artists
    const artistCounts = {};
    user.playHistory.forEach(h => {
      const a = (h.artist || '').trim();
      if (a && !a.toLowerCase().includes('youtube artist') && !a.toLowerCase().includes('chưa biết')) {
        artistCounts[a] = (artistCounts[a] || 0) + (h.playCount || 1);
      }
    });

    const topArtists = Object.entries(artistCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 3);

    // Build set of already heavily watched video/song IDs to avoid boring duplicates
    const heavilyWatchedIds = new Set();
    user.playHistory.forEach(h => {
      if (h.playCount >= 3) {
        if (h.youtubeId) heavilyWatchedIds.add(h.youtubeId);
        if (h.songId) heavilyWatchedIds.add(h.songId);
        heavilyWatchedIds.add(h.title.toLowerCase().trim());
      }
    });

    let forYou = [];

    // Search for music related to top artists
    for (const artistName of topArtists) {
      try {
        const ytResults = await searchYouTubeVideos(`${artistName} official music video`, 6);
        for (const track of ytResults) {
          const vId = track.videoId || track.youtubeId;
          if (!heavilyWatchedIds.has(vId) && !heavilyWatchedIds.has(track.title.toLowerCase().trim())) {
            forYou.push({
              id: `yt_${vId}`,
              youtubeId: vId,
              title: track.title,
              artist: track.artist,
              cover: track.cover,
              duration: track.duration,
              durationSec: track.durationSec,
              isYouTube: true,
              badge: `Vì bạn thích ${artistName}`
            });
          }
        }
      } catch (err) {
        console.warn('Rec fetch error for artist', artistName, err.message);
      }
    }

    // Also look up in MongoDB database for songs matching user's top artists
    if (topArtists.length > 0) {
      try {
        const regexes = topArtists.map(a => new RegExp(a, 'i'));
        const dbMatches = await Song.find({ artist: { $in: regexes } }).limit(6);
        for (const s of dbMatches) {
          if (!heavilyWatchedIds.has(s._id.toString()) && !heavilyWatchedIds.has(s.title.toLowerCase().trim())) {
            forYou.push({
              id: s._id.toString(),
              title: s.title,
              artist: s.artist,
              cover: s.cover,
              audioUrl: s.audioUrl,
              youtubeId: s.youtubeId,
              isYouTube: s.isYouTube,
              duration: s.duration,
              durationSec: s.durationSec,
              badge: `Dành cho bạn`
            });
          }
        }
      } catch (err) {}
    }

    // If still less than 12 recommendations, fill with YouTube trending
    if (forYou.length < 12) {
      const ytTrending = await getYouTubeTrendingMusic('VN', 12);
      for (const t of ytTrending) {
        if (!heavilyWatchedIds.has(t.videoId) && !forYou.some(f => f.youtubeId === t.videoId)) {
          forYou.push({
            id: `yt_${t.videoId}`,
            youtubeId: t.videoId,
            title: t.title,
            artist: t.artist,
            cover: t.cover,
            duration: t.duration,
            durationSec: t.durationSec,
            isYouTube: true,
            badge: 'Gợi ý thịnh hành'
          });
        }
      }
    }

    // Deduplicate forYou
    const seenIds = new Set();
    forYou = forYou.filter(item => {
      const key = item.youtubeId || item.id || item.title;
      if (seenIds.has(key)) return false;
      seenIds.add(key);
      return true;
    }).slice(0, 16);

    res.json({
      success: true,
      isPersonalized: true,
      data: {
        mostPlayed,
        forYou,
        topArtists,
        totalListened: user.playHistory.length
      }
    });
  } catch (error) {
    console.error('Recommendations Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi tải đề xuất' });
  }
});

// 1. GET /api/songs - Fetch songs from MongoDB Atlas
app.get('/api/songs', async (req, res) => {
  try {
    const { search, genre, trending } = req.query;
    let query = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ title: regex }, { artist: regex }, { album: regex }];
    }

    if (genre && genre !== 'All') {
      query.genre = new RegExp(`^${genre}$`, 'i');
    }

    if (trending === 'true') {
      query.isTrending = true;
    }

    const songs = await Song.find(query).sort({ lastPlayedAt: -1, updatedAt: -1, createdAt: -1 });

    // Đảm bảo không bao giờ trùng lặp bài hát
    const uniqueSongs = [];
    const seen = new Set();
    for (const song of songs) {
      const key = song.youtubeId ? `yt_${song.youtubeId}` : `t_${song.title.trim().toLowerCase()}_${song.artist.trim().toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSongs.push(song);
      }
    }

    res.json({ success: true, count: uniqueSongs.length, data: uniqueSongs });
  } catch (error) {
    console.error('GET /api/songs error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách bài hát' });
  }
});

// POST /api/songs/record-play - Cập nhật thời điểm nghe gần nhất (lastPlayedAt) và lượt nghe
app.post('/api/songs/record-play', async (req, res) => {
  try {
    const { id, youtubeId, title, artist } = req.body;
    let song = null;
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      song = await Song.findById(id);
    }
    if (!song && youtubeId) {
      song = await Song.findOne({ youtubeId });
    }
    if (!song && title) {
      song = await Song.findOne({
        title: new RegExp(`^${title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      });
    }

    if (song) {
      song.lastPlayedAt = new Date();
      song.views = (song.views || 0) + 1;
      await song.save();
      return res.json({ success: true, data: song });
    }
    res.json({ success: false, message: 'Bài hát chưa có trong thư viện' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. GET /api/songs/:id - Fetch single song
app.get('/api/songs/:id', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ success: false, message: 'Bài hát không tồn tại' });
    }
    res.json({ success: true, data: song });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// 3. PUT /api/songs/:id/lyrics - Update/Add lyrics for a song in MongoDB
app.put('/api/songs/:id/lyrics', async (req, res) => {
  try {
    const { lyrics } = req.body;
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ success: false, message: 'Bài hát không tồn tại' });
    }

    let parsedLyrics = [];
    if (typeof lyrics === 'string') {
      const lines = lyrics.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      parsedLyrics = lines.map((text, idx) => ({
        time: idx * 5,
        text: text
      }));
    } else if (Array.isArray(lyrics)) {
      parsedLyrics = lyrics;
    }

    song.lyrics = parsedLyrics;
    await song.save();

    res.json({
      success: true,
      message: 'Đã cập nhật lời bài hát vào MongoDB Atlas thành công!',
      data: song
    });
  } catch (error) {
    console.error('Update lyrics error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lưu lời bài hát' });
  }
});

// POST /api/songs/:id/refresh-lyrics - Tự động cào lại lời từ YouTube Captions / LRCLIB
app.post('/api/songs/:id/refresh-lyrics', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ success: false, message: 'Bài hát không tồn tại' });
    }

    const yId = song.youtubeId || (req.body.youtubeId ? req.body.youtubeId : null);
    const lyrics = await resolveLyrics(yId, song.artist, song.title, song.durationSec);

    if (lyrics && lyrics.length > 1) {
      song.lyrics = lyrics;
      await song.save();
      return res.json({
        success: true,
        message: `Đã tìm thấy và cập nhật ${lyrics.length} câu lời bài hát tự động!`,
        data: song
      });
    }

    return res.json({
      success: false,
      message: 'Chưa tìm thấy phụ đề tự động trên YouTube hoặc LRCLIB. Bạn có thể tự thêm lời thủ công!',
      data: song
    });
  } catch (err) {
    console.error('Refresh lyrics error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// PUT /api/songs/:id - Update full song details (Title, Artist, Genre, Cover, Lyrics)
app.put("/api/songs/:id", async (req, res) => {
  try {
    const { title, artist, genre, cover, lyrics } = req.body;
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ success: false, message: "Bài hát không tồn tại" });
    }

    if (title) song.title = title.trim();
    if (artist) song.artist = artist.trim();
    if (genre) song.genre = genre.trim();
    if (cover) song.cover = cover.trim();

    if (lyrics !== undefined) {
      song.lyrics = parseLyrics(lyrics, song.durationSec || 225);
    }

    await song.save();

    res.json({
      success: true,
      message: "Đã cập nhật thông tin bài hát thành công!",
      data: song
    });
  } catch (error) {
    console.error("Update song error:", error);
    res.status(500).json({ success: false, message: "Lỗi khi cập nhật bài hát" });
  }
});

// DELETE /api/songs/:id - Delete song from MongoDB Atlas
app.delete("/api/songs/:id", async (req, res) => {
  try {
    const song = await Song.findByIdAndDelete(req.params.id);
    if (!song) {
      return res.status(404).json({ success: false, message: "Bài hát không tồn tại" });
    }

    res.json({
      success: true,
      message: "Đã xóa bài hát khỏi MongoDB thành công!",
      songId: req.params.id
    });
  } catch (error) {
    console.error("Delete song error:", error);
    res.status(500).json({ success: false, message: "Lỗi khi xóa bài hát" });
  }
});

// ==================== PLAYLIST ENDPOINTS ====================
// 1. GET /api/playlists - List all custom playlists
app.get('/api/playlists', async (req, res) => {
  try {
    let playlists = await Playlist.find().populate('songs').sort({ isPinned: -1, updatedAt: -1 });
    if (playlists.length === 0) {
      const sampleSongs = await Song.find().limit(3);
      const songIds = sampleSongs.map(s => s._id);
      await Playlist.insertMany([
        {
          title: "Lowibe's Mood",
          author: "Lowibe",
          description: "Danh sách phát chill & ballad",
          cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
          isPinned: true,
          songs: songIds
        },
        {
          title: "Rap / HipHop Hits",
          author: "Quốc Phạm",
          description: "Tuyển tập Rap Việt cực cháy",
          cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80",
          isPinned: false,
          songs: songIds
        }
      ]);
      playlists = await Playlist.find().populate('songs').sort({ isPinned: -1, updatedAt: -1 });
    }
    res.json({ success: true, data: playlists });
  } catch (error) {
    console.error("GET /api/playlists error:", error);
    res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách playlist" });
  }
});

// 2. POST /api/playlists - Create new custom playlist
app.post('/api/playlists', async (req, res) => {
  try {
    const { title, description, cover, author } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập tên Playlist!" });
    }

    const defaultCover = cover && cover.trim()
      ? cover.trim()
      : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';

    const newPlaylist = await Playlist.create({
      title: title.trim(),
      description: description || 'Danh sách phát cá nhân',
      author: author || 'Quốc Phạm',
      cover: defaultCover,
      isPinned: false,
      songs: []
    });

    res.status(201).json({
      success: true,
      message: `Đã tạo Playlist "${newPlaylist.title}" thành công!`,
      data: newPlaylist
    });
  } catch (error) {
    console.error("Create playlist error:", error);
    res.status(500).json({ success: false, message: "Lỗi khi tạo playlist" });
  }
});

// 3. POST /api/playlists/:id/pin - Toggle Pin status
app.post('/api/playlists/:id/pin', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist không tồn tại" });
    }

    playlist.isPinned = !playlist.isPinned;
    await playlist.save();

    res.json({
      success: true,
      message: playlist.isPinned ? `Đã ghim "${playlist.title}" lên đầu!` : `Đã bỏ ghim "${playlist.title}"`,
      data: playlist
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi đổi trạng thái ghim" });
  }
});

// 4. POST /api/playlists/:id/songs - Add/Remove song to Playlist
app.post('/api/playlists/:id/songs', async (req, res) => {
  try {
    const { songId } = req.body;
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist không tồn tại" });
    }

    const songIndex = playlist.songs.findIndex(id => id.toString() === songId);
    let action = 'added';
    if (songIndex >= 0) {
      playlist.songs.splice(songIndex, 1);
      action = 'removed';
    } else {
      playlist.songs.push(songId);
    }

    await playlist.save();
    const updated = await Playlist.findById(playlist._id).populate('songs');

    res.json({
      success: true,
      message: action === 'added' ? 'Đã thêm bài hát vào Playlist thành công!' : 'Đã xóa bài hát khỏi Playlist',
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi cập nhật danh sách phát" });
  }
});

// 5. DELETE /api/playlists/:id - Delete playlist
app.delete('/api/playlists/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndDelete(req.params.id);
    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist không tồn tại" });
    }
    res.json({ success: true, message: "Đã xóa Playlist thành công!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi khi xóa playlist" });
  }
});

// 4. GET /api/charts - Top Charts sorted by views
app.get('/api/charts', async (req, res) => {
  try {
    const songs = await Song.find().sort({ views: -1 }).limit(10);
    const charts = songs.map((song, idx) => ({
      ...song.toJSON(),
      chartRank: idx + 1
    }));
    res.json({ success: true, data: charts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// 5. POST /api/songs/:id/like - Toggle Favorite song status
app.post('/api/songs/:id/like', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ success: false, message: 'Song not found' });
    }

    song.isLiked = !song.isLiked;
    await song.save();

    res.json({ 
      success: true, 
      songId: song.id, 
      isLiked: song.isLiked,
      message: song.isLiked ? 'Đã thêm vào Yêu thích' : 'Đã xóa khỏi Yêu thích'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật yêu thích' });
  }
});

// 6. POST /api/youtube - Add YouTube Song to MongoDB Atlas

// POST /api/spotify - Add Spotify Song to MongoDB Atlas
app.post('/api/spotify', async (req, res) => {
  try {
    const { spotifyUrl, title, artist, genre, lyrics, coverUrl } = req.body;
    if (!spotifyUrl) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đường dẫn Link Spotify!' });
    }

    const spotifyId = extractSpotifyId(spotifyUrl);
    if (!spotifyId) {
      return res.status(400).json({ success: false, message: 'Đường dẫn Spotify không hợp lệ! Vui lòng dán link dạng https://open.spotify.com/track/...' });
    }

    const defaultCover = coverUrl && coverUrl.trim() 
      ? coverUrl 
      : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

    const parsedLyrics = parseLyrics(lyrics, 225);

    const newSong = await Song.create({
      title: title || `Spotify Track (${spotifyId})`,
      artist: artist || 'Spotify Artist',
      album: 'Spotify Single',
      cover: defaultCover,
      audioUrl: '/uploads/cat_doi_noi_sau.wav',
      youtubeId: null,
      isYouTube: false,
      spotifyId: spotifyId,
      spotifyUrl: spotifyUrl,
      isSpotify: true,
      duration: '03:45',
      durationSec: 225,
      genre: genre || 'Pop',
      views: 1200,
      isTrending: true,
      lyrics: parsedLyrics
    });

    res.status(201).json({
      success: true,
      message: 'Đã lưu bài hát từ Spotify vào MongoDB thành công!',
      data: newSong
    });
  } catch (error) {
    console.error('Spotify Add Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi thêm link Spotify' });
  }
});

function removeVietnameseTones(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

// Helper to clean YouTube title and extract { title, artist }
function parseTitleCustom(rawTitle, authorName = '') {
  if (!rawTitle) return { title: 'YouTube Track', artist: authorName || 'V.A' };

  let text = rawTitle
    .replace(/[\(\[\{].*?[\)\]\}]/gi, '')
    .replace(/(Official Music Video|Official MV|Official Lyric Video|Lyrics Video|Lyrics|Official Video|Audio|HD|4K|Full|Vietsub|Live|Karaoke|Teaser|Visualizer)/gi, '')
    .trim();

  let artist = authorName ? authorName.replace(/ - Topic| Official/gi, '').trim() : '';
  let title = text;

  // Check if pipe '|' exists e.g. "J97 | LƯU NIÊN | Album TAM THÁI TỬ - Track No.4"
  if (text.includes('|')) {
    const segments = text.split('|').map(s => s.trim()).filter(Boolean);
    if (segments.length >= 2) {
      const validSegments = segments.filter(s => !/album|track\s*no|prod\./i.test(s));
      if (validSegments.length >= 2) {
        artist = validSegments[0];
        title = validSegments[1];
      } else if (validSegments.length === 1) {
        title = validSegments[0];
      }
    }
  } else if (text.includes('-')) {
    const parts = text.split('-');
    if (parts.length >= 2) {
      const p0 = parts[0].trim();
      const p1 = parts.slice(1).join('-').trim();
      if (!/album|track/i.test(p0)) {
        artist = p0;
        title = p1;
      } else {
        title = p0;
      }
    }
  }

  // Clean trailing Album or Track No from title
  title = title
    .replace(/-\s*track\s*no\.?\s*\d*/gi, '')
    .replace(/album\s+.*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  artist = artist
    .replace(/-\s*topic/gi, '')
    .replace(/official/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!artist || artist === 'V.A') {
    artist = authorName ? authorName.replace(/ - Topic| Official/gi, '').trim() : 'V.A';
  }

  return { title: title || rawTitle, artist: artist || 'V.A' };
}

function parseYouTubeTitle(rawTitle, authorName) {
  return parseTitleCustom(rawTitle, authorName);
}

// Fetch lyrics from LRCLIB API with duration matching & smart multi-tier fallback
async function fetchLrcLibLyrics(artist, title, durationSec) {
  if (!title) return null;

  // Tier 1: Direct /api/get (fast)
  try {
    const params = { track_name: title, artist_name: artist };
    if (durationSec && durationSec > 0) params.duration = Math.round(durationSec);
    const res = await axios.get('https://lrclib.net/api/get', { params, timeout: 1500 });
    if (res.data && (res.data.syncedLyrics || res.data.plainLyrics)) {
      return res.data.syncedLyrics || res.data.plainLyrics;
    }
  } catch (e) {
    // Ignore and proceed to fallbacks
  }

  // Multi-query search fallbacks (top 2 queries only to avoid delay)
  const queries = [
    `${title} ${artist}`.trim(),
    title.trim()
  ];

  for (const q of queries) {
    if (!q || q.length < 2) continue;
    try {
      const res = await axios.get(`https://lrclib.net/api/search?q=${encodeURIComponent(q)}`, { timeout: 1500 });
      if (Array.isArray(res.data) && res.data.length > 0) {
        const match = res.data.find(item => item.syncedLyrics || item.plainLyrics);
        if (match) {
          return match.syncedLyrics || match.plainLyrics;
        }
      }
    } catch (err) {}
  }

  return null;
}

// Trích xuất phụ đề tự động trực tiếp từ YouTube Video (CC subtitles tiếng Việt & quốc tế)
async function fetchYouTubeCaptionsAsLyrics(videoId) {
  if (!videoId) return null;
  try {
    let transcript = null;
    // Ưu tiên phụ đề tiếng Việt trước
    try {
      transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'vi' });
    } catch (e1) {
      // Nếu không có tiếng Việt, lấy ngôn ngữ gốc/bất kỳ của video
      try {
        transcript = await YoutubeTranscript.fetchTranscript(videoId);
      } catch (e2) {}
    }

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
      return null;
    }

    const lyrics = [];
    for (const item of transcript) {
      let text = (item.text || '').trim();
      text = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/^[♪♫♬\s]+|[♪♫♬\s]+$/g, '')
        .trim();

      if (!text || text === '[âm nhạc]' || text === '[Music]') continue;

      const timeInSec = Math.round((item.offset / 1000) * 10) / 10;
      lyrics.push({
        time: timeInSec,
        text: text
      });
    }

    return lyrics.length > 0 ? lyrics : null;
  } catch (err) {
    console.warn(`[YouTube Captions Scraper] Warning for ${videoId}:`, err.message);
    return null;
  }
}

// Bộ giải pháp lấy lời thông minh đa tầng: LRCLIB -> YouTube Captions (CC) -> Fallback
async function resolveLyrics(videoId, artist, title, durationSec) {
  // 1. Tìm trên LRCLIB trước (Lời chuẩn karaoke)
  try {
    const lrc = await fetchLrcLibLyrics(artist, title, durationSec);
    if (lrc) {
      const parsed = parseLyrics(lrc, durationSec);
      if (parsed.length > 1) {
        return parsed;
      }
    }
  } catch (e) {}

  // 2. Cào phụ đề YouTube Captions nếu video có CC
  if (videoId) {
    try {
      const ytLyrics = await fetchYouTubeCaptionsAsLyrics(videoId);
      if (ytLyrics && ytLyrics.length > 1) {
        console.log(`[Lyrics Resolver] Đã lấy thành công ${ytLyrics.length} câu lời từ YouTube Captions cho "${title}" (${videoId})`);
        return ytLyrics;
      }
    } catch (e) {}
  }

  // 3. Fallback placeholder
  return parseLyrics(`🎶 ${title} - ${artist}`, durationSec);
}

// Helper to extract all YouTube video IDs from a playlist page string or multiline URLs
function extractAllYouTubeIds(inputStr) {
  if (!inputStr) return [];
  const matches = inputStr.match(/(?:v=|\/vi\/|\/embed\/|\/shorts\/|youtu\.be\/|\&v=)([a-zA-Z0-9_-]{11})/g) || [];
  const ids = new Set();
  for (const match of matches) {
    const id = match.replace(/^(v=|\/vi\/|\/embed\/|\/shorts\/|youtu\.be\/|\&v=)/, '');
    if (id && id.length === 11) {
      ids.add(id);
    }
  }
  return Array.from(ids);
}

// Hàm dự đoán sơ bộ thể loại dựa trên từ khóa
function detectGenreCustom(title, artist) {
  const text = `${title} ${artist}`.toLowerCase();
  if (text.includes('remix') || text.includes('edm') || text.includes('vinahouse')) return 'Remix';
  if (text.includes('rap') || text.includes('hiphop') || text.includes('freestyle')) return 'Rap';
  if (text.includes('ballad') || text.includes('chill') || text.includes('acoustic')) return 'Ballad';
  return 'Pop';
}

// POST /api/music/fetch-lyrics - Standalone lyric lookup route
app.post('/api/music/fetch-lyrics', async (req, res) => {
  try {
    const { title, artist, durationSec } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Thiếu tên bài hát' });
    }
    const lyrics = await fetchLrcLibLyrics(artist || '', title, durationSec);
    if (lyrics) {
      return res.json({ success: true, lyrics });
    } else {
      return res.json({ success: false, message: 'Không tìm thấy lời bài hát khớp trên LRCLIB' });
    }
  } catch (err) {
    console.error('Fetch Lyrics Endpoint Error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi khi kết nối tới dịch vụ lời bài hát' });
  }
});

// POST /api/music/extract-info (YouTube Data API v3 / Axios oEmbed, LRCLIB & SponsorBlock Intro Sync)
app.post('/api/music/extract-info', async (req, res) => {
  const { youtubeUrl, durationSec } = req.body;

  if (!youtubeUrl) {
    return res.status(400).json({ success: false, error: 'Vui lòng cung cấp youtubeUrl' });
  }

  const videoId = extractYouTubeId(youtubeUrl);
  if (!videoId) {
    return res.status(400).json({ success: false, error: 'Link YouTube không hợp lệ' });
  }

  try {
    let rawTitle = '';
    let authorName = '';
    let thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    let exactDurationSec = durationSec || 0;
    let durationFormatted = '03:45';

    // 1. Parallel fetch: YouTube Data API v3 (or oEmbed fallback) and SponsorBlock
    const [ytApiDetails, musicStartTime] = await Promise.all([
      getYouTubeVideoDetails(videoId).catch(() => null),
      getMusicStartTime(videoId).catch(() => 0)
    ]);

    if (ytApiDetails) {
      rawTitle = ytApiDetails.title;
      authorName = ytApiDetails.channelTitle;
      thumbnailUrl = ytApiDetails.cover;
      exactDurationSec = ytApiDetails.durationSec;
      durationFormatted = ytApiDetails.duration;
    } else {
      // Fallback: oEmbed
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`;
      const ytRes = await axios.get(oembedUrl);
      rawTitle = ytRes.data.title;
      authorName = ytRes.data.author_name;
      thumbnailUrl = ytRes.data.thumbnail_url || thumbnailUrl;
    }

    const { title, artist } = parseTitleCustom(rawTitle, authorName);
    const genre = detectGenreCustom(title, artist);

    const finalLyricsStr = await fetchLrcLibLyrics(artist, title, exactDurationSec) || '';
    const parsedLyrics = parseLyrics(finalLyricsStr, exactDurationSec || 225);

    // 2. Parse first lyric time & auto-calculate offset from SponsorBlock intro start
    const firstLyricTime = (parsedLyrics && parsedLyrics.length > 0 && typeof parsedLyrics[0].time === 'number')
      ? parsedLyrics[0].time
      : 0;

    let autoOffset = 0;
    if (musicStartTime > 0) {
      autoOffset = musicStartTime - firstLyricTime;
      console.log(`[AutoOffset] Computed auto offset: ${autoOffset}s (musicStartsAt: ${musicStartTime}s, firstLyricTime: ${firstLyricTime}s)`);
    }

    return res.json({
      success: true,
      data: {
        youtubeId: videoId,
        title,
        artist,
        genre,
        lyrics: finalLyricsStr,
        thumbnail: thumbnailUrl,
        duration: durationFormatted,
        durationSec: exactDurationSec || 225,
        calculatedOffset: autoOffset,
        musicStartTime: musicStartTime
      }
    });

  } catch (error) {
    console.error('Lỗi phân tích link YouTube:', error.message);
    return res.status(500).json({ success: false, error: 'Không thể lấy thông tin từ URL YouTube này' });
  }
});

// POST /api/songs/:id/offset - Permanently shift lyric timestamps in MongoDB Atlas
app.post('/api/songs/:id/offset', async (req, res) => {
  try {
    const { offset } = req.body;
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ success: false, message: 'Bài hát không tồn tại' });
    }

    const calculatedOffset = typeof offset === 'number' ? offset : 0;

    // Shift all lyric timestamp values permanently in MongoDB schema array
    if (Array.isArray(song.lyrics) && song.lyrics.length > 0 && calculatedOffset !== 0) {
      song.lyrics = song.lyrics.map(l => ({
        time: Math.max(0, Math.round(((l.time || 0) + calculatedOffset) * 10) / 10),
        text: l.text || ""
      }));
    }
    song.offset = 0; // Reset relative offset since timestamps are shifted permanently in DB

    await song.save();

    res.json({
      success: true,
      message: `Đã lưu mốc thời gian chuẩn (${calculatedOffset > 0 ? '+' : ''}${calculatedOffset.toFixed(1)}s) vào MongoDB Atlas thành công!`,
      data: song
    });
  } catch (error) {
    console.error('Save offset error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lưu offset' });
  }
});

// POST /api/spotify/extract-info (Auto-Extract Spotify Metadata & Lyrics)
app.post('/api/spotify/extract-info', async (req, res) => {
  const { spotifyUrl } = req.body;
  if (!spotifyUrl) {
    return res.json({ success: false, error: 'Vui lòng cung cấp link Spotify' });
  }

  try {
    const info = await extractSpotifyInfo(spotifyUrl);
    if (!info.spotifyId) {
      return res.json({ success: false, error: 'Link Spotify chưa hoàn chỉnh hoặc không hợp lệ' });
    }

    const genre = detectGenreCustom(info.title, info.artist);
    const lyrics = await fetchLrcLibLyrics(info.artist, info.title) || '';

    return res.json({
      success: true,
      data: {
        spotifyId: info.spotifyId,
        title: info.title,
        artist: info.artist,
        genre,
        lyrics,
        thumbnail: info.cover,
        spotifyUrl
      }
    });
  } catch (err) {
    console.error('Spotify Extract Error:', err.message);
    return res.json({ success: false, error: 'Không thể lấy thông tin từ URL Spotify này' });
  }
});

// POST /api/playlist/extract-info (Bulk Playlist Scanner & Preview)
app.post('/api/playlist/extract-info', async (req, res) => {
  const { urls } = req.body;
  if (!urls) {
    return res.status(400).json({ success: false, error: 'Vui lòng cung cấp danh sách hoặc link Playlist' });
  }

  try {
    const inputStr = Array.isArray(urls) ? urls.join('\n') : urls;
    let ytIds = extractAllYouTubeIds(inputStr);
    const spIds = await extractAllSpotifyTrackIds(inputStr);

    // If a YouTube Playlist ID exists and YouTube API key is active, expand playlist items
    const playlistId = extractPlaylistId(inputStr);
    if (playlistId && getYouTubeApiKey()) {
      try {
        const playlistItems = await getYouTubePlaylistItems(playlistId, 50);
        const fetchedIds = playlistItems.map(p => p.videoId);
        ytIds = Array.from(new Set([...ytIds, ...fetchedIds]));
      } catch (e) {
        console.warn('Playlist extract warning:', e.message);
      }
    }

    if (ytIds.length === 0 && spIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Không tìm thấy link YouTube hoặc Spotify nào trong danh sách!' });
    }

    const tracks = [];

    // Process YouTube IDs (up to 30)
    for (const id of ytIds.slice(0, 30)) {
      try {
        const ytDetails = await getYouTubeVideoDetails(id).catch(() => null);
        if (ytDetails) {
          const parsed = parseTitleCustom(ytDetails.title, ytDetails.channelTitle);
          tracks.push({
            source: 'youtube',
            id,
            title: parsed.title,
            artist: parsed.artist,
            cover: ytDetails.cover,
            duration: ytDetails.duration,
            durationSec: ytDetails.durationSec,
            url: `https://www.youtube.com/watch?v=${id}`
          });
        } else {
          const oembedRes = await axios.get(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, { timeout: 3000 });
          const parsed = parseTitleCustom(oembedRes.data.title, oembedRes.data.author_name);
          tracks.push({
            source: 'youtube',
            id,
            title: parsed.title,
            artist: parsed.artist,
            cover: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
            url: `https://www.youtube.com/watch?v=${id}`
          });
        }
      } catch (e) {
        tracks.push({
          source: 'youtube',
          id,
          title: `YouTube Track (${id})`,
          artist: 'YouTube Artist',
          cover: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${id}`
        });
      }
    }

    // Process Spotify IDs (up to 30)
    for (const id of spIds.slice(0, 30)) {
      const spUrl = `https://open.spotify.com/track/${id}`;
      const info = await extractSpotifyInfo(spUrl);
      tracks.push({
        source: 'spotify',
        id: info.spotifyId,
        title: info.title,
        artist: info.artist,
        cover: info.cover,
        url: spUrl
      });
    }

    return res.json({
      success: true,
      count: tracks.length,
      data: tracks
    });
  } catch (err) {
    console.error('Playlist Extract Error:', err.message);
    return res.status(500).json({ success: false, error: 'Lỗi khi phân tích Playlist' });
  }
});

// GET /api/youtube/status - Check YouTube Data API v3 connection status
app.get('/api/youtube/status', async (req, res) => {
  const status = await verifyYouTubeApiKey();
  return res.json({
    success: true,
    ...status,
    hasApiKey: Boolean(getYouTubeApiKey())
  });
});

// GET /api/youtube/search - Search YouTube videos
app.get('/api/youtube/search', async (req, res) => {
  try {
    const { q, max } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp từ khóa tìm kiếm (q)' });
    }
    const results = await searchYouTubeVideos(q, max ? parseInt(max, 10) : 15);
    return res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi tìm kiếm YouTube' });
  }
});

// GET /api/youtube/trending - Live Trending Music Videos from YouTube Data API v3
app.get('/api/youtube/trending', async (req, res) => {
  try {
    const { region = 'VN', max = 24 } = req.query;
    const tracks = await getYouTubeTrendingMusic(region, parseInt(max, 10));
    return res.json({ success: true, count: tracks.length, data: tracks });
  } catch (err) {
    console.error('Trending fetch error:', err.message);
    return res.status(500).json({ success: false, message: 'Lỗi tải Trending YouTube' });
  }
});

// POST /api/youtube/play-or-create - Instant 1-Click Play & Auto-Save YouTube Track to DB
app.post('/api/youtube/play-or-create', async (req, res) => {
  try {
    const { videoId, title: clientTitle, artist: clientArtist, cover: clientCover, duration: clientDuration, durationSec: clientDurationSec } = req.body;
    if (!videoId) {
      return res.status(400).json({ success: false, message: 'Thiếu videoId' });
    }

    // Check if song already exists in MongoDB
    let song = await Song.findOne({ youtubeId: videoId });
    if (song) {
      song.views = (song.views || 0) + 1;
      song.lastPlayedAt = new Date();
      // Tự động bổ sung phụ đề/lời nếu bài hiện tại chưa có lời (hoặc chỉ có 1 dòng placeholder)
      if (!song.lyrics || song.lyrics.length <= 1) {
        const enriched = await resolveLyrics(videoId, song.artist, song.title, song.durationSec);
        if (enriched && enriched.length > 1) {
          song.lyrics = enriched;
        }
      }
      await song.save();
      return res.json({ success: true, isNew: false, data: song });
    }

    // Fetch video details only if not provided by client
    let songTitle = clientTitle || `YouTube Track (${videoId})`;
    let songArtist = clientArtist || 'YouTube Artist';
    let coverUrl = clientCover || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    let durationFormatted = clientDuration || '03:45';
    let durationSec = clientDurationSec || 225;
    let ytViews = 1500;

    if (!clientTitle || !clientDurationSec) {
      const ytDetails = await getYouTubeVideoDetails(videoId).catch(() => null);
      if (ytDetails) {
        const parsed = parseTitleCustom(ytDetails.title, ytDetails.channelTitle);
        songTitle = parsed.title;
        songArtist = parsed.artist;
        coverUrl = ytDetails.cover;
        durationFormatted = ytDetails.duration;
        durationSec = ytDetails.durationSec;
        if (ytDetails.views > 0) ytViews = ytDetails.views;
      }
    }

    // Tự động tìm kiếm lời đa nguồn: LRCLIB (LRC đồng bộ) -> Cào phụ đề YouTube Captions (CC)
    const parsedLyrics = await resolveLyrics(videoId, songArtist, songTitle, durationSec);
    const genre = detectGenreCustom(songTitle, songArtist);

    // Auto find-or-create artist in DB
    const artistDoc = await findOrCreateArtist(songArtist, coverUrl);

    // Create new Song document in MongoDB Atlas
    song = await Song.create({
      title: songTitle,
      artist: songArtist,
      album: "YouTube Music",
      cover: coverUrl,
      audioUrl: "/uploads/cat_doi_noi_sau.wav",
      youtubeId: videoId,
      isYouTube: true,
      duration: durationFormatted,
      durationSec: durationSec,
      genre: genre || "Pop",
      views: (ytDetails?.views && ytDetails.views > 0) ? ytDetails.views : (Math.floor(Math.random() * 5000) + 1200),
      isTrending: true,
      lyrics: parsedLyrics,
      artistId: artistDoc ? artistDoc._id : null,
      lastPlayedAt: new Date()
    });

    console.log(`[Instant YouTube Play] Created new song in DB: "${songTitle}" - "${songArtist}" (Lyrics: ${parsedLyrics.length} lines)`);
    return res.json({ success: true, isNew: true, data: song });
  } catch (err) {
    if (err.code === 11000) {
      const existing = await Song.findOne({ youtubeId: videoId });
      if (existing) {
        existing.lastPlayedAt = new Date();
        existing.views = (existing.views || 0) + 1;
        await existing.save();
        return res.json({ success: true, isNew: false, data: existing });
      }
    }
    console.error('play-or-create error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi phát bài hát YouTube' });
  }
});

// GET /api/youtube/fetch-info - Auto-fetch YouTube Info (v3 API or oEmbed) & LRCLIB Lyrics
app.get('/api/youtube/fetch-info', async (req, res) => {
  try {
    const { url } = req.query;
    const youtubeId = extractYouTubeId(url);
    if (!youtubeId) {
      return res.status(400).json({ success: false, message: 'URL YouTube không hợp lệ' });
    }

    let songTitle = `YouTube Track (${youtubeId})`;
    let songArtist = "YouTube Artist";
    let coverUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    let durationSec = 225;
    let durationFormatted = '03:45';

    // Try YouTube Data API v3
    const ytDetails = await getYouTubeVideoDetails(youtubeId).catch(() => null);
    if (ytDetails) {
      const parsed = parseYouTubeTitle(ytDetails.title, ytDetails.channelTitle);
      songTitle = parsed.title;
      songArtist = parsed.artist;
      coverUrl = ytDetails.cover;
      durationSec = ytDetails.durationSec;
      durationFormatted = ytDetails.duration;
    } else {
      // Fallback: oEmbed
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`);
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          const parsed = parseYouTubeTitle(oembedData.title, oembedData.author_name);
          songTitle = parsed.title;
          songArtist = parsed.artist;
        }
      } catch (e) {
        console.log("oEmbed error:", e);
      }
    }

    const fetchedLyrics = await fetchLrcLibLyrics(songArtist, songTitle, durationSec);

    res.json({
      success: true,
      data: {
        youtubeId,
        title: songTitle,
        artist: songArtist,
        coverUrl,
        duration: durationFormatted,
        durationSec,
        lyrics: fetchedLyrics || ""
      }
    });
  } catch (err) {
    console.error("Fetch YT Info Error:", err);
    res.status(500).json({ success: false, message: "Lỗi khi lấy thông tin bài hát" });
  }
});

// POST /api/youtube/bulk - Bulk Import YouTube Playlist / Spotify / Multiple Links
app.post('/api/youtube/bulk', async (req, res) => {
  try {
    const { urls, genre } = req.body;
    if (!urls || (typeof urls !== 'string' && !Array.isArray(urls))) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp danh sách link YouTube hoặc Spotify!' });
    }

    const inputStr = Array.isArray(urls) ? urls.join('\n') : urls;
    let videoIds = extractAllYouTubeIds(inputStr);
    const spotifyIds = await extractAllSpotifyTrackIds(inputStr);

    // If Playlist URL provided, expand it with YouTube Data API v3
    const playlistId = extractPlaylistId(inputStr);
    if (playlistId && getYouTubeApiKey()) {
      try {
        const playlistItems = await getYouTubePlaylistItems(playlistId, 50);
        const fetchedIds = playlistItems.map(p => p.videoId);
        videoIds = Array.from(new Set([...videoIds, ...fetchedIds]));
      } catch (e) {
        console.warn('Bulk playlist items fetch warning:', e.message);
      }
    }

    if (videoIds.length === 0 && spotifyIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy link YouTube hoặc Spotify hợp lệ nào!' });
    }

    const createdSongs = [];

    // 1. Process YouTube tracks
    for (const youtubeId of videoIds) {
      const existing = await Song.findOne({ youtubeId });
      if (existing) {
        createdSongs.push(existing);
        continue;
      }

      let songTitle = `YouTube Track (${youtubeId})`;
      let songArtist = "YouTube Artist";
      let coverUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
      let fetchedLyrics = "";
      let durationStr = "03:45";
      let durationSec = 225;
      let viewsCount = Math.floor(Math.random() * 5000) + 1000;

      // Try YouTube Data API v3 first
      const ytDetails = await getYouTubeVideoDetails(youtubeId).catch(() => null);
      if (ytDetails) {
        const parsed = parseYouTubeTitle(ytDetails.title, ytDetails.channelTitle);
        songTitle = parsed.title;
        songArtist = parsed.artist;
        coverUrl = ytDetails.cover;
        durationStr = ytDetails.duration;
        durationSec = ytDetails.durationSec;
        if (ytDetails.views > 0) viewsCount = ytDetails.views;
      } else {
        // Fallback: oEmbed
        try {
          const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`);
          if (oembedRes.ok) {
            const oembedData = await oembedRes.json();
            const parsed = parseYouTubeTitle(oembedData.title, oembedData.author_name);
            songTitle = parsed.title;
            songArtist = parsed.artist;
          }
        } catch (e) {}
      }

      fetchedLyrics = await fetchLrcLibLyrics(songArtist, songTitle, durationSec);
      const parsedLyrics = parseLyrics(fetchedLyrics || `🎶 ${songTitle} - ${songArtist}`, durationSec);

      const newSong = await Song.create({
        title: songTitle,
        artist: songArtist,
        album: "YouTube Single",
        cover: coverUrl,
        audioUrl: "/uploads/cat_doi_noi_sau.wav",
        youtubeId: youtubeId,
        isYouTube: true,
        duration: durationStr,
        durationSec: durationSec,
        genre: genre || "Pop",
        views: viewsCount,
        isTrending: true,
        lyrics: parsedLyrics
      });

      createdSongs.push(newSong);
    }

    // 2. Process Spotify tracks
    for (const spotifyId of spotifyIds) {
      const existing = await Song.findOne({ spotifyId });
      if (existing) {
        createdSongs.push(existing);
        continue;
      }

      const spUrl = `https://open.spotify.com/track/${spotifyId}`;
      const spInfo = await extractSpotifyInfo(spUrl);
      const fetchedLyrics = await fetchLrcLibLyrics(spInfo.artist, spInfo.title);
      const parsedLyrics = parseLyrics(fetchedLyrics || `🎶 ${spInfo.title} - ${spInfo.artist}`, 225);

      const newSong = await Song.create({
        title: spInfo.title,
        artist: spInfo.artist,
        album: "Spotify Single",
        cover: spInfo.cover,
        audioUrl: "/uploads/cat_doi_noi_sau.wav",
        spotifyId: spotifyId,
        spotifyUrl: spUrl,
        isSpotify: true,
        youtubeId: null,
        isYouTube: false,
        duration: "03:45",
        durationSec: 225,
        genre: genre || "Pop",
        views: Math.floor(Math.random() * 5000) + 1000,
        isTrending: true,
        lyrics: parsedLyrics
      });

      createdSongs.push(newSong);
    }

    res.status(201).json({
      success: true,
      message: `Đã nhập thành công ${createdSongs.length} bài hát vào thư viện!`,
      data: createdSongs
    });
  } catch (error) {
    console.error("Bulk Import Error:", error);
    res.status(500).json({ success: false, message: "Lỗi khi nhập danh sách bài hát" });
  }
});

// ==================== ARTIST ENDPOINTS (1-N Relational Model) ====================
// 1. GET /api/artists - List all artists with song counts
app.get('/api/artists', async (req, res) => {
  try {
    let artists = await Artist.find().sort({ createdAt: -1 });

    if (artists.length === 0) {
      const distinctArtists = await Song.distinct('artist');
      for (const name of distinctArtists) {
        if (name) await findOrCreateArtist(name);
      }
      artists = await Artist.find().sort({ createdAt: -1 });
    }

    const artistsWithCount = await Promise.all(artists.map(async (art) => {
      const escapedName = art.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const songCount = await Song.countDocuments({
        $or: [
          { artistId: art._id },
          { artist: { $regex: new RegExp(`^${escapedName}$`, 'i') } }
        ]
      });
      return {
        ...art.toJSON(),
        songCount
      };
    }));

    res.json({ success: true, data: artistsWithCount });
  } catch (error) {
    console.error("GET /api/artists error:", error);
    res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách nghệ sĩ" });
  }
});

// Image Upload Endpoint (For Artist Avatars & Playlist Covers)
app.post('/api/upload-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn file hình ảnh' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: imageUrl, message: 'Đã tải ảnh lên thành công!' });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải ảnh lên' });
  }
});

// PUT /api/playlists/:id - Update Playlist details (Title, Description, Cover)
app.put('/api/playlists/:id', async (req, res) => {
  try {
    const { title, description, cover } = req.body;
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ success: false, message: 'Playlist không tồn tại' });
    }

    if (title && title.trim()) playlist.title = title.trim();
    if (description !== undefined) playlist.description = description.trim();
    if (cover && cover.trim()) playlist.cover = cover.trim();

    await playlist.save();
    const updated = await Playlist.findById(playlist._id).populate('songs');

    res.json({
      success: true,
      message: 'Đã cập nhật thông tin Playlist thành công!',
      data: updated
    });
  } catch (error) {
    console.error('Update playlist error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật playlist' });
  }
});

// 2. GET /api/artists/:id - Fetch single artist details and their songs
app.get('/api/artists/:id', async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.status(404).json({ success: false, message: "Nghệ sĩ không tồn tại" });
    }

    const escapedName = artist.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const songs = await Song.find({
      $or: [
        { artistId: artist._id },
        { artist: { $regex: new RegExp(`^${escapedName}$`, 'i') } }
      ]
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        artist: artist.toJSON(),
        songs: songs
      }
    });
  } catch (error) {
    console.error("GET /api/artists/:id error:", error);
    res.status(500).json({ success: false, message: "Lỗi khi lấy thông tin nghệ sĩ" });
  }
});

// 3. PUT /api/artists/:id - Update Artist details (Name, Bio, Avatar)
app.put('/api/artists/:id', async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    const artist = await Artist.findById(req.params.id);
    if (!artist) {
      return res.status(404).json({ success: false, message: 'Nghệ sĩ không tồn tại' });
    }

    const oldName = artist.name;

    if (name && name.trim()) artist.name = name.trim();
    if (bio !== undefined) artist.bio = bio.trim();
    if (avatar && avatar.trim()) artist.avatar = avatar.trim();

    await artist.save();

    // If name was updated, update matching songs
    if (oldName !== artist.name) {
      const escapedOld = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      await Song.updateMany(
        { $or: [{ artistId: artist._id }, { artist: { $regex: new RegExp(`^${escapedOld}$`, 'i') } }] },
        { $set: { artist: artist.name, artistId: artist._id } }
      );
    }

    const escapedName = artist.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const songs = await Song.find({
      $or: [
        { artistId: artist._id },
        { artist: { $regex: new RegExp(`^${escapedName}$`, 'i') } }
      ]
    });

    res.json({
      success: true,
      message: 'Đã cập nhật thông tin Nghệ sĩ thành công!',
      data: {
        artist: artist.toJSON(),
        songs: songs
      }
    });
  } catch (error) {
    console.error('Update artist error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật nghệ sĩ' });
  }
});

// 4. DELETE /api/artists/:id - Delete Artist from MongoDB Atlas
app.delete('/api/artists/:id', async (req, res) => {
  try {
    const artist = await Artist.findByIdAndDelete(req.params.id);
    if (!artist) {
      return res.status(404).json({ success: false, message: 'Nghệ sĩ không tồn tại' });
    }

    // Remove artistId ref from songs
    await Song.updateMany(
      { artistId: req.params.id },
      { $unset: { artistId: 1 } }
    );

    res.json({
      success: true,
      message: `Đã xóa nghệ sĩ "${artist.name}" khỏi cơ sở dữ liệu!`,
      artistId: req.params.id
    });
  } catch (error) {
    console.error("Delete artist error:", error);
    res.status(500).json({ success: false, message: "Lỗi khi xóa nghệ sĩ" });
  }
});

app.post('/api/youtube', async (req, res) => {
  try {
    const { youtubeUrl, title, artist, genre, lyrics, coverUrl: customCover, calculatedOffset } = req.body;
    if (!youtubeUrl) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đường dẫn Link YouTube!' });
    }

    const youtubeId = extractYouTubeId(youtubeUrl);
    if (!youtubeId) {
      return res.status(400).json({ success: false, message: 'Đường dẫn YouTube không hợp lệ!' });
    }

    const coverUrl = customCover && customCover.trim() 
      ? customCover 
      : `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

    const artistName = artist || 'YouTube Artist';
    const artistDoc = await findOrCreateArtist(artistName, coverUrl);

    let parsedLyrics = parseLyrics(lyrics || `🎶 ${title || 'YouTube Music'} - ${artistName}`, 225);

    let songOffset = typeof calculatedOffset === 'number' ? calculatedOffset : 0;
    if (songOffset === 0 && youtubeId) {
      const musicStartTime = await getMusicStartTime(youtubeId);
      const firstLyricTime = (parsedLyrics && parsedLyrics.length > 0 && typeof parsedLyrics[0].time === 'number')
        ? parsedLyrics[0].time
        : 0;
      if (musicStartTime > 0) {
        songOffset = musicStartTime - firstLyricTime;
      }
    }

    const newSong = await Song.create({
      title: title || `YouTube Track (${youtubeId})`,
      artist: artistName,
      artistId: artistDoc ? artistDoc._id : null,
      album: 'YouTube Single',
      cover: coverUrl,
      audioUrl: "/uploads/cat_doi_noi_sau.wav",
      youtubeId: youtubeId,
      isYouTube: true,
      duration: "03:45",
      durationSec: 225,
      genre: genre || 'Pop',
      views: 1000,
      isTrending: true,
      offset: songOffset,
      lyrics: parsedLyrics
    });

    res.status(201).json({
      success: true,
      message: 'Đã lưu bài hát từ YouTube vào MongoDB thành công!',
      data: newSong
    });
  } catch (error) {
    console.error('YouTube Add Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi thêm link YouTube' });
  }
});

// 7. POST /api/upload - Upload MP3 file to MongoDB Atlas
app.post('/api/upload', upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, artist, album, genre, lyrics } = req.body;
    if (!req.files || !req.files.audio) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn file âm thanh (MP3)' });
    }

    const audioFile = req.files.audio[0];
    const coverFile = req.files.cover ? req.files.cover[0] : null;

    const audioUrl = `/uploads/${audioFile.filename}`;
    const coverUrl = coverFile 
      ? `/uploads/${coverFile.filename}`
      : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

    let parsedLyrics = [
      { time: 0, text: `🎶 ${title || audioFile.originalname} - ${artist || 'Artist'}` }
    ];

    if (lyrics && lyrics.trim()) {
      const lines = lyrics.split('\n');
      parsedLyrics = lines.map((line, idx) => ({
        time: idx * 5,
        text: line.trim()
      })).filter(item => item.text.length > 0);
    }

    const newSong = await Song.create({
      title: title || audioFile.originalname.replace(/\.[^/.]+$/, ""),
      artist: artist || 'Nghệ sĩ chưa biết',
      album: album || 'Single Upload',
      cover: coverUrl,
      audioUrl: audioUrl,
      youtubeId: null,
      isYouTube: false,
      duration: '03:30',
      durationSec: 210,
      genre: genre || 'Pop',
      views: 1,
      isTrending: false,
      lyrics: parsedLyrics
    });

    res.status(201).json({
      success: true,
      message: 'Đã tải bài hát lên MongoDB thành công!',
      data: newSong
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống khi tải file lên' });
  }
});

// 8. GET /api/stats - System stats from MongoDB
app.get('/api/stats', async (req, res) => {
  try {
    const totalSongs = await Song.countDocuments();
    const genres = await Song.distinct('genre');
    const artists = await Song.distinct('artist');
    const songs = await Song.find({}, 'views');
    const totalStreams = songs.reduce((acc, curr) => acc + (curr.views || 0), 0);

    res.json({
      success: true,
      data: {
        totalSongs,
        totalArtists: artists.length,
        genresCount: genres.length,
        totalStreams
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎵 Node.js Music Server running at http://0.0.0.0:${PORT}`);
});

setInterval(() => {}, 60000);
