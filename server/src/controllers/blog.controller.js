import fs from "fs";
import path from "path";
import Blog from "../models/blog.model.js";
import { ApiError, ok } from "../utils/response.util.js";
import asyncHandler from "../utils/asyncHandler.util.js";
import { UPLOAD_DIR } from "../middleware/upload.middleware.js";

const toPublicUrl = (req, filename) =>
  `${req.protocol}://${req.get("host")}/uploads/${filename}`;

const deleteFileSafely = (filename) => {
  if (!filename) return;
  const filePath = path.join(UPLOAD_DIR, filename);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("Failed to delete file:", filePath, err.message);
    }
  });
};

const withImageUrl = (req, blog) => ({
  ...blog.toObject(),
  image_url: toPublicUrl(req, blog.imagePath),
});

export const createBlog = asyncHandler(async (req, res) => {
  const { title, shortDescription, content } = req.body;

  if (!req.file) {
    throw new ApiError(400, "An image is required to create a blog post");
  }

  const blog = await Blog.create({
    title,
    shortDescription: shortDescription || "",
    content,
    imagePath: req.file.filename,
    author: req.user.id,
  });

  return ok(res, 201, "Blog post created", withImageUrl(req, blog));
});

export const getBlogs = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const skip = (page - 1) * limit;

  const filter = {};

  // Filter by pinned status: highlights = pinned posts, stories = unpinned posts
  if (req.query.pinned !== undefined) {
    const isPinned = req.query.pinned === "true";
    filter.isPinned = isPinned;
  }

  const [blogs, total] = await Promise.all([
    Blog.find(filter)
      .populate("author", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Blog.countDocuments(filter),
  ]);

  return ok(res, 200, "Blogs fetched", {
    blogs: blogs.map((b) => withImageUrl(req, b)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const getBlogById = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate(
    "author",
    "name email",
  );
  if (!blog) throw new ApiError(404, "Blog post not found");

  return ok(res, 200, "Blog fetched", withImageUrl(req, blog));
});

export const updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) throw new ApiError(404, "Blog post not found");

  if (String(blog.author) !== req.user.id) {
    throw new ApiError(403, "You are not allowed to edit this blog post");
  }

  const { title, shortDescription, content } = req.body;
  if (title !== undefined) blog.title = title;
  if (shortDescription !== undefined) blog.shortDescription = shortDescription;
  if (content !== undefined) blog.content = content;

  const oldImage = blog.imagePath;
  if (req.file) {
    blog.imagePath = req.file.filename;
  }

  await blog.save();

  // Only remove the old image after the DB write succeeds, and only if replaced.
  if (req.file) {
    deleteFileSafely(oldImage);
  }

  return ok(res, 200, "Blog post updated", withImageUrl(req, blog));
});

export const togglePin = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) throw new ApiError(404, "Blog post not found");

  blog.isPinned = !blog.isPinned;
  await blog.save();

  return ok(
    res,
    200,
    `Blog ${blog.isPinned ? "pinned" : "unpinned"}`,
    withImageUrl(req, blog),
  );
});

export const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) throw new ApiError(404, "Blog post not found");

  if (String(blog.author) !== req.user.id) {
    throw new ApiError(403, "You are not allowed to delete this blog post");
  }

  await blog.deleteOne();
  deleteFileSafely(blog.imagePath);

  return ok(res, 200, "Blog post deleted");
});

export const getMyBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find({ author: req.user.id }).sort({
    createdAt: -1,
  });
  return ok(
    res,
    200,
    "Your blogs fetched",
    blogs.map((b) => withImageUrl(req, b)),
  );
});
