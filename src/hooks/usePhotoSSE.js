import { useEffect, useRef } from "react";

function usePhotoSSE(setPhotos, showNotification) {
  const eventSourceRef = useRef(null);

  // Hàm lấy thông tin user từ user_id
  const getUserInfo = async (userId) => {
    try {
      const response = await fetch(`http://localhost:8081/user/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user info");
      }
      const user = await response.json();
      return user;
    } catch (error) {
      console.error("Error fetching user info:", error);
      return null;
    }
  };

  // Hàm format tên user
  const formatUserName = (user) => {
    if (!user) return "Someone";
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || user.login_name || "Someone";
  };

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

    eventSource.addEventListener("new-photo", async (e) => {
      const newPhoto = JSON.parse(e.data);
      setPhotos((prev) => [newPhoto, ...prev]);
      console.log("New photo received via SSE:", newPhoto);
      
      // Lấy thông tin user và hiển thị thông báo
      if (showNotification && newPhoto.user_id) {
        const user = await getUserInfo(newPhoto.user_id);
        const userName = formatUserName(user);
        
        showNotification({
          message: `${userName} uploaded a new photo!`,
          severity: "success"
        });
      }
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
      
      // Hiển thị thông báo
      if (showNotification && data.comment.user) {
        const userName = formatUserName(data.comment.user);
        
        showNotification({
          message: `${userName} commented on a photo`,
          severity: "info"
        });
      }
    });
    
    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      if (showNotification) {
        showNotification({
          message: "Connection error",
          severity: "error"
        });
      }
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [setPhotos, showNotification]);
}

export default usePhotoSSE;