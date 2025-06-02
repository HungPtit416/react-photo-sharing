import "./App.css";
import React, { useState, useEffect } from "react";
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

const App = (props) => {
  const [user, setUser] = useState(null); // Current logged in user
  const [loading, setLoading] = useState(true); // Loading state

  // Check if user is already logged in when app loads
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      console.log("🔍 Checking login status...");

      // Try to get current user info from auth router
      const response = await fetch(
        "https://3pqzgw-8081.csb.app/admin/current",
        {
          credentials: "include",
        }
      );

      console.log("📡 Response status:", response.status);

      if (response.status === 401) {
        console.log("❌ Not logged in - 401");
        setUser(null);
      } else if (response.ok) {
        // Successfully got user data
        const userData = await response.json();
        console.log("✅ User data received:", userData);
        setUser(userData);
      } else {
        console.log("❌ Other error:", response.status);
        setUser(null);
      }
    } catch (err) {
      console.log("❌ Fetch error:", err);
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
      await fetch("https://3pqzgw-8081.csb.app/admin/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  // If not logged in, show login form
  if (!user) {
    return (
      <Router>
        <div>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TopBar user={user} onLogout={handleLogout} />
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

  // If logged in, show main app
  return (
    <Router>
      <div>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TopBar user={user} onLogout={handleLogout} />
          </Grid>
          <div className="main-topbar-buffer" />
          <Grid item sm={3}>
            <Paper className="main-grid-item">
              <UserList />
            </Paper>
          </Grid>
          <Grid item sm={9}>
            <Paper className="main-grid-item">
              <Routes>
                <Route path="/users/:userId" element={<UserDetail />} />
                <Route path="/photos/:userId" element={<UserPhotos />} />
                <Route path="/users" element={<UserList />} />
                <Route
                  path="/"
                  element={<Navigate to={`/users/${user._id}`} />}
                />
                {/* Redirect any unknown route to user's detail page */}
                <Route
                  path="*"
                  element={<Navigate to={`/users/${user._id}`} />}
                />
              </Routes>
            </Paper>
          </Grid>
        </Grid>
      </div>
    </Router>
  );
};

export default App;
