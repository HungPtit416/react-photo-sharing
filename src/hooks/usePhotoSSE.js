import { useEffect } from "react";

function usePhotoSSE(setPhotos) {
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.log("No token found, SSE will not start");
      return;
    }

    console.log("Setting up SSE with token:", token);

    const eventSource = new EventSource(
      `http://localhost:8081/api/stream/stream?token=${token}`
    );

    eventSource.addEventListener("new-photo", (e) => {
      const newPhoto = JSON.parse(e.data);
      setPhotos((prev) => [newPhoto, ...prev]);
      console.log("New photo received via SSE:", newPhoto);
    });

    eventSource.addEventListener("new-comment", (e) => {
      const commentData = JSON.parse(e.data);
      setPhotos((prevPhotos) =>
        prevPhotos.map((photo) =>
          photo._id === commentData.photo_id
            ? { ...photo, comments: [...photo.comments, commentData.comment] }
            : photo
        )
      );
    });

    return () => {
      eventSource.close();
    };
  }, [setPhotos]); // Chỉ chạy khi mount
}

export default usePhotoSSE;
