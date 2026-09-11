import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(process.env.MONGO_URI);
    console.log("MongoDB connected successfully.");
  } catch (err) {
    console.log(process.env.MONGO_URI);
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected.");
});

export default connectDB;
