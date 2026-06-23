import React, { useState } from "react";
import {
  AppBar, Toolbar, Typography, Button, Avatar, Box,
  IconButton, Menu, MenuItem, Divider, Tooltip, useScrollTrigger, Slide,
} from "@mui/material";
import { AutoAwesome, Logout, Person, KeyboardArrowDown } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Hide AppBar on scroll down for mobile feel
function HideOnScroll({ children }) {
  const trigger = useScrollTrigger();
  return <Slide appear={false} direction="down" in={!trigger}>{children}</Slide>;
}

// Deterministic avatar color from username
const avatarColor = (name = "") => {
  const colors = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#8b5cf6","#ef4444"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => { handleClose(); logout(); navigate("/login"); };

  return (
    <HideOnScroll>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e2e8f0",
          color: "text.primary",
        }}
      >
        <Toolbar sx={{ maxWidth: 700, width: "100%", mx: "auto", px: { xs: 2, sm: 3 } }}>
          {/* Brand */}
          <Box
            onClick={() => navigate("/")}
            sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", flexGrow: 1 }}
          >
            <AutoAwesome sx={{ color: "primary.main", fontSize: 26 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "-0.5px", color: "primary.main" }}>
              SocialSpark
            </Typography>
          </Box>

          {/* Right side */}
          {user ? (
            <>
              <Tooltip title="Account">
                <Box
                  onClick={handleMenu}
                  sx={{
                    display: "flex", alignItems: "center", gap: 1,
                    cursor: "pointer", borderRadius: 2, px: 1.5, py: 0.5,
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <Avatar
                    sx={{ width: 34, height: 34, bgcolor: avatarColor(user.username), fontSize: 14, fontWeight: 700 }}
                  >
                    {user.username[0].toUpperCase()}
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 600, display: { xs: "none", sm: "block" } }}>
                    {user.username}
                  </Typography>
                  <KeyboardArrowDown sx={{ fontSize: 18, color: "text.secondary" }} />
                </Box>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  sx: { mt: 1, minWidth: 180, borderRadius: 2, boxShadow: "0 8px 32px rgba(0,0,0,.12)" },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700}>{user.username}</Typography>
                  <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                </Box>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ gap: 1.5, color: "error.main", mt: 0.5 }}>
                  <Logout fontSize="small" /> Sign out
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button onClick={() => navigate("/login")} sx={{ color: "text.secondary" }}>Log in</Button>
              <Button onClick={() => navigate("/signup")} variant="contained" size="small">Sign up</Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
    </HideOnScroll>
  );
}
