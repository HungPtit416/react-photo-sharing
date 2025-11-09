import { useEffect, useRef } from "react";

function usePhotoSSE(setPhotos) {
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (eventSourceRef.current) return; // Nếu đã tạo, không tạo lại

    const token = localStorage.getItem("authToken");
    if (!token) {
      console.log("No token found, SSE will not start");
      return;
    }

    console.log("Setting up SSE with token:", token);

    const eventSource = new EventSource(
      `http://localhost:8081/api/stream/stream?token=${token}`
    );
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("new-photo", (e) => {
      const newPhoto = JSON.parse(e.data);
      setPhotos((prev) => [newPhoto, ...prev]);
      console.log("New photo received via SSE:", newPhoto);
    });

    eventSource.addEventListener("new-comment", (e) => {
      const data = JSON.parse(e.data); // { photo_id, comment }
      setPhotos((prevPhotos) =>
        prevPhotos.map((photo) => {
          if (photo._id === data.photo_id) {
            // Dùng Set để đảm bảo không trùng _id
            const allComments = [...photo.comments, data.comment];
            const uniqueComments = Array.from(
              new Map(allComments.map(c => [c._id, c])).values()
            );
            return { ...photo, comments: uniqueComments };
          }
          return photo;
        })
      );
    });
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [setPhotos]);
}

export default usePhotoSSE;
