import React, { useState } from "react";
import {
  Box, Container, Card, CardContent, Typography, TextField,
  Button, Link, Alert, InputAdornment, IconButton, CircularProgress,
  Divider, LinearProgress, Tooltip,
} from "@mui/material";
import {
  Email, Lock, Person, Visibility, VisibilityOff,
  AutoAwesome, CheckCircle, Cancel,
} from "@mui/icons-material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Password strength helper
const passwordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: "", color: "inherit" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map = [
    { label: "", color: "inherit" },
    { label: "Weak", color: "error" },
    { label: "Fair", color: "warning" },
    { label: "Good", color: "info" },
    { label: "Strong", color: "success" },
  ];
  return { score, ...map[score] };
};

// Validation rule component
function Rule({ met, label }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      {met ? (
        <CheckCircle sx={{ fontSize: 13, color: "success.main" }} />
      ) : (
        <Cancel sx={{ fontSize: 13, color: "text.disabled" }} />
      )}
      <Typography variant="caption" color={met ? "success.main" : "text.disabled"}>{label}</Typography>
    </Box>
  );
}

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = passwordStrength(form.password);
  const usernameValid = /^[a-zA-Z0-9_]{3,20}$/.test(form.username);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    if (!usernameValid) {
      setError("Username must be 3–20 chars, letters/numbers/underscores only.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await signup(form.username, form.email, form.password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
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
            Join the community today — it's free!
          </Typography>
        </Box>

        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3.5 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Create account ✨
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Fill in the details below to get started
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              {/* Username */}
              <TextField
                label="Username"
                name="username"
                value={form.username}
                onChange={handleChange}
                fullWidth
                autoComplete="username"
                sx={{ mb: 2 }}
                helperText="3–20 characters, letters/numbers/underscores"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ fontSize: 18, color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  endAdornment: form.username.length >= 3 ? (
                    <InputAdornment position="end">
                      {usernameValid
                        ? <CheckCircle sx={{ fontSize: 18, color: "success.main" }} />
                        : <Cancel sx={{ fontSize: 18, color: "error.main" }} />
                      }
                    </InputAdornment>
                  ) : null,
                }}
              />

              {/* Email */}
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

              {/* Password */}
              <TextField
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                fullWidth
                autoComplete="new-password"
                sx={{ mb: 1 }}
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

              {/* Password strength bar */}
              {form.password && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={(strength.score / 4) * 100}
                    color={strength.color}
                    sx={{ borderRadius: 2, height: 5, mb: 0.5 }}
                  />
                  <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                    <Rule met={form.password.length >= 8} label="8+ chars" />
                    <Rule met={/[A-Z]/.test(form.password)} label="Uppercase" />
                    <Rule met={/[0-9]/.test(form.password)} label="Number" />
                    <Rule met={/[^A-Za-z0-9]/.test(form.password)} label="Symbol" />
                  </Box>
                </Box>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ borderRadius: 2, py: 1.3, fontWeight: 700, fontSize: 15, mt: form.password ? 0 : 2 }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : "Create account"}
              </Button>
            </Box>

            <Divider sx={{ my: 2.5 }}>
              <Typography variant="caption" color="text.secondary">OR</Typography>
            </Divider>

            <Typography variant="body2" textAlign="center" color="text.secondary">
              Already have an account?{" "}
              <Link component={RouterLink} to="/login" fontWeight={700} color="primary.main">
                Sign in
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
