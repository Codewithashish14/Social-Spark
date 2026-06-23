const express = require("express");
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const Post = require("../models/Post");
const { protect } = require("../middleware/auth");

const router = express.Router();

// ─── Cloudinary config ────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Multer — store in memory, upload to Cloudinary ──────────────────────────
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Helper: stream buffer → Cloudinary
const uploadToCloudinary = (buffer, folder = "social-app") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, transformation: [{ width: 1200, crop: "limit", quality: "auto" }] },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// ─── GET /api/posts — public feed (paginated, newest first) ──────────────────
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [posts, totalCount] = await Promise.all([
      Post.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "username avatar")
        .populate("comments.user", "username avatar")
        .lean({ virtuals: true }),
      Post.countDocuments(),
    ]);

    res.json({
      success: true,
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: skip + posts.length < totalCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/posts — create a post ─────────────────────────────────────────
router.post(
  "/",
  protect,
  upload.single("image"),
  async (req, res) => {
    try {
      const { content } = req.body;
      const hasText = content && content.trim().length > 0;
      const hasImage = !!req.file;

      // At least one field required
      if (!hasText && !hasImage) {
        return res.status(400).json({
          success: false,
          message: "A post must have text, an image, or both.",
        });
      }

      if (hasText && content.trim().length > 2000) {
        return res.status(400).json({
          success: false,
          message: "Post content cannot exceed 2000 characters.",
        });
      }

      // Upload image to Cloudinary if present
      let imageData = { url: "", publicId: "" };
      if (hasImage) {
        const result = await uploadToCloudinary(req.file.buffer);
        imageData = { url: result.secure_url, publicId: result.public_id };
      }

      const post = await Post.create({
        author: req.user._id,
        content: hasText ? content.trim() : "",
        image: imageData,
      });

      // Populate author info before returning
      await post.populate("author", "username avatar");

      res.status(201).json({ success: true, post });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ─── PATCH /api/posts/:id/like — toggle like ──────────────────────────────────
router.patch("/:id/like", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const userId = req.user._id;
    const alreadyLiked = post.likes.some((id) => id.toString() === userId.toString());

    if (alreadyLiked) {
      // Unlike
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      // Like
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      success: true,
      liked: !alreadyLiked,
      likesCount: post.likes.length,
      likes: post.likes,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/posts/:id/comment — add a comment ─────────────────────────────
router.post(
  "/:id/comment",
  protect,
  [body("text").trim().notEmpty().withMessage("Comment text is required").isLength({ max: 500 }).withMessage("Comment cannot exceed 500 characters")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    try {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ success: false, message: "Post not found." });
      }

      const comment = {
        user: req.user._id,
        username: req.user.username,
        text: req.body.text,
      };

      post.comments.push(comment);
      await post.save();

      // Return just the new comment (last item)
      const newComment = post.comments[post.comments.length - 1];

      res.status(201).json({
        success: true,
        comment: newComment,
        commentsCount: post.comments.length,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ─── DELETE /api/posts/:id — delete own post ──────────────────────────────────
router.delete("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    // Only the author can delete
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only delete your own posts." });
    }

    // Delete image from Cloudinary if it exists
    if (post.image && post.image.publicId) {
      await cloudinary.uploader.destroy(post.image.publicId);
    }

    await post.deleteOne();
    res.json({ success: true, message: "Post deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET /api/posts/:id — single post ────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username avatar")
      .populate("comments.user", "username avatar")
      .lean({ virtuals: true });

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
