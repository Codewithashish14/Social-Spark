import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box, Container, Typography, CircularProgress, Button,
  Skeleton, Card, CardContent, Alert, Chip,
} from "@mui/material";
import { AutoAwesome, Refresh, ArrowUpward } from "@mui/icons-material";
import api from "../api/axios";
import PostCard from "../components/PostCard";
import CreatePost from "../components/CreatePost";

const POSTS_PER_PAGE = 8;

// Skeleton loader for posts
function PostSkeleton() {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
          <Skeleton variant="circular" width={44} height={44} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="30%" height={16} sx={{ mb: 0.5 }} />
            <Skeleton width="20%" height={12} />
          </Box>
        </Box>
        <Skeleton width="90%" height={16} sx={{ mb: 0.5 }} />
        <Skeleton width="75%" height={16} sx={{ mb: 1.5 }} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
      </CardContent>
    </Card>
  );
}

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [newPostCount, setNewPostCount] = useState(0);  // Banner for refreshing
  const [showScrollTop, setShowScrollTop] = useState(false);
  const loaderRef = useRef(null);

  // ─── Fetch posts (page 1 = initial load / refresh) ───────────────────────
  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    setError("");
    try {
      const { data } = await api.get(`/posts?page=${pageNum}&limit=${POSTS_PER_PAGE}`);
      if (append) {
        setPosts((prev) => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      setHasMore(data.pagination.hasMore);
      setPage(pageNum);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load posts. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchPosts(1); }, [fetchPosts]);

  // Scroll-to-top button visibility
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ─── Infinite scroll via IntersectionObserver ─────────────────────────────
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
          fetchPosts(page + 1, true);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchPosts]);

  // ─── Add new post to top of feed ─────────────────────────────────────────
  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  // ─── Handle delete ────────────────────────────────────────────────────────
  const handleDelete = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  // ─── Handle like update (optional sync) ──────────────────────────────────
  const handleLikeUpdate = (postId, liked, likesCount) => {
    setPosts((prev) =>
      prev.map((p) => p._id === postId ? { ...p, likes: Array(likesCount).fill(null) } : p)
    );
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 8 }}>
      <Container maxWidth="sm" sx={{ pt: 3 }}>

        {/* Page title */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
          <AutoAwesome sx={{ color: "primary.main" }} />
          <Typography variant="h6" fontWeight={800} letterSpacing="-0.5px">
            Community Feed
          </Typography>
          <Chip label="Public" size="small" color="primary" sx={{ ml: "auto", height: 22, fontSize: 11 }} />
        </Box>

        {/* Create post box */}
        <CreatePost onPostCreated={handlePostCreated} />

        {/* Error state */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} action={
            <Button size="small" onClick={() => fetchPosts(1)}>Retry</Button>
          }>
            {error}
          </Alert>
        )}

        {/* Skeleton loading */}
        {loading && [1, 2, 3].map((i) => <PostSkeleton key={i} />)}

        {/* Empty state */}
        {!loading && posts.length === 0 && !error && (
          <Box sx={{ textAlign: "center", py: 10 }}>
            <Typography variant="h2" sx={{ mb: 1 }}>✨</Typography>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              No posts yet
            </Typography>
            <Typography color="text.secondary">
              Be the first to share something with the community!
            </Typography>
          </Box>
        )}

        {/* Posts */}
        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onDelete={handleDelete}
            onLikeUpdate={handleLikeUpdate}
          />
        ))}

        {/* Infinite scroll sentinel */}
        <Box ref={loaderRef} sx={{ height: 40, display: "flex", justifyContent: "center", alignItems: "center" }}>
          {loadingMore && <CircularProgress size={24} />}
        </Box>

        {/* End of feed */}
        {!hasMore && posts.length > 0 && (
          <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ py: 3 }}>
            🎉 You've seen all posts!
          </Typography>
        )}
      </Container>

      {/* Scroll-to-top FAB */}
      {showScrollTop && (
        <Button
          variant="contained"
          size="small"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          startIcon={<ArrowUpward />}
          sx={{
            position: "fixed", bottom: 24, right: 24,
            borderRadius: 8, boxShadow: "0 4px 20px rgba(99,102,241,.4)",
            zIndex: 999,
          }}
        >
          Top
        </Button>
      )}
    </Box>
  );
}
