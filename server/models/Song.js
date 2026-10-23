import mongoose from 'mongoose';

const lyricSchema = new mongoose.Schema({
  time: { type: Number, required: true },
  text: { type: String, default: '' }
}, { _id: false });

const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true, default: 'Nghệ sĩ chưa biết' },
  artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', default: null },
  album: { type: String, default: 'Single' },
  cover: { type: String, required: true },
  audioUrl: { type: String, default: '' },
  youtubeId: { type: String, default: null },
  isYouTube: { type: Boolean, default: false },
  spotifyId: { type: String, default: null },
  spotifyUrl: { type: String, default: null },
  isSpotify: { type: Boolean, default: false },
  duration: { type: String, default: '00:45' },
  durationSec: { type: Number, default: 45 },
  genre: { type: String, default: 'Pop' },
  views: { type: Number, default: 1000 },
  isTrending: { type: Boolean, default: true },
  chartRank: { type: Number, default: 1 },
  isLiked: { type: Boolean, default: false },
  offset: { type: Number, default: 0 },
  lyrics: [lyricSchema]
}, { timestamps: true });

// Transform _id to id for seamless frontend compatibility
songSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

const Song = mongoose.model('Song', songSchema);

export default Song;
