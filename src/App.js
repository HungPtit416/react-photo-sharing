import "./App.css";
import React, { useState, useEffect, useRef } from "react";
import { Grid, Typography, Paper } from "@mui/material";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";

import TopBar from "./components/TopBar";
import UserDetail from "./components/UserDetail";
import UserList from "./components/UserList";
import UserPhotos from "./components/UserPhotos";
import LoginRegister from "./components/LoginRegister";
import UserHome from "./components/UserHome";

const App = (props) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUserIds, setOnlineUserIds] = useState([]);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (user) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [user]);

  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.log("No token found, cannot connect WebSocket");
        return;
      }

      const ws = new WebSocket(`ws://localhost:8081?token=${token}`);

      ws.onopen = () => {
        console.log("WebSocket connected");
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message:", data);

          switch (data.type) {
            case "CONNECTED":
              console.log("Connected to WebSocket server");
              break;
            case "ONLINE_USERS":
              setOnlineCount(data.count);
              setOnlineUserIds(data.userIds || []);
              console.log(`Online: ${data.count} users`, data.userIds);
              break;
            default:
              console.log("Unknown message type:", data.type);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        wsRef.current = null;

        if (user && event.code !== 1000) {
          console.log("Attempting to reconnect in 3 seconds...");
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  };

  const disconnectWebSocket = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, "User logged out");
      }
      wsRef.current = null;
      console.log("WebSocket disconnected");
    }

    setOnlineCount(0);
    setOnlineUserIds([]);
  };

  const checkLoginStatus = async () => {
    try {
      console.log("Checking login status...");

      const token = localStorage.getItem("authToken");

      if (!token) {
        console.log("No token found - not logged in");
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await fetch("http://localhost:8081/admin/current", {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);

      if (response.status === 401) {
        console.log("Not logged in - 401, removing invalid token");
        localStorage.removeItem("authToken");
        setUser(null);
      } else if (response.ok) {
        const userData = await response.json();
        console.log("User data received:", userData);
        setUser(userData);
      } else {
        console.log("Other error:", response.status);
        localStorage.removeItem("authToken");
        setUser(null);
      }
    } catch (err) {
      console.log("Fetch error:", err);
      localStorage.removeItem("authToken");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      disconnectWebSocket();

      const token = localStorage.getItem("authToken");

      if (token) {
        await fetch("http://localhost:8081/admin/logout", {
          method: "POST",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("authToken");
      setUser(null);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <Router>
        <div>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TopBar user={user} onLogout={handleLogout} onlineCount={0} />
            </Grid>
            <div className="main-topbar-buffer" />
            <Grid item xs={12}>
              <Paper className="main-grid-item">
                <LoginRegister onLogin={handleLogin} />
              </Paper>
            </Grid>
          </Grid>
        </div>
      </Router>
    );
  }

  return (
    <Router>
      <div>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TopBar
              user={user}
              onLogout={handleLogout}
              onlineCount={onlineCount}
            />
          </Grid>
          <div className="main-topbar-buffer" />
          <Grid item sm={3}>
            <Paper className="main-grid-item">
              <UserList onlineUserIds={onlineUserIds} />
            </Paper>
          </Grid>
          <Grid item sm={9}>
            <Paper className="main-grid-item">
              <Routes>
                <Route path="/home" element={<UserHome />} />
                <Route path="/users/:userId" element={<UserDetail />} />
                <Route path="/photos/:userId" element={<UserPhotos />} />
                <Route
                  path="/users"
                  element={<UserList onlineUserIds={onlineUserIds} />}
                />
                <Route path="/" element={<Navigate to={`/home`} />} />
                <Route path="*" element={<Navigate to={`/home`} />} />
              </Routes>
            </Paper>
          </Grid>
        </Grid>
      </div>
    </Router>
  );
};

export default App;
