import mongoose from 'mongoose';

const playlistSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: 'Danh sách phát cá nhân' },
  author: { type: String, default: 'Quốc Phạm' },
  cover: { type: String, default: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80' },
  isPinned: { type: Boolean, default: false },
  songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }]
}, { timestamps: true });

playlistSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

const Playlist = mongoose.model('Playlist', playlistSchema);

export default Playlist;
