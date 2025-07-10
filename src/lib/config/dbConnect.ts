import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables');
}

const dbConnect = async () => {
  const connectionState = mongoose.connection.readyState;
  
  // If already connected, return early
  if (connectionState === 1) {
    return;
  }
  
  // If connecting, wait for it
  if (connectionState === 2) {
    return;
  }

  // If disconnected, disconnecting, or uninitialized, establish a new connection
  if (connectionState === 0 || connectionState === 3) {
    try {
      await mongoose.connect(MONGODB_URI, {
        dbName: "skillSwapHub",
        bufferCommands: true
      });
    } catch (error: any) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }
};

export default dbConnect;
