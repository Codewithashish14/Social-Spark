import React, { useState } from "react";
import {
  Card, CardContent, CardMedia, CardActions, Box, Avatar, Typography,
  IconButton, Button, Chip, Tooltip, Menu, MenuItem, Divider, Zoom,
} from "@mui/material";
import {
  FavoriteBorder, Favorite, ChatBubbleOutline, MoreHoriz,
  Delete, AccessTime,
} from "@mui/icons-material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import CommentModal from "./CommentModal";

dayjs.extend(relativeTime);

const avatarColor = (name = "") => {
  const colors = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ef4444"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export default function PostCard({ post, onDelete, onLikeUpdate, onCommentUpdate }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(() =>
    user ? post.likes?.some((id) => id === user._id || id?._id === user._id || id?.toString() === user._id) : false
  );
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments?.length || 0);
  const [localComments, setLocalComments] = useState(post.comments || []);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [imageOpen, setImageOpen] = useState(false);

  const isAuthor = user && post.author?._id === user._id;

  // ─── Like toggle ──────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (!user || likeLoading) return;
    // Optimistic update
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((prev) => newLiked ? prev + 1 : prev - 1);
    setLikeLoading(true);
    try {
      const { data } = await api.patch(`/posts/${post._id}/like`);
      setLiked(data.liked);
      setLikesCount(data.likesCount);
      onLikeUpdate?.(post._id, data.liked, data.likesCount);
    } catch {
      // Roll back on error
      setLiked(!newLiked);
      setLikesCount((prev) => newLiked ? prev - 1 : prev + 1);
    } finally {
      setLikeLoading(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setMenuAnchor(null);
    try {
      await api.delete(`/posts/${post._id}`);
      onDelete?.(post._id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete post.");
    }
  };

  // ─── Comment callback ─────────────────────────────────────────────────────
  const handleCommentAdded = (_postId, newCount, updatedComments) => {
    setCommentsCount(newCount);
    setLocalComments(updatedComments);
    onCommentUpdate?.(_postId, newCount, updatedComments);
  };

  return (
    <>
      <Card sx={{ mb: 2, transition: "box-shadow .2s", "&:hover": { boxShadow: "0 4px 24px rgba(0,0,0,.09)" } }}>
        <CardContent sx={{ pb: 1 }}>
          {/* Author row */}
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar
                sx={{ bgcolor: avatarColor(post.author?.username), fontWeight: 700, width: 44, height: 44 }}
              >
                {post.author?.username?.[0]?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} lineHeight={1.2}>
                  {post.author?.username || "Unknown"}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <AccessTime sx={{ fontSize: 12, color: "text.secondary" }} />
                  <Typography variant="caption" color="text.secondary">
                    {dayjs(post.createdAt).fromNow()}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Options menu — only for post author */}
            {isAuthor && (
              <>
                <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
                  <MoreHoriz fontSize="small" />
                </IconButton>
                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={() => setMenuAnchor(null)}
                  PaperProps={{ sx: { borderRadius: 2, minWidth: 140 } }}
                >
                  <MenuItem onClick={handleDelete} sx={{ color: "error.main", gap: 1 }}>
                    <Delete fontSize="small" /> Delete post
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>

          {/* Post text */}
          {post.content && (
            <Typography
              variant="body1"
              sx={{ mb: 1.5, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {post.content}
            </Typography>
          )}
        </CardContent>

        {/* Post image */}
        {post.image?.url && (
          <Box
            sx={{ mx: 2, mb: 1.5, borderRadius: 2, overflow: "hidden", cursor: "zoom-in" }}
            onClick={() => setImageOpen(true)}
          >
            <CardMedia
              component="img"
              image={post.image.url}
              alt="post"
              sx={{ maxHeight: 420, objectFit: "cover", width: "100%", transition: "transform .25s", "&:hover": { transform: "scale(1.01)" } }}
            />
          </Box>
        )}

        {/* Stats row */}
        {(likesCount > 0 || commentsCount > 0) && (
          <>
            <Box sx={{ px: 2, pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {likesCount > 0 && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ bgcolor: "secondary.main", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Favorite sx={{ fontSize: 11, color: "#fff" }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">{likesCount}</Typography>
                </Box>
              )}
              {commentsCount > 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: "auto", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                  onClick={() => setCommentOpen(true)}
                >
                  {commentsCount} comment{commentsCount !== 1 ? "s" : ""}
                </Typography>
              )}
            </Box>
            <Divider sx={{ mx: 2 }} />
          </>
        )}

        {/* Action buttons */}
        <CardActions sx={{ px: 2, py: 0.5 }}>
          <Tooltip title={liked ? "Unlike" : "Like"}>
            <Button
              startIcon={
                <Zoom in={liked} unmountOnExit>
                  <Favorite sx={{ color: "#ec4899" }} />
                </Zoom>
              }
              onClick={handleLike}
              disabled={!user}
              sx={{
                flex: 1, color: liked ? "#ec4899" : "text.secondary",
                fontWeight: liked ? 700 : 500,
                "&:hover": { bgcolor: "#fce7f3" },
              }}
            >
              {!liked && <FavoriteBorder sx={{ mr: 0.5, fontSize: 18 }} />}
              Like
            </Button>
          </Tooltip>

          <Button
            startIcon={<ChatBubbleOutline sx={{ fontSize: 18 }} />}
            onClick={() => setCommentOpen(true)}
            sx={{ flex: 1, color: "text.secondary", "&:hover": { bgcolor: "#ede9fe" } }}
            disabled={!user}
          >
            Comment
          </Button>
        </CardActions>
      </Card>

      {/* Comments modal */}
      <CommentModal
        open={commentOpen}
        onClose={() => setCommentOpen(false)}
        post={{ ...post, comments: localComments }}
        onCommentAdded={handleCommentAdded}
      />

      {/* Full-size image viewer */}
      {imageOpen && post.image?.url && (
        <Box
          onClick={() => setImageOpen(false)}
          sx={{
            position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, cursor: "zoom-out", p: 2,
          }}
        >
          <img
            src={post.image.url}
            alt="full"
            style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 12, objectFit: "contain" }}
          />
        </Box>
      )}
    </>
  );
}
