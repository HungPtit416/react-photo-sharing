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
} from "@mui/material";
import { Link, useParams } from "react-router-dom";
import "./styles.css";
import fetchModel from "../../lib/fetchModelData";
import usePhotoSSE from "../../hooks/usePhotoSSE";

/**
 * Define UserHome , a React component of Project 4.
 */
function UserHome() {
    const [photoUsers, setPhotoUsers] = useState({});
    const [photos, setPhotos] = useState(null);
    const [commentTexts, setCommentTexts] = useState({}); // Store comment text for each photo
    const [loading, setLoading] = useState({}); // Track loading state for each photo
    const [errors, setErrors] = useState({}); // Track errors for each photo
    const [isLoggedIn, setIsLoggedIn] = useState(true); // Assume user is logged in if they can access this page


    const fetchAllPhotos = async () => {
        try {
            // 1. Lấy tất cả user
            const allUsers = await fetchModel("/user/list"); // trả về array [{_id, first_name, last_name}, ...]
            // 2. Lấy ảnh của từng user
            const photosArrays = await Promise.all(
                allUsers.map(user =>
                    fetchModel(`/photo/photosOfUser/${user._id}`)
                )
            );
            // 3. Gom tất cả ảnh thành 1 mảng
            const allPhotos = photosArrays.flat();
            // 3b. Sắp xếp từ mới nhất đến cũ nhất
            allPhotos.sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
            // 4. Cập nhật state
            setPhotos(allPhotos);

        } catch (err) {
            console.error("Error fetching photos of all users:", err);
        }

    };
    usePhotoSSE(setPhotos);
    // 1. Lấy ảnh
    useEffect(() => {
        fetchAllPhotos()
    }, []);

    // 2. Khi photos thay đổi, tạo map user
    useEffect(() => {
        if (!photos) return;

        const fetchUsersMap = async () => {
            const allUsers = await fetchModel("/user/list");
            const usersMap = {};
            for (let photo of photos) {
                const user = allUsers.find(u => u._id === photo.user_id);
                if (user) usersMap[photo._id] = user;
            }
            setPhotoUsers(usersMap);
        };

        fetchUsersMap();
    }, [photos]);
    // Handle comment text change
    const handleCommentChange = (photoId, value) => {
        setCommentTexts((prev) => ({
            ...prev,
            [photoId]: value,
        }));

        // Clear error when user starts typing
        if (errors[photoId]) {
            setErrors((prev) => ({
                ...prev,
                [photoId]: null,
            }));
        }
    };

    const handleSubmitComment = async (photoId) => {
        const commentText = commentTexts[photoId] || "";

        // Validate comment
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
            // Get JWT token from localStorage
            const token = localStorage.getItem("authToken");

            if (!token) {
                throw new Error("No authentication token found");
            }

            const response = await fetch(
                `http://localhost:8081/api/photo/commentsOfPhoto/${photoId}`,
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
                    // Token expired or invalid
                    localStorage.removeItem("authToken");
                    window.location.reload();
                    throw new Error("Session expired. Please login again.");
                }
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to add comment");
            }

            const result = await response.json();

            // Update photos state to include new comment
            setPhotos((prevPhotos) =>
                prevPhotos.map((photo) =>
                    photo._id === photoId
                        ? {
                            ...photo,
                            comments: [...photo.comments, result.comment],
                        }
                        : photo
                )
            );

            // Clear comment text
            setCommentTexts((prev) => ({
                ...prev,
                [photoId]: "",
            }));
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

    // Handle Enter key press
    const handleKeyPress = (event, photoId) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmitComment(photoId);
        }
    };

    if (!photos) {
        return <div>Loading...</div>;
    }

    // Định dạng ngày tháng thành chuỗi thân thiện
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    return (
        <div className="user-photos">
            {/* <Typography variant="h4" component="h1">
                Photos of {user.first_name} {user.last_name}
            </Typography> */}

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
                        image={`http://localhost:8081/images/${photo.file_name}`}
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
                            {/* Kiểm tra xem photo.comments có tồn tại không và có phải là mảng không */}
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

                        {/* Add Comment Section - Only show if user is logged in */}
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
