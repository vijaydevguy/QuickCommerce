import mongoose, { connect } from "mongoose";

//singleton pattern
// Especially in serverless or hot-reloading environments:

// Code can be re-executed multiple times.

// Without caching, you'd create a new DB connection each time.

// This pattern ensures only one connection is reused.

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null,
  };
}

async function connectDb() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    cached.promise = mongoose
      .connect(`${process.env.MONGODB_URI}/quickcart`, opts)
      .then((mongoose) => {
        return mongoose;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDb;
