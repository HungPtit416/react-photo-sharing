import { useEffect, useRef, useState, useCallback } from 'react';

const useChatWebSocket = (currentChatId, onNewMessage) => {
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setConnectionError("No authentication token");
      return;
    }

    console.log("Connecting to WebSocket for chat...");
    const ws = new WebSocket(`ws://localhost:8081?token=${token}`);

    ws.onopen = () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log("Chat WebSocket connected");
      
      // Join current chat room if exists
      if (currentChatId) {
        ws.send(JSON.stringify({
          type: "JOIN_CHAT",
          chatId: currentChatId
        }));
        console.log(`Joined chat room: ${currentChatId}`);
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);
        
        if (data.type === "NEW_MESSAGE") {
          console.log("New message received:");
          console.log("- Message chatId:", data.chatId);
          console.log("- Current chatId:", currentChatId);
          console.log("- Message data:", data.message);
          
          if (data.chatId === currentChatId) {
            console.log("Message is for current chat, adding to messages");
            onNewMessage(data.message);
          } else {
            console.log("Message is not for current chat, ignoring");
          }
        } else if (data.type === "CONNECTED") {
          console.log("WebSocket connection confirmed");
        } else if (data.type === "CHAT_JOINED") {
          console.log("Successfully joined chat:", data.chatId);
        } else if (data.type === "ONLINE_USERS") {
          console.log("Online users update:", data);
        } else {
          console.log("Unknown message type:", data.type);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      console.log("Chat WebSocket disconnected:", event.code, event.reason);
      
      // Reconnect after 3 seconds if not intentional close
      if (event.code !== 1000) {
        setTimeout(() => {
          console.log("Attempting to reconnect...");
          connect();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error("Chat WebSocket error:", error);
      setConnectionError("Connection failed");
    };

    wsRef.current = ws;
  }, [currentChatId, onNewMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, "Component unmounting");
      }
    };
  }, [connect]);

  // Join new chat room when chat changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (currentChatId) {
        wsRef.current.send(JSON.stringify({
          type: "JOIN_CHAT",
          chatId: currentChatId
        }));
        console.log(`Switched to chat room: ${currentChatId}`);
      } else {
        wsRef.current.send(JSON.stringify({
          type: "LEAVE_CHAT"
        }));
        console.log("Left chat room");
      }
    }
  }, [currentChatId]);

  const disconnect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close(1000, "Manual disconnect");
    }
  }, []);

  return { 
    isConnected, 
    connectionError, 
    disconnect 
  };
};

export default useChatWebSocket;