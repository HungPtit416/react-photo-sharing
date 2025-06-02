import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Input,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useLocation } from "react-router-dom";
import "./styles.css";
import models from "../../modelData/models";

/**
 * Define TopBar, a React component of Project 4.
 */
function TopBar({ user, onLogout }) {
  const location = useLocation();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  const getContext = () => {
    let context = "";

    if (!location || !location.pathname) {
      return context;
    }

    const path = location.pathname;

    if (path.includes("/users/") && path !== "/users") {
      const userId = path.split("/").pop();
      if (userId) {
        const user = models.userModel(userId);
        if (user) {
          context = `${user.first_name} ${user.last_name}`;
        }
      }
    } else if (path.includes("/photos/")) {
      const userId = path.split("/").pop();
      if (userId) {
        const user = models.userModel(userId);
        if (user) {
          context = `Photos of ${user.first_name} ${user.last_name}`;
        }
      }
    }

    return context;
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setUploadError("Please select an image file");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("File size must be less than 5MB");
        return;
      }

      setSelectedFile(file);
      setUploadError("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please select a file");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("photo", selectedFile);

      const response = await fetch(
        "http://localhost:8081/api/photo/photos/new",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();
      setUploadSuccess("Photo uploaded successfully!");
      setSelectedFile(null);

      // Close dialog after a short delay
      setTimeout(() => {
        setUploadDialogOpen(false);
        setUploadSuccess("");

        // Refresh page if on photos page to show new photo
        if (location.pathname.includes("/photos/")) {
          window.location.reload();
        }
      }, 1500);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCloseDialog = () => {
    if (!uploading) {
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadError("");
      setUploadSuccess("");
    }
  };

  const context = getContext();

  return (
    <>
      <AppBar className="topbar-appBar" position="absolute">
        <Toolbar>
          <Typography variant="h5" color="inherit">
            [Nguyen Tuan Hung B22DCCN416]
          </Typography>

          <div className="topbar-right">
            {context && (
              <Typography variant="h6" color="inherit" sx={{ mr: 2 }}>
                {context}
              </Typography>
            )}

            {user ? (
              <>
                <Button
                  color="inherit"
                  onClick={() => setUploadDialogOpen(true)}
                  sx={{ mr: 2 }}
                >
                  Add Photo
                </Button>
                <Typography variant="h6" color="inherit" sx={{ mr: 2 }}>
                  Hi {user.last_name}
                </Typography>
                <Button color="inherit" onClick={onLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Typography variant="h6" color="inherit">
                Please Login
              </Typography>
            )}
          </div>
        </Toolbar>
      </AppBar>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload New Photo</DialogTitle>
        <DialogContent>
          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {uploadError}
            </Alert>
          )}

          {uploadSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {uploadSuccess}
            </Alert>
          )}

          <Input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            sx={{ width: "100%", mt: 1 }}
          />

          {selectedFile && (
            <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
              Selected: {selectedFile.name} (
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploading}
          >
            {uploading ? <CircularProgress size={24} /> : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default TopBar;
