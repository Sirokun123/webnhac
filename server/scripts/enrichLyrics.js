import { connectDB } from '../config/db.js';
import Song from '../models/Song.js';
import { YoutubeTranscript } from 'youtube-transcript';

async function main() {
  await connectDB();
  const songs = await Song.find({});
  console.log(`Checking ${songs.length} songs for missing lyrics...`);

  for (const song of songs) {
    if (!song.lyrics || song.lyrics.length <= 1) {
      if (song.youtubeId) {
        console.log(`Auto-fetching YouTube captions for: "${song.title}" (${song.youtubeId})...`);
        try {
          let transcript = null;
          try {
            transcript = await YoutubeTranscript.fetchTranscript(song.youtubeId, { lang: 'vi' });
          } catch (e) {
            transcript = await YoutubeTranscript.fetchTranscript(song.youtubeId).catch(() => null);
          }

          if (transcript && transcript.length > 0) {
            const lyrics = transcript
              .map(item => {
                let text = (item.text || '')
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&quot;/g, '"')
                  .replace(/&#39;/g, "'")
                  .replace(/^[♪♫♬\s]+|[♪♫♬\s]+$/g, '')
                  .trim();
                return {
                  time: Math.round((item.offset / 1000) * 10) / 10,
                  text
                };
              })
              .filter(l => l.text && l.text !== '[âm nhạc]' && l.text !== '[Music]');

            if (lyrics.length > 1) {
              song.lyrics = lyrics;
              await song.save();
              console.log(`  ✓ Updated "${song.title}" with ${lyrics.length} synced lyric lines!`);
            }
          } else {
            console.log(`  ✗ No captions found for "${song.title}"`);
          }
        } catch (err) {
          console.log(`  ✗ Error for "${song.title}":`, err.message);
        }
      }
    }
  }
  console.log("Migration complete!");
  process.exit(0);
}

main();
