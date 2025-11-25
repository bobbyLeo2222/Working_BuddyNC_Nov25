import mongoose from 'mongoose';

let isConnected = false;

const connectDb = async () => {
  if (isConnected) return mongoose.connection;

  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sgpapers';
  if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI not set. Falling back to mongodb://127.0.0.1:27017/sgpapers');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    dbName: process.env.MONGO_DB_NAME || 'sgpapers'
  });

  isConnected = true;
  console.log('Connected to MongoDB');
  return mongoose.connection;
};

export default connectDb;
