const mongoose = require("mongoose");

// ─── Comment sub-schema ───────────────────────────────────────────────────────
const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
  },
  { timestamps: true }
);

// ─── Post schema ─────────────────────────────────────────────────────────────
const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Either text or image is required (validated at route level)
    content: {
      type: String,
      trim: true,
      maxlength: [2000, "Post content cannot exceed 2000 characters"],
      default: "",
    },
    image: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" }, // For Cloudinary deletion
    },
    // Store user IDs who liked the post (for toggle logic)
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [commentSchema],
  },
  {
    timestamps: true,
    // Add virtual for likes count
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual fields ───────────────────────────────────────────────────────────
postSchema.virtual("likesCount").get(function () {
  return this.likes.length;
});

postSchema.virtual("commentsCount").get(function () {
  return this.comments.length;
});

// ─── Index for efficient feed queries ─────────────────────────────────────────
postSchema.index({ createdAt: -1 }); // Sort by newest first
postSchema.index({ author: 1 });

module.exports = mongoose.model("Post", postSchema);
