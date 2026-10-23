import mongoose from 'mongoose';

const artistSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  avatar: { 
    type: String, 
    default: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80' 
  },
  bio: { type: String, default: 'Nghệ sĩ phát hành âm nhạc trên Zingify Music' },
  isVerified: { type: Boolean, default: true }
}, { timestamps: true });

artistSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  }
});

const Artist = mongoose.model('Artist', artistSchema);

export default Artist;
