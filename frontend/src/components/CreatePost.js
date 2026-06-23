import React, { useState, useRef } from "react";
import {
  Card, CardContent, Box, Avatar, TextField, Button, IconButton,
  Typography, Chip, LinearProgress, Tooltip, Collapse,
} from "@mui/material";
import { Image as ImageIcon, Close, Send, EmojiEmotions } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const avatarColor = (name = "") => {
  const colors = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ef4444"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);       // File object
  const [preview, setPreview] = useState("");     // Data URL for preview
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  const MAX_CHARS = 2000;
  const remaining = MAX_CHARS - content.length;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB");
      return;
    }
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  };

  const removeImage = () => {
    setImage(null);
    setPreview("");
    fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    setError("");
    if (!content.trim() && !image) {
      setError("Please add some text or an image.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      if (content.trim()) formData.append("content", content.trim());
      if (image) formData.append("image", image);

      const { data } = await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setContent("");
      removeImage();
      onPostCreated(data.post);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mb: 2.5, overflow: "visible" }}>
      {loading && <LinearProgress sx={{ borderRadius: "12px 12px 0 0" }} />}
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
          {/* Avatar */}
          <Avatar sx={{ bgcolor: avatarColor(user?.username), fontWeight: 700, width: 42, height: 42 }}>
            {user?.username?.[0]?.toUpperCase()}
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <TextField
              multiline
              fullWidth
              minRows={2}
              maxRows={6}
              placeholder={`What's on your mind, ${user?.username}?`}
              value={content}
              onChange={(e) => { setContent(e.target.value); setError(""); }}
              disabled={loading}
              variant="outlined"
              inputProps={{ maxLength: MAX_CHARS }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#f8fafc",
                  "&:hover": { bgcolor: "#f1f5f9" },
                  "&.Mui-focused": { bgcolor: "#fff" },
                },
                "& fieldset": { border: "1.5px solid #e2e8f0" },
              }}
            />

            {/* Image preview */}
            <Collapse in={!!preview}>
              <Box sx={{ mt: 1.5, position: "relative", display: "inline-block", maxWidth: "100%" }}>
                <img
                  src={preview}
                  alt="preview"
                  style={{ maxWidth: "100%", maxHeight: 260, borderRadius: 10, objectFit: "cover", display: "block" }}
                />
                <IconButton
                  size="small"
                  onClick={removeImage}
                  sx={{
                    position: "absolute", top: 6, right: 6,
                    bgcolor: "rgba(0,0,0,.55)", color: "#fff",
                    "&:hover": { bgcolor: "rgba(0,0,0,.75)" },
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            </Collapse>

            {/* Footer row */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {/* Image upload */}
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
                <Tooltip title="Add photo">
                  <IconButton size="small" onClick={() => fileRef.current.click()} disabled={loading} color="primary">
                    <ImageIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                {/* Character counter */}
                {content.length > 0 && (
                  <Chip
                    label={remaining < 0 ? `${remaining}` : `${remaining} left`}
                    size="small"
                    color={remaining < 50 ? (remaining < 0 ? "error" : "warning") : "default"}
                    sx={{ height: 22, fontSize: 11 }}
                  />
                )}
              </Box>

              <Button
                variant="contained"
                size="small"
                endIcon={<Send sx={{ fontSize: "16px !important" }} />}
                onClick={handleSubmit}
                disabled={loading || remaining < 0 || (!content.trim() && !image)}
              >
                Post
              </Button>
            </Box>

            {/* Error */}
            {error && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                {error}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
