import React, { useState, useEffect } from "react";
import {
  Typography,
  Card,
  CardContent,
  CardMedia,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  Box,
  Alert,
  Snackbar,
} from "@mui/material";
import { Link, useParams } from "react-router-dom";
import "./styles.css";
import fetchModel from "../../lib/fetchModelData";
import usePhotoSSE from "../../hooks/usePhotoSSE";

function UserHome() {
  const [photoUsers, setPhotoUsers] = useState({});
  const [photos, setPhotos] = useState(null);
  const [commentTexts, setCommentTexts] = useState({}); // Store comment text for each photo
  const [loading, setLoading] = useState({}); // Track loading state for each photo
  const [errors, setErrors] = useState({}); // Track errors for each photo
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Assume user is logged in if they can access this page
  const [currentUserId, setCurrentUserId] = useState(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Function để hiển thị notification
  const showNotification = ({ message, severity = "info" }) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // Đóng snackbar
  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  //  lấy currentUserId từ localStorage
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setCurrentUserId(userId);
      console.log("Current user ID:", userId);
    } else {
      console.warn("No userId found in localStorage");
    }
  }, []);

  const fetchAllPhotos = async () => {
    try {
      const allUsers = await fetchModel("/user/list");
      const photosArrays = await Promise.all(
        allUsers.map((user) => fetchModel(`/photo/photosOfUser/${user._id}`))
      );
      const allPhotos = photosArrays.flat();
      allPhotos.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
      setPhotos(allPhotos);
    } catch (err) {
      console.error("Error fetching photos of all users:", err);
    }
  };

  // ✅ THÊM currentUserId vào usePhotoSSE
  usePhotoSSE(setPhotos, showNotification, currentUserId);

  // 1. Lấy ảnh
  useEffect(() => {
    fetchAllPhotos();
  }, []);

  // 2. Khi photos thay đổi, tạo map user
  useEffect(() => {
    if (!photos) return;

    const fetchUsersMap = async () => {
      const allUsers = await fetchModel("/user/list");
      const usersMap = {};
      for (let photo of photos) {
        const user = allUsers.find((u) => u._id === photo.user_id);
        if (user) usersMap[photo._id] = user;
      }
      setPhotoUsers(usersMap);
    };

    fetchUsersMap();
  }, [photos]);

  // ... rest of the code remains the same

  const handleCommentChange = (photoId, value) => {
    setCommentTexts((prev) => ({
      ...prev,
      [photoId]: value,
    }));

    if (errors[photoId]) {
      setErrors((prev) => ({
        ...prev,
        [photoId]: null,
      }));
    }
  };

  const handleSubmitComment = async (photoId) => {
    const commentText = commentTexts[photoId] || "";

    if (!commentText.trim()) {
      setErrors((prev) => ({
        ...prev,
        [photoId]: "Comment cannot be empty",
      }));
      return;
    }

    setLoading((prev) => ({ ...prev, [photoId]: true }));
    setErrors((prev) => ({ ...prev, [photoId]: null }));

    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `https://api.live2am.com/api/photo/commentsOfPhoto/${photoId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            comment: commentText.trim(),
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("authToken");
          window.location.reload();
          throw new Error("Session expired. Please login again.");
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add comment");
      }

      setCommentTexts((prev) => ({
        ...prev,
        [photoId]: "",
      }));

      showNotification({
        message: "Comment added successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      setErrors((prev) => ({
        ...prev,
        [photoId]: error.message,
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [photoId]: false }));
    }
  };

  const handleKeyPress = (event, photoId) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmitComment(photoId);
    }
  };

  if (!photos) {
    return <div>Loading...</div>;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="user-photos">
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {photos.map((photo) => (
        <Card key={photo._id} className="photo-card">
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: "bold", padding: "8px 16px 0 16px" }}
          >
            Photo by{" "}
            {photoUsers[photo._id]
              ? `${photoUsers[photo._id].last_name}`
              : "Unknown"}
          </Typography>
          <CardMedia
            component="img"
            image={`https://api.live2am.com/images/${photo.file_name}`}
            alt={`Photo by ${photoUsers[photo._id]?.last_name || "Unknown"}`}
            className="photo-image"
          />

          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Posted on: {formatDate(photo.date_time)}
            </Typography>

            <Typography variant="h6" component="h2" className="comments-header">
              Comments
            </Typography>

            <List>
              {photo.comments &&
              Array.isArray(photo.comments) &&
              photo.comments.length > 0 ? (
                photo.comments.map((comment) => (
                  <ListItem key={comment._id} alignItems="flex-start">
                    <ListItemText
                      primary={
                        <React.Fragment>
                          <Link to={`/users/${comment.user._id}`}>
                            {comment.user.first_name} {comment.user.last_name}
                          </Link>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            style={{ marginLeft: 10 }}
                          >
                            {formatDate(comment.date_time)}
                          </Typography>
                        </React.Fragment>
                      }
                      secondary={comment.comment}
                    />
                    <Divider />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No comments yet" />
                </ListItem>
              )}
            </List>

            {isLoggedIn && (
              <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Add a comment:
                </Typography>

                {errors[photo._id] && (
                  <Alert severity="error" sx={{ mb: 1 }}>
                    {errors[photo._id]}
                  </Alert>
                )}

                <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                  <TextField
                    multiline
                    minRows={2}
                    maxRows={4}
                    placeholder="Write your comment here"
                    value={commentTexts[photo._id] || ""}
                    onChange={(e) =>
                      handleCommentChange(photo._id, e.target.value)
                    }
                    onKeyPress={(e) => handleKeyPress(e, photo._id)}
                    variant="outlined"
                    size="small"
                    fullWidth
                    disabled={loading[photo._id]}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleSubmitComment(photo._id)}
                    disabled={
                      loading[photo._id] || !commentTexts[photo._id]?.trim()
                    }
                    sx={{ minWidth: 80 }}
                  >
                    {loading[photo._id] ? "Adding..." : "Add"}
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default UserHome;
