import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [300, "Short description cannot exceed 300 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    imagePath: {
      type: String,
      required: [true, "An image is required for every blog post"],
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

blogSchema.index({ createdAt: -1 });

export default mongoose.model("Blog", blogSchema);
