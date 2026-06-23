import React, { useState } from "react";
import {
  Box, Container, Card, CardContent, Typography, TextField,
  Button, Link, Alert, InputAdornment, IconButton, CircularProgress, Divider,
} from "@mui/material";
import { Email, Lock, Visibility, VisibilityOff, AutoAwesome } from "@mui/icons-material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ede9fe 0%, #e0e7ff 50%, #f0f9ff 100%)",
        display: "flex",
        alignItems: "center",
        py: 4,
      }}
    >
      <Container maxWidth="xs">
        {/* Brand */}
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Box
            sx={{
              display: "inline-flex", alignItems: "center", gap: 1,
              bgcolor: "white", borderRadius: 3, px: 2, py: 1,
              boxShadow: "0 4px 20px rgba(99,102,241,.15)", mb: 2,
            }}
          >
            <AutoAwesome sx={{ color: "primary.main", fontSize: 28 }} />
            <Typography variant="h5" fontWeight={800} color="primary.main" letterSpacing="-0.5px">
              SocialSpark
            </Typography>
          </Box>
          <Typography color="text.secondary" variant="body2">
            Share moments. Connect with people.
          </Typography>
        </Box>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3.5 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Welcome back 👋
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Sign in to your account to continue
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                label="Email address"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                fullWidth
                autoComplete="email"
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ fontSize: 18, color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                fullWidth
                autoComplete="current-password"
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ fontSize: 18, color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword((s) => !s)} edge="end">
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ borderRadius: 2, py: 1.3, fontWeight: 700, fontSize: 15 }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : "Sign in"}
              </Button>
            </Box>

            <Divider sx={{ my: 2.5 }}>
              <Typography variant="caption" color="text.secondary">OR</Typography>
            </Divider>

            <Typography variant="body2" textAlign="center" color="text.secondary">
              Don't have an account?{" "}
              <Link component={RouterLink} to="/signup" fontWeight={700} color="primary.main">
                Create one
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
