import axios from 'axios';

// Get YouTube API Key from environment or fallback
export const getYouTubeApiKey = () => {
  return (process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY || '').trim();
};

// In-memory cache for Trending & Search to preserve quota and improve speed
const memoryCache = {
  trending: {},
  search: {}
};

// Parse ISO 8601 duration string (e.g. PT3M45S, PT1H2M30S, PT45S)
export function parseISODuration(isoDuration) {
  if (!isoDuration) return { durationSec: 225, durationFormatted: '03:45' };
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = isoDuration.match(regex);
  if (!matches) return { durationSec: 225, durationFormatted: '03:45' };

  const hours = parseInt(matches[1] || 0, 10);
  const minutes = parseInt(matches[2] || 0, 10);
  const seconds = parseInt(matches[3] || 0, 10);
  const totalSec = hours * 3600 + minutes * 60 + seconds;

  const pad = (n) => String(n).padStart(2, '0');
  const formatted = hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;

  return { durationSec: totalSec, durationFormatted: formatted };
}

// Extract YouTube playlist ID from URL or string
export function extractPlaylistId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Fetch single video details via YouTube Data API v3
export async function getYouTubeVideoDetails(videoId) {
  const apiKey = getYouTubeApiKey();
  if (!apiKey) return null;

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`;
    const res = await axios.get(url, { timeout: 6000 });
    const item = res.data?.items?.[0];
    if (!item) return null;

    const { snippet, contentDetails, statistics } = item;
    const { durationSec, durationFormatted } = parseISODuration(contentDetails?.duration);

    // Pick the highest resolution thumbnail available
    const thumbnails = snippet.thumbnails || {};
    const coverUrl = thumbnails.maxres?.url ||
                     thumbnails.standard?.url ||
                     thumbnails.high?.url ||
                     thumbnails.medium?.url ||
                     `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    return {
      videoId,
      title: snippet.title,
      channelTitle: snippet.channelTitle,
      description: snippet.description,
      durationSec,
      duration: durationFormatted,
      cover: coverUrl,
      views: parseInt(statistics?.viewCount || 0, 10),
      publishedAt: snippet.publishedAt,
      tags: snippet.tags || []
    };
  } catch (err) {
    console.warn(`[YouTube API v3] Video detail error for ${videoId}:`, err.response?.data?.error?.message || err.message);
    return null;
  }
}

// Fetch live Trending Music videos (Most Popular in Music category 10)
export async function getYouTubeTrendingMusic(regionCode = 'VN', maxResults = 24) {
  const apiKey = getYouTubeApiKey();
  if (!apiKey) return [];

  const cacheKey = `${regionCode}_${maxResults}`;
  const cached = memoryCache.trending[cacheKey];
  if (cached && (Date.now() - cached.timestamp < 1000 * 60 * 15)) { // 15 mins cache
    return cached.data;
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&chart=mostPopular&videoCategoryId=10&regionCode=${regionCode}&maxResults=${maxResults}&key=${apiKey}`;
    const res = await axios.get(url, { timeout: 8000 });
    const items = res.data?.items || [];

    const result = items.map(item => {
      const { snippet, contentDetails, statistics, id } = item;
      const { durationSec, durationFormatted } = parseISODuration(contentDetails?.duration);
      const thumbs = snippet?.thumbnails || {};
      const coverUrl = thumbs.maxres?.url || thumbs.high?.url || thumbs.medium?.url || `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

      return {
        id,
        videoId: id,
        youtubeId: id,
        title: snippet.title,
        channelTitle: snippet.channelTitle,
        artist: snippet.channelTitle ? snippet.channelTitle.replace(/ - Topic| Official/gi, '').trim() : 'YouTube Artist',
        cover: coverUrl,
        duration: durationFormatted,
        durationSec,
        views: parseInt(statistics?.viewCount || 0, 10),
        publishedAt: snippet.publishedAt,
        isYouTube: true
      };
    });

    memoryCache.trending[cacheKey] = {
      timestamp: Date.now(),
      data: result
    };

    return result;
  } catch (err) {
    console.warn(`[YouTube API v3] Trending fetch error:`, err.response?.data?.error?.message || err.message);
    return [];
  }
}

// Fetch all items from a YouTube Playlist via YouTube Data API v3
export async function getYouTubePlaylistItems(playlistId, maxResults = 50) {
  const apiKey = getYouTubeApiKey();
  if (!apiKey) return [];

  try {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=${maxResults}&playlistId=${playlistId}&key=${apiKey}`;
    const res = await axios.get(url, { timeout: 8000 });
    const items = res.data?.items || [];

    return items.map(item => {
      const vId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
      const snippet = item.snippet || {};
      const thumbs = snippet.thumbnails || {};
      return {
        videoId: vId,
        title: snippet.title,
        channelTitle: snippet.videoOwnerChannelTitle || snippet.channelTitle,
        cover: thumbs.maxres?.url || thumbs.high?.url || thumbs.medium?.url || (vId ? `https://img.youtube.com/vi/${vId}/hqdefault.jpg` : '')
      };
    }).filter(v => v.videoId && v.title !== 'Private video' && v.title !== 'Deleted video');
  } catch (err) {
    console.warn(`[YouTube API v3] Playlist fetch error for ${playlistId}:`, err.response?.data?.error?.message || err.message);
    return [];
  }
}

// Search YouTube videos via YouTube Data API v3 with enriched details
export async function searchYouTubeVideos(query, maxResults = 15) {
  const apiKey = getYouTubeApiKey();
  if (!apiKey) return [];

  const cacheKey = `${query.toLowerCase().trim()}_${maxResults}`;
  const cached = memoryCache.search[cacheKey];
  if (cached && (Date.now() - cached.timestamp < 1000 * 60 * 10)) { // 10 mins cache
    return cached.data;
  }

  try {
    // 1. Search for video IDs
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${apiKey}`;
    const searchRes = await axios.get(searchUrl, { timeout: 8000 });
    const searchItems = searchRes.data?.items || [];
    const videoIds = searchItems.map(i => i.id?.videoId).filter(Boolean);

    if (videoIds.length === 0) return [];

    // 2. Batch get contentDetails (duration) and statistics (views)
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${apiKey}`;
    const videosRes = await axios.get(videosUrl, { timeout: 8000 });
    const videoMap = {};
    for (const v of (videosRes.data?.items || [])) {
      videoMap[v.id] = v;
    }

    const results = videoIds.map(vId => {
      const vItem = videoMap[vId];
      if (!vItem) return null;
      const { snippet, contentDetails, statistics } = vItem;
      const { durationSec, durationFormatted } = parseISODuration(contentDetails?.duration);
      const thumbs = snippet?.thumbnails || {};
      const coverUrl = thumbs.maxres?.url || thumbs.high?.url || thumbs.medium?.url || `https://img.youtube.com/vi/${vId}/hqdefault.jpg`;

      return {
        id: vId,
        videoId: vId,
        youtubeId: vId,
        title: snippet.title,
        channelTitle: snippet.channelTitle,
        artist: snippet.channelTitle ? snippet.channelTitle.replace(/ - Topic| Official/gi, '').trim() : 'YouTube Artist',
        cover: coverUrl,
        duration: durationFormatted,
        durationSec,
        views: parseInt(statistics?.viewCount || 0, 10),
        publishedAt: snippet.publishedAt,
        isYouTube: true
      };
    }).filter(Boolean);

    memoryCache.search[cacheKey] = {
      timestamp: Date.now(),
      data: results
    };

    return results;
  } catch (err) {
    console.warn(`[YouTube API v3] Search error for "${query}":`, err.response?.data?.error?.message || err.message);
    return [];
  }
}

// Check / verify YouTube API Key connectivity
export async function verifyYouTubeApiKey(keyToTest) {
  const key = keyToTest || getYouTubeApiKey();
  if (!key) {
    return {
      connected: false,
      message: 'Chưa cấu hình YOUTUBE_API_KEY trong file .env'
    };
  }

  try {
    const res = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=dQw4w9WgXcQ&key=${key}`, { timeout: 5000 });
    if (res.data?.items?.length > 0) {
      return {
        connected: true,
        message: 'Kết nối YouTube Data API v3 thành công!',
        apiKeyMasked: key.slice(0, 6) + '...' + key.slice(-4)
      };
    }
    return {
      connected: true,
      message: 'API key hợp lệ!'
    };
  } catch (err) {
    const errorData = err.response?.data?.error;
    const errorMsg = errorData?.message || err.message;
    return {
      connected: false,
      error: errorMsg,
      code: errorData?.code || err.response?.status
    };
  }
}
