import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, Box, Avatar, Typography,
  TextField, IconButton, Button, Divider, CircularProgress, Chip,
} from "@mui/material";
import { Close, Send } from "@mui/icons-material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

dayjs.extend(relativeTime);

const avatarColor = (name = "") => {
  const colors = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ef4444"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export default function CommentModal({ open, onClose, post, onCommentAdded }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [comments, setComments] = useState(post?.comments || []);

  // Sync local comments when post prop changes
  React.useEffect(() => {
    setComments(post?.comments || []);
  }, [post]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post(`/posts/${post._id}/comment`, { text: text.trim() });
      const newComment = { ...data.comment, username: user.username };
      const updatedComments = [...comments, newComment];
      setComments(updatedComments);
      setText("");
      onCommentAdded(post._id, data.commentsCount, updatedComments);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post comment.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!post) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3, maxHeight: "85vh" } }}
    >
      {/* Header */}
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Comments</Typography>
          <Chip label={`${comments.length} comment${comments.length !== 1 ? "s" : ""}`} size="small" sx={{ mt: 0.5, bgcolor: "#f1f5f9" }} />
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ bgcolor: "#f1f5f9" }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0 }}>
        {/* Post preview */}
        <Box sx={{ px: 3, py: 2, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 1 }}>
            <Avatar sx={{ bgcolor: avatarColor(post.author?.username), width: 32, height: 32, fontSize: 13, fontWeight: 700 }}>
              {post.author?.username?.[0]?.toUpperCase()}
            </Avatar>
            <Typography variant="subtitle2" fontWeight={700}>{post.author?.username}</Typography>
            <Typography variant="caption" color="text.secondary">{dayjs(post.createdAt).fromNow()}</Typography>
          </Box>
          {post.content && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: "44px", lineHeight: 1.6 }}>
              {post.content.length > 120 ? post.content.slice(0, 120) + "…" : post.content}
            </Typography>
          )}
        </Box>

        {/* Comments list */}
        <Box sx={{ overflowY: "auto", maxHeight: 380, px: 2, py: 1.5 }}>
          {comments.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 5 }}>
              <Typography color="text.secondary" variant="body2">No comments yet. Be the first!</Typography>
            </Box>
          ) : (
            comments.map((c, i) => (
              <Box key={c._id || i} sx={{ display: "flex", gap: 1.5, mb: 2 }}>
                <Avatar sx={{ bgcolor: avatarColor(c.username), width: 34, height: 34, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {c.username?.[0]?.toUpperCase()}
                </Avatar>
                <Box sx={{ bgcolor: "#f8fafc", borderRadius: 2.5, px: 2, py: 1.2, flex: 1, border: "1px solid #e2e8f0" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.3 }}>
                    <Typography variant="caption" fontWeight={700}>{c.username}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(c.createdAt).fromNow()}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{c.text}</Typography>
                </Box>
              </Box>
            ))
          )}
        </Box>

        <Divider />

        {/* Input area */}
        {user && (
          <Box sx={{ display: "flex", gap: 1.5, px: 2.5, py: 2, alignItems: "flex-end" }}>
            <Avatar sx={{ bgcolor: avatarColor(user.username), width: 36, height: 36, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
              {user.username[0].toUpperCase()}
            </Avatar>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder="Write a comment…"
              value={text}
              onChange={(e) => { setText(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              inputProps={{ maxLength: 500 }}
              size="small"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "#f8fafc" } }}
            />
            <IconButton
              color="primary"
              onClick={handleSubmit}
              disabled={loading || !text.trim()}
              sx={{ bgcolor: "primary.main", color: "#fff", "&:hover": { bgcolor: "primary.dark" }, flexShrink: 0 }}
            >
              {loading ? <CircularProgress size={18} color="inherit" /> : <Send sx={{ fontSize: 18 }} />}
            </IconButton>
          </Box>
        )}

        {error && (
          <Typography variant="caption" color="error" sx={{ px: 3, pb: 1.5, display: "block" }}>
            {error}
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
