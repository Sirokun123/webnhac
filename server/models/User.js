import mongoose from 'mongoose';

const playHistorySchema = new mongoose.Schema({
  songId: { type: String, default: null },
  youtubeId: { type: String, default: null },
  title: { type: String, required: true },
  artist: { type: String, default: 'YouTube Artist' },
  cover: { type: String, default: '' },
  genre: { type: String, default: 'Pop' },
  duration: { type: String, default: '03:45' },
  durationSec: { type: Number, default: 225 },
  isYouTube: { type: Boolean, default: true },
  playCount: { type: Number, default: 1 },
  lastPlayedAt: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  avatar: { 
    type: String, 
    default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' 
  },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  likedSongIds: [{ type: String }],
  playHistory: [playHistorySchema]
}, { timestamps: true });

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.password;
  }
});

const User = mongoose.model('User', userSchema);

export default User;
