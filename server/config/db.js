import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://siro0921260379_db_user:RlbvfC4IHRRjrZjr@cluster0.fqnjhs1.mongodb.net/zingify_music_db?retryWrites=true&w=majority&appName=Cluster0";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`🍃 MongoDB Atlas Connected: ${conn.connection.host} [Database: ${conn.connection.name}]`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
  }
};
